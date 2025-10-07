import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config/env';

cloudinary.config({
  cloud_name: env.S3_BUCKET,
  api_key: env.S3_ACCESS_KEY_ID,
  api_secret: env.S3_SECRET_ACCESS_KEY,
});

export const objectStore = {
  async upload(buffer: Buffer, folder: string): Promise<any> {
    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'raw' }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
      stream.end(buffer);
    });
  },
  async destroy(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  },
};
