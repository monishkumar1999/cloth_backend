const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class ProductDesign extends Model {}

ProductDesign.init(
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
    color_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'default',
      validate: {
        len: {
          args: [0, 100],
          msg: 'color_name must not exceed 100 characters'
        }
      }
    },
    color_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: {
          args: [0, 20],
          msg: 'color_code must not exceed 20 characters'
        }
      }
    },
    view_side: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'front',
      validate: {
        notEmpty: { msg: 'view_side cannot be empty' },
        len: {
          args: [1, 50],
          msg: 'view_side must be between 1 and 50 characters'
        }
      }
    },
    mockup_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'mockup_image_url must not exceed 500 characters'
        }
      }
    },
    zone_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Design Zone',
      validate: {
        notNull: { msg: 'zone_name is required' },
        notEmpty: { msg: 'zone_name cannot be empty' },
        len: {
          args: [1, 100],
          msg: 'zone_name must be between 1 and 100 characters'
        }
      }
    },
    shape: {
      type: DataTypes.ENUM('rectangle', 'circle', 'arch'),
      allowNull: false,
      defaultValue: 'rectangle',
      validate: {
        isIn: {
          args: [['rectangle', 'circle', 'arch']],
          msg: 'shape must be one of: rectangle, circle, arch'
        }
      }
    },
    pos_x: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: { args: [0], msg: 'pos_x must be at least 0' },
        max: { args: [100], msg: 'pos_x must not exceed 100' }
      }
    },
    pos_y: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: { args: [0], msg: 'pos_y must be at least 0' },
        max: { args: [100], msg: 'pos_y must not exceed 100' }
      }
    },
    width: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: { args: [0], msg: 'width must be at least 0' },
        max: { args: [100], msg: 'width must not exceed 100' }
      }
    },
    height: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: { args: [0], msg: 'height must be at least 0' },
        max: { args: [100], msg: 'height must not exceed 100' }
      }
    },
    rotation: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.00
    }
  },
  {
    sequelize,
    modelName: 'ProductDesign',
    tableName: 'product_designs',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Associations
const Product = require('./Product');

ProductDesign.belongsTo(Product, {
  as: 'product',
  foreignKey: 'product_id'
});

Product.hasMany(ProductDesign, {
  as: 'designs',
  foreignKey: 'product_id'
});

module.exports = ProductDesign;
