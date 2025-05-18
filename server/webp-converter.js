// server/webp-converter.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');

const app = express();
const port = 3001;

// Enable CORS
app.use(cors());

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Endpoint to convert base64 image to WebP
app.post('/convert-base64', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    // Extract base64 data
    const matches = imageData.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image format' });
    }
    
    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    // Process steps with logging
    console.log('Converting to JPG and removing metadata...');
    const jpgBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();
    
    console.log('Converting to WebP...');
    const webpBuffer = await sharp(jpgBuffer)
      .webp({ 
        quality: 85,
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
        effort: 5
      })
      .toBuffer();
    
    // Return the WebP image as base64
    const webpBase64 = `data:image/webp;base64,${webpBuffer.toString('base64')}`;
    res.json({ success: true, webpImage: webpBase64 });
  } catch (error) {
    console.error('Error converting image:', error);
    res.status(500).json({ error: `Conversion failed: ${error.message}` });
  }
});

// Endpoint to convert uploaded file to WebP
app.post('/convert-file', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = path.parse(req.file.originalname).name;
    const jpgFilename = `${originalName}-${timestamp}.jpg`;
    const webpFilename = `${originalName}-${timestamp}.webp`;
    const jpgPath = path.join(uploadsDir, jpgFilename);
    const webpPath = path.join(uploadsDir, webpFilename);
    
    // Convert to JPG and remove metadata
    await sharp(req.file.buffer)
      .jpeg({ quality: 90 })
      .toFile(jpgPath);
    
    // Convert to WebP
    await sharp(jpgPath)
      .webp({ 
        quality: 85,
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
        effort: 5
      })
      .toFile(webpPath);
    
    // Return paths to both files
    res.json({ 
      success: true, 
      jpgPath: `/uploads/${jpgFilename}`,
      webpPath: `/uploads/${webpFilename}`
    });
  } catch (error) {
    console.error('Error converting file:', error);
    res.status(500).json({ error: `File conversion failed: ${error.message}` });
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Start the server
app.listen(port, () => {
  console.log(`WebP converter server running on port ${port}`);
});
