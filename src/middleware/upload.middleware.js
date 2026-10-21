const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Public uploads directory
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'banners');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `banner-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, and AVIF images are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter
});

// Category uploads directory
const CATEGORY_UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'categories');
if (!fs.existsSync(CATEGORY_UPLOADS_DIR)) {
  fs.mkdirSync(CATEGORY_UPLOADS_DIR, { recursive: true });
}

const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CATEGORY_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `category-${uniqueSuffix}${ext}`);
  }
});

const uploadCategory = multer({
  storage: categoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter
});

// Size Chart uploads directory
const SIZE_CHART_UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'size-charts');
if (!fs.existsSync(SIZE_CHART_UPLOADS_DIR)) {
  fs.mkdirSync(SIZE_CHART_UPLOADS_DIR, { recursive: true });
}

const sizeChartStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SIZE_CHART_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `size-chart-${uniqueSuffix}${ext}`);
  }
});

const uploadSizeChart = multer({
  storage: sizeChartStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter
});

// Brand uploads directory
const BRAND_UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'brands');
if (!fs.existsSync(BRAND_UPLOADS_DIR)) {
  fs.mkdirSync(BRAND_UPLOADS_DIR, { recursive: true });
}

const brandStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BRAND_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `brand-${uniqueSuffix}${ext}`);
  }
});

const uploadBrand = multer({
  storage: brandStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter
});

module.exports = {
  uploadBannerImages: upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'image_url', maxCount: 1 },
    { name: 'mobile_image', maxCount: 1 },
    { name: 'mobile_image_url', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'desktop_image', maxCount: 1 }
  ]),
  uploadCategoryImage: uploadCategory.fields([
    { name: 'image', maxCount: 1 },
    { name: 'image_url', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]),
  uploadSizeChartImage: uploadSizeChart.fields([
    { name: 'image', maxCount: 1 },
    { name: 'image_url', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]),
  uploadBrandLogo: uploadBrand.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'logo_url', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]),
  uploadAny: upload.any(),
  UPLOADS_DIR,
  CATEGORY_UPLOADS_DIR,
  SIZE_CHART_UPLOADS_DIR,
  BRAND_UPLOADS_DIR
};


