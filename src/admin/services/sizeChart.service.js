const { Op } = require('sequelize');
const { sequelize } = require('../../config/db');
const SizeChart = require('../models/SizeChart');
const SizeChartColumn = require('../models/SizeChartColumn');
const SizeChartRow = require('../models/SizeChartRow');

class SizeChartService {
  /**
   * List all size charts for admin with pagination, search, status, and chart_type filters
   */
  async listAdminSizeCharts(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const where = {};
    if (query.is_active !== undefined && query.is_active !== '') {
      where.is_active = query.is_active === 'true' || query.is_active === true;
    }
    if (query.chart_type && typeof query.chart_type === 'string') {
      where.chart_type = query.chart_type.trim().toLowerCase();
    }
    if (query.search && typeof query.search === 'string') {
      const search = `%${query.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: search } },
        { slug: { [Op.like]: search } }
      ];
    }

    const { count, rows } = await SizeChart.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ],
      include: [
        {
          model: SizeChartColumn,
          as: 'columns',
          order: [
            ['display_order', 'ASC'],
            ['id', 'ASC']
          ]
        },
        {
          model: SizeChartRow,
          as: 'rows',
          order: [
            ['display_order', 'ASC'],
            ['id', 'ASC']
          ]
        }
      ]
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      size_charts: rows
    };
  }

  /**
   * Fetch single size chart with ordered columns and rows by ID
   */
  async getSizeChartById(id) {
    const chart = await SizeChart.findByPk(id, {
      include: [
        {
          model: SizeChartColumn,
          as: 'columns',
          order: [
            ['display_order', 'ASC'],
            ['id', 'ASC']
          ]
        },
        {
          model: SizeChartRow,
          as: 'rows',
          order: [
            ['display_order', 'ASC'],
            ['id', 'ASC']
          ]
        }
      ]
    });

    return chart;
  }

  /**
   * Create a size chart with optional atomic columns and rows creation
   */
  async createSizeChart(data) {
    const { columns = [], rows = [], ...chartData } = data;

    const result = await sequelize.transaction(async (t) => {
      const chart = await SizeChart.create(chartData, { transaction: t });

      if (columns.length > 0) {
        const columnsToCreate = columns.map((col, idx) => ({
          ...col,
          size_chart_id: chart.id,
          display_order: col.display_order !== undefined ? col.display_order : idx
        }));
        await SizeChartColumn.bulkCreate(columnsToCreate, { transaction: t });
      }

      if (rows.length > 0) {
        const rowsToCreate = rows.map((row, idx) => ({
          ...row,
          size_chart_id: chart.id,
          display_order: row.display_order !== undefined ? row.display_order : idx
        }));
        await SizeChartRow.bulkCreate(rowsToCreate, { transaction: t });
      }

      return chart;
    });

    return this.getSizeChartById(result.id);
  }

  /**
   * Update size chart metadata, and optionally replace columns/rows atomically
   */
  async updateSizeChart(id, data) {
    const chart = await SizeChart.findByPk(id);
    if (!chart) {
      return null;
    }

    const { columns, rows, ...chartData } = data;

    await sequelize.transaction(async (t) => {
      if (Object.keys(chartData).length > 0) {
        await chart.update(chartData, { transaction: t });
      }

      if (columns !== undefined) {
        await SizeChartColumn.destroy({ where: { size_chart_id: id }, transaction: t });
        if (columns.length > 0) {
          const columnsToCreate = columns.map((col, idx) => ({
            ...col,
            size_chart_id: id,
            display_order: col.display_order !== undefined ? col.display_order : idx
          }));
          await SizeChartColumn.bulkCreate(columnsToCreate, { transaction: t });
        }
      }

      if (rows !== undefined) {
        await SizeChartRow.destroy({ where: { size_chart_id: id }, transaction: t });
        if (rows.length > 0) {
          const rowsToCreate = rows.map((row, idx) => ({
            ...row,
            size_chart_id: id,
            display_order: row.display_order !== undefined ? row.display_order : idx
          }));
          await SizeChartRow.bulkCreate(rowsToCreate, { transaction: t });
        }
      }
    });

    return this.getSizeChartById(id);
  }

  /**
   * Enable or disable size chart status
   */
  async updateSizeChartStatus(id, isActive) {
    const chart = await SizeChart.findByPk(id);
    if (!chart) {
      return null;
    }

    await chart.update({ is_active: isActive });
    return chart;
  }

  /**
   * Delete size chart safely
   */
  async deleteSizeChart(id) {
    const chart = await SizeChart.findByPk(id);
    if (!chart) {
      return { found: false };
    }

    // Dependency check: Future products table referencing size_chart_id
    const tables = await sequelize.getQueryInterface().showAllTables();
    if (tables.includes('products')) {
      const [products] = await sequelize.query(
        'SELECT COUNT(*) as count FROM products WHERE size_chart_id = ?',
        { replacements: [id] }
      );
      if (products[0]?.count > 0) {
        const error = new Error(`Cannot delete size chart because it is referenced by ${products[0].count} product(s).`);
        error.statusCode = 409;
        throw error;
      }
    }

    // Cascade deletion of columns and rows is handled via DB cascade / transaction
    await sequelize.transaction(async (t) => {
      await SizeChartRow.destroy({ where: { size_chart_id: id }, transaction: t });
      await SizeChartColumn.destroy({ where: { size_chart_id: id }, transaction: t });
      await chart.destroy({ transaction: t });
    });

    return { found: true, deleted: true };
  }

  // ==================== NESTED COLUMNS METHODS ====================

  async listColumns(sizeChartId) {
    const chart = await SizeChart.findByPk(sizeChartId);
    if (!chart) return null;

    return SizeChartColumn.findAll({
      where: { size_chart_id: sizeChartId },
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ]
    });
  }

  async createColumn(sizeChartId, data) {
    const chart = await SizeChart.findByPk(sizeChartId);
    if (!chart) return null;

    const column = await SizeChartColumn.create({
      ...data,
      size_chart_id: sizeChartId
    });
    return column;
  }

  async updateColumn(sizeChartId, columnId, data) {
    const column = await SizeChartColumn.findOne({
      where: { id: columnId, size_chart_id: sizeChartId }
    });
    if (!column) return null;

    // If key is being changed, update existing measurements in rows within a transaction
    if (data.key && data.key !== column.key) {
      await sequelize.transaction(async (t) => {
        const rows = await SizeChartRow.findAll({ where: { size_chart_id: sizeChartId }, transaction: t });
        for (const row of rows) {
          const measurements = { ...row.measurements };
          if (measurements[column.key] !== undefined) {
            measurements[data.key] = measurements[column.key];
            delete measurements[column.key];
            await row.update({ measurements }, { transaction: t });
          }
        }
        await column.update(data, { transaction: t });
      });
      return column;
    }

    await column.update(data);
    return column;
  }

  async deleteColumn(sizeChartId, columnId) {
    const column = await SizeChartColumn.findOne({
      where: { id: columnId, size_chart_id: sizeChartId }
    });
    if (!column) return { found: false };

    // Clean up measurements with this column key from rows atomically
    await sequelize.transaction(async (t) => {
      const rows = await SizeChartRow.findAll({ where: { size_chart_id: sizeChartId }, transaction: t });
      for (const row of rows) {
        const measurements = { ...row.measurements };
        if (measurements[column.key] !== undefined) {
          delete measurements[column.key];
          await row.update({ measurements }, { transaction: t });
        }
      }
      await column.destroy({ transaction: t });
    });

    return { found: true, deleted: true };
  }

  // ==================== NESTED ROWS METHODS ====================

  async listRows(sizeChartId) {
    const chart = await SizeChart.findByPk(sizeChartId);
    if (!chart) return null;

    return SizeChartRow.findAll({
      where: { size_chart_id: sizeChartId },
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ]
    });
  }

  async createRow(sizeChartId, data) {
    const chart = await SizeChart.findByPk(sizeChartId);
    if (!chart) return null;

    const row = await SizeChartRow.create({
      ...data,
      size_chart_id: sizeChartId
    });
    return row;
  }

  async updateRow(sizeChartId, rowId, data) {
    const row = await SizeChartRow.findOne({
      where: { id: rowId, size_chart_id: sizeChartId }
    });
    if (!row) return null;

    await row.update(data);
    return row;
  }

  async deleteRow(sizeChartId, rowId) {
    const row = await SizeChartRow.findOne({
      where: { id: rowId, size_chart_id: sizeChartId }
    });
    if (!row) return { found: false };

    await row.destroy();
    return { found: true, deleted: true };
  }

  // ==================== PUBLIC STOREFRONT METHODS ====================

  /**
   * Public: List active size charts (sanitized)
   */
  async getPublicSizeCharts() {
    const charts = await SizeChart.findAll({
      where: { is_active: true },
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ],
      attributes: ['id', 'name', 'slug', 'chart_type', 'description', 'image_url', 'display_order'],
      include: [
        {
          model: SizeChartColumn,
          as: 'columns',
          attributes: ['id', 'label', 'key', 'unit', 'value_type', 'display_order'],
          order: [
            ['display_order', 'ASC'],
            ['id', 'ASC']
          ]
        },
        {
          model: SizeChartRow,
          as: 'rows',
          attributes: ['id', 'size_label', 'size_code', 'measurements', 'display_order'],
          order: [
            ['display_order', 'ASC'],
            ['id', 'ASC']
          ]
        }
      ]
    });

    return charts;
  }

  /**
   * Public: Get single active size chart by slug (sanitized)
   */
  async getPublicSizeChartBySlug(slug) {
    const chart = await SizeChart.findOne({
      where: { slug, is_active: true },
      attributes: ['id', 'name', 'slug', 'chart_type', 'description', 'image_url'],
      include: [
        {
          model: SizeChartColumn,
          as: 'columns',
          attributes: ['id', 'label', 'key', 'unit', 'value_type', 'display_order'],
          order: [
            ['display_order', 'ASC'],
            ['id', 'ASC']
          ]
        },
        {
          model: SizeChartRow,
          as: 'rows',
          attributes: ['id', 'size_label', 'size_code', 'measurements', 'display_order'],
          order: [
            ['display_order', 'ASC'],
            ['id', 'ASC']
          ]
        }
      ]
    });

    return chart;
  }
}

module.exports = new SizeChartService();
