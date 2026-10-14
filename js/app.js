/**
 * SmartPort Connect — Main Application Controller
 * Handles application state, views, events, and UI rendering
 */

window.STATE = {
  currentUser: null,
  users: [
    { id: 1, name: 'Alex Morgan', email: 'admin@smartport.io', password: 'admin123', role: 'admin' },
    { id: 2, name: 'Sam Torres', email: 'planner@smartport.io', password: 'planner123', role: 'planner' }
  ],
  vessels: [
    { id: 1, name: 'MV Pacific Star', imo: 'IMO 9123456', flag: 'Liberia', cargo: 'Container', priority: 'Priority', eta: '2026-10-15T08:30', berth: 'Berth 1', cranes: '3', status: 'In Transit', lat: 51.95, lng: 3.8, destLat: 51.985, destLng: 4.05 },
    { id: 2, name: 'MV Arctic Breeze', imo: 'IMO 9234567', flag: 'Norway', cargo: 'Cold-Chain', priority: 'Cold-Chain', eta: '2026-10-15T11:30', berth: 'Berth 3', cranes: '2', status: 'Delayed', lat: 51.90, lng: 3.5, destLat: 51.985, destLng: 4.05 },
    { id: 3, name: 'MV Horizon Pearl', imo: 'IMO 9345678', flag: 'Panama', cargo: 'Bulk Cargo', priority: 'Standard', eta: '2026-10-15T07:00', berth: 'Berth 2', cranes: '2', status: 'Docked', lat: 51.988, lng: 4.03, destLat: 51.988, destLng: 4.03 },
    { id: 4, name: 'MV Thunder Bay', imo: 'IMO 9456789', flag: 'Marshall Is.', cargo: 'LNG', priority: 'Priority', eta: '2026-10-15T11:00', berth: 'Berth 5', cranes: '1', status: 'At Anchorage', lat: 51.97, lng: 3.7, destLat: 51.985, destLng: 4.05 },
    { id: 5, name: 'MV Coral Wind', imo: 'IMO 9567890', flag: 'Cyprus', cargo: 'General Cargo', priority: 'Standard', eta: '2026-10-15T06:00', berth: 'Berth 4', cranes: '2', status: 'Departing', lat: 51.99, lng: 4.1, destLat: 51.85, destLng: 3.2 },
    { id: 6, name: 'MV Caspian Star', imo: 'IMO 9678901', flag: 'Malta', cargo: 'Liquid Bulk', priority: 'Standard', eta: '2026-10-15T14:30', berth: 'Anchorage A', cranes: '1', status: 'In Transit', lat: 51.88, lng: 3.3, destLat: 51.985, destLng: 4.05 }
  ],
  alerts: [
    { id: 1, type: 'crit', msg: 'MV Arctic Breeze (Cold-Chain) delayed 2h 15m due to Storm Warning. Berth 3 conflict with MV Pacific Star.', time: '2 min ago' },
    { id: 2, type: 'crit', msg: 'Cold-chain integrity risk: MV Arctic Breeze ETA revised to 11:30. Refrigeration window at risk.', time: '5 min ago' },
    { id: 3, type: 'warn', msg: 'Strong winds (32 kn) forecast 10:00-14:00. 3 inbound vessels may face approach delays.', time: '12 min ago' },
    { id: 4, type: 'warn', msg: 'Crane 2 maintenance due in 4h. Berth 1 operations may be affected.', time: '28 min ago' },
    { id: 5, type: 'info', msg: 'MV Horizon Pearl docking complete. Berth 2 operational. Cargo offload started.', time: '41 min ago' },
    { id: 6, type: 'info', msg: 'MV Thunder Bay cleared customs. Awaiting berth assignment.', time: '1 hr ago' }
  ],
  weather: {
    temp: 14,
    wind: 28,
    visibility: 8,
    wave: 2.1,
    condition: 'Moderate Storm Warning',
    icon: 'Storm'
  },
  nextVesselId: 7,
  nextUserId: 3,
  editingVesselId: null
};

// Formatting helpers
window.fmtDate = function(str) {
  if (!str) return '--';
  try {
    const d = new Date(str);
    return d.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return str;
  }
};

function statusBadge(s) {
  const m = {
    'In Transit': 'transit',
    'Docked': 'docked',
    'Delayed': 'delayed',
    'At Anchorage': 'anchored',
    'Departing': 'departing'
  };
  return `<span class="sbadge ${m[s] || 'transit'}">${s}</span>`;
}

function priorityFlag(p) {
  const m = { 'Cold-Chain': 'cold', 'Priority': 'priority', 'Standard': 'std' };
  return `<span class="pflag ${m[p] || 'std'}">${p}</span>`;
}

// UI Notification Toast
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', danger: '✕', warn: '⚠', info: 'ℹ' };
  el.innerHTML = `
    <span style="font-weight:800;font-size:14px;line-height:1">${icons[type] || 'ℹ'}</span>
    <span style="font-weight:600">${msg}</span>
  `;
  const container = document.getElementById('toast-wrap');
  if (container) {
    container.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'all 0.3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateX(40px)';
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 300);
    }, 3500);
  }
}

// Auth Tabs
function switchAuthTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const form = document.getElementById(tab + '-form');
  if (form) form.classList.add('active');
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pwd = document.getElementById('login-pwd').value;
  const err = document.getElementById('login-error');

  const response = await API.login(email, pwd);

  let user = null;
  if (response && response.success) {
    user = response.user;
  } else {
    // Local memory fallback
    user = STATE.users.find(u => u.email === email && u.password === pwd);
  }

  if (!user) {
    err.style.display = 'block';
    err.textContent = 'Invalid credentials. Use demo: admin@smartport.io / admin123';
    return;
  }

  err.style.display = 'none';
  STATE.currentUser = user;
  try { sessionStorage.setItem('spc_user', JSON.stringify(user)); } catch (ex) {}
  launchApp(user);
}

// Handle Signup
async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const role = document.getElementById('su-role').value;
  const pwd = document.getElementById('su-pwd').value;
  const err = document.getElementById('signup-error');

  const response = await API.signup(name, email, role, pwd);

  let user = null;
  if (response && response.success) {
    user = response.user;
  } else {
    // Check duplicates locally
    if (STATE.users.some(u => u.email === email)) {
      err.style.display = 'block';
      err.textContent = 'Email already registered.';
      return;
    }
    user = { id: STATE.nextUserId++, name, email, password: pwd, role };
    STATE.users.push(user);
  }

  STATE.currentUser = user;
  try { sessionStorage.setItem('spc_user', JSON.stringify(user)); } catch (ex) {}
  err.style.display = 'none';
  launchApp(user);
}

// Handle Logout
async function handleLogout() {
  await API.logout();
  STATE.currentUser = null;
  try { sessionStorage.removeItem('spc_user'); } catch (ex) {}
  MapEngine.destroy();

  const shell = document.getElementById('app-shell');
  shell.classList.remove('visible');
  shell.style.display = 'none';

  const authScreen = document.getElementById('auth-screen');
  authScreen.style.display = 'flex';
  toast('Signed out successfully', 'info');
}

// Launch Dashboard
async function launchApp(user) {
  document.getElementById('auth-screen').style.display = 'none';
  const shell = document.getElementById('app-shell');
  shell.style.display = 'flex';
  shell.classList.add('visible');

  // User pill
  document.getElementById('top-avatar').textContent = user.name[0].toUpperCase();
  document.getElementById('top-name').textContent = user.name;
  document.getElementById('top-role').textContent = user.role === 'admin' ? 'Administrator' : 'Port Planner';

  // Role permissions
  if (user.role === 'admin') {
    document.getElementById('admin-nav').style.display = '';
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  } else {
    document.getElementById('admin-nav').style.display = 'none';
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }

  // Load backend data if available
  const serverVessels = await API.getVessels();
  if (serverVessels && serverVessels.length) {
    STATE.vessels = serverVessels;
  }

  const serverAlerts = await API.getAlerts();
  if (serverAlerts && serverAlerts.length) {
    STATE.alerts = serverAlerts;
  }

  const serverUsers = await API.getUsers();
  if (serverUsers && serverUsers.length) {
    STATE.users = serverUsers;
  }

  updateStats();
  renderAlerts();
  renderFleetTable();
  renderDashTable();
  ScheduleEngine.renderGantt();
  ScheduleEngine.renderCranes();
  renderWeather();
  renderUsers();

  MapEngine.init();
  startWeatherCycle();

  toast(`Welcome back, ${user.name}!`, 'success');
}

// Switch Views
function switchView(name, navBtn, sideItem) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + name);
  if (el) el.classList.add('active');

  if (navBtn) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    navBtn.classList.add('active');
  }
  if (sideItem) {
    document.querySelectorAll('.si').forEach(s => s.classList.remove('active'));
    sideItem.classList.add('active');
  }

  if (name === 'schedule') {
    ScheduleEngine.renderGantt();
    ScheduleEngine.renderCranes();
  }
  if (name === 'dashboard') {
    setTimeout(() => {
      if (MapEngine.map) MapEngine.map.invalidateSize();
    }, 150);
  }
}

// Update KPI Stats
function updateStats() {
  const v = STATE.vessels;
  document.getElementById('sc-total').textContent = v.length;
  document.getElementById('sc-docked').textContent = v.filter(x => x.status === 'Docked').length;
  document.getElementById('sc-transit').textContent = v.filter(x => x.status === 'In Transit').length;
  document.getElementById('sc-delayed').textContent = v.filter(x => x.status === 'Delayed').length;

  const sbDelayed = document.getElementById('sb-delayed');
  if (sbDelayed) sbDelayed.textContent = v.filter(x => x.status === 'Delayed').length;

  const mapCount = document.getElementById('map-vessel-count');
  if (mapCount) mapCount.textContent = `${v.length} vessels monitored`;
}

// Render Alerts
function renderAlerts() {
  const a = STATE.alerts;
  const activeAlerts = a.filter(x => x.type !== 'info');
  const alertBadge = document.getElementById('alert-count-badge');
  if (alertBadge) alertBadge.textContent = activeAlerts.length;

  const sbAlerts = document.getElementById('sb-alerts');
  if (sbAlerts) sbAlerts.textContent = a.filter(x => x.type === 'crit').length;

  const html = a.map(al => `
    <div class="al ${al.type}">
      <div class="al-dot"></div>
      <div style="flex:1">
        <div class="al-msg">${al.msg}</div>
        <div class="al-time">${al.time}</div>
      </div>
    </div>
  `).join('');

  ['alerts-list', 'alerts-list-full'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });

  document.getElementById('alc-crit').textContent = a.filter(x => x.type === 'crit').length;
  document.getElementById('alc-warn').textContent = a.filter(x => x.type === 'warn').length;
  document.getElementById('alc-info').textContent = a.filter(x => x.type === 'info').length;
  document.getElementById('alc-res').textContent = 4;
}

async function clearAlerts() {
  await API.clearAlerts();
  STATE.alerts = STATE.alerts.filter(x => x.type === 'info');
  renderAlerts();
  toast('Active warnings cleared', 'success');
}

// Fleet Filtering & Rendering
let _fleetFilterTxt = '';
let _fleetFilterStatus = '';

function filterVessels(txt, status) {
  if (txt !== null && txt !== undefined) _fleetFilterTxt = txt.toLowerCase();
  if (status !== undefined) _fleetFilterStatus = status;
  renderFleetTable();
}

function renderFleetTable() {
  let v = STATE.vessels;
  if (_fleetFilterTxt) {
    v = v.filter(x => x.name.toLowerCase().includes(_fleetFilterTxt) || x.imo.toLowerCase().includes(_fleetFilterTxt));
  }
  if (_fleetFilterStatus) {
    v = v.filter(x => x.status === _fleetFilterStatus);
  }

  const isAdmin = STATE.currentUser && STATE.currentUser.role === 'admin';
  const tbody = document.getElementById('fleet-tbody');
  if (!tbody) return;

  if (v.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px">No vessels found</td></tr>';
    return;
  }

  tbody.innerHTML = v.map(vessel => `
    <tr>
      <td>
        <strong style="color:var(--text-primary);font-size:13px">${vessel.name}</strong><br>
        <span style="font-size:11px;color:var(--text-muted)">Flag: ${vessel.flag || 'Panama'}</span>
      </td>
      <td style="color:var(--text-secondary);font-weight:600">${vessel.imo}</td>
      <td>${vessel.cargo} ${priorityFlag(vessel.priority)}</td>
      <td>${statusBadge(vessel.status)}</td>
      <td>${fmtDate(vessel.eta)}</td>
      <td style="color:var(--accent);font-weight:700">${vessel.berth}</td>
      <td>${vessel.cranes} crane${parseInt(vessel.cranes) > 1 ? 's' : ''}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn-sm acc" onclick="openVesselModal(${vessel.id})">Edit</button>
          ${isAdmin ? `<button class="btn-sm red" onclick="deleteVessel(${vessel.id})">Delete</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function renderDashTable() {
  const tbody = document.getElementById('dash-vessel-tbody');
  if (!tbody) return;
  tbody.innerHTML = STATE.vessels.slice(0, 5).map(v => `
    <tr>
      <td><strong style="color:var(--text-primary)">${v.name}</strong></td>
      <td style="color:var(--text-muted)">${v.imo}</td>
      <td>${v.cargo} ${priorityFlag(v.priority)}</td>
      <td>${statusBadge(v.status)}</td>
      <td>${fmtDate(v.eta)} — <strong style="color:var(--accent)">${v.berth}</strong></td>
    </tr>
  `).join('');
}

// Vessel Modal Handling
function openVesselModal(id = null) {
  STATE.editingVesselId = id;
  document.getElementById('vessel-modal-title').textContent = id ? 'Edit Vessel' : 'Add New Vessel';

  if (id) {
    const v = STATE.vessels.find(x => x.id === id);
    if (!v) return;
    ['name', 'imo', 'flag', 'cargo', 'priority', 'eta', 'berth', 'cranes', 'status'].forEach(field => {
      const el = document.getElementById('v-' + field);
      if (el) el.value = v[field] || '';
    });
  } else {
    ['v-name', 'v-imo', 'v-flag'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const nowIso = new Date().toISOString().slice(0, 16);
    document.getElementById('v-eta').value = nowIso;
  }

  document.getElementById('vessel-modal').classList.add('open');
}

function closeVesselModal() {
  document.getElementById('vessel-modal').classList.remove('open');
}

async function saveVessel() {
  const name = document.getElementById('v-name').value.trim();
  const imo = document.getElementById('v-imo').value.trim();

  if (!name || !imo) {
    toast('Vessel name and IMO are required', 'danger');
    return;
  }

  const data = {
    name,
    imo,
    flag: document.getElementById('v-flag').value.trim() || 'International',
    cargo: document.getElementById('v-cargo').value,
    priority: document.getElementById('v-priority').value,
    eta: document.getElementById('v-eta').value,
    berth: document.getElementById('v-berth').value,
    cranes: document.getElementById('v-cranes').value,
    status: document.getElementById('v-status').value
  };

  if (STATE.editingVesselId) {
    await API.saveVessel(data, STATE.editingVesselId);
    const idx = STATE.vessels.findIndex(x => x.id === STATE.editingVesselId);
    if (idx >= 0) {
      STATE.vessels[idx] = { ...STATE.vessels[idx], ...data };
    }
    toast(`Vessel updated: ${name}`, 'success');
  } else {
    const lat = 51.86 + Math.random() * 0.2;
    const lng = 3.20 + Math.random() * 0.8;
    const newVessel = {
      id: STATE.nextVesselId++,
      ...data,
      lat,
      lng,
      destLat: 51.985,
      destLng: 4.05
    };

    await API.saveVessel(newVessel);
    STATE.vessels.push(newVessel);

    if (data.status === 'Delayed') {
      STATE.alerts.unshift({
        id: Date.now(),
        type: 'crit',
        msg: `Vessel ${name} registered with DELAYED status. Review berth slot.`,
        time: 'Just now'
      });
      renderAlerts();
    }
    toast(`New vessel registered: ${name}`, 'success');
  }

  closeVesselModal();
  updateStats();
  renderFleetTable();
  renderDashTable();
  ScheduleEngine.renderGantt();
  MapEngine.refreshMarkers();
}

async function deleteVessel(id) {
  if (!confirm('Remove this vessel from the port registry?')) return;
  await API.deleteVessel(id);

  STATE.vessels = STATE.vessels.filter(x => x.id !== id);
  if (MapEngine.markers[id]) {
    MapEngine.markers[id].remove();
    delete MapEngine.markers[id];
  }
  updateStats();
  renderFleetTable();
  renderDashTable();
  ScheduleEngine.renderGantt();
  toast('Vessel removed from system', 'warn');
}

// Weather Engine & Real-time Loop
function renderWeather() {
  const w = STATE.weather;
  const items = [
    { icon: '🌡', val: `${w.temp}°C`, lbl: 'Temperature' },
    { icon: '💨', val: `${w.wind} kn`, lbl: 'Wind Speed' },
    { icon: '👁', val: `${w.visibility} nm`, lbl: 'Visibility' },
    { icon: '🌊', val: `${w.wave}m`, lbl: 'Wave Height' },
    { icon: '☁', val: '72%', lbl: 'Cloud Cover' },
    { icon: '💧', val: '1013 hPa', lbl: 'Atm. Pressure' }
  ];

  document.getElementById('wx-grid').innerHTML = items.map(i => `
    <div class="wx-item">
      <div class="wx-icon">${i.icon}</div>
      <div class="wx-val">${i.val}</div>
      <div class="wx-lbl">${i.lbl}</div>
    </div>
  `).join('');

  const sev = w.wind > 30 ? 'danger' : w.wind > 22 ? 'warn' : 'ok';
  const prefix = sev === 'danger' ? '⚠ CRITICAL ALERT:' : sev === 'warn' ? '⚡ CAUTION:' : '✓ NORMAL:';
  document.getElementById('wx-alert-box').innerHTML = `
    <strong>${prefix} ${w.condition}</strong> — Winds at ${w.wind} kn, Waves ${w.wave}m.
    ${sev === 'danger' ? 'Harbor approach restrictions enforced.' : sev === 'warn' ? 'Caution for small cargo craft.' : 'Standard navigational clearance.'}
  `;

  document.getElementById('top-wx-val').textContent = `${w.temp}°C · Wind ${w.wind} kn`;

  const affected = STATE.vessels.filter(v => v.status === 'Delayed' || v.status === 'At Anchorage');
  document.getElementById('wx-vessels-list').innerHTML = affected.length ? affected.map(v => `
    <div style="background:#ffffff;border:1px solid ${v.status === 'Delayed' ? '#fecaca' : '#fde68a'};border-radius:9px;padding:12px;box-shadow:var(--card-shadow)">
      <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${v.name}</div>
      <div style="font-size:11px;color:var(--text-muted)">${v.cargo} • ${v.berth}</div>
      <div style="font-size:11px;margin-top:4px">
        <span style="color:${v.status === 'Delayed' ? '#dc2626' : '#d97706'};font-weight:700">
          ${v.status === 'Delayed' ? 'Delayed — Harbor speed restricted' : 'Anchored — Awaiting clear conditions'}
        </span>
      </div>
    </div>
  `).join('') : '<div style="color:var(--text-muted);font-size:13px;padding:10px">No vessels currently impacted by weather.</div>';

  const fc = [18, 22, 28, 35, 32, 30, 26, 24, 20, 18, 16, 14];
  const lb = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const maxVal = Math.max(...fc);

  document.getElementById('forecast-chart').innerHTML = fc.map((v, i) => {
    const col = v > 30 ? 'var(--danger)' : v > 22 ? 'var(--warning)' : 'var(--accent)';
    return `<div style="flex:1;background:${col};border-radius:4px 4px 0 0;height:${Math.round((v / maxVal) * 100)}%;min-height:6px" title="${lb[i]} - ${v} kn"></div>`;
  }).join('');

  document.getElementById('forecast-labels').innerHTML = lb.map(l => `<div style="flex:1;text-align:center">${l}</div>`).join('');
}

let _weatherTimer = null;
function startWeatherCycle() {
  if (_weatherTimer) return;
  _weatherTimer = setInterval(() => {
    STATE.weather.wind = Math.round(Math.max(12, Math.min(42, STATE.weather.wind + (Math.random() - 0.45) * 3)));
    STATE.weather.temp = Math.round((Math.max(10, Math.min(22, STATE.weather.temp + (Math.random() - 0.5)))) * 10) / 10;
    STATE.weather.condition = STATE.weather.wind > 30 ? 'Storm Warning Active' : STATE.weather.wind > 22 ? 'Moderate Storm Warning' : 'Conditions Nominal';
    renderWeather();

    if (STATE.weather.wind > 32) {
      const transitVessel = STATE.vessels.find(v => v.status === 'In Transit');
      const alreadyFired = STATE.alerts.some(a => a.id === 'windDelay');
      if (transitVessel && !alreadyFired) {
        transitVessel.status = 'Delayed';
        STATE.alerts.unshift({
          id: 'windDelay',
          type: 'crit',
          msg: `High Wind (${STATE.weather.wind} kn): ${transitVessel.name} status updated to DELAYED. ETA adjusted.`,
          time: 'Just now'
        });
        renderAlerts();
        updateStats();
        renderFleetTable();
        renderDashTable();
        MapEngine.refreshMarkers();
        toast(`${transitVessel.name} delayed due to high winds!`, 'danger');
      }
    }
  }, 9000);
}

// User Management (Admin)
function renderUsers() {
  const container = document.getElementById('user-grid');
  if (!container) return;

  const countBadge = document.getElementById('user-count');
  if (countBadge) countBadge.textContent = `${STATE.users.length} Active Accounts`;

  const colors = [
    'linear-gradient(135deg,#2563eb,#0891b2)',
    'linear-gradient(135deg,#7c3aed,#2563eb)',
    'linear-gradient(135deg,#059669,#0891b2)',
    'linear-gradient(135deg,#d97706,#dc2626)'
  ];

  container.innerHTML = STATE.users.map((u, i) => {
    const isAdmin = STATE.currentUser && STATE.currentUser.role === 'admin';
    const canDelete = isAdmin && u.id !== STATE.currentUser.id;

    return `
      <div class="ucard">
        <div class="ucard-av" style="background:${colors[i % colors.length]}">${u.name[0].toUpperCase()}</div>
        <div style="flex:1;min-width:0">
          <div class="ucard-name">${u.name}</div>
          <div class="ucard-email">${u.email}</div>
          <span class="rbadge ${u.role}">${u.role === 'admin' ? 'Administrator' : 'Port Planner'}</span>
        </div>
        ${canDelete ? `<button class="btn-sm red" onclick="deleteUser(${u.id})">Remove</button>` : ''}
      </div>
    `;
  }).join('');
}

function openUserModal() {
  document.getElementById('user-modal').classList.add('open');
}

function closeUserModal() {
  document.getElementById('user-modal').classList.remove('open');
}

async function saveUser() {
  const name = document.getElementById('nu-name').value.trim();
  const email = document.getElementById('nu-email').value.trim();
  const role = document.getElementById('nu-role').value;
  const pwd = document.getElementById('nu-pwd').value;

  if (!name || !email || !pwd) {
    toast('All user fields are required', 'danger');
    return;
  }

  const res = await API.createUser({ name, email, role, password: pwd });
  if (res && res.success) {
    STATE.users.push(res.data);
  } else {
    if (STATE.users.some(u => u.email === email)) {
      toast('Email already registered', 'danger');
      return;
    }
    STATE.users.push({ id: STATE.nextUserId++, name, email, role, password: pwd });
  }

  closeUserModal();
  renderUsers();
  toast(`User created: ${name}`, 'success');
}

async function deleteUser(id) {
  if (!confirm('Remove this user account?')) return;
  await API.deleteUser(id);
  STATE.users = STATE.users.filter(u => u.id !== id);
  renderUsers();
  toast('User account removed', 'warn');
}

// Export Fleet Report
function exportFleetCsv() {
  window.open('api/export.php', '_blank');
}

// Center Map shortcut
function centerMap() {
  MapEngine.center();
}

// Auto-boot / Session restore on load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const sessionRes = await API.checkSession();
    if (sessionRes && sessionRes.authenticated && sessionRes.user) {
      STATE.currentUser = sessionRes.user;
      launchApp(sessionRes.user);
      return;
    }

    const stored = sessionStorage.getItem('spc_user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u && u.id) {
        STATE.currentUser = u;
        launchApp(u);
      }
    }
  } catch (err) {
    console.error('Boot error:', err);
  }
});
