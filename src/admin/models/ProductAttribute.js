const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class ProductAttribute extends Model {}

ProductAttribute.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Attribute name is required' },
        notEmpty: { msg: 'Attribute name cannot be empty' },
        len: {
          args: [1, 100],
          msg: 'Attribute name must be between 1 and 100 characters'
        }
      }
    },
    slug: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: 'Slug is required' },
        notEmpty: { msg: 'Slug cannot be empty' },
        len: {
          args: [1, 120],
          msg: 'Slug must be between 1 and 120 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    input_type: {
      type: DataTypes.ENUM('text', 'number', 'boolean', 'select', 'multiselect'),
      allowNull: false,
      defaultValue: 'select',
      validate: {
        isIn: {
          args: [['text', 'number', 'boolean', 'select', 'multiselect']],
          msg: 'input_type must be one of: text, number, boolean, select, multiselect'
        }
      }
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Unit must not exceed 50 characters'
        }
      }
    },
    is_variant_attribute: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_filterable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    modelName: 'ProductAttribute',
    tableName: 'product_attributes',
    timestamps: true,
    underscored: true
  }
);

module.exports = ProductAttribute;
