import express from 'express';
import cors from 'cors';
import { router } from '@/routes';
import { env } from '@/config/env';
import { errorHandler } from '@/middlewares/error-handler';
import { notFoundHandler } from '@/middlewares/not-found-handler';

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOriginPatterns = [/^https:\/\/.*\.vercel\.app$/];

function isAllowedOrigin(origin?: string | null) {
  if (!origin) return true; // allow same-origin and non-browser requests
  if (allowedOrigins.includes(origin)) return true;
  return allowedOriginPatterns.some((re) => re.test(origin));
}

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(router);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
