const validateCreateProduct = (req, res, next) => {
  const { name, product_name, category_id } = req.body;
  const errors = [];

  const productName = name || product_name;
  if (!productName || typeof productName !== 'string' || !productName.trim()) {
    errors.push({ field: 'name', message: 'Product name is required and cannot be empty' });
  }

  if (!category_id) {
    errors.push({ field: 'category_id', message: 'category_id is required' });
  } else if (!Number.isInteger(Number(category_id)) || Number(category_id) <= 0) {
    errors.push({ field: 'category_id', message: 'category_id must be a positive integer' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

const validateUpdateProduct = (req, res, next) => {
  const { name, product_name, category_id } = req.body;
  const errors = [];

  const productName = name || product_name;
  if (productName !== undefined && (typeof productName !== 'string' || !productName.trim())) {
    errors.push({ field: 'name', message: 'Product name cannot be empty' });
  }

  if (category_id !== undefined && (!Number.isInteger(Number(category_id)) || Number(category_id) <= 0)) {
    errors.push({ field: 'category_id', message: 'category_id must be a positive integer' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

const validateProductIdParam = (req, res, next) => {
  const { id } = req.params;
  const parsedId = Number(id);
  if (!id || !Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'id', message: 'Product ID must be a positive integer' }]
    });
  }
  req.params.id = parsedId;
  next();
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductIdParam
};
