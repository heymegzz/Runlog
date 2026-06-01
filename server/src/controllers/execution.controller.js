import Execution from '../models/Execution.js';
import { success, error } from '../utils/apiResponse.js';

export const listExecutions = async (req, res, next) => {
  try {
    // Get all executions for a specific workspace, and optionally filter by job ID
    const query = { workspace: req.workspace._id };
    
    if (req.query.jobId) {
      query.job = req.query.jobId;
    }

    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const executions = await Execution.find(query)
      .sort({ executedAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('job', 'name url method'); // Populate job details lightly

    const total = await Execution.countDocuments(query);

    return success(res, { executions, total, skip, limit });
  } catch (err) {
    next(err);
  }
};

export const getExecution = async (req, res, next) => {
  try {
    const execution = await Execution.findOne({ _id: req.params.id, workspace: req.workspace._id })
      .populate('job', 'name url method headers payload schedule');

    if (!execution) return error(res, 'NOT_FOUND', 'Execution log not found', 404);
    
    return success(res, execution);
  } catch (err) {
    next(err);
  }
};

export const listJobExecutions = async (req, res, next) => {
  try {
    const query = { job: req.params.id, workspace: req.workspace._id };
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const executions = await Execution.find(query)
      .sort({ executedAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Execution.countDocuments(query);

    return success(res, { executions, total, skip, limit });
  } catch (err) {
    next(err);
  }
};
