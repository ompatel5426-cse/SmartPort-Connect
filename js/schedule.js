/**
 * SmartPort Connect — Schedule Engine
 * Berth Gantt chart visualization & Crane utilization management
 */

const ScheduleEngine = {
  hours: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
  berths: ['Berth 1', 'Berth 2', 'Berth 3', 'Berth 4', 'Berth 5', 'Anchorage A'],

  renderGantt(scheduleData) {
    const container = document.getElementById('gantt-chart');
    if (!container) return;

    const startHour = 6;
    const totalHours = 12;
    const now = new Date();
    const currentHourDecimal = now.getHours() + now.getMinutes() / 60;
    const nowPercent = Math.min(Math.max(((currentHourDecimal - startHour) / totalHours) * 100, 0), 100);

    const defaultSched = {
      'Berth 1': [{ label: 'MV Pacific Star', start: 8.5, duration: 4, class: 'b' }],
      'Berth 2': [
        { label: 'MV Horizon Pearl', start: 6.0, duration: 5, class: 'g' },
        { label: 'Slot Open', start: 11.0, duration: 1, class: 'p' }
      ],
      'Berth 3': [
        { label: 'CONFLICT ZONE', start: 9.0, duration: 2.5, class: 'w' },
        { label: 'MV Arctic Breeze (Risk)', start: 11.5, duration: 3.5, class: 'd' }
      ],
      'Berth 4': [{ label: 'MV Coral Wind', start: 6.0, duration: 2, class: 'p' }],
      'Berth 5': [{ label: 'MV Thunder Bay', start: 11.0, duration: 4, class: 'b' }],
      'Anchorage A': [{ label: 'MV Caspian Star', start: 14.5, duration: 2, class: 'g' }]
    };

    const sched = scheduleData || defaultSched;

    let html = `
      <div class="gantt-hdr">
        <div class="gantt-lbl">Berth Facility</div>
        <div class="gantt-hours">
          ${this.hours.map(h => `<div class="gantt-hr">${h}</div>`).join('')}
        </div>
      </div>
    `;

    this.berths.forEach(b => {
      const blocks = (sched[b] || []).map(bl => {
        const left = (((bl.start - startHour) / totalHours) * 100).toFixed(1);
        const width = ((bl.duration / totalHours) * 100).toFixed(1);
        return `<div class="gblock ${bl.class}" style="left:${left}%;width:${width}%" title="${bl.label}">${bl.label}</div>`;
      }).join('');

      html += `
        <div class="gantt-row">
          <div class="gantt-berth">${b}</div>
          <div class="gantt-track">
            ${blocks}
            <div class="gnow" style="left:${nowPercent.toFixed(1)}%"></div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  renderCranes(cranesList) {
    const container = document.getElementById('crane-chart');
    if (!container) return;

    const defaultCranes = [
      { id: 'STS Crane 1', load: 85, status: 'Active', vessel: 'MV Horizon Pearl' },
      { id: 'STS Crane 2', load: 72, status: 'Active', vessel: 'MV Pacific Star' },
      { id: 'STS Crane 3', load: 0, status: 'Maintenance', vessel: '--' },
      { id: 'Mobile Crane 4', load: 45, status: 'Standby', vessel: 'MV Thunder Bay' },
      { id: 'STS Crane 5', load: 60, status: 'Active', vessel: 'MV Horizon Pearl' },
      { id: 'Rail Crane 6', load: 0, status: 'Idle', vessel: '--' }
    ];

    const cranes = cranesList || defaultCranes;

    container.innerHTML = cranes.map(c => {
      const loadColor = c.load > 75 ? 'var(--danger)' : c.load > 40 ? 'var(--warning)' : 'var(--success)';
      const statusColor = c.status === 'Maintenance' ? 'var(--danger)' : c.status === 'Active' ? 'var(--success)' : 'var(--text-muted)';

      return `
        <div style="background:#ffffff;border:1px solid var(--border);border-radius:10px;padding:14px;box-shadow:var(--card-shadow)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:13px;font-weight:700;color:var(--text-primary)">${c.id}</span>
            <span style="font-size:11px;font-weight:700;color:${statusColor}">${c.status}</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">Assigned: <strong style="color:var(--text-secondary)">${c.vessel}</strong></div>
          <div style="height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-bottom:6px">
            <div style="height:100%;width:${c.load}%;background:${loadColor};border-radius:3px;transition:width 0.4s"></div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);display:flex;justify-content:space-between">
            <span>Utilization</span>
            <strong style="color:var(--text-primary)">${c.load}%</strong>
          </div>
        </div>
      `;
    }).join('');
  }
};
