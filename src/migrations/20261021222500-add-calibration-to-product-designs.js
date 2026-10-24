const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    const tableDesc = await queryInterface.describeTable('product_designs');
    if (!tableDesc.calibration) {
      await queryInterface.addColumn('product_designs', 'calibration', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Artwork alignment calibration { rotation, scale, x, y, isFlipped, fitMode }'
      });
    }
  },

  down: async (queryInterface) => {
    const tableDesc = await queryInterface.describeTable('product_designs');
    if (tableDesc.calibration) {
      await queryInterface.removeColumn('product_designs', 'calibration');
    }
  }
};
