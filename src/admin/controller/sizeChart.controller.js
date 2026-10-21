const sizeChartService = require('../services/sizeChart.service');

class SizeChartController {
  // ==================== ADMIN CHART ACTIONS ====================

  /**
   * GET /api/admin/size-charts
   */
  async listAdminSizeCharts(req, res, next) {
    try {
      const result = await sizeChartService.listAdminSizeCharts(req.query);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/size-charts/:id
   */
  async getAdminSizeChartById(req, res, next) {
    try {
      const chart = await sizeChartService.getSizeChartById(req.params.id);
      if (!chart) {
        return res.status(404).json({
          success: false,
          message: `Size chart with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: chart
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/size-charts
   */
  async createSizeChart(req, res, next) {
    try {
      const chart = await sizeChartService.createSizeChart(req.validatedData);
      return res.status(201).json({
        success: true,
        message: 'Size chart created successfully',
        data: chart
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/size-charts/:id
   */
  async updateSizeChart(req, res, next) {
    try {
      const chart = await sizeChartService.updateSizeChart(req.params.id, req.validatedData);
      if (!chart) {
        return res.status(404).json({
          success: false,
          message: `Size chart with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Size chart updated successfully',
        data: chart
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/size-charts/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const chart = await sizeChartService.updateSizeChartStatus(req.params.id, req.validatedData.is_active);
      if (!chart) {
        return res.status(404).json({
          success: false,
          message: `Size chart with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: `Size chart ${req.validatedData.is_active ? 'enabled' : 'disabled'} successfully`,
        data: chart
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/size-charts/:id
   */
  async deleteSizeChart(req, res, next) {
    try {
      const result = await sizeChartService.deleteSizeChart(req.params.id);
      if (!result.found) {
        return res.status(404).json({
          success: false,
          message: `Size chart with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Size chart deleted successfully'
      });
    } catch (error) {
      if (error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // ==================== NESTED COLUMNS ACTIONS ====================

  /**
   * GET /api/admin/size-charts/:id/columns
   */
  async listColumns(req, res, next) {
    try {
      const columns = await sizeChartService.listColumns(req.params.id);
      if (columns === null) {
        return res.status(404).json({
          success: false,
          message: `Size chart with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: columns
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/size-charts/:id/columns
   */
  async createColumn(req, res, next) {
    try {
      const column = await sizeChartService.createColumn(req.params.id, req.validatedData);
      if (!column) {
        return res.status(404).json({
          success: false,
          message: `Size chart with ID ${req.params.id} not found`
        });
      }
      return res.status(201).json({
        success: true,
        message: 'Column created successfully',
        data: column
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/size-charts/:id/columns/:columnId
   */
  async updateColumn(req, res, next) {
    try {
      const column = await sizeChartService.updateColumn(req.params.id, req.params.columnId, req.validatedData);
      if (!column) {
        return res.status(404).json({
          success: false,
          message: `Column with ID ${req.params.columnId} not found under size chart ${req.params.id}`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Column updated successfully',
        data: column
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/size-charts/:id/columns/:columnId
   */
  async deleteColumn(req, res, next) {
    try {
      const result = await sizeChartService.deleteColumn(req.params.id, req.params.columnId);
      if (!result.found) {
        return res.status(404).json({
          success: false,
          message: `Column with ID ${req.params.columnId} not found under size chart ${req.params.id}`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Column deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== NESTED ROWS ACTIONS ====================

  /**
   * GET /api/admin/size-charts/:id/rows
   */
  async listRows(req, res, next) {
    try {
      const rows = await sizeChartService.listRows(req.params.id);
      if (rows === null) {
        return res.status(404).json({
          success: false,
          message: `Size chart with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: rows
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/size-charts/:id/rows
   */
  async createRow(req, res, next) {
    try {
      const row = await sizeChartService.createRow(req.params.id, req.validatedData);
      if (!row) {
        return res.status(404).json({
          success: false,
          message: `Size chart with ID ${req.params.id} not found`
        });
      }
      return res.status(201).json({
        success: true,
        message: 'Row created successfully',
        data: row
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/size-charts/:id/rows/:rowId
   */
  async updateRow(req, res, next) {
    try {
      const row = await sizeChartService.updateRow(req.params.id, req.params.rowId, req.validatedData);
      if (!row) {
        return res.status(404).json({
          success: false,
          message: `Row with ID ${req.params.rowId} not found under size chart ${req.params.id}`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Row updated successfully',
        data: row
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/size-charts/:id/rows/:rowId
   */
  async deleteRow(req, res, next) {
    try {
      const result = await sizeChartService.deleteRow(req.params.id, req.params.rowId);
      if (!result.found) {
        return res.status(404).json({
          success: false,
          message: `Row with ID ${req.params.rowId} not found under size chart ${req.params.id}`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Row deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== PUBLIC STOREFRONT ACTIONS ====================

  /**
   * GET /api/size-charts (Public)
   */
  async getPublicSizeCharts(req, res, next) {
    try {
      const charts = await sizeChartService.getPublicSizeCharts();
      return res.status(200).json({
        success: true,
        data: charts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/size-charts/:slug (Public)
   */
  async getPublicSizeChartBySlug(req, res, next) {
    try {
      const chart = await sizeChartService.getPublicSizeChartBySlug(req.params.slug);
      if (!chart) {
        return res.status(404).json({
          success: false,
          message: `Size chart with slug '${req.params.slug}' not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: chart
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SizeChartController();
