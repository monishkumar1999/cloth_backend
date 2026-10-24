const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class VariantImage extends Model {}

VariantImage.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    variant_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'product_variants',
        key: 'id'
      },
      validate: {
        notNull: { msg: 'Variant ID is required' }
      }
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notNull: { msg: 'Image URL is required' },
        notEmpty: { msg: 'Image URL cannot be empty' },
        len: {
          args: [1, 500],
          msg: 'image_url must not exceed 500 characters'
        }
      }
    },
    position: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'VariantImage',
    tableName: 'variant_images',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

module.exports = VariantImage;
