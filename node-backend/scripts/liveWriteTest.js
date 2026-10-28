/**
 * TaskOrbit — Dedicated Non-Destructive Live Write Test with Explicit Cleanup
 *
 * This test executes against the remote Supabase database (PacePilot) to prove
 * live persistence functionality (Insert -> Update -> Join Read -> Delete Cleanup).
 *
 * Approved by user under production safety protocol.
 */

import { getSupabase } from '../src/config/supabase.js';

async function runLiveWriteTest() {
  console.log('================================================================');
  console.log('TASKORBIT — LIVE WRITE & CLEANUP PERSISTENCE VERIFICATION');
  console.log('================================================================');

  const client = getSupabase({ requireServiceRole: true });

  let testProjectId = null;
  let testTaskId = null;
  let testLogId = null;

  try {
    // 1. Create a dedicated test project
    console.log('\n[1/5] Executing INSERT into public.projects...');
    const { data: project, error: projErr } = await client
      .from('projects')
      .insert({
        title: '__TEST_VERIFY_PERSISTENCE_PROJECT__',
        description: 'Temporary automated test record for live persistence verification.',
        client_id: 'client-001',
        manager_id: 'manager-001',
        status: 'active',
        start_date: '2026-11-01',
        due_date: '2026-11-15',
      })
      .select()
      .single();

    if (projErr) throw new Error(`Project INSERT failed: ${projErr.message}`);
    testProjectId = project.id;
    console.log(`✅ Project created successfully with id: ${testProjectId}`);

    // 2. Create a dedicated test task referencing the project
    console.log('\n[2/5] Executing INSERT into public.tasks...');
    const { data: task, error: taskErr } = await client
      .from('tasks')
      .insert({
        project_id: testProjectId,
        title: '__TEST_VERIFY_PERSISTENCE_TASK__',
        description: 'Temporary task for persistence testing',
        assignee_id: 'assignee-001',
        priority: 'high',
        status: 'todo',
        start_date: '2026-11-02',
        due_date: '2026-11-10',
      })
      .select()
      .single();

    if (taskErr) throw new Error(`Task INSERT failed: ${taskErr.message}`);
    testTaskId = task.id;
    console.log(`✅ Task created successfully with id: ${testTaskId}`);

    // 3. Create a test activity log
    console.log('\n[3/5] Executing INSERT into public.activity_logs...');
    const { data: log, error: logErr } = await client
      .from('activity_logs')
      .insert({
        project_id: testProjectId,
        task_id: testTaskId,
        actor_id: 'manager-001',
        action: 'test_verification_executed',
        details: { verification: true },
      })
      .select()
      .single();

    if (logErr) throw new Error(`Activity log INSERT failed: ${logErr.message}`);
    testLogId = log.id;
    console.log(`✅ Activity log created successfully with id: ${testLogId}`);

    // 4. Update the task status (todo -> in_progress)
    console.log('\n[4/5] Executing UPDATE on public.tasks...');
    const { data: updatedTask, error: updateErr } = await client
      .from('tasks')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', testTaskId)
      .select(`
        id,
        title,
        status,
        assignee:profiles!tasks_assignee_id_fkey(id, display_name),
        project:projects(id, title)
      `)
      .single();

    if (updateErr) throw new Error(`Task UPDATE failed: ${updateErr.message}`);
    console.log(`✅ Task updated successfully to status: '${updatedTask.status}'`);
    console.log(`   Hydrated assignee: ${updatedTask.assignee?.display_name}`);
    console.log(`   Hydrated project: ${updatedTask.project?.title}`);

  } finally {
    // 5. Explicit cleanup of test records
    console.log('\n[5/5] Executing EXPLICIT CLEANUP of test records...');

    if (testLogId) {
      const { error: delLogErr } = await client.from('activity_logs').delete().eq('id', testLogId);
      if (delLogErr) console.warn('⚠️ Warning: Failed to delete test activity log:', delLogErr.message);
      else console.log(`✅ Cleaned up test activity log: ${testLogId}`);
    }

    if (testTaskId) {
      const { error: delTaskErr } = await client.from('tasks').delete().eq('id', testTaskId);
      if (delTaskErr) console.warn('⚠️ Warning: Failed to delete test task:', delTaskErr.message);
      else console.log(`✅ Cleaned up test task: ${testTaskId}`);
    }

    if (testProjectId) {
      const { error: delProjErr } = await client.from('projects').delete().eq('id', testProjectId);
      if (delProjErr) console.warn('⚠️ Warning: Failed to delete test project:', delProjErr.message);
      else console.log(`✅ Cleaned up test project: ${testProjectId}`);
    }

    // Verify cleanup
    if (testProjectId) {
      const { data: checkProj } = await client.from('projects').select('id').eq('id', testProjectId);
      if (!checkProj || checkProj.length === 0) {
        console.log('✅ Confirmed: Test records fully purged from remote database.');
      } else {
        console.warn('⚠️ Warning: Test project still found in remote database.');
      }
    }
  }

  console.log('\n================================================================');
  console.log('🎉 LIVE WRITE & CLEANUP PERSISTENCE TEST COMPLETED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runLiveWriteTest().catch((err) => {
  console.error('\n❌ Live write verification failed:', err.message);
  process.exit(1);
});
