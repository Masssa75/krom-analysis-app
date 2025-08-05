import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN!;
const projectId = 'eucfoommxxvqmmwdbkdv';

export async function GET() {
  try {
    // Query cron jobs from pg_cron using Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            SELECT 
              j.jobid,
              j.jobname,
              j.schedule,
              j.active,
              j.command,
              (
                SELECT COUNT(*)::float / NULLIF(
                  (SELECT COUNT(*) FROM cron.job_run_details WHERE jobid = j.jobid AND start_time > NOW() - INTERVAL '24 hours'),
                  0
                ) * 100 as success_rate
                FROM cron.job_run_details 
                WHERE jobid = j.jobid 
                  AND status = 'succeeded' 
                  AND start_time > NOW() - INTERVAL '24 hours'
              ) as success_rate,
              (
                SELECT start_time 
                FROM cron.job_run_details 
                WHERE jobid = j.jobid 
                ORDER BY start_time DESC 
                LIMIT 1
              ) as last_run,
              (
                SELECT status 
                FROM cron.job_run_details 
                WHERE jobid = j.jobid 
                ORDER BY start_time DESC 
                LIMIT 1
              ) as last_status
            FROM cron.job j
            WHERE j.command LIKE '%crypto-%'
            ORDER BY j.jobid;
          `
        })
      }
    );

    if (!response.ok) {
      // Return empty array if Management API fails
      console.error('Failed to fetch cron jobs from Management API');
      return NextResponse.json([]);
    }

    const data = await response.json();
    
    // Transform the data
    const jobs = data.map((job: any) => {
      // Calculate time ago for last run
      let lastRun = 'Never';
      if (job.last_run) {
        const lastRunDate = new Date(job.last_run);
        const now = new Date();
        const diffMs = now.getTime() - lastRunDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins === 0) {
          lastRun = 'Just now';
        } else if (diffMins === 1) {
          lastRun = '1 minute ago';
        } else if (diffMins < 60) {
          lastRun = `${diffMins} minutes ago`;
        } else {
          const diffHours = Math.floor(diffMins / 60);
          lastRun = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        }
      }

      // Determine status
      let status = 'success';
      if (job.success_rate < 90) status = 'warning';
      if (job.success_rate < 70) status = 'error';
      if (job.last_status === 'failed') status = 'error';

      return {
        jobid: job.jobid,
        jobname: job.jobname,
        schedule: job.schedule,
        active: job.active,
        lastRun: lastRun,
        successRate: Math.round(job.success_rate || 0),
        status: status
      };
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    
    // Return empty array on error - never show mock data
    return NextResponse.json([]);
  }
}