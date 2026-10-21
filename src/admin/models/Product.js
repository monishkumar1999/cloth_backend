const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');
const Category = require('./Category');

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Product name is required' },
        notEmpty: { msg: 'Product name cannot be empty' },
        len: {
          args: [1, 255],
          msg: 'Product name must be between 1 and 255 characters'
        }
      }
    },
    category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      },
      validate: {
        notNull: { msg: 'Category ID is required' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    },
    has_variants: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null
    },
    compare_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null
    },
    options_config: {
      type: DataTypes.JSON,
      allowNull: true
    },
    active_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    paranoid: true, // enables soft delete via deleted_at
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  }
);

// Associations
Product.belongsTo(Category, {
  as: 'category',
  foreignKey: 'category_id'
});

Category.hasMany(Product, {
  as: 'products',
  foreignKey: 'category_id'
});

module.exports = Product;
