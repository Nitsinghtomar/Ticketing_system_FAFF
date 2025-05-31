// server/src/routes/upload.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for validation
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// File upload endpoint
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    // Generate file URL
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // File metadata
    const fileData = {
      filename: req.file.originalname,
      storedFilename: req.file.filename,
      url: `${process.env.API_BASE_URL || 'http://localhost:5000'}${fileUrl}`,
      type: req.file.mimetype,
      size: req.file.size,
      taskId,
      uploadedAt: new Date().toISOString()
    };

    console.log(`File uploaded: ${req.file.originalname} (${req.file.size} bytes) for task ${taskId}`);

    res.json({
      success: true,
      url: fileData.url,
      filename: fileData.filename,
      type: fileData.type,
      size: fileData.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Serve uploaded files
router.get('/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Security check - ensure filename doesn't contain path traversal
    const resolvedPath = path.resolve(filePath);
    const uploadsPath = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(uploadsPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const contentType = getContentType(ext);
    
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // For images, set cache headers
    if (contentType?.startsWith('image/')) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    }

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({ error: 'Error serving file' });
  }
});

// Helper function to get content type
function getContentType(ext: string): string | null {
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.csv': 'text/csv'
  };

  return mimeTypes[ext] || null;
}

// Clean up old files periodically (optional)
router.delete('/cleanup', (req, res) => {
  try {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const now = Date.now();
    
    const files = fs.readdirSync(uploadsDir);
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    res.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} old files` 
    });
  } catch (error) {
    console.error('File cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

export default router;