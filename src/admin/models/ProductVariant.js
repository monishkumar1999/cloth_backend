const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class ProductVariant extends Model {}

ProductVariant.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      },
      validate: {
        notNull: { msg: 'Product ID is required' }
      }
    },
    variant_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Variant name is required' },
        notEmpty: { msg: 'Variant name cannot be empty' },
        len: {
          args: [1, 255],
          msg: 'Variant name must be between 1 and 255 characters'
        }
      }
    },
    variant_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'variant_image URL must not exceed 500 characters'
        }
      }
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    },
    gallery: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    sequelize,
    modelName: 'ProductVariant',
    tableName: 'product_variants',
    timestamps: true,
    paranoid: true, // enables soft delete via deleted_at
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  }
);

// Association setup in a deferred manner or direct require
const Product = require('./Product');
const VariantImage = require('./VariantImage');

ProductVariant.belongsTo(Product, {
  as: 'product',
  foreignKey: 'product_id'
});

Product.hasMany(ProductVariant, {
  as: 'variants',
  foreignKey: 'product_id'
});

ProductVariant.hasMany(VariantImage, {
  as: 'gallery_images',
  foreignKey: 'variant_id'
});

VariantImage.belongsTo(ProductVariant, {
  as: 'variant',
  foreignKey: 'variant_id'
});

module.exports = ProductVariant;

