const { Op } = require('sequelize');
const SizeChart = require('../models/SizeChart');
const SizeChartColumn = require('../models/SizeChartColumn');
const SizeChartRow = require('../models/SizeChartRow');

const VALID_CHART_TYPES = ['clothing', 'footwear', 'ring', 'custom'];
const VALID_VALUE_TYPES = ['text', 'number'];

/**
 * Normalizes text to URL-friendly slug
 */
const slugify = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&+/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Normalizes column key to snake_case identifier
 */
const normalizeKey = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const validateSizeChartIdParam = (req, res, next) => {
  const id = Number(req.params.id || req.params.chartId);
  if (!id || !Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'id', message: 'Size chart ID must be a positive integer' }]
    });
  }
  if (req.params.id) req.params.id = id;
  if (req.params.chartId) req.params.chartId = id;
  next();
};

const validateColumnIdParam = (req, res, next) => {
  const columnId = Number(req.params.columnId);
  if (!columnId || !Number.isInteger(columnId) || columnId <= 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'column_id', message: 'Column ID must be a positive integer' }]
    });
  }
  req.params.columnId = columnId;
  next();
};

const validateRowIdParam = (req, res, next) => {
  const rowId = Number(req.params.rowId);
  if (!rowId || !Number.isInteger(rowId) || rowId <= 0) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'row_id', message: 'Row ID must be a positive integer' }]
    });
  }
  req.params.rowId = rowId;
  next();
};

const validateSizeChartSlugParam = (req, res, next) => {
  const slug = req.params.slug ? req.params.slug.trim().toLowerCase() : '';
  if (!slug || slug.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'slug', message: 'Invalid slug format. Must be lowercase alphanumeric with hyphens.' }]
    });
  }
  req.params.slug = slug;
  next();
};

/**
 * Validate columns array and keys
 */
const validateColumnsArray = (columns, errors) => {
  if (!Array.isArray(columns)) {
    errors.push({ field: 'columns', message: 'Columns must be an array' });
    return [];
  }

  const seenKeys = new Set();
  const parsedColumns = [];

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i] || {};
    const label = typeof col.label === 'string' ? col.label.trim() : '';
    if (!label) {
      errors.push({ field: `columns[${i}].label`, message: 'Column label is required' });
    } else if (label.length > 100) {
      errors.push({ field: `columns[${i}].label`, message: 'Column label must not exceed 100 characters' });
    }

    let key = typeof col.key === 'string' ? normalizeKey(col.key) : normalizeKey(label);
    if (!key) {
      errors.push({ field: `columns[${i}].key`, message: 'Valid column key is required' });
    } else if (key.length > 100) {
      errors.push({ field: `columns[${i}].key`, message: 'Column key must not exceed 100 characters' });
    } else if (seenKeys.has(key)) {
      errors.push({ field: `columns[${i}].key`, message: `Duplicate column key '${key}' within the chart` });
    } else {
      seenKeys.add(key);
    }

    const value_type = col.value_type ? col.value_type.toString().trim().toLowerCase() : 'number';
    if (!VALID_VALUE_TYPES.includes(value_type)) {
      errors.push({
        field: `columns[${i}].value_type`,
        message: `value_type must be one of: ${VALID_VALUE_TYPES.join(', ')}`
      });
    }

    const unit = col.unit !== undefined && col.unit !== null ? col.unit.toString().trim() : null;
    if (unit && unit.length > 30) {
      errors.push({ field: `columns[${i}].unit`, message: 'Unit must not exceed 30 characters' });
    }

    const display_order = col.display_order !== undefined ? Number(col.display_order) : i;
    if (!Number.isInteger(display_order)) {
      errors.push({ field: `columns[${i}].display_order`, message: 'display_order must be an integer' });
    }

    parsedColumns.push({
      id: col.id ? Number(col.id) : undefined,
      label,
      key,
      unit: unit || null,
      value_type,
      display_order
    });
  }

  return parsedColumns;
};

/**
 * Validate rows array against columns definitions
 */
const validateRowsArray = (rows, parsedColumns, errors) => {
  if (!Array.isArray(rows)) {
    errors.push({ field: 'rows', message: 'Rows must be an array' });
    return [];
  }

  const columnMap = new Map();
  for (const col of parsedColumns) {
    if (col.key) {
      columnMap.set(col.key, col);
    }
  }

  const seenLabels = new Set();
  const parsedRows = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || {};
    const size_label = typeof row.size_label === 'string' ? row.size_label.trim() : '';
    if (!size_label) {
      errors.push({ field: `rows[${i}].size_label`, message: 'size_label is required' });
    } else if (size_label.length > 100) {
      errors.push({ field: `rows[${i}].size_label`, message: 'size_label must not exceed 100 characters' });
    } else {
      const normalizedLabel = size_label.toLowerCase();
      if (seenLabels.has(normalizedLabel)) {
        errors.push({ field: `rows[${i}].size_label`, message: `Duplicate size label '${size_label}' in size chart` });
      } else {
        seenLabels.add(normalizedLabel);
      }
    }

    const size_code = typeof row.size_code === 'string' && row.size_code.trim() ? row.size_code.trim() : null;
    if (size_code && size_code.length > 100) {
      errors.push({ field: `rows[${i}].size_code`, message: 'size_code must not exceed 100 characters' });
    }

    let rawMeasurements = row.measurements;
    if (typeof rawMeasurements === 'string') {
      try {
        rawMeasurements = JSON.parse(rawMeasurements);
      } catch {
        errors.push({ field: `rows[${i}].measurements`, message: 'measurements must be a valid JSON object' });
        rawMeasurements = {};
      }
    }

    if (!rawMeasurements || typeof rawMeasurements !== 'object' || Array.isArray(rawMeasurements)) {
      errors.push({ field: `rows[${i}].measurements`, message: 'measurements must be an object' });
      rawMeasurements = {};
    }

    const validatedMeasurements = {};
    for (const [key, val] of Object.entries(rawMeasurements)) {
      const colDef = columnMap.get(key);
      if (!colDef) {
        // Unknown key warning or ignore, but if column definitions provided, check if invalid
        validatedMeasurements[key] = val;
        continue;
      }

      if (val === null || val === undefined || val === '') {
        validatedMeasurements[key] = null;
        continue;
      }

      if (colDef.value_type === 'number') {
        const numVal = Number(val);
        if (isNaN(numVal)) {
          errors.push({
            field: `rows[${i}].measurements.${key}`,
            message: `Measurement '${key}' must be a valid number (got '${val}')`
          });
        } else {
          validatedMeasurements[key] = numVal;
        }
      } else {
        // text value
        validatedMeasurements[key] = String(val).trim();
      }
    }

    const display_order = row.display_order !== undefined ? Number(row.display_order) : i;
    if (!Number.isInteger(display_order)) {
      errors.push({ field: `rows[${i}].display_order`, message: 'display_order must be an integer' });
    }

    parsedRows.push({
      id: row.id ? Number(row.id) : undefined,
      size_label,
      size_code,
      measurements: validatedMeasurements,
      display_order
    });
  }

  return parsedRows;
};

/**
 * Middleware: Validate creating a size chart
 */
const validateCreateSizeChart = async (req, res, next) => {
  const errors = [];
  const {
    name,
    slug,
    chart_type,
    description,
    image_url,
    display_order,
    is_active,
    columns,
    rows
  } = req.body || {};

  // 1. Name validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push({ field: 'name', message: 'Size chart name is required' });
  } else if (name.trim().length > 150) {
    errors.push({ field: 'name', message: 'Size chart name must not exceed 150 characters' });
  }

  // 2. Slug validation
  let normalizedSlug = slug ? slugify(slug) : slugify(name);
  if (!normalizedSlug) {
    errors.push({ field: 'slug', message: 'A valid slug could not be generated' });
  } else if (normalizedSlug.length > 160) {
    errors.push({ field: 'slug', message: 'Slug must not exceed 160 characters' });
  } else {
    const existing = await SizeChart.findOne({ where: { slug: normalizedSlug } });
    if (existing) {
      errors.push({ field: 'slug', message: `Size chart with slug '${normalizedSlug}' already exists` });
    }
  }

  // 3. chart_type validation
  const finalType = chart_type ? chart_type.toString().trim().toLowerCase() : 'clothing';
  if (!VALID_CHART_TYPES.includes(finalType)) {
    errors.push({
      field: 'chart_type',
      message: `chart_type must be one of: ${VALID_CHART_TYPES.join(', ')}`
    });
  }

  // 4. image_url / file upload handling
  let finalImageUrl = null;
  if (req.files && (req.files.image || req.files.image_url || req.files.file)) {
    const uploadedFile = (req.files.image || req.files.image_url || req.files.file)[0];
    finalImageUrl = `/uploads/size-charts/${uploadedFile.filename}`;
  } else if (image_url && typeof image_url === 'string') {
    finalImageUrl = image_url.trim();
  }

  if (finalImageUrl && finalImageUrl.length > 500) {
    errors.push({ field: 'image_url', message: 'image_url must not exceed 500 characters' });
  }

  // 5. display_order
  let finalDisplayOrder = 0;
  if (display_order !== undefined && display_order !== null && display_order !== '') {
    const orderNum = Number(display_order);
    if (!Number.isInteger(orderNum)) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    } else {
      finalDisplayOrder = orderNum;
    }
  }

  // 6. is_active
  let finalIsActive = true;
  if (is_active !== undefined && is_active !== null && is_active !== '') {
    finalIsActive = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';
  }

  // 7. Parse columns & rows if provided
  let parsedColumns = [];
  if (columns !== undefined) {
    let rawCols = columns;
    if (typeof rawCols === 'string') {
      try {
        rawCols = JSON.parse(rawCols);
      } catch {
        errors.push({ field: 'columns', message: 'columns must be valid JSON array' });
        rawCols = [];
      }
    }
    parsedColumns = validateColumnsArray(rawCols, errors);
  }

  let parsedRows = [];
  if (rows !== undefined) {
    let rawRows = rows;
    if (typeof rawRows === 'string') {
      try {
        rawRows = JSON.parse(rawRows);
      } catch {
        errors.push({ field: 'rows', message: 'rows must be valid JSON array' });
        rawRows = [];
      }
    }
    parsedRows = validateRowsArray(rawRows, parsedColumns, errors);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = {
    name: name.trim(),
    slug: normalizedSlug,
    chart_type: finalType,
    description: description && typeof description === 'string' ? description.trim() : null,
    image_url: finalImageUrl,
    display_order: finalDisplayOrder,
    is_active: finalIsActive,
    columns: parsedColumns,
    rows: parsedRows
  };

  next();
};

/**
 * Middleware: Validate updating a size chart
 */
const validateUpdateSizeChart = async (req, res, next) => {
  const chartId = req.params.id;
  const errors = [];
  const {
    name,
    slug,
    chart_type,
    description,
    image_url,
    display_order,
    is_active,
    columns,
    rows
  } = req.body || {};

  const validatedData = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      errors.push({ field: 'name', message: 'Size chart name cannot be empty' });
    } else if (name.trim().length > 150) {
      errors.push({ field: 'name', message: 'Size chart name must not exceed 150 characters' });
    } else {
      validatedData.name = name.trim();
    }
  }

  if (slug !== undefined) {
    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) {
      errors.push({ field: 'slug', message: 'Slug cannot be empty' });
    } else if (normalizedSlug.length > 160) {
      errors.push({ field: 'slug', message: 'Slug must not exceed 160 characters' });
    } else {
      const existing = await SizeChart.findOne({
        where: {
          slug: normalizedSlug,
          id: { [Op.ne]: chartId }
        }
      });
      if (existing) {
        errors.push({ field: 'slug', message: `Size chart with slug '${normalizedSlug}' already exists` });
      } else {
        validatedData.slug = normalizedSlug;
      }
    }
  }

  if (chart_type !== undefined) {
    const finalType = chart_type.toString().trim().toLowerCase();
    if (!VALID_CHART_TYPES.includes(finalType)) {
      errors.push({
        field: 'chart_type',
        message: `chart_type must be one of: ${VALID_CHART_TYPES.join(', ')}`
      });
    } else {
      validatedData.chart_type = finalType;
    }
  }

  if (description !== undefined) {
    validatedData.description = description && typeof description === 'string' ? description.trim() : null;
  }

  if (req.files && (req.files.image || req.files.image_url || req.files.file)) {
    const uploadedFile = (req.files.image || req.files.image_url || req.files.file)[0];
    validatedData.image_url = `/uploads/size-charts/${uploadedFile.filename}`;
  } else if (image_url !== undefined) {
    if (image_url === null || image_url === '') {
      validatedData.image_url = null;
    } else if (typeof image_url === 'string') {
      if (image_url.trim().length > 500) {
        errors.push({ field: 'image_url', message: 'image_url must not exceed 500 characters' });
      } else {
        validatedData.image_url = image_url.trim();
      }
    }
  }

  if (display_order !== undefined && display_order !== null && display_order !== '') {
    const orderNum = Number(display_order);
    if (!Number.isInteger(orderNum)) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    } else {
      validatedData.display_order = orderNum;
    }
  }

  if (is_active !== undefined && is_active !== null && is_active !== '') {
    validatedData.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';
  }

  // Parse columns & rows if included in update
  let parsedColumns = null;
  if (columns !== undefined) {
    let rawCols = columns;
    if (typeof rawCols === 'string') {
      try {
        rawCols = JSON.parse(rawCols);
      } catch {
        errors.push({ field: 'columns', message: 'columns must be valid JSON array' });
        rawCols = [];
      }
    }
    parsedColumns = validateColumnsArray(rawCols, errors);
    validatedData.columns = parsedColumns;
  }

  if (rows !== undefined) {
    let rawRows = rows;
    if (typeof rawRows === 'string') {
      try {
        rawRows = JSON.parse(rawRows);
      } catch {
        errors.push({ field: 'rows', message: 'rows must be valid JSON array' });
        rawRows = [];
      }
    }
    // If columns were not sent, retrieve existing columns for the chart
    let colsForValidation = parsedColumns;
    if (!colsForValidation) {
      colsForValidation = await SizeChartColumn.findAll({
        where: { size_chart_id: chartId }
      });
    }
    validatedData.rows = validateRowsArray(rawRows, colsForValidation, errors);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = validatedData;
  next();
};

/**
 * Middleware: Validate toggling chart status
 */
const validateSizeChartStatus = (req, res, next) => {
  const { is_active } = req.body || {};
  if (is_active === undefined || is_active === null) {
    return res.status(400).json({
      success: false,
      errors: [{ field: 'is_active', message: 'is_active boolean field is required' }]
    });
  }

  const finalIsActive = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';
  req.validatedData = { is_active: finalIsActive };
  next();
};

/**
 * Middleware: Validate creating a single column
 */
const validateCreateColumn = async (req, res, next) => {
  const chartId = req.params.id || req.params.chartId;
  const errors = [];
  const { label, key, unit, value_type, display_order } = req.body || {};

  const cleanLabel = typeof label === 'string' ? label.trim() : '';
  if (!cleanLabel) {
    errors.push({ field: 'label', message: 'Column label is required' });
  } else if (cleanLabel.length > 100) {
    errors.push({ field: 'label', message: 'Column label must not exceed 100 characters' });
  }

  let finalKey = typeof key === 'string' && key.trim() ? normalizeKey(key) : normalizeKey(cleanLabel);
  if (!finalKey) {
    errors.push({ field: 'key', message: 'Valid column key is required' });
  } else if (finalKey.length > 100) {
    errors.push({ field: 'key', message: 'Column key must not exceed 100 characters' });
  } else {
    const existing = await SizeChartColumn.findOne({
      where: {
        size_chart_id: chartId,
        key: finalKey
      }
    });
    if (existing) {
      errors.push({ field: 'key', message: `Column key '${finalKey}' already exists in this chart` });
    }
  }

  const finalType = value_type ? value_type.toString().trim().toLowerCase() : 'number';
  if (!VALID_VALUE_TYPES.includes(finalType)) {
    errors.push({ field: 'value_type', message: `value_type must be one of: ${VALID_VALUE_TYPES.join(', ')}` });
  }

  const finalUnit = unit && typeof unit === 'string' ? unit.trim() : null;
  if (finalUnit && finalUnit.length > 30) {
    errors.push({ field: 'unit', message: 'Unit must not exceed 30 characters' });
  }

  let finalOrder = 0;
  if (display_order !== undefined && display_order !== null && display_order !== '') {
    const orderNum = Number(display_order);
    if (!Number.isInteger(orderNum)) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    } else {
      finalOrder = orderNum;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = {
    size_chart_id: chartId,
    label: cleanLabel,
    key: finalKey,
    unit: finalUnit,
    value_type: finalType,
    display_order: finalOrder
  };

  next();
};

/**
 * Middleware: Validate updating a single column
 */
const validateUpdateColumn = async (req, res, next) => {
  const chartId = req.params.id || req.params.chartId;
  const columnId = req.params.columnId;
  const errors = [];
  const { label, key, unit, value_type, display_order } = req.body || {};

  const validatedData = {};

  if (label !== undefined) {
    const cleanLabel = typeof label === 'string' ? label.trim() : '';
    if (!cleanLabel) {
      errors.push({ field: 'label', message: 'Column label cannot be empty' });
    } else if (cleanLabel.length > 100) {
      errors.push({ field: 'label', message: 'Column label must not exceed 100 characters' });
    } else {
      validatedData.label = cleanLabel;
    }
  }

  if (key !== undefined) {
    const finalKey = normalizeKey(key);
    if (!finalKey) {
      errors.push({ field: 'key', message: 'Column key cannot be empty' });
    } else if (finalKey.length > 100) {
      errors.push({ field: 'key', message: 'Column key must not exceed 100 characters' });
    } else {
      const existing = await SizeChartColumn.findOne({
        where: {
          size_chart_id: chartId,
          key: finalKey,
          id: { [Op.ne]: columnId }
        }
      });
      if (existing) {
        errors.push({ field: 'key', message: `Column key '${finalKey}' already exists in this chart` });
      } else {
        validatedData.key = finalKey;
      }
    }
  }

  if (value_type !== undefined) {
    const finalType = value_type.toString().trim().toLowerCase();
    if (!VALID_VALUE_TYPES.includes(finalType)) {
      errors.push({ field: 'value_type', message: `value_type must be one of: ${VALID_VALUE_TYPES.join(', ')}` });
    } else {
      validatedData.value_type = finalType;
    }
  }

  if (unit !== undefined) {
    if (unit === null || unit === '') {
      validatedData.unit = null;
    } else {
      const cleanUnit = String(unit).trim();
      if (cleanUnit.length > 30) {
        errors.push({ field: 'unit', message: 'Unit must not exceed 30 characters' });
      } else {
        validatedData.unit = cleanUnit;
      }
    }
  }

  if (display_order !== undefined && display_order !== null && display_order !== '') {
    const orderNum = Number(display_order);
    if (!Number.isInteger(orderNum)) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    } else {
      validatedData.display_order = orderNum;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = validatedData;
  next();
};

/**
 * Middleware: Validate creating a single row
 */
const validateCreateRow = async (req, res, next) => {
  const chartId = req.params.id || req.params.chartId;
  const errors = [];
  const { size_label, size_code, measurements, display_order } = req.body || {};

  const cleanLabel = typeof size_label === 'string' ? size_label.trim() : '';
  if (!cleanLabel) {
    errors.push({ field: 'size_label', message: 'size_label is required' });
  } else if (cleanLabel.length > 100) {
    errors.push({ field: 'size_label', message: 'size_label must not exceed 100 characters' });
  } else {
    const existing = await SizeChartRow.findOne({
      where: {
        size_chart_id: chartId,
        size_label: cleanLabel
      }
    });
    if (existing) {
      errors.push({ field: 'size_label', message: `Size label '${cleanLabel}' already exists in this chart` });
    }
  }

  const cleanCode = typeof size_code === 'string' && size_code.trim() ? size_code.trim() : null;
  if (cleanCode && cleanCode.length > 100) {
    errors.push({ field: 'size_code', message: 'size_code must not exceed 100 characters' });
  }

  let rawMeasurements = measurements;
  if (typeof rawMeasurements === 'string') {
    try {
      rawMeasurements = JSON.parse(rawMeasurements);
    } catch {
      errors.push({ field: 'measurements', message: 'measurements must be a valid JSON object' });
      rawMeasurements = {};
    }
  }

  if (!rawMeasurements || typeof rawMeasurements !== 'object' || Array.isArray(rawMeasurements)) {
    errors.push({ field: 'measurements', message: 'measurements must be an object' });
    rawMeasurements = {};
  }

  // Validate measurements against configured columns for this chart
  const columns = await SizeChartColumn.findAll({ where: { size_chart_id: chartId } });
  const columnMap = new Map();
  for (const c of columns) {
    columnMap.set(c.key, c);
  }

  const validatedMeasurements = {};
  for (const [k, v] of Object.entries(rawMeasurements)) {
    const colDef = columnMap.get(k);
    if (!colDef) {
      validatedMeasurements[k] = v;
      continue;
    }

    if (v === null || v === undefined || v === '') {
      validatedMeasurements[k] = null;
      continue;
    }

    if (colDef.value_type === 'number') {
      const numVal = Number(v);
      if (isNaN(numVal)) {
        errors.push({
          field: `measurements.${k}`,
          message: `Measurement '${k}' must be a valid number (got '${v}')`
        });
      } else {
        validatedMeasurements[k] = numVal;
      }
    } else {
      validatedMeasurements[k] = String(v).trim();
    }
  }

  let finalOrder = 0;
  if (display_order !== undefined && display_order !== null && display_order !== '') {
    const orderNum = Number(display_order);
    if (!Number.isInteger(orderNum)) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    } else {
      finalOrder = orderNum;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = {
    size_chart_id: chartId,
    size_label: cleanLabel,
    size_code: cleanCode,
    measurements: validatedMeasurements,
    display_order: finalOrder
  };

  next();
};

/**
 * Middleware: Validate updating a single row
 */
const validateUpdateRow = async (req, res, next) => {
  const chartId = req.params.id || req.params.chartId;
  const rowId = req.params.rowId;
  const errors = [];
  const { size_label, size_code, measurements, display_order } = req.body || {};

  const validatedData = {};

  if (size_label !== undefined) {
    const cleanLabel = typeof size_label === 'string' ? size_label.trim() : '';
    if (!cleanLabel) {
      errors.push({ field: 'size_label', message: 'size_label cannot be empty' });
    } else if (cleanLabel.length > 100) {
      errors.push({ field: 'size_label', message: 'size_label must not exceed 100 characters' });
    } else {
      const existing = await SizeChartRow.findOne({
        where: {
          size_chart_id: chartId,
          size_label: cleanLabel,
          id: { [Op.ne]: rowId }
        }
      });
      if (existing) {
        errors.push({ field: 'size_label', message: `Size label '${cleanLabel}' already exists in this chart` });
      } else {
        validatedData.size_label = cleanLabel;
      }
    }
  }

  if (size_code !== undefined) {
    if (size_code === null || size_code === '') {
      validatedData.size_code = null;
    } else {
      const cleanCode = String(size_code).trim();
      if (cleanCode.length > 100) {
        errors.push({ field: 'size_code', message: 'size_code must not exceed 100 characters' });
      } else {
        validatedData.size_code = cleanCode;
      }
    }
  }

  if (measurements !== undefined) {
    let rawMeasurements = measurements;
    if (typeof rawMeasurements === 'string') {
      try {
        rawMeasurements = JSON.parse(rawMeasurements);
      } catch {
        errors.push({ field: 'measurements', message: 'measurements must be a valid JSON object' });
        rawMeasurements = {};
      }
    }

    if (!rawMeasurements || typeof rawMeasurements !== 'object' || Array.isArray(rawMeasurements)) {
      errors.push({ field: 'measurements', message: 'measurements must be an object' });
    } else {
      const columns = await SizeChartColumn.findAll({ where: { size_chart_id: chartId } });
      const columnMap = new Map();
      for (const c of columns) {
        columnMap.set(c.key, c);
      }

      const validatedMeasurements = {};
      for (const [k, v] of Object.entries(rawMeasurements)) {
        const colDef = columnMap.get(k);
        if (!colDef) {
          validatedMeasurements[k] = v;
          continue;
        }

        if (v === null || v === undefined || v === '') {
          validatedMeasurements[k] = null;
          continue;
        }

        if (colDef.value_type === 'number') {
          const numVal = Number(v);
          if (isNaN(numVal)) {
            errors.push({
              field: `measurements.${k}`,
              message: `Measurement '${k}' must be a valid number (got '${v}')`
            });
          } else {
            validatedMeasurements[k] = numVal;
          }
        } else {
          validatedMeasurements[k] = String(v).trim();
        }
      }
      validatedData.measurements = validatedMeasurements;
    }
  }

  if (display_order !== undefined && display_order !== null && display_order !== '') {
    const orderNum = Number(display_order);
    if (!Number.isInteger(orderNum)) {
      errors.push({ field: 'display_order', message: 'display_order must be an integer' });
    } else {
      validatedData.display_order = orderNum;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = validatedData;
  next();
};

module.exports = {
  slugify,
  normalizeKey,
  validateSizeChartIdParam,
  validateColumnIdParam,
  validateRowIdParam,
  validateSizeChartSlugParam,
  validateCreateSizeChart,
  validateUpdateSizeChart,
  validateSizeChartStatus,
  validateCreateColumn,
  validateUpdateColumn,
  validateCreateRow,
  validateUpdateRow
};
