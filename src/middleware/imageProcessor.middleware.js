const imageProcessorService = require('../admin/services/imageProcessor.service');

/**
 * Middleware that takes uploaded desktop & mobile banner images and uses Sharp
 * to generate optimized WebP variants:
 * - If a desktop file is uploaded:
 *     - Generates desktop WebP variant (max 1920x1080)
 *     - Automatically generates 4:5 portrait mobile WebP variant (max 1080x1350)
 * - If a custom mobile file is also uploaded:
 *     - Processes the custom mobile file and overrides the auto-generated mobile variant
 * - Attaches the processed URLs to req.processedImages and populates req.body
 */
const processUploadedBannerImages = async (req, res, next) => {
  if (!req.files) {
    return next();
  }

  const desktopFile =
    (req.files.image && req.files.image[0]) ||
    (req.files.image_url && req.files.image_url[0]) ||
    (req.files.desktop_image && req.files.desktop_image[0]) ||
    (req.files.file && req.files.file[0]);

  const customMobileFile =
    (req.files.mobile_image && req.files.mobile_image[0]) ||
    (req.files.mobile_image_url && req.files.mobile_image_url[0]);

  if (!desktopFile && !customMobileFile) {
    return next();
  }

  try {
    req.body = req.body || {};

    // 1. Process Desktop file if present
    if (desktopFile) {
      const { desktopUrl, mobileUrl, originalUrl } = await imageProcessorService.processBannerImage(
        desktopFile.filename
      );

      req.body.image_url = desktopUrl;
      // Default auto-generated mobile URL from desktop
      req.body.mobile_image_url = mobileUrl;
      req.body.original_image_url = originalUrl;
    }

    // 2. Process Custom Mobile file if administrator uploaded one (overriding auto-generated)
    if (customMobileFile) {
      const customMobileUrl = await imageProcessorService.processCustomMobileImage(
        customMobileFile.filename
      );
      req.body.mobile_image_url = customMobileUrl;
    }

    next();
  } catch (error) {
    console.error('Image processing failure in middleware:', error);
    return res.status(400).json({
      success: false,
      message: `Image processing failed: ${error.message}`
    });
  }
};

module.exports = { processUploadedBannerImages };
