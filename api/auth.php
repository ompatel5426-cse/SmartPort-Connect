<?php
/**
 * SmartPort Connect — Authentication API
 * Login, Register, Logout, and Session Check
 */

session_start();
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$action = $_GET['action'] ?? $input['action'] ?? '';

$pdo = getDBConnection();

// Fallback demo accounts if database is not active
$fallbackUsers = [
    [
        'id' => 1,
        'name' => 'Alex Morgan',
        'email' => 'admin@smartport.io',
        'password' => 'admin123',
        'role' => 'admin'
    ],
    [
        'id' => 2,
        'name' => 'Sam Torres',
        'email' => 'planner@smartport.io',
        'password' => 'planner123',
        'role' => 'planner'
    ]
];

// Check current session
if ($action === 'check') {
    if (isset($_SESSION['user'])) {
        sendJsonResponse([
            'success' => true,
            'authenticated' => true,
            'user' => $_SESSION['user']
        ]);
    } else {
        sendJsonResponse([
            'success' => true,
            'authenticated' => false
        ]);
    }
}

// Logout
if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    sendJsonResponse([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
}

// Login
if ($action === 'login') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        sendJsonResponse(['success' => false, 'error' => 'Email and password are required'], 400);
    }

    $authenticatedUser = null;

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user) {
                // Verify hash or plain text demo match
                if (password_verify($password, $user['password']) || $password === $user['password'] || ($email === 'admin@smartport.io' && $password === 'admin123') || ($email === 'planner@smartport.io' && $password === 'planner123')) {
                    unset($user['password']);
                    $authenticatedUser = $user;
                }
            }
        } catch (PDOException $e) {
            // fallback to in-memory check
        }
    }

    // Fallback if DB not active or user in demo set
    if (!$authenticatedUser) {
        foreach ($fallbackUsers as $u) {
            if ($u['email'] === $email && $u['password'] === $password) {
                unset($u['password']);
                $authenticatedUser = $u;
                break;
            }
        }
    }

    if ($authenticatedUser) {
        $_SESSION['user'] = $authenticatedUser;
        sendJsonResponse([
            'success' => true,
            'message' => 'Login successful',
            'user' => $authenticatedUser
        ]);
    } else {
        sendJsonResponse(['success' => false, 'error' => 'Invalid email or password'], 401);
    }
}

// Signup / Register
if ($action === 'signup') {
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $role = in_array($input['role'] ?? '', ['admin', 'planner']) ? $input['role'] : 'planner';

    if (empty($name) || empty($email) || strlen($password) < 6) {
        sendJsonResponse(['success' => false, 'error' => 'Valid name, email and password (min 6 chars) required'], 400);
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                sendJsonResponse(['success' => false, 'error' => 'Email is already registered'], 409);
            }

            $hash = password_hash($password, PASSWORD_BCRYPT);
            $insert = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
            $insert->execute([$name, $email, $hash, $role]);
            $newId = $pdo->lastInsertId();

            $newUser = [
                'id' => (int)$newId,
                'name' => $name,
                'email' => $email,
                'role' => $role
            ];
            $_SESSION['user'] = $newUser;

            sendJsonResponse([
                'success' => true,
                'message' => 'Account created successfully',
                'user' => $newUser
            ], 201);
        } catch (PDOException $e) {
            sendJsonResponse(['success' => false, 'error' => 'Database error during registration'], 500);
        }
    } else {
        // Fallback for standalone demo
        $newUser = [
            'id' => time(),
            'name' => $name,
            'email' => $email,
            'role' => $role
        ];
        $_SESSION['user'] = $newUser;
        sendJsonResponse([
            'success' => true,
            'message' => 'Account created (Offline Mode)',
            'user' => $newUser
        ], 201);
    }
}

sendJsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
