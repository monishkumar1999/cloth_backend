const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('product_variants', {
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
      variant_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      variant_image: {
        type: DataTypes.STRING(500),
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

    await queryInterface.addIndex('product_variants', ['product_id'], {
      name: 'idx_product_variants_product_id'
    });

    await queryInterface.addIndex('product_variants', ['deleted_at'], {
      name: 'idx_product_variants_deleted_at'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('product_variants');
  }
};
