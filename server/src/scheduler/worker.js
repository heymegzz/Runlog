import axios from 'axios';
import jobQueue from '../queues/jobQueue.js';
import Job from '../models/Job.js';
import Execution from '../models/Execution.js';
import { emitExecutionUpdate, emitJobUpdated } from '../sockets/socketHandler.js';
import { sendFailureAlert } from '../services/notification.service.js';

const startWorker = () => {
  jobQueue.process(async (bullJob) => {
    const { jobId } = bullJob.data;

    const dbJob = await Job.findById(jobId);
    if (!dbJob) {
      console.warn(`[Worker] Job ${jobId} not found in database.`);
      return;
    }

    const startTime = Date.now();
    let status = 'success';
    let responsePayload = null;
    let errorDetails = null;
    let statusCode = null;

    try {
      const headersObj =
        dbJob.callbackHeaders instanceof Map
          ? Object.fromEntries(dbJob.callbackHeaders)
          : dbJob.callbackHeaders || {};

      const response = await axios({
        method: dbJob.callbackMethod,
        url: dbJob.callbackUrl,
        headers: headersObj,
        data: dbJob.callbackMethod !== 'GET' ? dbJob.callbackBody : undefined,
        timeout: dbJob.timeout || 30000,
      });

      statusCode = response.status;
      responsePayload =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);
    } catch (err) {
      status = 'failed';
      statusCode = err.response?.status || 0;
      errorDetails = err.message;
      responsePayload = err.response?.data
        ? JSON.stringify(err.response.data)
        : null;
    }

    const durationMs = Date.now() - startTime;

    // Save Execution record
    const execution = new Execution({
      job: dbJob._id,
      workspace: dbJob.workspace,
      executedAt: new Date(startTime),
      status,
      statusCode,
      durationMs,
      responsePayload,
      errorDetails,
    });

    await execution.save();

    // Update Job metrics
    dbJob.lastRunAt = execution.executedAt;
    dbJob.lastRunStatus = status;
    if (status === 'success') {
      dbJob.successCount = (dbJob.successCount || 0) + 1;
    } else {
      dbJob.failureCount = (dbJob.failureCount || 0) + 1;
    }
    await dbJob.save();

    console.log(
      `[Worker] Job "${dbJob.name}" → ${status.toUpperCase()} (${statusCode}) in ${durationMs}ms`
    );

    // Emit real-time update to workspace room
    emitExecutionUpdate(dbJob.workspace.toString(), {
      executionId: execution._id.toString(),
      jobId: dbJob._id.toString(),
      jobName: dbJob.name,
      status,
      statusCode,
      durationMs,
      executedAt: execution.executedAt,
    });

    emitJobUpdated(dbJob.workspace.toString(), {
      jobId: dbJob._id.toString(),
      lastRunStatus: status,
      lastRunAt: dbJob.lastRunAt,
      successCount: dbJob.successCount,
      failureCount: dbJob.failureCount,
    });

    // Send alert if job failed and alerting is configured
    if (status === 'failed') {
      await sendFailureAlert(dbJob, execution).catch((alertErr) =>
        console.error('[Worker] Failed to send alert:', alertErr.message)
      );
      // Re-throw so Bull records it as a failed job for retry logic
      throw new Error(`Job execution failed: ${errorDetails}`);
    }
  });

  console.log('✅ Worker initialized and listening to job queue');
};

export default startWorker;
