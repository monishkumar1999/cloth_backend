const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('navigation_items', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      label: {
        type: DataTypes.STRING(60),
        allowNull: false
      },
      href: {
        type: DataTypes.STRING(500),
        allowNull: false
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

    // Composite index optimized for the public header query: WHERE is_active = true ORDER BY display_order ASC, id ASC
    await queryInterface.addIndex('navigation_items', ['is_active', 'display_order', 'id'], {
      name: 'idx_navigation_items_active_order'
    });

    // Seed initial storefront items
    const now = new Date();
    const initialItems = [
      { label: 'Home', href: '/', display_order: 1, is_active: true, open_in_new_tab: false, created_at: now, updated_at: now },
      { label: 'Men', href: '/collections/men', display_order: 2, is_active: true, open_in_new_tab: false, created_at: now, updated_at: now },
      { label: 'Women', href: '/collections/women', display_order: 3, is_active: true, open_in_new_tab: false, created_at: now, updated_at: now },
      { label: 'Oversized', href: '/collections/oversized', display_order: 4, is_active: true, open_in_new_tab: false, created_at: now, updated_at: now },
      { label: 'Graphic', href: '/collections/graphic', display_order: 5, is_active: true, open_in_new_tab: false, created_at: now, updated_at: now },
      { label: 'Minimal', href: '/collections/minimal', display_order: 6, is_active: true, open_in_new_tab: false, created_at: now, updated_at: now },
      { label: 'New Arrivals', href: '/collections/new-arrivals', display_order: 7, is_active: true, open_in_new_tab: false, created_at: now, updated_at: now }
    ];

    await queryInterface.bulkInsert('navigation_items', initialItems);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('navigation_items');
  }
};
