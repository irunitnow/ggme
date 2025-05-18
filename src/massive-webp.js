// massive-webp.js - Script to convert images to WebP format
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');

/**
 * Converts an image to WebP format with optimized settings
 * @param {Buffer|string} inputBuffer - Image buffer
 * @returns {Promise<Buffer>} - WebP image buffer
 */
async function convertToWebP(inputBuffer) {
  try {
    // First convert to JPG and strip metadata
    const jpgBuffer = await sharp(inputBuffer)
      .jpeg({ quality: 5 })
      .toBuffer();
    
    // Then convert to WebP with high quality
    const webpBuffer = await sharp(jpgBuffer)
      .webp({ 
        quality: 85,
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
        effort: 5 // Medium-high compression effort (0-6)
      })
      .toBuffer();
    
    return webpBuffer;
  } catch (error) {
    console.error('Error in convertToWebP:', error);
    throw error;
  }
}

/**
 * Fetches an image from a URL or base64 string and returns a buffer
 * @param {string} imageSource - URL or base64 string
 * @returns {Promise<Buffer>} - Image buffer
 */
async function getImageBuffer(imageSource) {
  try {
    // Handle base64 data URLs
    if (imageSource.startsWith('data:')) {
      const matches = imageSource.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 data URL format');
      }
      return Buffer.from(matches[2], 'base64');
    } 
    // Handle http/https URLs
    else if (imageSource.startsWith('http')) {
      const response = await fetch(imageSource);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } 
    else {
      throw new Error('Unsupported image source format');
    }
  } catch (error) {
    console.error('Error in getImageBuffer:', error);
    throw error;
  }
}

/**
 * Processes an image through the full conversion pipeline
 * @param {string} imageSource - Image URL or base64 string
 * @returns {Promise<string>} - Base64 encoded WebP image
 */
async function processImage(imageSource) {
  try {
    console.log('Processing image...');
    
    // Get image buffer from source
    const imageBuffer = await getImageBuffer(imageSource);
    console.log('Image buffer obtained, size:', imageBuffer.length);
    
    // Convert to WebP
    const webpBuffer = await convertToWebP(imageBuffer);
    console.log('WebP conversion complete, size:', webpBuffer.length);
    
    // Return as base64 string with WebP data URL prefix
    return `data:image/webp;base64,${webpBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error in processImage:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

module.exports = {
  processImage,
  convertToWebP,
  getImageBuffer
};
