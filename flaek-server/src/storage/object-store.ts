import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config/env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  timeout: 600000,
});

export const objectStore = {
  async upload(buffer: Buffer, folder: string, publicId?: string): Promise<any> {
    const attempt = () => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'raw',
          public_id: publicId,
          overwrite: true,
          unique_filename: false,
          use_filename: !!publicId,
          timeout: 600000,
        },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    let lastErr: any;
    for (let i = 0; i < 3; i++) {
      try {
        return await attempt();
      } catch (e: any) {
        lastErr = e;
        const msg = e?.message || '';
        if (!/timeout/i.test(msg)) break;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    throw lastErr;
  },
  async destroy(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  },
};
