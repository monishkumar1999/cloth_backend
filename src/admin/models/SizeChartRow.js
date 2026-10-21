const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');
const SizeChart = require('./SizeChart');

class SizeChartRow extends Model {}

SizeChartRow.init(
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
    size_label: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'size_label is required' },
        notEmpty: { msg: 'size_label cannot be empty' },
        len: {
          args: [1, 100],
          msg: 'size_label must be between 1 and 100 characters'
        }
      }
    },
    size_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'size_code must not exceed 100 characters'
        }
      }
    },
    measurements: {
      type: DataTypes.JSON,
      allowNull: false,
      get() {
        const raw = this.getDataValue('measurements');
        if (typeof raw === 'string') {
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        }
        return raw;
      },
      set(val) {
        if (typeof val === 'string') {
          try {
            this.setDataValue('measurements', JSON.parse(val));
          } catch {
            this.setDataValue('measurements', val);
          }
        } else {
          this.setDataValue('measurements', val);
        }
      },
      validate: {
        notNull: { msg: 'measurements JSON is required' }
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
    modelName: 'SizeChartRow',
    tableName: 'size_chart_rows',
    timestamps: true,
    underscored: true
  }
);

// Association definitions
SizeChart.hasMany(SizeChartRow, {
  as: 'rows',
  foreignKey: 'size_chart_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

SizeChartRow.belongsTo(SizeChart, {
  as: 'chart',
  foreignKey: 'size_chart_id'
});

module.exports = SizeChartRow;
