import axios from 'axios'

export const convertToWebP = async (imageUrl: string): Promise<string> => {
  try {
    // For client-side conversion, we'll use the browser's canvas API
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }
          
          // Fill with white background first
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          // Draw the image
          ctx.drawImage(img, 0, 0)
          
          // Convert to WebP with quality 0.85 (85%)
          const webpDataUrl = canvas.toDataURL('image/webp', 0.85)
          resolve(webpDataUrl)
        } catch (error) {
          console.error('Error converting to WebP:', error)
          reject(error)
        }
      }
      
      img.onerror = (error) => {
        console.error('Error loading image:', error)
        reject(new Error('Failed to load image'))
      }
      
      img.src = imageUrl
    })
  } catch (error) {
    console.error('WebP conversion failed:', error)
    // Fallback to original image if conversion fails
    return imageUrl
  }
}