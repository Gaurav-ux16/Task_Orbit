import supabase from '../config/supabase.js';
import { applyStatusTransition } from '../services/taskWorkflowService.js';
import { requireTaskAccess } from '../services/accessService.js';

export async function getPendingReviews(req, res, next) {
  try {
    // Tasks in 'submitted' or 'in_review' status awaiting reviewer action
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, title),
        assignee:profiles!tasks_assignee_id_fkey(id, display_name)
      `)
      .in('status', ['submitted', 'in_review'])
      .order('updated_at', { ascending: true });
    if (error) throw error;

    const result = await Promise.all(
      tasks.map(async (task) => {
        const { data: submissions } = await supabase
          .from('submissions')
          .select('id, task_id, version_number, file_name, description, created_at, submitted_by')
          .eq('task_id', task.id)
          .order('version_number', { ascending: false })
          .limit(1);
        return { ...task, latest_submission: submissions?.[0] || null };
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req, res, next) {
  try {
    const { submissionId } = req.params;
    const { decision, feedback, task_id } = req.body;

    if (decision === 'revision' && !feedback) {
      return res.status(400).json({ success: false, error: 'Feedback is required when requesting revisions' });
    }

    const { data: submission, error: subErr } = await supabase
      .from('submissions')
      .select('id, task_id, version_number')
      .eq('id', submissionId)
      .maybeSingle();
    if (subErr) throw subErr;
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });

    if (task_id && task_id !== submission.task_id) {
      return res.status(400).json({ success: false, error: 'task_id does not match the submission' });
    }
    const effectiveTaskId = submission.task_id;

    const { data: task } = await supabase
      .from('tasks')
      .select('id, status, latest_submission_id, latest_version_number')
      .eq('id', effectiveTaskId)
      .maybeSingle();
    if (!task) return res.status(404).json({ success: false, error: 'Associated task not found' });

    const { data: latestSubs } = await supabase
      .from('submissions')
      .select('version_number, id')
      .eq('task_id', submission.task_id)
      .order('version_number', { ascending: false })
      .limit(1);

    const latestVersion = latestSubs?.[0]?.version_number;
    const latestSubId = latestSubs?.[0]?.id || task.latest_submission_id;

    // Stale review protection — HTTP 409 if not latest version or id (property P4)
    if (submission.version_number !== latestVersion || (latestSubId && submission.id !== latestSubId)) {
      return res.status(409).json({
        success: false,
        error: `Stale review rejected (HTTP 409): Reviewing outdated submission version ${submission.version_number}. Latest is version ${latestVersion}.`,
        data: { reviewed_version: submission.version_number, latest_version: latestVersion },
      });
    }

    if (task.status !== 'in_review') {
      return res.status(409).json({
        success: false,
        error: `Workflow violation: Task must be transitioned to 'in_review' before a review decision can be committed. Current status is '${task.status}'.`,
      });
    }

    const { data: review, error: reviewErr } = await supabase
      .from('reviews')
      .insert({
        task_id: effectiveTaskId,
        submission_id: submissionId,
        reviewer_id: req.user.id,
        decision,
        feedback: feedback || null,
      })
      .select()
      .single();
    if (reviewErr) throw reviewErr;

    await applyStatusTransition(effectiveTaskId, decision, req.user, { review_id: review.id, feedback });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function getTaskReviews(req, res, next) {
  try {
    const task = await requireTaskAccess(req.user, req.params.taskId);
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(id, display_name),
        submission:submissions(version_number, file_name)
      `)
      .eq('task_id', task.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
