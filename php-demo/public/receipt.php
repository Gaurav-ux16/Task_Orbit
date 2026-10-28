<?php
/**
 * TaskOrbit PHP Learning Utility — Submission Receipt
 * Syllabus Topics: Sessions (reading flash session data), Cookies (reading setcookie value), Output escaping
 */

session_start();

require_once __DIR__ . '/../includes/validation.php';

$receipt = $_SESSION['receipt_data'] ?? null;
$remembered_cookie = $_COOKIE['taskorbit_demo_user'] ?? null;

// Clear the session flash data after loading (standard flash receipt pattern)
unset($_SESSION['receipt_data']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskOrbit — Submission Receipt (PHP)</title>
    <style>
        :root {
            --bg: #f8fafc;
            --surface: #ffffff;
            --border: #e2e8f0;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --accent: #4f46e5;
            --success: #16a34a;
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
        .success-banner {
            background: var(--success-bg);
            border: 1px solid var(--success-border);
            color: #14532d;
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 24px;
        }
        .success-banner h2 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
        .success-banner p { font-size: 13px; color: #166534; }
        .receipt-card {
            background: #f8fafc;
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .receipt-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 13px;
            border-bottom: 1px solid var(--border);
        }
        .receipt-row:last-child { border-bottom: none; }
        .receipt-label { color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 11px; }
        .receipt-val { color: var(--text-main); font-weight: 500; text-align: right; }
        .cookie-notice {
            background: #fffbeb;
            border: 1px solid #fde68a;
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            color: #92400e;
            margin-bottom: 20px;
        }
        .btn-link {
            display: inline-block;
            background: var(--accent);
            color: #fff;
            text-decoration: none;
            padding: 9px 16px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 5px;
        }
        .btn-link:hover { background: #4338ca; }
    </style>
</head>
<body>
    <div class="container">
        <?php if ($receipt): ?>
            <div class="success-banner">
                <h2>Submission Receipt Generated</h2>
                <p>Your task deliverable has been processed by the PHP server and logged into the demonstration store.</p>
            </div>

            <div class="receipt-card">
                <div class="receipt-row">
                    <span class="receipt-label">Receipt Identifier</span>
                    <span class="receipt-val"><code>#<?= sanitize_string($receipt['submission_id']) ?></code></span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">Task Deliverable</span>
                    <span class="receipt-val"><?= sanitize_string($receipt['task_title']) ?></span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">Submitted By</span>
                    <span class="receipt-val"><?= sanitize_string($receipt['assignee_name']) ?></span>
                </div>
                <?php if (!empty($receipt['contact_email'])): ?>
                    <div class="receipt-row">
                        <span class="receipt-label">Contact Email</span>
                        <span class="receipt-val"><?= sanitize_string($receipt['contact_email']) ?></span>
                    </div>
                <?php endif; ?>
                <div class="receipt-row">
                    <span class="receipt-label">Attached File</span>
                    <span class="receipt-val"><?= sanitize_string($receipt['file_name']) ?> (<?= sanitize_string($receipt['file_size_kb']) ?> KB)</span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">Timestamp</span>
                    <span class="receipt-val"><?= sanitize_string($receipt['submitted_at']) ?></span>
                </div>
                <div class="receipt-row">
                    <span class="receipt-label">Backend Persistence</span>
                    <span class="receipt-val"><?= sanitize_string($receipt['storage_type']) ?></span>
                </div>
                <?php if (!empty($receipt['notes'])): ?>
                    <div class="receipt-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                        <span class="receipt-label">Notes</span>
                        <span class="receipt-val" style="text-align: left; font-size: 12px; color: #475569;"><?= nl2br(sanitize_string($receipt['notes'])) ?></span>
                    </div>
                <?php endif; ?>
            </div>

            <?php if ($remembered_cookie): ?>
                <div class="cookie-notice">
                    <strong>PHP Cookie Demonstration:</strong> Active cookie detected: <code>taskorbit_demo_user = "<?= sanitize_string($remembered_cookie) ?>"</code>. Your name will be pre-filled on subsequent visits.
                </div>
            <?php endif; ?>

            <a href="submission.php" class="btn-link">← Submit Another Deliverable</a>
        <?php else: ?>
            <div style="padding: 24px; text-align: center;">
                <h2 style="font-size: 18px; margin-bottom: 8px;">No Active Receipt Found</h2>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Session data has expired or no recent submission occurred.</p>
                <a href="submission.php" class="btn-link">Go to Submission Form</a>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
