import cron from 'node-cron';
import cronParser from 'cron-parser';
import Job from '../models/Job.js';
import jobQueue from '../queues/jobQueue.js';

let isScanning = false;

const startCronScanner = () => {
  // Run every minute at the 0th second
  cron.schedule('* * * * *', async () => {
    if (isScanning) return;
    isScanning = true;

    try {
      const now = new Date();
      
      // Find all active jobs that are due
      const dueJobs = await Job.find({
        status: 'active',
        nextRunAt: { $lte: now }
      });

      if (dueJobs.length > 0) {
        console.log(`[CronScanner] Found ${dueJobs.length} due jobs.`);
      }

      for (const job of dueJobs) {
        try {
          // Push to Bull queue for execution
          await jobQueue.add(
            { jobId: job._id },
            { 
              jobId: job._id.toString(), // Prevent duplicates in queue
              removeOnComplete: true,
              removeOnFail: false 
            }
          );

          // Calculate next run
          const interval = cronParser.parseExpression(job.schedule);
          job.nextRunAt = interval.next().toDate();
          await job.save();
        } catch (jobErr) {
          console.error(`[CronScanner] Error processing job ${job._id}:`, jobErr);
        }
      }
    } catch (err) {
      console.error('[CronScanner] Error during scan:', err);
    } finally {
      isScanning = false;
    }
  });

  console.log('✅ Cron scanner initialized');
};

export default startCronScanner;
