const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class ProductPrice extends Model {}

ProductPrice.init(
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
    variant_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'product_variants',
        key: 'id'
      }
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notNull: { msg: 'Size is required' },
        notEmpty: { msg: 'Size cannot be empty' },
        len: {
          args: [1, 50],
          msg: 'Size must be between 1 and 50 characters'
        }
      }
    },
    product_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: { msg: 'Product price is required' },
        isDecimal: { msg: 'Product price must be a valid decimal number' },
        min: {
          args: [0],
          msg: 'Product price cannot be negative'
        }
      }
    },
    selling_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: { msg: 'Selling price is required' },
        isDecimal: { msg: 'Selling price must be a valid decimal number' },
        min: {
          args: [0],
          msg: 'Selling price cannot be negative'
        }
      }
    },
    current_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: { msg: 'Current stock must be an integer' },
        min: {
          args: [0],
          msg: 'Current stock cannot be negative'
        }
      }
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null
    },
    options: {
      type: DataTypes.JSON,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'ProductPrice',
    tableName: 'product_prices',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Associations
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');

ProductPrice.belongsTo(Product, {
  as: 'product',
  foreignKey: 'product_id'
});

Product.hasMany(ProductPrice, {
  as: 'prices',
  foreignKey: 'product_id'
});

ProductPrice.belongsTo(ProductVariant, {
  as: 'variant',
  foreignKey: 'variant_id'
});

ProductVariant.hasMany(ProductPrice, {
  as: 'prices',
  foreignKey: 'variant_id'
});

module.exports = ProductPrice;
