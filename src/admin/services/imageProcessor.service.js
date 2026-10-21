const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { UPLOADS_DIR } = require('../../middleware/upload.middleware');

/**
 * Image Processing Service using Sharp
 * - Generates high-quality WebP desktop variant (16:9 / wide ratio, max 1920x1080)
 * - Generates high-quality WebP mobile portrait variant (4:5 ratio, max 1080x1350)
 * - Applies smart attention-based / entropy-based cropping when cropping is necessary
 * - Avoids enlargement of smaller source images (withoutEnlargement: true)
 * - Preserves the original file for future variant regeneration
 */
class ImageProcessorService {
  /**
   * Process uploaded desktop image to produce optimized desktop and mobile variants
   * @param {string} originalFilename
   * @returns {Promise<{ desktopUrl: string, mobileUrl: string, originalUrl: string }>}
   */
  async processBannerImage(originalFilename) {
    const inputPath = path.join(UPLOADS_DIR, originalFilename);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Original image file not found at ${inputPath}`);
    }

    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const desktopFilename = `banner-desktop-${uniqueId}.webp`;
    const mobileFilename = `banner-mobile-${uniqueId}.webp`;

    const desktopOutputPath = path.join(UPLOADS_DIR, desktopFilename);
    const mobileOutputPath = path.join(UPLOADS_DIR, mobileFilename);

    // 1. Desktop Variant:
    // Resize within 1920x1080 without enlargement, convert to WebP quality 85
    await sharp(inputPath)
      .resize({
        width: 1920,
        height: 1080,
        fit: 'inside', // preserve exact aspect ratio without distortion
        withoutEnlargement: true
      })
      .webp({ quality: 85, effort: 4 })
      .toFile(desktopOutputPath);

    // 2. Mobile Variant:
    // Crop to 4:5 portrait (1080x1350) using sharp's smart attention/entropy focal crop
    // If the image is smaller, fit without enlargement
    await sharp(inputPath)
      .resize({
        width: 1080,
        height: 1350,
        fit: 'cover',
        position: sharp.strategy.attention, // Focus on the most salient features/faces
        withoutEnlargement: true
      })
      .webp({ quality: 85, effort: 4 })
      .toFile(mobileOutputPath);

    return {
      desktopUrl: `/uploads/banners/${desktopFilename}`,
      mobileUrl: `/uploads/banners/${mobileFilename}`,
      originalUrl: `/uploads/banners/${originalFilename}`
    };
  }

  /**
   * Process a dedicated custom mobile upload into an optimized WebP mobile variant
   * @param {string} originalFilename
   * @returns {Promise<string>}
   */
  async processCustomMobileImage(originalFilename) {
    const inputPath = path.join(UPLOADS_DIR, originalFilename);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Custom mobile image file not found at ${inputPath}`);
    }

    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const customMobileFilename = `banner-mobile-custom-${uniqueId}.webp`;
    const outputPath = path.join(UPLOADS_DIR, customMobileFilename);

    await sharp(inputPath)
      .resize({
        width: 1080,
        height: 1350,
        fit: 'inside', // preserve user's custom aspect ratio
        withoutEnlargement: true
      })
      .webp({ quality: 85, effort: 4 })
      .toFile(outputPath);

    return `/uploads/banners/${customMobileFilename}`;
  }

  /**
   * Clean up orphaned files if a process fails
   * @param {string[]} filePaths
   */
  safeCleanup(filePaths = []) {
    for (const filePath of filePaths) {
      try {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn(`Could not delete file ${filePath}:`, err.message);
      }
    }
  }
}

module.exports = new ImageProcessorService();
