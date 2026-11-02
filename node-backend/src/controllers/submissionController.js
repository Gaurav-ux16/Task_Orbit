import supabase from '../config/supabase.js';
import { createSubmission, getDownloadUrl } from '../services/submissionService.js';
import { applyStatusTransition } from '../services/taskWorkflowService.js';
import { requireTaskAccess, forbidden } from '../services/accessService.js';
import { inspectUpload } from '../utils/fileGuard.js';

export async function listSubmissions(req, res, next) {
  try {
    const task = await requireTaskAccess(req.user, req.params.taskId);

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id, task_id, version_number, file_name, description, created_at, submitted_by,
        submitter:profiles!submissions_submitted_by_fkey(id, display_name)
      `)
      .eq('task_id', task.id)
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

    const task = await requireTaskAccess(req.user, taskId);

    // Ownership: only the assigned developer may deliver work (Section III-G / IV-A).
    if (task.assignee_id !== req.user.id) {
      throw forbidden('Access denied: You cannot submit deliverables for a task assigned to another developer.');
    }

    // Workflow state: a deliverable can only be submitted from 'in_progress'.
    if (task.status !== 'in_progress') {
      return res.status(409).json({
        success: false,
        error: `Cannot submit deliverable for task in '${task.status}' state. Task must be 'in_progress' to submit work.`,
      });
    }

    // Content verification BEFORE anything is stored.
    const inspected = inspectUpload(req.file);
    if (!inspected.ok) return res.status(400).json({ success: false, error: inspected.error });

    const submission = await createSubmission(
      taskId,
      req.user.id,
      req.file.buffer,
      inspected.safeName,
      inspected.mime,
      description
    );

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
        file_name: inspected.safeName,
      },
    });

    const { file_path: _hidden, ...publicSubmission } = submission;
    res.status(201).json({ success: true, data: publicSubmission });
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
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Submission not found' });

    const task = await requireTaskAccess(req.user, data.task_id);

    // Clients may only retrieve deliverables that have passed review.
    if (req.user.role === 'client' && task.status !== 'approved') {
      throw forbidden('Access denied: deliverables are released to clients once the task is approved.');
    }

    const signedUrl = await getDownloadUrl(data.file_path);
    res.json({ success: true, data: { url: signedUrl, file_name: data.file_name } });
  } catch (err) {
    next(err);
  }
}
