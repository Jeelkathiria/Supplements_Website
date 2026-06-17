import multer from "multer";

// Configure memory storage for serverless environments (Vercel)
const storage = multer.memoryStorage();

// Filter for video files only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska"
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only video files (MP4, WebM, MOV, AVI, MKV) are allowed."));
  }
};

// Create multer instance for videos
export const videoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
});
