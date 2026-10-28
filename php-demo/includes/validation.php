<?php
/**
 * TaskOrbit PHP Learning Utility — Input Validation & Sanitization
 * Syllabus Topics: Functions, Conditions & Loops, String Manipulation, Email Validation
 */

/**
 * Sanitize raw string input to protect against XSS when rendering.
 * Demonstrates: Functions, String manipulation (trim, htmlspecialchars)
 *
 * @param mixed $input
 * @return string
 */
function sanitize_string($input): string {
    if ($input === null) return '';
    return htmlspecialchars(trim((string)$input), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate required field presence.
 * Demonstrates: Conditions, String length check
 *
 * @param string $value
 * @param string $field_name
 * @param array &$errors Reference to errors associative array
 */
function validate_required(string $value, string $field_name, array &$errors): void {
    if (trim($value) === '') {
        $errors[$field_name] = ucfirst(str_replace('_', ' ', $field_name)) . ' is required.';
    }
}

/**
 * Validate minimum and maximum string length.
 * Demonstrates: String length (strlen), conditions
 *
 * @param string $value
 * @param int $min
 * @param int $max
 * @param string $field_name
 * @param array &$errors
 */
function validate_length(string $value, int $min, int $max, string $field_name, array &$errors): void {
    $len = strlen(trim($value));
    if ($len < $min || $len > $max) {
        $errors[$field_name] = ucfirst(str_replace('_', ' ', $field_name)) . " must be between {$min} and {$max} characters.";
    }
}

/**
 * Validate email address format using PHP filter_var.
 * Demonstrates: Email validation, filter_var, FILTER_VALIDATE_EMAIL
 *
 * @param string $email
 * @param array &$errors
 * @param bool $required
 */
function validate_email_address(string $email, array &$errors, bool $required = false): void {
    $trimmed = trim($email);
    if ($trimmed === '') {
        if ($required) {
            $errors['contact_email'] = 'Contact email address is required.';
        }
        return;
    }

    if (!filter_var($trimmed, FILTER_VALIDATE_EMAIL)) {
        $errors['contact_email'] = 'The provided contact email address "' . sanitize_string($trimmed) . '" is invalid.';
    }
}

/**
 * Validate CSRF token stored in PHP session.
 * Demonstrates: Sessions, hash_equals comparison
 *
 * @param string $submitted_token
 * @return bool
 */
function validate_csrf_token(?string $submitted_token): bool {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (empty($_SESSION['csrf_token']) || empty($submitted_token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $submitted_token);
}

/**
 * Generate or retrieve the session CSRF token.
 *
 * @return string
 */
function get_csrf_token(): string {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}
