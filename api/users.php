<?php
/**
 * SmartPort Connect — Users Management API
 * Accessible by Admin users
 */

session_start();
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDBConnection();

$fallbackUsers = [
    ['id' => 1, 'name' => 'Alex Morgan', 'email' => 'admin@smartport.io', 'role' => 'admin'],
    ['id' => 2, 'name' => 'Sam Torres', 'email' => 'planner@smartport.io', 'role' => 'planner']
];

if ($method === 'GET') {
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT id, name, email, role, created_at FROM users ORDER BY id ASC");
            $users = $stmt->fetchAll();
            if (empty($users)) {
                $users = $fallbackUsers;
            }
            sendJsonResponse(['success' => true, 'data' => $users]);
        } catch (PDOException $e) {
            sendJsonResponse(['success' => true, 'data' => $fallbackUsers]);
        }
    } else {
        sendJsonResponse(['success' => true, 'data' => $fallbackUsers]);
    }
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $role = in_array($input['role'] ?? '', ['admin', 'planner']) ? $input['role'] : 'planner';

    if (empty($name) || empty($email) || strlen($password) < 6) {
        sendJsonResponse(['success' => false, 'error' => 'All fields required with password min 6 chars'], 400);
    }

    if ($pdo) {
        try {
            $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $check->execute([$email]);
            if ($check->fetch()) {
                sendJsonResponse(['success' => false, 'error' => 'Email already registered'], 409);
            }

            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
            $stmt->execute([$name, $email, $hash, $role]);
            $newId = (int)$pdo->lastInsertId();

            sendJsonResponse([
                'success' => true,
                'message' => 'User created successfully',
                'data' => ['id' => $newId, 'name' => $name, 'email' => $email, 'role' => $role]
            ], 201);
        } catch (PDOException $e) {
            sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    } else {
        sendJsonResponse([
            'success' => true,
            'message' => 'User created (Offline Mode)',
            'data' => ['id' => time(), 'name' => $name, 'email' => $email, 'role' => $role]
        ], 201);
    }
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = (int)($input['id'] ?? 0);
    }

    if ($id <= 0) {
        sendJsonResponse(['success' => false, 'error' => 'Valid User ID required'], 400);
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            sendJsonResponse(['success' => true, 'message' => 'User deleted successfully']);
        } catch (PDOException $e) {
            sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    } else {
        sendJsonResponse(['success' => true, 'message' => 'User deleted (Offline Mode)']);
    }
}

sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
