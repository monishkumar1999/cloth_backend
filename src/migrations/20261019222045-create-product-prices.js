const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('product_prices', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      product_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      variant_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'product_variants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      size: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      product_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      selling_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      current_stock: {
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

    await queryInterface.addIndex('product_prices', ['product_id'], {
      name: 'idx_product_prices_product_id'
    });

    await queryInterface.addIndex('product_prices', ['variant_id'], {
      name: 'idx_product_prices_variant_id'
    });

    await queryInterface.addIndex('product_prices', ['is_active'], {
      name: 'idx_product_prices_is_active'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('product_prices');
  }
};
