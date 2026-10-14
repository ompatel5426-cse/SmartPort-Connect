<?php
/**
 * SmartPort Connect — Vessels API
 * Full CRUD for Port Fleet Management
 */

session_start();
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDBConnection();

// Initial fleet fallback if MySQL is not populated or offline
$fallbackVessels = [
    [
        'id' => 1,
        'name' => 'MV Pacific Star',
        'imo' => 'IMO 9123456',
        'flag' => 'Liberia',
        'cargo' => 'Container',
        'priority' => 'Priority',
        'eta' => '2026-10-15T08:30',
        'berth' => 'Berth 1',
        'cranes' => '3',
        'status' => 'In Transit',
        'lat' => 51.95,
        'lng' => 3.8,
        'destLat' => 51.985,
        'destLng' => 4.05
    ],
    [
        'id' => 2,
        'name' => 'MV Arctic Breeze',
        'imo' => 'IMO 9234567',
        'flag' => 'Norway',
        'cargo' => 'Cold-Chain',
        'priority' => 'Cold-Chain',
        'eta' => '2026-10-15T11:30',
        'berth' => 'Berth 3',
        'cranes' => '2',
        'status' => 'Delayed',
        'lat' => 51.90,
        'lng' => 3.5,
        'destLat' => 51.985,
        'destLng' => 4.05
    ],
    [
        'id' => 3,
        'name' => 'MV Horizon Pearl',
        'imo' => 'IMO 9345678',
        'flag' => 'Panama',
        'cargo' => 'Bulk Cargo',
        'priority' => 'Standard',
        'eta' => '2026-10-15T07:00',
        'berth' => 'Berth 2',
        'cranes' => '2',
        'status' => 'Docked',
        'lat' => 51.988,
        'lng' => 4.03,
        'destLat' => 51.988,
        'destLng' => 4.03
    ],
    [
        'id' => 4,
        'name' => 'MV Thunder Bay',
        'imo' => 'IMO 9456789',
        'flag' => 'Marshall Is.',
        'cargo' => 'LNG',
        'priority' => 'Priority',
        'eta' => '2026-10-15T11:00',
        'berth' => 'Berth 5',
        'cranes' => '1',
        'status' => 'At Anchorage',
        'lat' => 51.97,
        'lng' => 3.7,
        'destLat' => 51.985,
        'destLng' => 4.05
    ],
    [
        'id' => 5,
        'name' => 'MV Coral Wind',
        'imo' => 'IMO 9567890',
        'flag' => 'Cyprus',
        'cargo' => 'General Cargo',
        'priority' => 'Standard',
        'eta' => '2026-10-15T06:00',
        'berth' => 'Berth 4',
        'cranes' => '2',
        'status' => 'Departing',
        'lat' => 51.99,
        'lng' => 4.1,
        'destLat' => 51.85,
        'destLng' => 3.2
    ],
    [
        'id' => 6,
        'name' => 'MV Caspian Star',
        'imo' => 'IMO 9678901',
        'flag' => 'Malta',
        'cargo' => 'Liquid Bulk',
        'priority' => 'Standard',
        'eta' => '2026-10-15T14:30',
        'berth' => 'Anchorage A',
        'cranes' => '1',
        'status' => 'In Transit',
        'lat' => 51.88,
        'lng' => 3.3,
        'destLat' => 51.985,
        'destLng' => 4.05
    ]
];

// Helper to sanitize vessel data from MySQL to match frontend schema
function formatVesselRow($row) {
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'imo' => $row['imo'],
        'flag' => $row['flag'] ?? 'International',
        'cargo' => $row['cargo'],
        'priority' => $row['priority'],
        'eta' => date('Y-m-d\TH:i', strtotime($row['eta'])),
        'berth' => $row['berth'],
        'cranes' => (string)$row['cranes'],
        'status' => $row['status'],
        'lat' => (float)$row['lat'],
        'lng' => (float)$row['lng'],
        'destLat' => isset($row['dest_lat']) ? (float)$row['dest_lat'] : (float)$row['destLat'],
        'destLng' => isset($row['dest_lng']) ? (float)$row['dest_lng'] : (float)$row['destLng']
    ];
}

// ------------------------------------------------------------------
// GET: Retrieve all or filtered vessels
// ------------------------------------------------------------------
if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $status = trim($_GET['status'] ?? '');
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($pdo) {
        try {
            $sql = "SELECT * FROM vessels WHERE 1=1";
            $params = [];

            if ($id > 0) {
                $sql .= " AND id = ?";
                $params[] = $id;
            }
            if (!empty($search)) {
                $sql .= " AND (name LIKE ? OR imo LIKE ? OR flag LIKE ? OR cargo LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            if (!empty($status)) {
                $sql .= " AND status = ?";
                $params[] = $status;
            }

            $sql .= " ORDER BY id ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            $vessels = array_map('formatVesselRow', $rows);

            // If DB table is empty, auto-seed with fallback
            if (empty($vessels) && empty($search) && empty($status) && $id === 0) {
                $vessels = $fallbackVessels;
            }

            sendJsonResponse(['success' => true, 'data' => $vessels]);
        } catch (PDOException $e) {
            sendJsonResponse(['success' => true, 'data' => $fallbackVessels, 'fallback' => true]);
        }
    } else {
        // Fallback filter
        $res = $fallbackVessels;
        if (!empty($search)) {
            $res = array_filter($res, function($v) use ($search) {
                return stripos($v['name'], $search) !== false || stripos($v['imo'], $search) !== false;
            });
        }
        if (!empty($status)) {
            $res = array_filter($res, function($v) use ($status) {
                return $v['status'] === $status;
            });
        }
        sendJsonResponse(['success' => true, 'data' => array_values($res), 'fallback' => true]);
    }
}

// ------------------------------------------------------------------
// POST: Create a new vessel
// ------------------------------------------------------------------
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    $name = trim($input['name'] ?? '');
    $imo = trim($input['imo'] ?? '');
    $flag = trim($input['flag'] ?? 'International');
    $cargo = trim($input['cargo'] ?? 'General Cargo');
    $priority = in_array($input['priority'] ?? '', ['Standard', 'Priority', 'Cold-Chain']) ? $input['priority'] : 'Standard';
    $eta = trim($input['eta'] ?? date('Y-m-d H:i:s'));
    $berth = trim($input['berth'] ?? 'Berth 1');
    $cranes = (int)($input['cranes'] ?? 1);
    $status = in_array($input['status'] ?? '', ['In Transit', 'Docked', 'Delayed', 'At Anchorage', 'Departing']) ? $input['status'] : 'In Transit';
    
    $lat = isset($input['lat']) ? (float)$input['lat'] : (51.86 + (mt_rand(0, 20) / 100));
    $lng = isset($input['lng']) ? (float)$input['lng'] : (3.20 + (mt_rand(0, 80) / 100));
    $destLat = 51.985;
    $destLng = 4.05;

    if (empty($name) || empty($imo)) {
        sendJsonResponse(['success' => false, 'error' => 'Vessel Name and IMO Number are required'], 400);
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("INSERT INTO vessels (name, imo, flag, cargo, priority, eta, berth, cranes, status, lat, lng, dest_lat, dest_lng)
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $imo, $flag, $cargo, $priority, $eta, $berth, $cranes, $status, $lat, $lng, $destLat, $destLng]);
            $newId = (int)$pdo->lastInsertId();

            // Auto-log alert if added as delayed
            if ($status === 'Delayed') {
                $alertStmt = $pdo->prepare("INSERT INTO alerts (type, message, time_ago) VALUES ('crit', ?, 'Just now')");
                $alertStmt->execute(["New vessel $name added with DELAYED status. Review berth assignment immediately."]);
            }

            $createdVessel = [
                'id' => $newId,
                'name' => $name,
                'imo' => $imo,
                'flag' => $flag,
                'cargo' => $cargo,
                'priority' => $priority,
                'eta' => $eta,
                'berth' => $berth,
                'cranes' => (string)$cranes,
                'status' => $status,
                'lat' => $lat,
                'lng' => $lng,
                'destLat' => $destLat,
                'destLng' => $destLng
            ];

            sendJsonResponse(['success' => true, 'message' => 'Vessel added successfully', 'data' => $createdVessel], 201);
        } catch (PDOException $e) {
            sendJsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else {
        $createdVessel = [
            'id' => time(),
            'name' => $name,
            'imo' => $imo,
            'flag' => $flag,
            'cargo' => $cargo,
            'priority' => $priority,
            'eta' => $eta,
            'berth' => $berth,
            'cranes' => (string)$cranes,
            'status' => $status,
            'lat' => $lat,
            'lng' => $lng,
            'destLat' => $destLat,
            'destLng' => $destLng
        ];
        sendJsonResponse(['success' => true, 'message' => 'Vessel added (Offline Mode)', 'data' => $createdVessel], 201);
    }
}

// ------------------------------------------------------------------
// PUT: Update existing vessel
// ------------------------------------------------------------------
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = (int)($input['id'] ?? $_GET['id'] ?? 0);

    if ($id <= 0) {
        sendJsonResponse(['success' => false, 'error' => 'Valid Vessel ID required for update'], 400);
    }

    $name = trim($input['name'] ?? '');
    $imo = trim($input['imo'] ?? '');
    $flag = trim($input['flag'] ?? 'International');
    $cargo = trim($input['cargo'] ?? 'General Cargo');
    $priority = in_array($input['priority'] ?? '', ['Standard', 'Priority', 'Cold-Chain']) ? $input['priority'] : 'Standard';
    $eta = trim($input['eta'] ?? date('Y-m-d H:i:s'));
    $berth = trim($input['berth'] ?? 'Berth 1');
    $cranes = (int)($input['cranes'] ?? 1);
    $status = in_array($input['status'] ?? '', ['In Transit', 'Docked', 'Delayed', 'At Anchorage', 'Departing']) ? $input['status'] : 'In Transit';

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE vessels SET name=?, imo=?, flag=?, cargo=?, priority=?, eta=?, berth=?, cranes=?, status=? WHERE id=?");
            $stmt->execute([$name, $imo, $flag, $cargo, $priority, $eta, $berth, $cranes, $status, $id]);

            sendJsonResponse(['success' => true, 'message' => 'Vessel updated successfully']);
        } catch (PDOException $e) {
            sendJsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else {
        sendJsonResponse(['success' => true, 'message' => 'Vessel updated (Offline Mode)']);
    }
}

// ------------------------------------------------------------------
// DELETE: Remove vessel
// ------------------------------------------------------------------
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = (int)($input['id'] ?? 0);
    }

    if ($id <= 0) {
        sendJsonResponse(['success' => false, 'error' => 'Valid Vessel ID required to delete'], 400);
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM vessels WHERE id = ?");
            $stmt->execute([$id]);
            sendJsonResponse(['success' => true, 'message' => 'Vessel deleted successfully']);
        } catch (PDOException $e) {
            sendJsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else {
        sendJsonResponse(['success' => true, 'message' => 'Vessel deleted (Offline Mode)']);
    }
}

sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
