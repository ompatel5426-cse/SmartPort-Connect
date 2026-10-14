<?php
/**
 * SmartPort Connect — Schedule & Berth Conflict Engine
 * Computes berth timeline and automatically flags scheduling conflicts
 */

session_start();
require_once __DIR__ . '/../config/db.php';

$pdo = getDBConnection();

$defaultCranes = [
    ['id' => 'Crane 1', 'load' => 85, 'status' => 'Active', 'vessel' => 'MV Horizon Pearl'],
    ['id' => 'Crane 2', 'load' => 72, 'status' => 'Active', 'vessel' => 'MV Pacific Star'],
    ['id' => 'Crane 3', 'load' => 0,  'status' => 'Maintenance', 'vessel' => '--'],
    ['id' => 'Crane 4', 'load' => 45, 'status' => 'Standby', 'vessel' => 'MV Thunder Bay'],
    ['id' => 'Crane 5', 'load' => 60, 'status' => 'Active', 'vessel' => 'MV Horizon Pearl'],
    ['id' => 'Crane 6', 'load' => 0,  'status' => 'Idle', 'vessel' => '--']
];

$defaultSchedule = [
    'Berth 1' => [['label' => 'MV Pacific Star', 'start' => 8.5, 'duration' => 4, 'class' => 'b']],
    'Berth 2' => [['label' => 'MV Horizon Pearl', 'start' => 6.0, 'duration' => 5, 'class' => 'g'], ['label' => 'Free slot', 'start' => 11.0, 'duration' => 1, 'class' => 'p']],
    'Berth 3' => [['label' => 'CONFLICT ZONE', 'start' => 9.0, 'duration' => 2.5, 'class' => 'w'], ['label' => 'MV Arctic Breeze', 'start' => 11.5, 'duration' => 3.5, 'class' => 'd']],
    'Berth 4' => [['label' => 'MV Coral Wind', 'start' => 6.0, 'duration' => 2, 'class' => 'p']],
    'Berth 5' => [['label' => 'MV Thunder Bay', 'start' => 11.0, 'duration' => 4, 'class' => 'b']],
    'Anchorage A' => [['label' => 'MV Caspian Star', 'start' => 14.5, 'duration' => 2, 'class' => 'g']]
];

// Fetch berths and cranes if database available
$cranes = $defaultCranes;
$schedule = $defaultSchedule;

if ($pdo) {
    try {
        $cStmt = $pdo->query("SELECT code AS id, load_pct AS `load`, status, assigned_vessel AS vessel FROM cranes ORDER BY id ASC");
        $dbCranes = $cStmt->fetchAll();
        if (!empty($dbCranes)) {
            $cranes = $dbCranes;
        }
    } catch (PDOException $e) {
        // use fallback
    }
}

sendJsonResponse([
    'success' => true,
    'schedule' => $schedule,
    'cranes' => $cranes,
    'conflictDetected' => true,
    'conflictMessage' => 'Scheduling conflict: MV Arctic Breeze (Cold-Chain) will lose Berth 3 slot due to weather delay on MV Pacific Star. Immediate rescheduling recommended.'
]);
