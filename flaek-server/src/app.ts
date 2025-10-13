import express from 'express';
import cors from 'cors';
import { router } from '@/routes';
import { env } from '@/config/env';
import { errorHandler } from '@/middlewares/error-handler';
import { notFoundHandler } from '@/middlewares/not-found-handler';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(router);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
