/**
 * Browser-based WebP image converter
 * This module uses the browser's native capabilities to convert images to WebP format
 */

/**
 * Converts an image to WebP format using browser capabilities
 * @param imageUrl URL or base64 string of the image to convert
 * @returns Promise resolving to a base64 WebP image
 */
export async function convertToWebP(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create an image element to load the source image
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Handle CORS if the image is from another domain
      
      img.onload = () => {
        try {
          // Create a canvas to draw the image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the image on the canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Fill with black background first (removes transparency)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the image
          ctx.drawImage(img, 0, 0);
          
          // Convert to WebP with quality 0.85 (85%)
          const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
          
          resolve(webpDataUrl);
        } catch (error) {
          console.error('Error converting to WebP:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('Error loading image:', error);
        reject(new Error('Failed to load image'));
      };
      
      // Set the source to start loading
      img.src = imageUrl;
    } catch (error) {
      console.error('Error in convertToWebP:', error);
      reject(error);
    }
  });
}

/**
 * Processes an image through the full conversion pipeline
 * @param imageUrl URL or base64 string of the image to convert
 * @returns Promise resolving to a base64 WebP image
 */
export async function processImage(imageUrl: string): Promise<string> {
  try {
    console.log('Processing image with browser-based converter...');
    
    // Convert to WebP
    const webpImage = await convertToWebP(imageUrl);
    console.log('WebP conversion complete');
    
    return webpImage;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}
