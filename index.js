require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const adminRoutes = require('./src/admin/routes/adminRoutes');
const customerAnnouncementRoutes = require('./src/customer/announcement.routes');
const customerNavigationRoutes = require('./src/customer/navigation.routes');
const customerBannerRoutes = require('./src/customer/banner.routes');
const customerCategoryRoutes = require('./src/customer/category.routes');
const customerSizeChartRoutes = require('./src/customer/sizeChart.routes');
const customerBrandRoutes = require('./src/customer/brand.routes');
const customerProductRoutes = require('./src/customer/product.routes');
const { connectDB } = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// API Routes
app.use('/api/announcements', customerAnnouncementRoutes);
app.use('/api/navigation', customerNavigationRoutes);
app.use('/api/banners', customerBannerRoutes);
app.use('/api/categories', customerCategoryRoutes);
app.use('/api/size-charts', customerSizeChartRoutes);
app.use('/api/brands', customerBrandRoutes);
app.use('/api/products', customerProductRoutes);
app.use('/api/admin', adminRoutes);


// Routes
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to the Clothing Backend API!'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      field: err.field
    });
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const validationErrors = err.errors ? err.errors.map(e => ({ field: e.path, message: e.message })) : [];
    return res.status(400).json({
      success: false,
      message: err.message || 'Validation error',
      errors: validationErrors
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectDB();
});
