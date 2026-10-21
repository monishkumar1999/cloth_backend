const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('products', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      product_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      category_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      active_status: {
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
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('products', ['category_id'], {
      name: 'idx_products_category_id'
    });

    await queryInterface.addIndex('products', ['active_status'], {
      name: 'idx_products_active_status'
    });

    await queryInterface.addIndex('products', ['deleted_at'], {
      name: 'idx_products_deleted_at'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('products');
  }
};
