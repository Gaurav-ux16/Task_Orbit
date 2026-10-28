<?php
/**
 * TaskOrbit PHP Learning Utility — Database Configuration
 * Syllabus Topics: MySQL with PHP, PDO, Exception Handling, Prepared Statements
 *
 * Connects to a local MySQL database if available using PDO with prepared statements.
 * If MySQL is not running or unconfigured, it catches the PDOException and falls
 * back to storing metadata in a local JSON file so the educational demonstration
 * continues to function seamlessly without crashing.
 */

class Database {
    private static ?PDO $pdo = null;
    private static bool $is_connected = false;

    public static function getConnection(): ?PDO {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $host = getenv('DB_HOST') ?: 'localhost';
        $port = getenv('DB_PORT') ?: '3306';
        $dbname = getenv('DB_NAME') ?: 'taskorbit_demo';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';

        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            self::$pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            self::$is_connected = true;
            return self::$pdo;
        } catch (PDOException $e) {
            // MySQL server is not reachable; fall back gracefully
            self::$is_connected = false;
            return null;
        }
    }

    public static function isConnected(): bool {
        self::getConnection();
        return self::$is_connected;
    }

    /**
     * Store submission metadata in MySQL if available, or fall back to JSON file storage.
     *
     * @param array $data Submission attributes
     * @return int|string Generated record identifier
     * @throws Exception
     */
    public static function saveSubmission(array $data) {
        $pdo = self::getConnection();

        if ($pdo !== null) {
            // Prepared statement demo — prevents SQL injection
            $sql = "INSERT INTO php_submissions 
                    (task_id, task_title, assignee_name, contact_email, file_name, stored_file_path, file_size_bytes, notes, created_at)
                    VALUES 
                    (:task_id, :task_title, :assignee_name, :contact_email, :file_name, :stored_file_path, :file_size_bytes, :notes, NOW())";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':task_id'          => $data['task_id'],
                ':task_title'       => $data['task_title'],
                ':assignee_name'    => $data['assignee_name'],
                ':contact_email'    => $data['contact_email'] ?? null,
                ':file_name'        => $data['file_name'],
                ':stored_file_path' => $data['stored_file_path'],
                ':file_size_bytes'  => (int)$data['file_size_bytes'],
                ':notes'            => $data['notes'] ?? null,
            ]);

            return (int)$pdo->lastInsertId();
        } else {
            // Fallback storage: JSON flat file
            $storageDir = __DIR__ . '/../storage';
            if (!is_dir($storageDir)) {
                mkdir($storageDir, 0755, true);
            }
            $jsonFile = $storageDir . '/submissions.json';
            $existing = [];
            if (file_exists($jsonFile)) {
                $content = file_get_contents($jsonFile);
                $existing = json_decode($content, true) ?: [];
            }

            $id = 'SUB-' . strtoupper(substr(uniqid(), -6));
            $record = array_merge(['id' => $id, 'created_at' => date('Y-m-d H:i:s')], $data);
            $existing[] = $record;
            file_put_contents($jsonFile, json_encode($existing, JSON_PRETTY_PRINT));

            return $id;
        }
    }
}
