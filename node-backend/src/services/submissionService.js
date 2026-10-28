import supabase from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'taskorbit-files';

/**
 * Get the next monotonically increasing version number for a task's submissions.
 * Section III-D: Monotonically increasing versioning per task.
 */
export async function getNextVersionNumber(taskId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('version_number')
    .eq('task_id', taskId)
    .order('version_number', { ascending: false })
    .limit(1);

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  if (!data || data.length === 0) return 1;
  return data[0].version_number + 1;
}

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the storage path.
 */
export async function uploadDeliverable(taskId, fileBuffer, originalName, mimeType) {
  const ext = originalName.split('.').pop() || 'bin';
  const storagePath = `tasks/${taskId}/${uuidv4()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: false });

  if (error) throw Object.assign(new Error('Storage upload failed: ' + error.message), { status: 500 });

  return storagePath;
}

/**
 * Cleanup a storage file upon partial transaction failure.
 */
export async function deleteDeliverable(storagePath) {
  try {
    if (supabase.storage && supabase.storage.from) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }
  } catch (err) {
    console.error(`[Storage Cleanup Warning] Failed to delete orphaned file ${storagePath}:`, err);
  }
}

/**
 * Generate a short-lived signed URL for downloading a deliverable.
 */
export async function getDownloadUrl(storagePath, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) throw Object.assign(new Error('Failed to generate download URL: ' + error.message), { status: 500 });
  return data.signedUrl;
}

/**
 * Create a submission record, maintain task latest-submission consistency,
 * and handle partial failures gracefully (Section III-D & Section 7).
 */
export async function createSubmission(taskId, submittedBy, fileBuffer, originalName, mimeType, description) {
  const versionNumber = await getNextVersionNumber(taskId);
  const filePath = await uploadDeliverable(taskId, fileBuffer, originalName, mimeType);

  let data;
  try {
    const res = await supabase
      .from('submissions')
      .insert({
        task_id: taskId,
        version_number: versionNumber,
        submitted_by: submittedBy,
        file_path: filePath,
        file_name: originalName,
        description: description || null,
      })
      .select()
      .single();

    if (res.error) throw res.error;
    data = res.data;

    // Maintain consistent reference to latest submission on the task record
    await supabase
      .from('tasks')
      .update({
        latest_submission_id: data.id,
        latest_version_number: versionNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

  } catch (dbError) {
    // Partial failure recovery: delete the uploaded file from storage if DB persistence failed
    await deleteDeliverable(filePath);
    throw Object.assign(new Error('Failed to create submission: ' + dbError.message), { status: 500 });
  }

  return data;
}
