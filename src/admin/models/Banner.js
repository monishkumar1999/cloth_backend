const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class Banner extends Model {}

Banner.init(
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
        notNull: { msg: 'Name is required' },
        notEmpty: { msg: 'Name cannot be empty' },
        len: {
          args: [1, 100],
          msg: 'Name must be between 1 and 100 characters'
        }
      }
    },
    eyebrow: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Eyebrow must not exceed 100 characters'
        }
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notNull: { msg: 'Title is required' },
        notEmpty: { msg: 'Title cannot be empty' },
        len: {
          args: [1, 200],
          msg: 'Title must be between 1 and 200 characters'
        }
      }
    },
    subtitle: {
      type: DataTypes.STRING(300),
      allowNull: true,
      validate: {
        len: {
          args: [0, 300],
          msg: 'Subtitle must not exceed 300 characters'
        }
      }
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notNull: { msg: 'Desktop image_url is required' },
        notEmpty: { msg: 'Desktop image_url cannot be empty' },
        len: {
          args: [1, 500],
          msg: 'image_url must not exceed 500 characters'
        }
      }
    },
    mobile_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'mobile_image_url must not exceed 500 characters'
        }
      }
    },
    image_alt_text: {
      type: DataTypes.STRING(250),
      allowNull: true,
      validate: {
        len: {
          args: [0, 250],
          msg: 'image_alt_text must not exceed 250 characters'
        }
      }
    },
    cta_text: {
      type: DataTypes.STRING(60),
      allowNull: true,
      validate: {
        len: {
          args: [0, 60],
          msg: 'cta_text must not exceed 60 characters'
        }
      }
    },
    cta_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'cta_url must not exceed 500 characters'
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
    modelName: 'Banner',
    tableName: 'banners',
    timestamps: true,
    underscored: true
  }
);

module.exports = Banner;
