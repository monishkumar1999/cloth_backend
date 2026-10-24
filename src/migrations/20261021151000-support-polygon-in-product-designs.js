const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // 1. Change shape column from ENUM('rectangle', 'circle', 'arch') to VARCHAR(50)
    // to support 'polygon', 'freeform', 'circle', 'arch', 'rectangle', 'oval', etc.
    await queryInterface.changeColumn('product_designs', 'shape', {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'rectangle',
      comment: 'Design area boundary shape e.g. rectangle, circle, arch, polygon, etc.'
    });

    // 2. Add points JSON column for freeform polygon coordinates
    const tableDesc = await queryInterface.describeTable('product_designs');
    if (!tableDesc.points) {
      await queryInterface.addColumn('product_designs', 'points', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Array of polygon vertex coordinates [{x, y}]'
      });
    }

    // 3. Add clip_path column for CSS clip-path polygon(...) string
    if (!tableDesc.clip_path) {
      await queryInterface.addColumn('product_designs', 'clip_path', {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'CSS clip-path polygon(...) definition'
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('product_designs', 'clip_path');
    await queryInterface.removeColumn('product_designs', 'points');
    await queryInterface.changeColumn('product_designs', 'shape', {
      type: DataTypes.ENUM('rectangle', 'circle', 'arch'),
      allowNull: false,
      defaultValue: 'rectangle'
    });
  }
};
