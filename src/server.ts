import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { handleRefuel } from './refuel';

dotenv.config();

const port = process.env.PORT || 3000;
const cronSchedule = process.env.CRON_SCHEDULE || '0 4,16 * * *';
let jobRunning = false;

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (_: Request, res: Response) => {
  res.json({
    status: 'success',
    message: '🫗 Validator Refuel service is running',
  });
});

app.use('*', (_: Request, res: Response) => {
  res.status(418).json({
    status: 'error',
    message: "⛽ I'm a gas pump",
  });
});

// Start server
app.listen(port, () => {
  console.info(
    `⛽ Validator Refuel service started successfully on http://localhost:${port}`,
  );

  cron.schedule(cronSchedule, async () => {
    if (!jobRunning) {
      jobRunning = true;
      console.info('\n🔄 Running cron job');
      await handleRefuel();

      console.info('\n🔄 Cron job finished');
      jobRunning = false;
    } else {
      console.info('\n🔄 Cron job already running, skipping this run');
    }
  });
});

export default app;
