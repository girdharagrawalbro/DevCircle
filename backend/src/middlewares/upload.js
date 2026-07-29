import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinary.js';

// ensuring local directories exist as fallback
const avatarDir = path.join(import.meta.dirname, '../../uploads/avatars');
const postDir = path.join(import.meta.dirname, '../../uploads/posts');

if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

const createHybridStorage = (subfolder, localDir) => {
  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, localDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });

  return {
    _handleFile: (req, file, cb) => {
      diskStorage._handleFile(req, file, async (err, info) => {
        if (err) return cb(err);

        // store to local directory
        const localPath = info.path;
        const port = process.env.PORT || 5000;
        const localUrl = `http://localhost:${port}/uploads/${subfolder}/${info.filename}`;

        // try cloudinary upload
        try {
          const result = await cloudinary.uploader.upload(localPath, {
            folder: `devcircle/${subfolder}`,
          });
          console.log(`Uploaded to Cloud: ${result.secure_url}`);

          // remove local file if upload to cloud succeeds
          fs.unlink(localPath, () => { });
          cb(null, { ...info, path: result.secure_url });
        } catch (cloudinaryErr) {
          console.warn(`Upload Failed (${cloudinaryErr.message || cloudinaryErr.http_code}). Falling back to local URL: ${localUrl}`);

          // else fallback to local server URL
          cb(null, { ...info, path: localUrl });
        }
      });
    },
    _removeFile: (req, file, cb) => {
      diskStorage._removeFile(req, file, cb);
    },
  };
};

const uploadAvatar = multer({
  storage: createHybridStorage('avatars', avatarDir),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadPostImage = multer({
  storage: createHybridStorage('posts', postDir),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export { uploadAvatar, uploadPostImage };
