const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');
const ProductAttribute = require('./ProductAttribute');

class ProductAttributeValue extends Model {}

ProductAttributeValue.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    attribute_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'product_attributes',
        key: 'id'
      },
      validate: {
        notNull: { msg: 'attribute_id is required' }
      }
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Label is required' },
        notEmpty: { msg: 'Label cannot be empty' },
        len: {
          args: [1, 100],
          msg: 'Label must be between 1 and 100 characters'
        }
      }
    },
    value: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notNull: { msg: 'Value is required' },
        notEmpty: { msg: 'Value cannot be empty' },
        len: {
          args: [1, 120],
          msg: 'Value must be between 1 and 120 characters'
        }
      }
    },
    color_code: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: {
          args: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
          msg: 'color_code must be a valid hexadecimal color (e.g., #000000 or #FFF)'
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
    modelName: 'ProductAttributeValue',
    tableName: 'product_attribute_values',
    timestamps: true,
    underscored: true
  }
);

// Association definitions
ProductAttribute.hasMany(ProductAttributeValue, {
  as: 'values',
  foreignKey: 'attribute_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

ProductAttributeValue.belongsTo(ProductAttribute, {
  as: 'attribute',
  foreignKey: 'attribute_id'
});

module.exports = ProductAttributeValue;
