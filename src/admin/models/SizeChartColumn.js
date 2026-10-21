const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');
const SizeChart = require('./SizeChart');

class SizeChartColumn extends Model {}

SizeChartColumn.init(
  {
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
      validate: {
        notNull: { msg: 'size_chart_id is required' }
      }
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Column label is required' },
        notEmpty: { msg: 'Column label cannot be empty' },
        len: {
          args: [1, 100],
          msg: 'Column label must be between 1 and 100 characters'
        }
      }
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Column key is required' },
        notEmpty: { msg: 'Column key cannot be empty' },
        len: {
          args: [1, 100],
          msg: 'Column key must be between 1 and 100 characters'
        }
      }
    },
    unit: {
      type: DataTypes.STRING(30),
      allowNull: true,
      validate: {
        len: {
          args: [0, 30],
          msg: 'Unit must not exceed 30 characters'
        }
      }
    },
    value_type: {
      type: DataTypes.ENUM('text', 'number'),
      allowNull: false,
      defaultValue: 'number',
      validate: {
        isIn: {
          args: [['text', 'number']],
          msg: 'value_type must be either text or number'
        }
      }
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'SizeChartColumn',
    tableName: 'size_chart_columns',
    timestamps: true,
    underscored: true
  }
);

// Association definitions
SizeChart.hasMany(SizeChartColumn, {
  as: 'columns',
  foreignKey: 'size_chart_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

SizeChartColumn.belongsTo(SizeChart, {
  as: 'chart',
  foreignKey: 'size_chart_id'
});

module.exports = SizeChartColumn;
