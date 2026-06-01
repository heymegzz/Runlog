import axios from 'axios';
import jobQueue from '../queues/jobQueue.js';
import Job from '../models/Job.js';
import Execution from '../models/Execution.js';
import { emitExecutionUpdate } from '../sockets/socketHandler.js';
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
    let responsePayload = '';
    let errorDetails = '';
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
      statusCode = err.response?.status || null;
      errorDetails = err.message;
      responsePayload = err.response?.data
        ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data))
        : '';
    }

    const durationMs = Date.now() - startTime;
    const executedAt = new Date(startTime);

    // Save Execution record
    const execution = new Execution({
      job: dbJob._id,
      workspace: dbJob.workspace,
      executedAt,
      status,
      statusCode,
      durationMs,
      responsePayload,
      errorDetails,
    });

    await execution.save();

    // Update Job metrics
    const updateObj = {
      $set: {
        lastRunAt: executedAt,
        lastRunStatus: status
      },
      $inc: {}
    };

    if (status === 'success') {
      updateObj.$inc.successCount = 1;
    } else {
      updateObj.$inc.failureCount = 1;
    }

    await Job.updateOne({ _id: dbJob._id }, updateObj);

    // Fetch the updated job or just use the local state to emit updates
    dbJob.lastRunAt = executedAt;
    dbJob.lastRunStatus = status;

    console.log(
      `[Worker] Job "${dbJob.name}" → ${status.toUpperCase()} (${statusCode}) in ${durationMs}ms`
    );

    // Emit real-time update
    emitExecutionUpdate(dbJob.workspace.toString(), {
      executionId: execution._id.toString(),
      jobId: dbJob._id.toString(),
      jobName: dbJob.name,
      status,
      statusCode,
      durationMs,
      executedAt,
    });

    // Send alert if job failed
    if (status === 'failed') {
      await sendFailureAlert(dbJob, execution).catch((alertErr) =>
        console.error('[Worker] Failed to send alert:', alertErr.message)
      );
      throw new Error(errorDetails || 'Job execution failed');
    }
  });

  console.log('✅ Worker initialized and listening to job queue');
};

export default startWorker;
