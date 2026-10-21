const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class Category extends Model {}

Category.init(
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
        notNull: { msg: 'Category name is required' },
        notEmpty: { msg: 'Category name cannot be empty' },
        len: {
          args: [1, 100],
          msg: 'Category name must be between 1 and 100 characters'
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
    parent_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
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
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
    underscored: true
  }
);

// Self-referential associations for parent and child categories
Category.belongsTo(Category, {
  as: 'parent',
  foreignKey: 'parent_id'
});

Category.hasMany(Category, {
  as: 'children',
  foreignKey: 'parent_id'
});

module.exports = Category;
