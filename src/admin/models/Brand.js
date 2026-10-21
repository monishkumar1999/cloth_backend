const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class Brand extends Model {}

Brand.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notNull: { msg: 'Brand name is required' },
        notEmpty: { msg: 'Brand name cannot be empty' },
        len: {
          args: [1, 150],
          msg: 'Brand name must be between 1 and 150 characters'
        }
      }
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: 'Slug is required' },
        notEmpty: { msg: 'Slug cannot be empty' },
        len: {
          args: [1, 180],
          msg: 'Slug must be between 1 and 180 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'logo_url must not exceed 500 characters'
        }
      }
    },
    website_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'website_url must not exceed 500 characters'
        }
      }
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Brand',
    tableName: 'brands',
    timestamps: true,
    underscored: true
  }
);

module.exports = Brand;
