const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('products', 'image_url', {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
      after: 'description',
      comment: 'Primary product image URL'
    });

    await queryInterface.addColumn('products', 'images', {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      after: 'image_url',
      comment: 'Gallery or additional product image URLs array'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('products', 'images');
    await queryInterface.removeColumn('products', 'image_url');
  }
};
