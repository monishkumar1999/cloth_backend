const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // 1. Create size_charts table
    await queryInterface.createTable('size_charts', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true
      },
      chart_type: {
        type: DataTypes.ENUM('clothing', 'footwear', 'ring', 'custom'),
        allowNull: false,
        defaultValue: 'clothing'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      image_url: {
        type: DataTypes.STRING(500),
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

    // Indexes on size_charts
    await queryInterface.addIndex('size_charts', ['is_active', 'display_order', 'id'], {
      name: 'idx_size_charts_active_order'
    });

    await queryInterface.addIndex('size_charts', ['chart_type'], {
      name: 'idx_size_charts_chart_type'
    });

    // 2. Create size_chart_columns table
    await queryInterface.createTable('size_chart_columns', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      size_chart_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'size_charts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      label: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      key: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      unit: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      value_type: {
        type: DataTypes.ENUM('text', 'number'),
        allowNull: false,
        defaultValue: 'number'
      },
      display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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

    // Composite unique index: key scoped to size_chart_id
    await queryInterface.addIndex('size_chart_columns', ['size_chart_id', 'key'], {
      unique: true,
      name: 'uq_size_chart_column_key'
    });

    await queryInterface.addIndex('size_chart_columns', ['size_chart_id', 'display_order', 'id'], {
      name: 'idx_size_chart_columns_order'
    });

    // 3. Create size_chart_rows table
    await queryInterface.createTable('size_chart_rows', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      size_chart_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'size_charts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      size_label: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      size_code: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      measurements: {
        type: DataTypes.JSON,
        allowNull: false
      },
      display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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

    // Composite unique index: size_label scoped to size_chart_id
    await queryInterface.addIndex('size_chart_rows', ['size_chart_id', 'size_label'], {
      unique: true,
      name: 'uq_size_chart_row_label'
    });

    await queryInterface.addIndex('size_chart_rows', ['size_chart_id', 'display_order', 'id'], {
      name: 'idx_size_chart_rows_order'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('size_chart_rows');
    await queryInterface.dropTable('size_chart_columns');
    await queryInterface.dropTable('size_charts');
  }
};
