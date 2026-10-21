const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class SizeChart extends Model {}

SizeChart.init(
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
        notNull: { msg: 'Size chart name is required' },
        notEmpty: { msg: 'Size chart name cannot be empty' },
        len: {
          args: [1, 150],
          msg: 'Size chart name must be between 1 and 150 characters'
        }
      }
    },
    slug: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: 'Slug is required' },
        notEmpty: { msg: 'Slug cannot be empty' },
        len: {
          args: [1, 160],
          msg: 'Slug must be between 1 and 160 characters'
        }
      }
    },
    chart_type: {
      type: DataTypes.ENUM('clothing', 'footwear', 'ring', 'custom'),
      allowNull: false,
      defaultValue: 'clothing',
      validate: {
        isIn: {
          args: [['clothing', 'footwear', 'ring', 'custom']],
          msg: 'chart_type must be one of: clothing, footwear, ring, custom'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'image_url must not exceed 500 characters'
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
    modelName: 'SizeChart',
    tableName: 'size_charts',
    timestamps: true,
    underscored: true
  }
);

module.exports = SizeChart;
