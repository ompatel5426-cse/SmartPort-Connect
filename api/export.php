<?php
/**
 * SmartPort Connect — Fleet Export API (CSV Generator)
 * College project report generator
 */

require_once __DIR__ . '/../config/db.php';

$pdo = getDBConnection();
$vessels = [];

if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT id, name, imo, flag, cargo, priority, eta, berth, cranes, status FROM vessels ORDER BY id ASC");
        $vessels = $stmt->fetchAll();
    } catch (PDOException $e) {
        $vessels = [];
    }
}

if (empty($vessels)) {
    // Fallback records
    $vessels = [
        ['id' => 1, 'name' => 'MV Pacific Star', 'imo' => 'IMO 9123456', 'flag' => 'Liberia', 'cargo' => 'Container', 'priority' => 'Priority', 'eta' => '2026-10-15 08:30:00', 'berth' => 'Berth 1', 'cranes' => 3, 'status' => 'In Transit'],
        ['id' => 2, 'name' => 'MV Arctic Breeze', 'imo' => 'IMO 9234567', 'flag' => 'Norway', 'cargo' => 'Cold-Chain', 'priority' => 'Cold-Chain', 'eta' => '2026-10-15 11:30:00', 'berth' => 'Berth 3', 'cranes' => 2, 'status' => 'Delayed'],
        ['id' => 3, 'name' => 'MV Horizon Pearl', 'imo' => 'IMO 9345678', 'flag' => 'Panama', 'cargo' => 'Bulk Cargo', 'priority' => 'Standard', 'eta' => '2026-10-15 07:00:00', 'berth' => 'Berth 2', 'cranes' => 2, 'status' => 'Docked'],
        ['id' => 4, 'name' => 'MV Thunder Bay', 'imo' => 'IMO 9456789', 'flag' => 'Marshall Is.', 'cargo' => 'LNG', 'priority' => 'Priority', 'eta' => '2026-10-15 11:00:00', 'berth' => 'Berth 5', 'cranes' => 1, 'status' => 'At Anchorage'],
        ['id' => 5, 'name' => 'MV Coral Wind', 'imo' => 'IMO 9567890', 'flag' => 'Cyprus', 'cargo' => 'General Cargo', 'priority' => 'Standard', 'eta' => '2026-10-15 06:00:00', 'berth' => 'Berth 4', 'cranes' => 2, 'status' => 'Departing'],
        ['id' => 6, 'name' => 'MV Caspian Star', 'imo' => 'IMO 9678901', 'flag' => 'Malta', 'cargo' => 'Liquid Bulk', 'priority' => 'Standard', 'eta' => '2026-10-15 14:30:00', 'berth' => 'Anchorage A', 'cranes' => 1, 'status' => 'In Transit']
    ];
}

$filename = "SmartPort_Fleet_Report_" . date('Y-m-d_His') . ".csv";

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');

$output = fopen('php://output', 'w');

// Add UTF-8 BOM for Excel readability
fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

// CSV Header
fputcsv($output, ['ID', 'Vessel Name', 'IMO Number', 'Flag State', 'Cargo Type', 'Priority', 'ETA (Arrival)', 'Assigned Berth', 'Cranes Allocated', 'Current Status']);

// CSV Rows
foreach ($vessels as $row) {
    fputcsv($output, [
        $row['id'],
        $row['name'],
        $row['imo'],
        $row['flag'],
        $row['cargo'],
        $row['priority'],
        $row['eta'],
        $row['berth'],
        $row['cranes'],
        $row['status']
    ]);
}

fclose($output);
exit;
