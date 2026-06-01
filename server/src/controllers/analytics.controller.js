import Execution from '../models/Execution.js';
import Job from '../models/Job.js';
import { success, error } from '../utils/apiResponse.js';

/**
 * GET /api/analytics/overview
 * Summary stats for the workspace dashboard.
 */
export const getOverview = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;

    const [
      totalJobs,
      activeJobs,
      pausedJobs,
      totalExecutions,
      successExecutions,
      failedExecutions,
      recentExecutions,
    ] = await Promise.all([
      Job.countDocuments({ workspace: workspaceId }),
      Job.countDocuments({ workspace: workspaceId, status: 'active' }),
      Job.countDocuments({ workspace: workspaceId, status: 'paused' }),
      Execution.countDocuments({ workspace: workspaceId }),
      Execution.countDocuments({ workspace: workspaceId, status: 'success' }),
      Execution.countDocuments({ workspace: workspaceId, status: 'failed' }),
      Execution.find({ workspace: workspaceId })
        .sort({ executedAt: -1 })
        .limit(10)
        .populate('job', 'name callbackUrl callbackMethod'),
    ]);

    const successRate =
      totalExecutions > 0
        ? Math.round((successExecutions / totalExecutions) * 100)
        : 0;

    return success(res, {
      jobs: { total: totalJobs, active: activeJobs, paused: pausedJobs },
      executions: {
        total: totalExecutions,
        success: successExecutions,
        failed: failedExecutions,
        successRate,
      },
      recentExecutions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/jobs/:id
 * Execution history chart data for a specific job (last 30 days).
 */
export const getJobAnalytics = async (req, res, next) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      workspace: req.workspace._id,
    });
    if (!job) return error(res, 'NOT_FOUND', 'Job not found', 404);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const executions = await Execution.find({
      job: job._id,
      executedAt: { $gte: thirtyDaysAgo },
    }).sort({ executedAt: 1 });

    // Build daily buckets
    const buckets = {};
    executions.forEach((ex) => {
      const day = ex.executedAt.toISOString().slice(0, 10);
      if (!buckets[day]) buckets[day] = { date: day, success: 0, failed: 0, avgDuration: 0, totalDuration: 0, count: 0 };
      if (ex.status === 'success') buckets[day].success++;
      else buckets[day].failed++;
      buckets[day].totalDuration += ex.durationMs || 0;
      buckets[day].count++;
    });

    const dailyStats = Object.values(buckets).map((b) => ({
      ...b,
      avgDuration: b.count > 0 ? Math.round(b.totalDuration / b.count) : 0,
    }));

    const avgDuration =
      executions.length > 0
        ? Math.round(executions.reduce((a, e) => a + (e.durationMs || 0), 0) / executions.length)
        : 0;

    return success(res, {
      job: { _id: job._id, name: job.name, schedule: job.schedule },
      period: '30d',
      dailyStats,
      summary: {
        total: executions.length,
        success: executions.filter((e) => e.status === 'success').length,
        failed: executions.filter((e) => e.status === 'failed').length,
        avgDuration,
      },
    });
  } catch (err) {
    next(err);
  }
};
