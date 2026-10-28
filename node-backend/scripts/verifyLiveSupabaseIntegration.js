import { getSupabase } from '../src/config/supabase.js';

async function runDetailedInspection() {
  console.log('================================================================');
  console.log('TASKORBIT — LIVE SUPABASE SCHEMA & QUERY DEEP VERIFICATION');
  console.log('================================================================');

  const client = getSupabase({ requireServiceRole: true });

  const tables = [
    {
      name: 'profiles',
      columns: ['id', 'display_name', 'role', 'skills', 'availability', 'email', 'created_at', 'updated_at'],
      joins: [],
    },
    {
      name: 'project_requests',
      columns: ['id', 'client_id', 'title', 'description', 'requirements', 'priority', 'requested_deadline', 'status', 'created_at', 'updated_at'],
      joins: ['client:profiles!project_requests_client_id_fkey(id, display_name)'],
    },
    {
      name: 'projects',
      columns: ['id', 'request_id', 'title', 'description', 'client_id', 'manager_id', 'status', 'start_date', 'due_date', 'created_at', 'updated_at'],
      joins: [
        'client:profiles!projects_client_id_fkey(id, display_name)',
        'manager:profiles!projects_manager_id_fkey(id, display_name)',
        'tasks(id, title, status, priority, assignee_id, due_date)',
      ],
    },
    {
      name: 'tasks',
      columns: ['id', 'project_id', 'title', 'description', 'assignee_id', 'priority', 'status', 'start_date', 'due_date', 'latest_submission_id', 'latest_version_number', 'has_conflict_override', 'conflict_task_ids', 'created_at', 'updated_at'],
      joins: [
        'assignee:profiles!tasks_assignee_id_fkey(id, display_name, role)',
        'project:projects(id, title, client_id, manager_id)',
      ],
    },
    {
      name: 'submissions',
      columns: ['id', 'task_id', 'version_number', 'submitted_by', 'file_path', 'file_name', 'description', 'created_at'],
      joins: [
        'submitter:profiles!submissions_submitted_by_fkey(id, display_name)',
      ],
    },
    {
      name: 'reviews',
      columns: ['id', 'task_id', 'submission_id', 'reviewer_id', 'decision', 'feedback', 'created_at'],
      joins: [
        'reviewer:profiles!reviews_reviewer_id_fkey(id, display_name)',
        'submission:submissions(version_number, file_name)',
      ],
    },
    {
      name: 'activity_logs',
      columns: ['id', 'project_id', 'task_id', 'actor_id', 'action', 'details', 'created_at'],
      joins: [
        'actor:profiles!activity_logs_actor_id_fkey(id, display_name, role)',
      ],
    },
  ];

  let allPassed = true;

  for (const t of tables) {
    console.log(`\n--- Inspecting Table: public.${t.name} ---`);
    // 1. Column existence test
    const colList = t.columns.join(', ');
    const { data: colData, error: colErr, count } = await client
      .from(t.name)
      .select(colList, { count: 'exact' })
      .limit(1);

    if (colErr) {
      console.error(`❌ Column check FAILED for ${t.name}:`, colErr.message);
      allPassed = false;
    } else {
      console.log(`✅ All ${t.columns.length} columns verified (${count} total rows in table).`);
      if (colData && colData.length > 0) {
        console.log(`   Sample row structure:`, Object.keys(colData[0]));
      }
    }

    // 2. Joins / Foreign Key relationships test
    for (const joinExpr of t.joins) {
      const { error: joinErr } = await client
        .from(t.name)
        .select(`id, ${joinExpr}`)
        .limit(1);

      if (joinErr) {
        console.error(`❌ Join failed on ${t.name} -> ${joinExpr}:`, joinErr.message);
        allPassed = false;
      } else {
        console.log(`✅ Relationship verified: ${t.name} -> ${joinExpr}`);
      }
    }
  }

  // 3. Application Query Simulation (Safe Reads)
  console.log('\n--- Testing Critical Application Service Queries ---');

  // A. conflictService query:
  console.log('Testing conflictService query pattern...');
  const { data: conflictTasks, error: confErr } = await client
    .from('tasks')
    .select('id, title, start_date, due_date, status, project_id')
    .eq('assignee_id', 'assignee-001')
    .not('status', 'eq', 'approved');

  if (confErr) {
    console.error('❌ conflictService query failed:', confErr.message);
    allPassed = false;
  } else {
    console.log(`✅ conflictService query passed (${conflictTasks?.length || 0} active candidate tasks found)`);
  }

  // B. submissionService getNextVersionNumber query:
  console.log('Testing submissionService version calculation query pattern...');
  const { data: versions, error: verErr } = await client
    .from('submissions')
    .select('version_number')
    .eq('task_id', '33333333-0000-0000-0000-000000000001')
    .order('version_number', { ascending: false })
    .limit(1);

  if (verErr) {
    console.error('❌ submissionService query failed:', verErr.message);
    allPassed = false;
  } else {
    const nextVer = (!versions || versions.length === 0) ? 1 : versions[0].version_number + 1;
    console.log(`✅ submissionService query passed (latest version: ${versions?.[0]?.version_number || 0}, next: ${nextVer})`);
  }

  // C. reviewController pending reviews query:
  console.log('Testing reviewController pending reviews query pattern...');
  const { data: pendingTasks, error: penErr } = await client
    .from('tasks')
    .select(`
      *,
      project:projects(id, title),
      assignee:profiles!tasks_assignee_id_fkey(id, display_name)
    `)
    .in('status', ['submitted', 'in_review'])
    .order('updated_at', { ascending: true });

  if (penErr) {
    console.error('❌ pending reviews query failed:', penErr.message);
    allPassed = false;
  } else {
    console.log(`✅ reviewController pending reviews query passed (${pendingTasks?.length || 0} tasks found)`);
  }

  // D. activityController workers directory query:
  console.log('Testing activityController getWorkersDirectory query pattern...');
  const { data: workers, error: wErr } = await client
    .from('profiles')
    .select('id, display_name, role, skills, availability, email')
    .eq('role', 'assignee')
    .order('display_name');

  if (wErr) {
    console.error('❌ workers directory query failed:', wErr.message);
    allPassed = false;
  } else {
    console.log(`✅ getWorkersDirectory query passed (${workers?.length || 0} assignees found)`);
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL TABLES, COLUMNS, FOREIGN KEYS, AND QUERIES 100% VERIFIED!');
  } else {
    console.log('⚠️ SOME CHECKS FAILED. See details above.');
  }
  console.log('================================================================\n');
}

runDetailedInspection().catch((err) => {
  console.error('Execution error:', err);
  process.exit(1);
});
