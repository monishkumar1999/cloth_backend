const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    const tableDesc = await queryInterface.describeTable('product_variants');
    if (!tableDesc.images) {
      await queryInterface.addColumn('product_variants', 'images', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Array of gallery image URLs'
      });
    }

    if (!tableDesc.gallery) {
      await queryInterface.addColumn('product_variants', 'gallery', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Ordered variant gallery items [{ image_url, position, is_primary }]'
      });
    }
  },

  down: async (queryInterface) => {
    const tableDesc = await queryInterface.describeTable('product_variants');
    if (tableDesc.gallery) {
      await queryInterface.removeColumn('product_variants', 'gallery');
    }
    if (tableDesc.images) {
      await queryInterface.removeColumn('product_variants', 'images');
    }
  }
};
