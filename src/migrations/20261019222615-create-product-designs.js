const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('product_designs', {
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
        onDelete: 'CASCADE',
        comment: 'References products.id'
      },
      color_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'default',
        comment: 'e.g. Jet Black, Off White, Crimson Red'
      },
      color_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: null,
        comment: 'Hex code e.g. #000000'
      },
      view_side: {
        type: DataTypes.ENUM('front', 'back', 'left', 'right', 'default'),
        allowNull: false,
        defaultValue: 'front',
        comment: 'Placement side of mockup'
      },
      mockup_image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
        comment: 'Mockup product image URL'
      },
      zone_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Design Zone',
        comment: 'e.g. Front Chest, Center Box, Back Logo'
      },
      shape: {
        type: DataTypes.ENUM('rectangle', 'circle', 'arch'),
        allowNull: false,
        defaultValue: 'rectangle',
        comment: 'Design area boundary shape'
      },
      pos_x: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Left X position in % (0 - 100)'
      },
      pos_y: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Top Y position in % (0 - 100)'
      },
      width: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Width in % (0 - 100)'
      },
      height: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Height in % (0 - 100)'
      },
      rotation: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Rotation angle in degrees'
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

    await queryInterface.addIndex('product_designs', ['product_id'], {
      name: 'idx_product_designs_product_id'
    });

    await queryInterface.addIndex('product_designs', ['product_id', 'view_side'], {
      name: 'idx_product_designs_product_view'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('product_designs');
  }
};
