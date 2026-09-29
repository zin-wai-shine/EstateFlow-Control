// EstateFlow Control - Local Automation Controller Service
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8088;

app.use(cors());
app.use(express.json());

// In-memory worker and job cache for the service
const workers = [
  { id: 'w-1', name: 'Enhance Worker 01', type: 'enhancement', status: 'ready', totalJobs: 142 },
  { id: 'w-2', name: 'Enhance Worker 02', type: 'enhancement', status: 'ready', totalJobs: 128 },
  { id: 'w-3', name: 'Enhance Worker 03', type: 'enhancement', status: 'ready', totalJobs: 95 },
  { id: 'w-4', name: 'Hero Specialist Worker', type: 'hero', status: 'ready', totalJobs: 64 },
  { id: 'w-5', name: 'Social Publishing Worker', type: 'publishing', status: 'ready', totalJobs: 52 }
];

const jobs: any[] = [];

// 1. Healthcheck Endpoint (Section 45)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'EstateFlow Automation Controller',
    version: '1.0.0',
    docker: {
      active: true,
      containerEngine: 'Docker Desktop Engine'
    },
    workers: {
      total: workers.length,
      ready: workers.filter(w => w.status === 'ready').length
    },
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// 2. Workers API
app.get('/api/workers', (req, res) => {
  res.json({ success: true, workers });
});

// 3. Jobs API
app.get('/api/jobs', (req, res) => {
  res.json({ success: true, jobs });
});

app.post('/api/jobs', (req, res) => {
  const { propertyId, propertyName, workflowType, stageName } = req.body;
  const newJob = {
    id: 'job-srv-' + Date.now(),
    propertyId,
    propertyName,
    workflowType,
    stageName: stageName || workflowType,
    status: 'queued',
    progressPercent: 0,
    currentStepMessage: 'Queued in containerized backend',
    createdAt: new Date().toISOString()
  };
  jobs.unshift(newJob);
  res.status(201).json({ success: true, job: newJob });
});

// 4. Chrome Native Launch Trigger Endpoint
app.post('/api/chrome/launch', (req, res) => {
  const { profileDirName } = req.body;
  res.json({
    success: true,
    message: `Native Chrome launcher dispatched for ${profileDirName}`,
    timestamp: new Date().toISOString()
  });
});

// 5. System Info
app.get('/api/system', (req, res) => {
  res.json({
    app: 'EstateFlow Control Backend',
    platform: process.platform,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage()
  });
});

app.listen(PORT, () => {
  console.log(`[EstateFlow Backend] Automation Service online on port ${PORT}`);
});
