const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // Modify view_side column in product_designs to VARCHAR(50)
    // to allow arbitrary view angles/sides like front, back, left_sleeve, right_sleeve, collar, custom, etc.
    await queryInterface.changeColumn('product_designs', 'view_side', {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'front',
      comment: 'Placement side/angle of mockup e.g. front, back, left_sleeve, right_sleeve, collar'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.changeColumn('product_designs', 'view_side', {
      type: DataTypes.ENUM('front', 'back', 'left', 'right', 'default'),
      allowNull: false,
      defaultValue: 'front',
      comment: 'Placement side of mockup'
    });
  }
};
