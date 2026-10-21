const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // 1. Add fields to products table
    await queryInterface.addColumn('products', 'has_variants', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'description'
    });

    await queryInterface.addColumn('products', 'base_price', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      after: 'has_variants'
    });

    await queryInterface.addColumn('products', 'compare_price', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      after: 'base_price'
    });

    await queryInterface.addColumn('products', 'stock_quantity', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      after: 'compare_price'
    });

    await queryInterface.addColumn('products', 'sku', {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
      after: 'stock_quantity'
    });

    await queryInterface.addColumn('products', 'options_config', {
      type: DataTypes.JSON,
      allowNull: true,
      after: 'sku',
      comment: 'Raw options/attributes definitions with image assets and IDs'
    });

    // 2. Add sku and options_payload to product_prices table for variant specific sku & options
    await queryInterface.addColumn('product_prices', 'sku', {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
      after: 'current_stock'
    });

    await queryInterface.addColumn('product_prices', 'options', {
      type: DataTypes.JSON,
      allowNull: true,
      after: 'sku',
      comment: 'JSON map of selected option values e.g. { Color: "gold", Size: "M" }'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('product_prices', 'options');
    await queryInterface.removeColumn('product_prices', 'sku');
    await queryInterface.removeColumn('products', 'options_config');
    await queryInterface.removeColumn('products', 'sku');
    await queryInterface.removeColumn('products', 'stock_quantity');
    await queryInterface.removeColumn('products', 'compare_price');
    await queryInterface.removeColumn('products', 'base_price');
    await queryInterface.removeColumn('products', 'has_variants');
  }
};
