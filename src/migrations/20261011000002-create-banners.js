const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('banners', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      eyebrow: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      subtitle: {
        type: DataTypes.STRING(300),
        allowNull: true
      },
      image_url: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      mobile_image_url: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      image_alt_text: {
        type: DataTypes.STRING(250),
        allowNull: true
      },
      cta_text: {
        type: DataTypes.STRING(60),
        allowNull: true
      },
      cta_url: {
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

    // Public homepage query composite index:
    // WHERE is_active = true AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())
    // ORDER BY display_order ASC, id ASC
    await queryInterface.addIndex('banners', ['is_active', 'starts_at', 'ends_at', 'display_order', 'id'], {
      name: 'idx_banners_homepage_lookup'
    });

    // Seed default URBANDRIP hero banner
    const now = new Date();
    await queryInterface.bulkInsert('banners', [
      {
        name: 'Summer Oversized Launch Hero',
        eyebrow: 'NEW COLLECTION',
        title: 'OVERSIZED T-SHIRTS',
        subtitle: 'BIGGER FIT. BOLDER STYLE.',
        image_url: '/uploads/banners/oversized-desktop.webp',
        mobile_image_url: '/uploads/banners/oversized-mobile.webp',
        image_alt_text: 'Oversized streetwear collection',
        cta_text: 'SHOP NOW',
        cta_url: '/collections/oversized',
        display_order: 1,
        is_active: true,
        starts_at: null,
        ends_at: null,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('banners');
  }
};
