const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('announcements', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      message: {
        type: DataTypes.STRING(250),
        allowNull: false
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
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    // Add indexes for efficient queries on priority and active schedule lookup
    await queryInterface.addIndex('announcements', ['is_active', 'priority', 'starts_at', 'ends_at'], {
      name: 'idx_announcements_public_filter'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('announcements');
  }
};
