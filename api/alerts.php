<?php
/**
 * SmartPort Connect — Alerts API
 * Port notification and risk alert system
 */

session_start();
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDBConnection();

$fallbackAlerts = [
    ['id' => 1, 'type' => 'crit', 'msg' => 'MV Arctic Breeze (Cold-Chain) delayed 2h 15m due to Storm Warning. Berth 3 conflict with MV Pacific Star.', 'time' => '2 min ago'],
    ['id' => 2, 'type' => 'crit', 'msg' => 'Cold-chain integrity risk: MV Arctic Breeze ETA revised to 11:30. Refrigeration window at risk.', 'time' => '5 min ago'],
    ['id' => 3, 'type' => 'warn', 'msg' => 'Strong winds (32 kn) forecast 10:00-14:00. 3 inbound vessels may face approach delays.', 'time' => '12 min ago'],
    ['id' => 4, 'type' => 'warn', 'msg' => 'Crane 2 maintenance due in 4h. Berth 1 operations may be affected.', 'time' => '28 min ago'],
    ['id' => 5, 'type' => 'info', 'msg' => 'MV Horizon Pearl docking complete. Berth 2 operational. Cargo offload started.', 'time' => '41 min ago'],
    ['id' => 6, 'type' => 'info', 'msg' => 'MV Thunder Bay cleared customs. Awaiting berth assignment.', 'time' => '1 hr ago']
];

if ($method === 'GET') {
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT id, type, message AS msg, time_ago AS time FROM alerts WHERE is_resolved = 0 ORDER BY id DESC LIMIT 20");
            $alerts = $stmt->fetchAll();
            if (empty($alerts)) {
                $alerts = $fallbackAlerts;
            }
            sendJsonResponse(['success' => true, 'data' => $alerts]);
        } catch (PDOException $e) {
            sendJsonResponse(['success' => true, 'data' => $fallbackAlerts]);
        }
    } else {
        sendJsonResponse(['success' => true, 'data' => $fallbackAlerts]);
    }
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $type = in_array($input['type'] ?? '', ['crit', 'warn', 'info']) ? $input['type'] : 'info';
    $msg = trim($input['msg'] ?? $input['message'] ?? '');

    if (empty($msg)) {
        sendJsonResponse(['success' => false, 'error' => 'Alert message is required'], 400);
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("INSERT INTO alerts (type, message, time_ago) VALUES (?, ?, 'Just now')");
            $stmt->execute([$type, $msg]);
            $newId = (int)$pdo->lastInsertId();
            sendJsonResponse(['success' => true, 'data' => ['id' => $newId, 'type' => $type, 'msg' => $msg, 'time' => 'Just now']]);
        } catch (PDOException $e) {
            sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    } else {
        sendJsonResponse(['success' => true, 'data' => ['id' => time(), 'type' => $type, 'msg' => $msg, 'time' => 'Just now']]);
    }
}

if ($method === 'DELETE') {
    // Clear alerts or mark as resolved
    if ($pdo) {
        try {
            $pdo->exec("UPDATE alerts SET is_resolved = 1 WHERE type IN ('crit', 'warn')");
            sendJsonResponse(['success' => true, 'message' => 'Active alerts cleared']);
        } catch (PDOException $e) {
            sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    } else {
        sendJsonResponse(['success' => true, 'message' => 'Active alerts cleared (Offline)']);
    }
}

sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
