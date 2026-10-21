const attributeService = require('../services/attribute.service');

class AttributeController {
  /**
   * GET /api/admin/attributes - List attributes with pagination & filters
   */
  async listAttributes(req, res, next) {
    try {
      const result = await attributeService.listAttributes(req.query);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/attributes/:id - Fetch one attribute with values
   */
  async getAttributeById(req, res, next) {
    try {
      const attribute = await attributeService.getAttributeById(req.params.id);
      if (!attribute) {
        return res.status(404).json({
          success: false,
          message: `Attribute with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: attribute
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/attributes - Create attribute
   */
  async createAttribute(req, res, next) {
    try {
      const attribute = await attributeService.createAttribute(req.validatedData);
      return res.status(201).json({
        success: true,
        message: 'Attribute created successfully',
        data: attribute
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/attributes/:id - Update attribute
   */
  async updateAttribute(req, res, next) {
    try {
      const attribute = await attributeService.updateAttribute(req.params.id, req.validatedData);
      if (!attribute) {
        return res.status(404).json({
          success: false,
          message: `Attribute with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Attribute updated successfully',
        data: attribute
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

  /**
   * PATCH /api/admin/attributes/:id/status - Toggle attribute status
   */
  async updateAttributeStatus(req, res, next) {
    try {
      const attribute = await attributeService.updateAttributeStatus(req.params.id, req.validatedData.is_active);
      if (!attribute) {
        return res.status(404).json({
          success: false,
          message: `Attribute with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: `Attribute ${req.validatedData.is_active ? 'enabled' : 'disabled'} successfully`,
        data: attribute
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/attributes/:id - Delete attribute safely
   */
  async deleteAttribute(req, res, next) {
    try {
      const result = await attributeService.deleteAttribute(req.params.id);
      if (!result.found) {
        return res.status(404).json({
          success: false,
          message: `Attribute with ID ${req.params.id} not found`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Attribute deleted successfully'
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

  // ==================== ATTRIBUTE VALUES CONTROLLERS ====================

  /**
   * GET /api/admin/attributes/:attributeId/values - List values for attribute
   */
  async listAttributeValues(req, res, next) {
    try {
      const result = await attributeService.listAttributeValues(req.params.attributeId);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: `Attribute with ID ${req.params.attributeId} not found`
        });
      }
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/attributes/:attributeId/values - Create attribute value
   */
  async createAttributeValue(req, res, next) {
    try {
      const value = await attributeService.createAttributeValue(req.validatedData);
      return res.status(201).json({
        success: true,
        message: 'Attribute value created successfully',
        data: value
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/attributes/:attributeId/values/:valueId - Update attribute value
   */
  async updateAttributeValue(req, res, next) {
    try {
      const value = await attributeService.updateAttributeValue(
        req.params.attributeId,
        req.params.valueId,
        req.validatedData
      );
      if (!value) {
        return res.status(404).json({
          success: false,
          message: `Attribute value with ID ${req.params.valueId} not found under attribute ${req.params.attributeId}`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Attribute value updated successfully',
        data: value
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/attributes/:attributeId/values/:valueId/status - Toggle value status
   */
  async updateAttributeValueStatus(req, res, next) {
    try {
      const value = await attributeService.updateAttributeValueStatus(
        req.params.attributeId,
        req.params.valueId,
        req.validatedData.is_active
      );
      if (!value) {
        return res.status(404).json({
          success: false,
          message: `Attribute value with ID ${req.params.valueId} not found under attribute ${req.params.attributeId}`
        });
      }
      return res.status(200).json({
        success: true,
        message: `Attribute value ${req.validatedData.is_active ? 'enabled' : 'disabled'} successfully`,
        data: value
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/attributes/:attributeId/values/:valueId - Delete value safely
   */
  async deleteAttributeValue(req, res, next) {
    try {
      const result = await attributeService.deleteAttributeValue(
        req.params.attributeId,
        req.params.valueId
      );
      if (!result.found) {
        return res.status(404).json({
          success: false,
          message: `Attribute value with ID ${req.params.valueId} not found under attribute ${req.params.attributeId}`
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Attribute value deleted successfully'
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
}

module.exports = new AttributeController();
