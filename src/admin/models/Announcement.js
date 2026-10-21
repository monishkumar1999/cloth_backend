const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class Announcement extends Model {}

Announcement.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    message: {
      type: DataTypes.STRING(250),
      allowNull: false,
      validate: {
        notNull: { msg: 'Message is required' },
        notEmpty: { msg: 'Message cannot be empty' },
        len: {
          args: [1, 250],
          msg: 'Message must be between 1 and 250 characters'
        }
      }
    },
    link_text: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    link_url: {
      type: DataTypes.STRING(2048),
      allowNull: true
    },
    background_color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: '#171717'
    },
    text_color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: '#FFFFFF'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    starts_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ends_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Announcement',
    tableName: 'announcements',
    timestamps: true,
    underscored: true
  }
);

module.exports = Announcement;
