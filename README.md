# ⚓ SmartPort Connect — Port & Fleet Management System

A full-stack, modular, modern Web-based Port Management & Maritime Logistics Application designed for college project submission and real-world port operations demonstration.

---

## 🎨 Theme & Appearance
- **Clean White Background**: Designed with a high-contrast, modern, executive-grade white dashboard theme (`--bg-primary: #ffffff`).
- **Crisp Visuals**: Clear typography, status badges, interactive radar map, berth Gantt timeline, and crane workload cards.

---

## 📁 Project Architecture & File Division

The original monolithic file has been systematically organized into an industry-standard MVC/Modular structure:

```
E:\college projects\port web\
│
├── index.php                 # Main PHP Web Application entry with Session handling
├── index.html                # Standalone HTML5 front-end (Runs directly in any browser)
│
├── config/
│   └── db.php                # PDO MySQL database configuration & CORS/JSON response helpers
│
├── database/
│   └── schema.sql            # Complete MySQL database schema + Initial Fleet & User seed data
│
├── api/                      # Backend REST API Endpoints (PHP)
│   ├── auth.php              # Login, Registration, Session verification & Logout
│   ├── vessels.php           # Fleet CRUD (GET all/filter, POST add, PUT update, DELETE)
│   ├── alerts.php            # Active alerts management & clearing
│   ├── schedule.php          # Berth Gantt schedule & conflict calculation engine
│   ├── users.php             # Admin personnel management (RBAC)
│   └── export.php            # Automatic Fleet Report generation & CSV download
│
├── css/
│   └── style.css             # Unified White-Theme styles, cards, modals, and responsive layout
│
├── js/
│   ├── api.js                # Asynchronous API service layer with offline fallback
│   ├── map.js                # Leaflet radar map, ship SVG markers & movement animations
│   ├── schedule.js           # Berth allocation Gantt chart & crane load meters
│   └── app.js                # Main application state, views, events & weather loop
│
├── README.md                 # Project documentation & execution guide
└── smartport.html            # Original reference file
```

---

## 🚀 Key Features Added

1. **Dual Run Modes**:
   - **XAMPP / PHP + MySQL Mode**: Fully dynamic with real database persistence, session security, and REST API.
   - **Standalone Client Mode**: Opening `index.html` directly in Chrome, Edge, or Firefox works seamlessly with local state fallback.
2. **Export Fleet Data to CSV**:
   - One-click export button (`📥 Export to CSV`) generates an official fleet manifest report with UTF-8 encoding.
3. **Live Conflict Detection Engine**:
   - Automatic detection of berth scheduling overlaps between inbound delayed vessels and docked vessels.
4. **Dynamic Maritime Weather Simulator**:
   - Simulates changing wind speeds, waves, and atmospheric conditions; triggers automatic alerts when wind exceeds 30 knots.
5. **Role-Based Access Control (RBAC)**:
   - **Administrator**: Full privileges to add/edit/delete vessels, manage user accounts, and resolve warnings.
   - **Port Planner**: Standard operations for vessel scheduling, monitoring, and berth assignment.
6. **Live Interactive Radar Map**:
   - Powered by Leaflet.js with custom color-coded vessel markers, status pulses, and animated transit routes.

---

## 🛠️ How to Setup & Run

### Method 1: Using XAMPP (Recommended for College Viva / Submission)

1. **Start Apache & MySQL**:
   - Open **XAMPP Control Panel** and click **Start** next to **Apache** and **MySQL**.

2. **Import Database**:
   - Open your browser and visit: `http://localhost/phpmyadmin/`
   - Click on the **Databases** tab and create a new database named `smartport_db`.
   - Click **Import**, choose the file `database/schema.sql`, and click **Go**.

3. **Deploy the Project**:
   - Copy this folder (`port web`) into `C:\xampp\htdocs\` and rename it (e.g. `port_web`).
   - Open your browser and navigate to:
     ```
     http://localhost/port_web/
     ```

### Method 2: Instant Run (Direct HTML Opening)
- Double-click `index.html` to open directly in Google Chrome, Microsoft Edge, or any modern web browser.
- All functionalities (Leaflet tracking, animations, fleet filtering, alerts, modals, and simulation) run out-of-the-box!

---

## 🔑 Default Login Credentials

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@smartport.io` | `admin123` | Full access + User management + Delete actions |
| **Port Planner** | `planner@smartport.io` | `planner123` | Fleet planning + Scheduling + Berths |

*(New accounts can also be freely registered via the "Register Account" tab on the sign-in screen.)*
