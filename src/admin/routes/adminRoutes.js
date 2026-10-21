const express = require('express');
const announcementRoutes = require('./announcement.routes');
const navigationRoutes = require('./navigation.routes');
const bannerRoutes = require('./banner.routes');
const categoryRoutes = require('./category.routes');
const attributeRoutes = require('./attribute.routes');
const sizeChartRoutes = require('./sizeChart.routes');
const brandRoutes = require('./brand.routes');
const productRoutes = require('./product.routes');

const routes = express.Router();

// Mount announcement routes under /api/admin/announcements
routes.use('/announcements', announcementRoutes);

// Mount navigation routes under /api/admin/navigation-items
routes.use('/navigation-items', navigationRoutes);

// Mount banner routes under /api/admin/banners
routes.use('/banners', bannerRoutes);

// Mount category routes under /api/admin/categories
routes.use('/categories', categoryRoutes);

// Mount attribute routes under /api/admin/attributes
routes.use('/attributes', attributeRoutes);

// Mount size-chart routes under /api/admin/size-charts
routes.use('/size-charts', sizeChartRoutes);

// Mount brand routes under /api/admin/brands
routes.use('/brands', brandRoutes);

// Mount product routes under /api/admin/products
routes.use('/products', productRoutes);

module.exports = routes;