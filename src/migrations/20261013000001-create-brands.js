const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('brands', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING(180),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      logo_url: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      website_url: {
        type: DataTypes.STRING(500),
        allowNull: true
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

    // Composite & index lookup
    await queryInterface.addIndex('brands', ['is_active', 'display_order', 'id'], {
      name: 'idx_brands_active_order'
    });

    await queryInterface.addIndex('brands', ['name'], {
      name: 'idx_brands_name'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('brands');
  }
};
