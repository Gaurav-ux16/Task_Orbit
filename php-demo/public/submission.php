<?php
/**
 * TaskOrbit PHP Learning Utility — Assignee Submission Form
 * Syllabus Topics: PHP Syntax, Form Handling, Sessions, Cookies, Validation, File Handling
 */

session_start();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/validation.php';
require_once __DIR__ . '/../includes/upload.php';

// Available demo tasks
$DEMO_TASKS = [
    'task-001' => 'Design new checkout flow (Project: E-Commerce Redesign)',
    'task-002' => 'Implement product listing page (Project: E-Commerce Redesign)',
    'task-003' => 'Payment gateway integration (Project: E-Commerce Redesign)',
    'task-007' => 'Token system — colours and spacing (Project: Design System Library)',
];

// Read harmless preference cookie (e.g. remembered developer name)
$saved_developer_name = $_COOKIE['taskorbit_demo_user'] ?? 'Carol Singh';

$errors = [];
$form_data = [
    'task_id'         => 'task-002',
    'assignee_name'   => $saved_developer_name,
    'contact_email'   => 'carol.singh@taskorbit.local',
    'notes'           => '',
    'remember_user'   => '1',
];

// Handle POST Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Validate CSRF Token
    $submitted_token = $_POST['csrf_token'] ?? '';
    if (!validate_csrf_token($submitted_token)) {
        $errors['csrf'] = 'Security validation failed (CSRF token mismatch). Please reload and try again.';
    }

    // 2. Extract and sanitize input
    $form_data['task_id']       = sanitize_string($_POST['task_id'] ?? '');
    $form_data['assignee_name'] = sanitize_string($_POST['assignee_name'] ?? '');
    $form_data['contact_email'] = sanitize_string($_POST['contact_email'] ?? '');
    $form_data['notes']         = sanitize_string($_POST['notes'] ?? '');
    $form_data['remember_user'] = isset($_POST['remember_user']) ? '1' : '0';

    // 3. Field Validations
    if (!array_key_exists($form_data['task_id'], $DEMO_TASKS)) {
        $errors['task_id'] = 'Please select a valid task from the list.';
    }

    validate_required($form_data['assignee_name'], 'assignee_name', $errors);
    validate_length($form_data['assignee_name'], 2, 50, 'assignee_name', $errors);

    // Email validation using filter_var (Syllabus topic: Email validation)
    validate_email_address($form_data['contact_email'], $errors, false);

    validate_length($form_data['notes'], 0, 1000, 'notes', $errors);

    // 4. File Upload Handling
    $upload_result = null;
    if (empty($_FILES['deliverable']) || $_FILES['deliverable']['error'] === UPLOAD_ERR_NO_FILE) {
        $errors['deliverable'] = 'A deliverable file attachment is required.';
    } else {
        try {
            $destination_dir = __DIR__ . '/../storage/uploads';
            $upload_result = handle_deliverable_upload($_FILES['deliverable'], $destination_dir);
        } catch (FileUploadException $e) {
            $errors['deliverable'] = $e->getMessage();
        } catch (Exception $e) {
            $errors['deliverable'] = 'Unexpected error occurred during file upload.';
        }
    }

    // 5. If no errors, persist and redirect to receipt
    if (empty($errors)) {
        // Set harmless cookie for developer name preference (1 day expiry)
        if ($form_data['remember_user'] === '1') {
            setcookie('taskorbit_demo_user', $form_data['assignee_name'], time() + 86400, '/', '', false, true);
        }

        try {
            $task_title = $DEMO_TASKS[$form_data['task_id']] ?? 'Unknown Task';
            
            $record_id = Database::saveSubmission([
                'task_id'          => $form_data['task_id'],
                'task_title'       => $task_title,
                'assignee_name'    => $form_data['assignee_name'],
                'contact_email'    => $form_data['contact_email'],
                'file_name'        => $upload_result['original_name'],
                'stored_file_path' => $upload_result['stored_name'],
                'file_size_bytes'  => $upload_result['file_size_bytes'],
                'notes'            => $form_data['notes'],
            ]);

            // Save receipt in session (Syllabus topic: Sessions)
            $_SESSION['receipt_data'] = [
                'submission_id' => $record_id,
                'task_title'    => $task_title,
                'assignee_name' => $form_data['assignee_name'],
                'contact_email' => $form_data['contact_email'],
                'file_name'     => $upload_result['original_name'],
                'file_size_kb'  => round($upload_result['file_size_bytes'] / 1024, 1),
                'notes'         => $form_data['notes'],
                'submitted_at'  => date('Y-m-d H:i:s'),
                'storage_type'  => Database::isConnected() ? 'MySQL Database' : 'Local File Storage (Fallback)',
            ];

            // Redirect to prevent duplicate submission on refresh
            header('Location: receipt.php');
            exit;
        } catch (Exception $e) {
            $errors['system'] = 'Failed to save submission record: ' . $e->getMessage();
        }
    }
}

$csrf_token = get_csrf_token();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskOrbit — PHP Submission Learning Utility (Unit I)</title>
    <style>
        :root {
            --bg: #f8fafc;
            --surface: #ffffff;
            --border: #e2e8f0;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --accent: #4f46e5;
            --accent-hover: #4338ca;
            --danger: #dc2626;
            --danger-bg: #fef2f2;
            --danger-border: #fecaca;
            --success-bg: #f0fdf4;
            --success-border: #bbf7d0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            padding: 30px 20px;
            line-height: 1.5;
        }
        .container {
            max-width: 680px;
            margin: 0 auto;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            padding: 28px;
        }
        .badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 4px;
            background: #ede9fe;
            color: #5b21b6;
            margin-bottom: 8px;
        }
        h1 { font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px; }
        p.subtitle { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
        .alert-error {
            background: var(--danger-bg);
            border: 1px solid var(--danger-border);
            color: var(--danger);
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 13px;
            margin-bottom: 20px;
        }
        .alert-error ul { margin-left: 20px; margin-top: 4px; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px; }
        input[type="text"], input[type="email"], select, textarea {
            width: 100%;
            padding: 8px 12px;
            font-size: 13px;
            border: 1px solid var(--border);
            border-radius: 5px;
            background: #fff;
            color: var(--text-main);
            outline: none;
            transition: border-color 0.15s;
        }
        input:focus, select:focus, textarea:focus { border-color: var(--accent); }
        .file-hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
        .field-error { font-size: 12px; color: var(--danger); margin-top: 4px; }
        .checkbox-group { display: flex; items-align: center; gap: 8px; font-size: 13px; color: var(--text-main); }
        button[type="submit"] {
            background: var(--accent);
            color: #fff;
            border: none;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.15s;
        }
        button[type="submit"]:hover { background: var(--accent-hover); }
        .syllabus-note {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid var(--border);
            font-size: 11px;
            color: var(--text-muted);
        }
        .syllabus-note code { background: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-size: 11px; }
    </style>
</head>
<body>
    <div class="container">
        <span class="badge">Syllabus Demo — Unit I: PHP Server-Side Technologies</span>
        <h1>Assignee Work Submission (PHP Utility)</h1>
        <p class="subtitle">Demonstrates PHP syntax, form processing, session persistence, secure file handling, and prepared statements.</p>

        <?php if (!empty($errors)): ?>
            <div class="alert-error">
                <strong>Please resolve the following submission errors:</strong>
                <ul>
                    <?php foreach ($errors as $field => $err): ?>
                        <li><?= sanitize_string($err) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <form method="POST" action="submission.php" enctype="multipart/form-data">
            <input type="hidden" name="csrf_token" value="<?= sanitize_string($csrf_token) ?>">

            <div class="form-group">
                <label for="task_id">Target Task Deliverable *</label>
                <select name="task_id" id="task_id" required>
                    <?php foreach ($DEMO_TASKS as $id => $title): ?>
                        <option value="<?= sanitize_string($id) ?>" <?= $form_data['task_id'] === $id ? 'selected' : '' ?>>
                            <?= sanitize_string($title) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <?php if (isset($errors['task_id'])): ?>
                    <p class="field-error"><?= sanitize_string($errors['task_id']) ?></p>
                <?php endif; ?>
            </div>

            <div class="form-group">
                <label for="assignee_name">Assignee Developer Name *</label>
                <input type="text" name="assignee_name" id="assignee_name" value="<?= sanitize_string($form_data['assignee_name']) ?>" required>
                <?php if (isset($errors['assignee_name'])): ?>
                    <p class="field-error"><?= sanitize_string($errors['assignee_name']) ?></p>
                <?php endif; ?>
            </div>

            <div class="form-group">
                <label for="contact_email">Contact Email (Email Validation Demo)</label>
                <input type="text" name="contact_email" id="contact_email" placeholder="developer@example.com" value="<?= sanitize_string($form_data['contact_email']) ?>">
                <p class="file-hint">Validated on server using PHP's <code>filter_var(..., FILTER_VALIDATE_EMAIL)</code>.</p>
                <?php if (isset($errors['contact_email'])): ?>
                    <p class="field-error"><?= sanitize_string($errors['contact_email']) ?></p>
                <?php endif; ?>
            </div>

            <div class="form-group">
                <label for="deliverable">Deliverable Attachment File *</label>
                <input type="file" name="deliverable" id="deliverable" required>
                <p class="file-hint">Allowed: ZIP, PDF, PNG, JPG, DOCX, TXT. Max size: 10 MB. Verified with MIME inspection.</p>
                <?php if (isset($errors['deliverable'])): ?>
                    <p class="field-error"><?= sanitize_string($errors['deliverable']) ?></p>
                <?php endif; ?>
            </div>

            <div class="form-group">
                <label for="notes">Submission Description & Notes</label>
                <textarea name="notes" id="notes" rows="3" placeholder="Provide notes regarding the deliverable or revisions made..."><?= sanitize_string($form_data['notes']) ?></textarea>
                <?php if (isset($errors['notes'])): ?>
                    <p class="field-error"><?= sanitize_string($errors['notes']) ?></p>
                <?php endif; ?>
            </div>

            <div class="form-group checkbox-group">
                <input type="checkbox" name="remember_user" id="remember_user" value="1" <?= $form_data['remember_user'] === '1' ? 'checked' : '' ?>>
                <label for="remember_user" style="display:inline; text-transform:none; font-weight:normal; font-size:13px; color:var(--text-main);">
                    Remember my developer name for future submissions (Demonstrates PHP Cookies: <code>setcookie</code>)
                </label>
            </div>

            <button type="submit">Submit Deliverable via PHP</button>
        </form>

        <div class="syllabus-note">
            <strong>Syllabus Concepts Illustrated in this script:</strong>
            PHP Syntax • <code>$_POST</code> & <code>$_FILES</code> Handling • Loops (<code>foreach</code> error rendering) • Functions (sanitization & upload handlers) • Strings (<code>trim</code>, <code>htmlspecialchars</code>) • Arrays • Sessions (<code>$_SESSION</code>) • Cookies (<code>setcookie</code>) • Exception Handling (<code>try-catch</code>) • Email validation (<code>filter_var</code>) • Prepared SQL (<code>PDO</code>).
        </div>
    </div>
</body>
</html>
