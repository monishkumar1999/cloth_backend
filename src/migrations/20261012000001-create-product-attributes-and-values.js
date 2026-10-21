const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // 1. Create product_attributes table
    await queryInterface.createTable('product_attributes', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      input_type: {
        type: DataTypes.ENUM('text', 'number', 'boolean', 'select', 'multiselect'),
        allowNull: false,
        defaultValue: 'select'
      },
      unit: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      is_variant_attribute: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_filterable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      display_order: {
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

    // Indexes on product_attributes
    await queryInterface.addIndex('product_attributes', ['is_active', 'display_order', 'id'], {
      name: 'idx_product_attributes_active_order'
    });

    await queryInterface.addIndex('product_attributes', ['input_type'], {
      name: 'idx_product_attributes_input_type'
    });

    // 2. Create product_attribute_values table
    await queryInterface.createTable('product_attribute_values', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      attribute_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'product_attributes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      label: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      value: {
        type: DataTypes.STRING(120),
        allowNull: false
      },
      color_code: {
        type: DataTypes.STRING(7),
        allowNull: true
      },
      display_order: {
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

    // Unique composite index: value scoped to attribute_id
    await queryInterface.addIndex('product_attribute_values', ['attribute_id', 'value'], {
      unique: true,
      name: 'uq_attribute_value'
    });

    // Index for fast lookup of attribute values in display order
    await queryInterface.addIndex('product_attribute_values', ['attribute_id', 'is_active', 'display_order', 'id'], {
      name: 'idx_attribute_values_active_order'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('product_attribute_values');
    await queryInterface.dropTable('product_attributes');
  }
};
