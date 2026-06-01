const API_URL = 'http://localhost:5005/api';
const fs = require('fs');

async function runTests() {
  console.log('🧪 Starting Phase 3 (Jobs & Executions) Tests...\n');

  try {
    // 1. Authenticate to get a fresh token
    console.log('➡️ 1. Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_123@example.com', password: 'password123' })
    });
    
    // If login fails, we'll try registering
    let token, workspaceId;
    if (loginRes.ok) {
      const loginData = await loginRes.json();
      token = loginData.data.accessToken;
      workspaceId = loginData.data.user.activeWorkspace;
    } else {
      const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Job Tester',
          email: 'test_123@example.com',
          password: 'password123',
        }),
      });
      const registerData = await registerRes.json();
      if (!registerRes.ok) throw new Error(registerData.message);
      token = registerData.data.accessToken;
      workspaceId = registerData.data.user.activeWorkspace;
    }
    
    console.log('✅ Success! Token acquired.\n');

    // 2. Create a Job
    console.log('➡️ 2. Creating a test job...');
    const createJobRes = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-workspace-id': workspaceId
      },
      body: JSON.stringify({
        name: 'Health Check Job',
        callbackUrl: 'http://localhost:5005/api/health',
        callbackMethod: 'GET',
        schedule: '* * * * *' // Every minute
      }),
    });
    const createJobData = await createJobRes.json();
    if (!createJobRes.ok) throw new Error(createJobData.message);
    const jobId = createJobData.data._id;
    console.log(`✅ Success! Job Created with ID: ${jobId}\n`);

    // 3. Trigger the Job manually
    console.log('➡️ 3. Triggering the job manually (Bull Queue)...');
    const triggerRes = await fetch(`${API_URL}/jobs/${jobId}/trigger`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'x-workspace-id': workspaceId
      }
    });
    const triggerData = await triggerRes.json();
    if (!triggerRes.ok) throw new Error(triggerData.message);
    console.log('✅ Success! Job dispatched to worker.\n');

    // Wait a couple seconds for Bull to process it
    console.log('⏳ Waiting for worker to process...');
    await new Promise(res => setTimeout(res, 2500));

    // 4. Fetch Executions
    console.log('➡️ 4. Fetching execution logs...');
    const execRes = await fetch(`${API_URL}/executions?jobId=${jobId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'x-workspace-id': workspaceId
      }
    });
    const execData = await execRes.json();
    if (!execRes.ok) throw new Error(execData.message);
    
    console.log(`✅ Success! Found ${execData.data.executions.length} executions.`);
    if (execData.data.executions.length > 0) {
      console.log(`   - Status: ${execData.data.executions[0].status}`);
      console.log(`   - Status Code: ${execData.data.executions[0].statusCode}`);
      console.log(`   - Duration: ${execData.data.executions[0].durationMs}ms`);
    }

    console.log('\n🎉 PHASE 3 VERIFIED!');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
  }
}

runTests();
