import supabase from '../config/supabase.js';
import { createSubmission, getDownloadUrl } from '../services/submissionService.js';
import { applyStatusTransition } from '../services/taskWorkflowService.js';

export async function listSubmissions(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        submitter:profiles!submissions_submitted_by_fkey(id, display_name)
      `)
      .eq('task_id', req.params.taskId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createTaskSubmission(req, res, next) {
  try {
    const { taskId } = req.params;
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'A deliverable file is required for submission' });
    }

    // 1. Verify task exists
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('id, status, project_id, assignee_id, latest_submission_id')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // 2. Ownership Validation (Section III-G & Section IV-A of research paper)
    // An assignee may ONLY submit deliverables for tasks assigned directly to them.
    if (req.user?.role === 'assignee') {
      if (task.assignee_id && task.assignee_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You cannot submit deliverables for a task assigned to another developer.',
        });
      }
    }

    // 3. Workflow State Validation (Section III-C & Section III-D)
    // Under the research paper's state machine, a deliverable can ONLY be submitted when in 'in_progress'.
    // If the task is in 'revision', the assignee must first transition it to 'in_progress' (resume work).
    // Invalid state transitions MUST be rejected with HTTP 409 Conflict.
    if (task.status !== 'in_progress') {
      return res.status(409).json({
        success: false,
        error: `Cannot submit deliverable for task in '${task.status}' state. Task must be 'in_progress' to submit work.`,
      });
    }

    // 4. Create submission record & upload file (monotonically increasing version)
    const submission = await createSubmission(
      taskId,
      req.user.id,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      description
    );

    // 5. Apply state machine transition: in_progress → submitted
    await applyStatusTransition(taskId, 'submitted', req.user, {
      submission_id: submission.id,
      version_number: submission.version_number,
    });

    await supabase.from('activity_logs').insert({
      project_id: task.project_id,
      task_id: taskId,
      actor_id: req.user.id,
      action: 'submission_created',
      details: {
        submission_id: submission.id,
        version_number: submission.version_number,
        file_name: req.file.originalname,
      },
    });

    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
}

export async function downloadSubmission(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('id, file_path, file_name, task_id')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Submission not found' });

    // Ownership check on private deliverables (Section III-G)
    if (req.user?.role === 'assignee') {
      const { data: task } = await supabase
        .from('tasks')
        .select('assignee_id')
        .eq('id', data.task_id)
        .single();

      if (task && task.assignee_id && task.assignee_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You do not have permission to download deliverables for unassigned tasks.',
        });
      }
    }

    const signedUrl = await getDownloadUrl(data.file_path);
    res.json({ success: true, data: { url: signedUrl, file_name: data.file_name } });
  } catch (err) {
    next(err);
  }
}
