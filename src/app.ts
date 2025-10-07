import express from 'express';
import pinoHttp from 'pino-http';
import { router } from '@/routes';
import { env } from '@/config/env';
import { errorHandler } from '@/middlewares/error-handler';
import { notFoundHandler } from '@/middlewares/not-found-handler';

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
}));

app.use(router);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
