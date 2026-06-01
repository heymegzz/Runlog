import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../src/models/User.js';
import Workspace from '../src/models/Workspace.js';
import Job from '../src/models/Job.js';
import Execution from '../src/models/Execution.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up existing demo data
    const existingUser = await User.findOne({ email: 'demo@runlog.dev' });
    if (existingUser) {
      await Workspace.deleteMany({ owner: existingUser._id });
      await Job.deleteMany({ createdBy: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
    }

    // 1. Create User
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const user = new User({
      name: 'Demo User',
      email: 'demo@runlog.dev',
      password: hashedPassword
    });
    await user.save();

    // 2. Create Workspace
    const workspace = new Workspace({
      name: 'Demo Workspace',
      owner: user._id,
      members: [{ user: user._id, role: 'owner' }]
    });
    await workspace.save();

    user.workspaces.push(workspace._id);
    await user.save();

    // 3. Create Jobs
    const jobTemplates = [
      { name: 'Health Check', schedule: '*/5 * * * *', method: 'GET', url: 'https://httpstat.us/200', type: 'health' },
      { name: 'Daily Report', schedule: '0 9 * * 1-5', method: 'POST', url: 'https://httpstat.us/200', type: 'daily' },
      { name: 'DB Cleanup', schedule: '0 2 * * *', method: 'POST', url: 'https://httpstat.us/200', type: 'daily' },
      { name: 'Cache Warmup', schedule: '*/15 * * * *', method: 'GET', url: 'https://httpstat.us/200', type: 'cache' },
      { name: 'Failing Job', schedule: '*/10 * * * *', method: 'GET', url: 'https://httpstat.us/500', type: 'fail' }
    ];

    const createdJobs = [];

    for (const t of jobTemplates) {
      const job = new Job({
        workspace: workspace._id,
        createdBy: user._id,
        name: t.name,
        schedule: t.schedule,
        callbackMethod: t.method,
        callbackUrl: t.url,
        status: 'active',
        timeout: 10000,
        retryCount: 3,
        successCount: 0,
        failureCount: 0
      });
      await job.save();
      createdJobs.push({ job, type: t.type });
    }

    // 4. Create Executions
    console.log('Generating executions over the last 7 days...');
    
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < 50; i++) {
      const template = createdJobs[Math.floor(Math.random() * createdJobs.length)];
      const randomPast = now - Math.floor(Math.random() * sevenDaysMs);
      
      let isSuccess = true;
      if (template.type === 'fail') isSuccess = false;
      else if (template.type === 'health' && Math.random() > 0.90) isSuccess = false;
      else if (Math.random() > 0.98) isSuccess = false;

      const status = isSuccess ? 'success' : 'failed';
      const statusCode = isSuccess ? 200 : 500;
      const durationMs = Math.floor(Math.random() * 500) + 50;

      const execution = new Execution({
        job: template.job._id,
        workspace: workspace._id,
        status,
        statusCode,
        executedAt: new Date(randomPast),
        durationMs,
        responsePayload: isSuccess ? 'OK' : 'Internal Server Error'
      });
      
      await execution.save();
      
      if (isSuccess) template.job.successCount++;
      else template.job.failureCount++;
      
      if (!template.job.lastRunAt || randomPast > template.job.lastRunAt.getTime()) {
        template.job.lastRunAt = new Date(randomPast);
        template.job.lastRunStatus = status;
      }
    }

    // Update job aggregates
    for (const { job } of createdJobs) {
      await job.save();
    }

    console.log('✅ Demo seed complete!');
    console.log('Login: demo@runlog.dev / demo123');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
