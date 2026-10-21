const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const ProductPrice = require('../models/ProductPrice');
const ProductDesign = require('../models/ProductDesign');
const Category = require('../models/Category');
const { sequelize } = require('../../config/db');
const { saveBase64Image, toRelativePath, toFullUrl } = require('./productImage.service');

class ProductService {
  /**
   * Create a comprehensive product with variants, prices, and design areas in a single transaction
   */
  async createProduct(payload) {
    const t = await sequelize.transaction();

    try {
      // 1. Verify Category existence
      const categoryId = payload.category_id;
      const category = await Category.findByPk(categoryId, { transaction: t });
      if (!category) {
        const error = new Error(`Category with ID ${categoryId} not found`);
        error.statusCode = 404;
        throw error;
      }

      // Process options if any images need saving to disk before storing options_config
      let optionsConfig = null;
      const variantMap = new Map(); // maps option value / title to ProductVariant instance

      if (Array.isArray(payload.options)) {
        optionsConfig = JSON.parse(JSON.stringify(payload.options));
        for (const opt of optionsConfig) {
          if (Array.isArray(opt.values)) {
            for (const val of opt.values) {
              if (val.image) {
                // Save base64 image and replace with public URL path in config
                val.image = saveBase64Image(val.image, `variant-${val.name || 'opt'}`);
              }
            }
          }
        }
      }

      // Process product image_url and images gallery
      let primaryImageUrl = null;
      if (payload.image_url) {
        primaryImageUrl = saveBase64Image(payload.image_url, 'product-main');
      } else if (payload.image) {
        primaryImageUrl = saveBase64Image(payload.image, 'product-main');
      } else if (payload.product_image) {
        primaryImageUrl = saveBase64Image(payload.product_image, 'product-main');
      }

      let galleryImages = null;
      if (Array.isArray(payload.images)) {
        galleryImages = payload.images.map((img, idx) =>
          typeof img === 'string' ? saveBase64Image(img, `product-gallery-${idx}`) : img
        );
        if (!primaryImageUrl && galleryImages.length > 0 && typeof galleryImages[0] === 'string') {
          primaryImageUrl = galleryImages[0];
        }
      }

      // 2. Create the main product with all fields including images
      const product = await Product.create(
        {
          product_name: payload.name || payload.product_name,
          category_id: categoryId,
          description: payload.description || null,
          image_url: primaryImageUrl,
          images: galleryImages,
          has_variants: payload.has_variants !== undefined ? Boolean(payload.has_variants) : false,
          base_price: payload.base_price !== undefined ? payload.base_price : null,
          compare_price: payload.compare_price !== undefined ? payload.compare_price : null,
          stock_quantity: payload.stock_quantity !== undefined ? payload.stock_quantity : 0,
          sku: payload.sku || null,
          options_config: optionsConfig,
          active_status: payload.active_status !== undefined ? payload.active_status : true
        },
        { transaction: t }
      );

      // 3. Create ProductVariants from processed optionsConfig
      if (Array.isArray(optionsConfig)) {
        for (const option of optionsConfig) {
          if (Array.isArray(option.values)) {
            for (const val of option.values) {
              const valName = val.name || val.title;
              if (valName && !variantMap.has(valName.toLowerCase())) {
                const variant = await ProductVariant.create(
                  {
                    product_id: product.id,
                    variant_name: valName,
                    variant_image: val.image || null
                  },
                  { transaction: t }
                );
                variantMap.set(valName.toLowerCase(), variant);
              }
            }
          }
        }
      }

      // 4. Process Variants / Prices array
      if (Array.isArray(payload.variants) && payload.variants.length > 0) {
        for (const v of payload.variants) {
          const variantTitle = v.title || (v.options ? Object.values(v.options)[0] : 'Default');
          let variantInstance = variantMap.get(variantTitle ? variantTitle.toLowerCase() : '');

          const vImg = v.image || v.variant_image || v.image_url;
          let savedVariantImg = null;
          if (vImg) {
            savedVariantImg = saveBase64Image(vImg, `variant-${variantTitle || 'item'}`);
          }

          // If variant wasn't created via options, create it now
          if (!variantInstance && variantTitle && variantTitle.toLowerCase() !== 'default') {
            variantInstance = await ProductVariant.create(
              {
                product_id: product.id,
                variant_name: variantTitle,
                variant_image: savedVariantImg
              },
              { transaction: t }
            );
            variantMap.set(variantTitle.toLowerCase(), variantInstance);
          } else if (variantInstance && !variantInstance.variant_image && savedVariantImg) {
            // Update image if option value didn't have it but variant object has it
            await variantInstance.update({ variant_image: savedVariantImg }, { transaction: t });
          }

          // Price calculation
          const productPriceVal = v.comparePrice !== undefined && v.comparePrice !== null
            ? v.comparePrice
            : (v.price || payload.base_price || 0.00);

          const sellingPriceVal = v.price !== undefined && v.price !== null
            ? v.price
            : (payload.base_price || 0.00);

          const stockVal = v.stock !== undefined ? v.stock : (payload.stock_quantity || 0);
          const sizeVal = v.size || (v.options && v.options.Size) || 'Standard';
          const skuVal = v.sku !== undefined ? v.sku : null;
          const optionsVal = v.options || null;

          await ProductPrice.create(
            {
              product_id: product.id,
              variant_id: variantInstance ? variantInstance.id : null,
              size: sizeVal,
              product_price: productPriceVal,
              selling_price: sellingPriceVal,
              current_stock: stockVal,
              sku: skuVal,
              options: optionsVal,
              is_active: true
            },
            { transaction: t }
          );
        }
      } else {
        // Simple product without variants array
        await ProductPrice.create(
          {
            product_id: product.id,
            variant_id: null,
            size: 'Standard',
            product_price: payload.compare_price || payload.base_price || 0.00,
            selling_price: payload.base_price || 0.00,
            current_stock: payload.stock_quantity || 0,
            sku: payload.sku || null,
            options: null,
            is_active: true
          },
          { transaction: t }
        );
      }

      // 5. Process Design Areas (mockup / zone positioning)
      if (Array.isArray(payload.design_areas) && payload.design_areas.length > 0) {
        // Cache uploaded mockup URLs so multiple zones on the SAME color and view_side don't re-upload/duplicate files
        const savedMockupCache = new Map();

        for (const da of payload.design_areas) {
          const colorKey = da.color_name || 'default';
          const viewSide = da.view_side || 'front';
          const cacheKey = `${colorKey}::${viewSide}`;

          let mockupUrl = null;
          const rawMockup = da.mockup_image || da.mockup_image_url || da.mockup || da.image;

          if (rawMockup) {
            if (savedMockupCache.has(cacheKey)) {
              mockupUrl = savedMockupCache.get(cacheKey);
            } else {
              mockupUrl = saveBase64Image(rawMockup, `mockup-${product.id}-${colorKey}-${viewSide}`);
              savedMockupCache.set(cacheKey, mockupUrl);
            }
          }

          await ProductDesign.create(
            {
              product_id: product.id,
              color_name: colorKey,
              color_code: da.color_code || null,
              view_side: viewSide,
              mockup_image_url: mockupUrl,
              zone_name: da.zone_name || 'Design Zone',
              shape: da.shape || 'rectangle',
              pos_x: da.pos_x !== undefined && da.pos_x !== null ? parseFloat(da.pos_x) : 0.00,
              pos_y: da.pos_y !== undefined && da.pos_y !== null ? parseFloat(da.pos_y) : 0.00,
              width: da.width !== undefined && da.width !== null ? parseFloat(da.width) : 0.00,
              height: da.height !== undefined && da.height !== null ? parseFloat(da.height) : 0.00,
              rotation: da.rotation !== undefined && da.rotation !== null ? parseFloat(da.rotation) : 0.00
            },
            { transaction: t }
          );
        }
      }

      await t.commit();

      // Retrieve full product with relations
      return await this.getProductById(product.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Fetch single product with all nested relations
   */
  async getProductById(id) {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductVariant,
          as: 'variants'
        },
        {
          model: ProductPrice,
          as: 'prices',
          include: [
            {
              model: ProductVariant,
              as: 'variant'
            }
          ]
        },
        {
          model: ProductDesign,
          as: 'designs'
        }
      ]
    });

    if (!product) return null;

    const data = product.toJSON();
    data.image_url = toFullUrl(data.image_url);

    if (Array.isArray(data.images)) {
      data.images = data.images.map(img => toFullUrl(img));
    }

    if (Array.isArray(data.variants)) {
      data.variants = data.variants.map(v => ({
        ...v,
        variant_image: toFullUrl(v.variant_image)
      }));
    }

    if (Array.isArray(data.prices)) {
      data.prices = data.prices.map(p => ({
        ...p,
        variant: p.variant ? { ...p.variant, variant_image: toFullUrl(p.variant.variant_image) } : null
      }));
    }

    if (Array.isArray(data.designs)) {
      data.designs = data.designs.map(d => ({
        ...d,
        mockup_image_url: toFullUrl(d.mockup_image_url)
      }));
    }

    // Also transform any image inside options_config values
    if (data.options_config) {
      try {
        const parsed = typeof data.options_config === 'string' ? JSON.parse(data.options_config) : data.options_config;
        if (Array.isArray(parsed)) {
          parsed.forEach(opt => {
            if (Array.isArray(opt.values)) {
              opt.values.forEach(val => {
                if (val.image) {
                  val.image = toFullUrl(val.image);
                }
              });
            }
          });
        }
        data.options_config = parsed;
      } catch {
        // keep as-is if parsing fails
      }
    }

    return data;
  }

  /**
   * List products with pagination and filters
   */
  async listProducts(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const where = {};
    if (query.category_id) {
      where.category_id = query.category_id;
    }
    if (query.active_status !== undefined) {
      where.active_status = query.active_status === 'true' || query.active_status === true;
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      distinct: true,
      order: [['id', 'DESC']],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductVariant,
          as: 'variants'
        },
        {
          model: ProductPrice,
          as: 'prices'
        },
        {
          model: ProductDesign,
          as: 'designs'
        }
      ]
    });

    return {
      products: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Lightweight list of products with only id, product_name, and category
   */
  async getSimpleProductList(query = {}) {
    const where = {};
    if (query.active_status !== undefined) {
      where.active_status = query.active_status === 'true' || query.active_status === true;
    }

    const products = await Product.findAll({
      where,
      attributes: ['id', 'product_name', 'image_url', 'category_id', 'active_status'],
      order: [['id', 'DESC']],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    return products.map(p => {
      const json = p.toJSON();
      json.image_url = toFullUrl(json.image_url);
      return json;
    });
  }

  /**
   * Update an existing product with its variants, prices, and design areas
   */
  async updateProduct(id, payload) {
    const t = await sequelize.transaction();

    try {
      const product = await Product.findByPk(id, { transaction: t });
      if (!product) {
        const error = new Error(`Product with ID ${id} not found`);
        error.statusCode = 404;
        throw error;
      }

      // Check Category if provided
      const categoryId = payload.category_id || product.category_id;
      if (payload.category_id) {
        const category = await Category.findByPk(categoryId, { transaction: t });
        if (!category) {
          const error = new Error(`Category with ID ${categoryId} not found`);
          error.statusCode = 404;
          throw error;
        }
      }

      // 1. Process options_config and images if supplied
      let optionsConfig = product.options_config;
      if (Array.isArray(payload.options)) {
        optionsConfig = JSON.parse(JSON.stringify(payload.options));
        for (const opt of optionsConfig) {
          if (Array.isArray(opt.values)) {
            for (const val of opt.values) {
              if (val.image) {
                val.image = saveBase64Image(val.image, `variant-${val.name || 'opt'}`);
              }
            }
          }
        }
      }

      // Process product image
      let primaryImageUrl = product.image_url;
      if (payload.image_url) {
        primaryImageUrl = saveBase64Image(payload.image_url, 'product-main');
      } else if (payload.image) {
        primaryImageUrl = saveBase64Image(payload.image, 'product-main');
      } else if (payload.product_image) {
        primaryImageUrl = saveBase64Image(payload.product_image, 'product-main');
      }

      let galleryImages = product.images;
      if (Array.isArray(payload.images)) {
        galleryImages = payload.images.map((img, idx) =>
          typeof img === 'string' ? saveBase64Image(img, `product-gallery-${idx}`) : img
        );
        if (!primaryImageUrl && galleryImages.length > 0 && typeof galleryImages[0] === 'string') {
          primaryImageUrl = galleryImages[0];
        }
      }

      // 2. Update Product record
      await product.update(
        {
          product_name: payload.name || payload.product_name || product.product_name,
          category_id: categoryId,
          description: payload.description !== undefined ? payload.description : product.description,
          image_url: primaryImageUrl,
          images: galleryImages,
          has_variants: payload.has_variants !== undefined ? Boolean(payload.has_variants) : product.has_variants,
          base_price: payload.base_price !== undefined ? payload.base_price : product.base_price,
          compare_price: payload.compare_price !== undefined ? payload.compare_price : product.compare_price,
          stock_quantity: payload.stock_quantity !== undefined ? payload.stock_quantity : product.stock_quantity,
          sku: payload.sku !== undefined ? payload.sku : product.sku,
          options_config: optionsConfig,
          active_status: payload.active_status !== undefined ? payload.active_status : product.active_status
        },
        { transaction: t }
      );

      // 3. Sync Variants
      // If options or variants array provided, refresh associated variants
      const variantMap = new Map();

      if (Array.isArray(payload.options) || Array.isArray(payload.variants)) {
        // Remove old variants and their associated prices
        await ProductPrice.destroy({ where: { product_id: product.id }, transaction: t });
        await ProductVariant.destroy({ where: { product_id: product.id }, transaction: t });

        // Create variants from optionsConfig
        if (Array.isArray(optionsConfig)) {
          for (const option of optionsConfig) {
            if (Array.isArray(option.values)) {
              for (const val of option.values) {
                const valName = val.name || val.title;
                if (valName && !variantMap.has(valName.toLowerCase())) {
                  const variant = await ProductVariant.create(
                    {
                      product_id: product.id,
                      variant_name: valName,
                      variant_image: val.image || null
                    },
                    { transaction: t }
                  );
                  variantMap.set(valName.toLowerCase(), variant);
                }
              }
            }
          }
        }

        // Create variant pricing entries
        if (Array.isArray(payload.variants) && payload.variants.length > 0) {
          for (const v of payload.variants) {
            const variantTitle = v.title || (v.options ? Object.values(v.options)[0] : 'Default');
            let variantInstance = variantMap.get(variantTitle ? variantTitle.toLowerCase() : '');

            const vImg = v.image || v.variant_image || v.image_url;
            let savedVariantImg = null;
            if (vImg) {
              savedVariantImg = saveBase64Image(vImg, `variant-${variantTitle || 'item'}`);
            }

            if (!variantInstance && variantTitle && variantTitle.toLowerCase() !== 'default') {
              variantInstance = await ProductVariant.create(
                {
                  product_id: product.id,
                  variant_name: variantTitle,
                  variant_image: savedVariantImg
                },
                { transaction: t }
              );
              variantMap.set(variantTitle.toLowerCase(), variantInstance);
            } else if (variantInstance && !variantInstance.variant_image && savedVariantImg) {
              await variantInstance.update({ variant_image: savedVariantImg }, { transaction: t });
            }

            const productPriceVal = v.comparePrice !== undefined && v.comparePrice !== null
              ? v.comparePrice
              : (v.price || payload.base_price || 0.00);

            const sellingPriceVal = v.price !== undefined && v.price !== null
              ? v.price
              : (payload.base_price || 0.00);

            const stockVal = v.stock !== undefined ? v.stock : (payload.stock_quantity || 0);
            const sizeVal = v.size || (v.options && v.options.Size) || 'Standard';
            const skuVal = v.sku !== undefined ? v.sku : null;
            const optionsVal = v.options || null;

            await ProductPrice.create(
              {
                product_id: product.id,
                variant_id: variantInstance ? variantInstance.id : null,
                size: sizeVal,
                product_price: productPriceVal,
                selling_price: sellingPriceVal,
                current_stock: stockVal,
                sku: skuVal,
                options: optionsVal,
                is_active: true
              },
              { transaction: t }
            );
          }
        } else {
          await ProductPrice.create(
            {
              product_id: product.id,
              variant_id: null,
              size: 'Standard',
              product_price: payload.compare_price || payload.base_price || 0.00,
              selling_price: payload.base_price || 0.00,
              current_stock: payload.stock_quantity || 0,
              sku: payload.sku || null,
              options: null,
              is_active: true
            },
            { transaction: t }
          );
        }
      }

      // 4. Sync Design Areas if provided
      if (Array.isArray(payload.design_areas)) {
        await ProductDesign.destroy({ where: { product_id: product.id }, transaction: t });

        // Cache uploaded mockup URLs so multiple zones on the SAME color and view_side don't re-upload/duplicate files
        const savedMockupCache = new Map();

        for (const da of payload.design_areas) {
          const colorKey = da.color_name || 'default';
          const viewSide = da.view_side || 'front';
          const cacheKey = `${colorKey}::${viewSide}`;

          let mockupUrl = null;
          const rawMockup = da.mockup_image || da.mockup_image_url || da.mockup || da.image;

          if (rawMockup) {
            if (savedMockupCache.has(cacheKey)) {
              mockupUrl = savedMockupCache.get(cacheKey);
            } else {
              mockupUrl = saveBase64Image(rawMockup, `mockup-${product.id}-${colorKey}-${viewSide}`);
              savedMockupCache.set(cacheKey, mockupUrl);
            }
          }

          await ProductDesign.create(
            {
              product_id: product.id,
              color_name: colorKey,
              color_code: da.color_code || null,
              view_side: viewSide,
              mockup_image_url: mockupUrl,
              zone_name: da.zone_name || 'Design Zone',
              shape: da.shape || 'rectangle',
              pos_x: da.pos_x !== undefined && da.pos_x !== null ? parseFloat(da.pos_x) : 0.00,
              pos_y: da.pos_y !== undefined && da.pos_y !== null ? parseFloat(da.pos_y) : 0.00,
              width: da.width !== undefined && da.width !== null ? parseFloat(da.width) : 0.00,
              height: da.height !== undefined && da.height !== null ? parseFloat(da.height) : 0.00,
              rotation: da.rotation !== undefined && da.rotation !== null ? parseFloat(da.rotation) : 0.00
            },
            { transaction: t }
          );
        }
      }

      await t.commit();
      return await this.getProductById(product.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Soft delete product
   */
  async deleteProduct(id) {
    const product = await Product.findByPk(id);
    if (!product) {
      const error = new Error(`Product with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    await product.destroy();
    return { id, deleted: true };
  }
}

module.exports = new ProductService();
