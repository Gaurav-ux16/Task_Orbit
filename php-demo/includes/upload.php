<?php
/**
 * TaskOrbit PHP Learning Utility — Safe File Upload Handler
 * Syllabus Topics: File Handling, Exception Handling, Security Best Practices
 */

class FileUploadException extends Exception {}

/**
 * Handle deliverable file upload with strict server-side validation.
 *
 * Demonstrates:
 * - File upload error code verification
 * - File size restriction (10 MB)
 * - Extension whitelist & MIME type inspection using finfo (not trusting client header)
 * - Safe random filename generation
 * - Saving to protected directory outside public document root
 * - Exception handling
 *
 * @param array $file_array The $_FILES['deliverable'] array
 * @param string $destination_directory Path to storage/uploads directory
 * @return array ['original_name' => ..., 'stored_name' => ..., 'stored_path' => ..., 'size' => ...]
 * @throws FileUploadException
 */
function handle_deliverable_upload(array $file_array, string $destination_directory): array {
    // 1. Check upload error code
    if (!isset($file_array['error']) || is_array($file_array['error'])) {
        throw new FileUploadException('Invalid file upload parameters.');
    }

    switch ($file_array['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_NO_FILE:
            throw new FileUploadException('No deliverable file was selected.');
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            throw new FileUploadException('File exceeds server maximum upload size limit.');
        default:
            throw new FileUploadException('Unknown file upload error (code: ' . $file_array['error'] . ').');
    }

    // 2. Enforce file size limit (10MB)
    $max_size = 10 * 1024 * 1024; // 10 Megabytes
    if ($file_array['size'] > $max_size) {
        $size_mb = round($file_array['size'] / (1024 * 1024), 2);
        throw new FileUploadException("File size ({$size_mb} MB) exceeds maximum allowed limit of 10 MB.");
    }

    // 3. Whitelist allowed file extensions
    $allowed_extensions = [
        'zip'  => ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'],
        'pdf'  => ['application/pdf'],
        'png'  => ['image/png'],
        'jpg'  => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'txt'  => ['text/plain'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ];

    $original_name = basename($file_array['name']);
    $extension = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));

    if (!array_key_exists($extension, $allowed_extensions)) {
        throw new FileUploadException("File extension .{$extension} is not allowed. Allowed: " . implode(', ', array_keys($allowed_extensions)));
    }

    // 4. Verify MIME type using finfo (server-side inspection)
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file_array['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime_type, $allowed_extensions[$extension])) {
            throw new FileUploadException("Security check failed: file MIME type ({$mime_type}) does not match extension .{$extension}.");
        }
    }

    // 5. Ensure storage directory exists
    if (!is_dir($destination_directory)) {
        if (!mkdir($destination_directory, 0755, true)) {
            throw new FileUploadException('Failed to create storage directory.');
        }
    }

    // 6. Generate safe server-side filename (prevents collision & directory traversal)
    $safe_filename = 'deliverable_' . bin2hex(random_bytes(8)) . '_' . time() . '.' . $extension;
    $target_path = rtrim($destination_directory, '/\\') . DIRECTORY_SEPARATOR . $safe_filename;

    // 7. Move uploaded file
    if (!move_uploaded_file($file_array['tmp_name'], $target_path)) {
        throw new FileUploadException('Failed to move uploaded file to permanent storage.');
    }

    return [
        'original_name'    => $original_name,
        'stored_name'      => $safe_filename,
        'stored_path'      => $target_path,
        'file_size_bytes'  => $file_array['size'],
    ];
}
