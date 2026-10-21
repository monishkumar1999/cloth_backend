const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class NavigationItem extends Model {}

NavigationItem.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    label: {
      type: DataTypes.STRING(60),
      allowNull: false,
      validate: {
        notNull: { msg: 'Label is required' },
        notEmpty: { msg: 'Label cannot be empty' },
        len: {
          args: [1, 60],
          msg: 'Label must be between 1 and 60 characters'
        }
      }
    },
    href: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notNull: { msg: 'href destination is required' },
        notEmpty: { msg: 'href cannot be empty' },
        len: {
          args: [1, 500],
          msg: 'href must be between 1 and 500 characters'
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
    },
    open_in_new_tab: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'NavigationItem',
    tableName: 'navigation_items',
    timestamps: true,
    underscored: true
  }
);

module.exports = NavigationItem;
