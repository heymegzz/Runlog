import Job from '../models/Job.js';
import Execution from '../models/Execution.js';
import { success, error } from '../utils/apiResponse.js';
import cronParser from 'cron-parser';
import jobQueue from '../queues/jobQueue.js';

export const listJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ workspace: req.workspace._id }).sort({ createdAt: -1 });
    return success(res, jobs);
  } catch (err) {
    next(err);
  }
};

export const getJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, workspace: req.workspace._id });
    if (!job) return error(res, 'NOT_FOUND', 'Job not found', 404);
    
    return success(res, job);
  } catch (err) {
    next(err);
  }
};

export const createJob = async (req, res, next) => {
  try {
    const { name, callbackUrl, callbackMethod, callbackHeaders, callbackBody, schedule, retryCount, timeout } = req.body;

    if (!name || !callbackUrl || !schedule) {
      return error(res, 'VALIDATION_ERROR', 'Name, callbackUrl, and schedule are required');
    }

    let nextRunAt;
    try {
      const interval = cronParser.parseExpression(schedule);
      nextRunAt = interval.next().toDate();
    } catch (err) {
      return error(res, 'VALIDATION_ERROR', 'Invalid cron expression');
    }

    const job = new Job({
      workspace: req.workspace._id,
      createdBy: req.user._id,
      name,
      callbackUrl,
      callbackMethod: callbackMethod || 'GET',
      callbackHeaders: callbackHeaders || {},
      callbackBody: callbackBody || '',
      schedule,
      nextRunAt,
      retryCount: retryCount || 3,
      timeout: timeout || 30000,
      status: 'active',
    });

    await job.save();
    return success(res, job, 201);
  } catch (err) {
    next(err);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, workspace: req.workspace._id });
    if (!job) return error(res, 'NOT_FOUND', 'Job not found', 404);

    const { name, callbackUrl, callbackMethod, callbackHeaders, callbackBody, schedule, retryCount, timeout } = req.body;

    if (name) job.name = name;
    if (callbackUrl) job.callbackUrl = callbackUrl;
    if (callbackMethod) job.callbackMethod = callbackMethod;
    if (callbackHeaders) job.callbackHeaders = callbackHeaders;
    if (callbackBody) job.callbackBody = callbackBody;
    if (retryCount !== undefined) job.retryCount = retryCount;
    if (timeout !== undefined) job.timeout = timeout;

    if (schedule && schedule !== job.schedule) {
      try {
        const interval = cronParser.parseExpression(schedule);
        job.nextRunAt = interval.next().toDate();
        job.schedule = schedule;
      } catch (err) {
        return error(res, 'VALIDATION_ERROR', 'Invalid cron expression');
      }
    }

    await job.save();
    return success(res, job);
  } catch (err) {
    next(err);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, workspace: req.workspace._id });
    if (!job) return error(res, 'NOT_FOUND', 'Job not found', 404);

    // Clean up related executions
    await Execution.deleteMany({ job: job._id });

    return success(res, { message: 'Job deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const pauseJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, workspace: req.workspace._id });
    if (!job) return error(res, 'NOT_FOUND', 'Job not found', 404);

    job.status = 'paused';
    await job.save();
    return success(res, job);
  } catch (err) {
    next(err);
  }
};

export const resumeJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, workspace: req.workspace._id });
    if (!job) return error(res, 'NOT_FOUND', 'Job not found', 404);

    job.status = 'active';
    const interval = cronParser.parseExpression(job.schedule);
    job.nextRunAt = interval.next().toDate();
    
    await job.save();
    return success(res, job);
  } catch (err) {
    next(err);
  }
};

export const triggerJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, workspace: req.workspace._id });
    if (!job) return error(res, 'NOT_FOUND', 'Job not found', 404);

    // Manually add to Bull queue for immediate execution
    await jobQueue.add({ jobId: job._id });

    return success(res, { message: 'Job triggered successfully' });
  } catch (err) {
    next(err);
  }
};
