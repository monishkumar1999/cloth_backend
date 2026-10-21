const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('categories', {
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
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      image_url: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      parent_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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

    // 1. Index on slug for fast public lookups by slug (unique constraint already adds an index, but explicit for clarity)
    // 2. Composite index on (is_active, display_order, id) for customer public listing
    await queryInterface.addIndex('categories', ['is_active', 'display_order', 'id'], {
      name: 'idx_categories_active_order'
    });

    // 3. Index on parent_id for child category querying and foreign key relationship checks
    await queryInterface.addIndex('categories', ['parent_id'], {
      name: 'idx_categories_parent_id'
    });

    // Seed initial URBANDRIP categories
    const now = new Date();
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Men',
        slug: 'men',
        description: 'Streetwear, oversized tees, and urban essentials for men.',
        image_url: null,
        parent_id: null,
        display_order: 1,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Women',
        slug: 'women',
        description: 'Contemporary streetwear and elevated essentials for women.',
        image_url: null,
        parent_id: null,
        display_order: 2,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Caps, bags, socks, and street accessories to complete your fit.',
        image_url: null,
        parent_id: null,
        display_order: 3,
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('categories');
  }
};
