/**
 * SmartPort Connect — Map Engine
 * Leaflet-powered real-time vessel tracking and vessel motion animations
 */

const MapEngine = {
  map: null,
  markers: {},
  animFrames: {},
  vesselPositions: {},

  init() {
    if (this.map) return;
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    this.map = L.map('map', {
      center: [51.94, 3.8],
      zoom: 10,
      zoomControl: false,
      attributionControl: false
    });

    // Clean OpenStreetMap tiles for white / crisp theme
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Port zone indicator
    L.circleMarker([51.985, 4.05], {
      radius: 20,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '6,6'
    }).addTo(this.map);

    L.circleMarker([51.985, 4.05], {
      radius: 6,
      color: '#1d4ed8',
      fillColor: '#2563eb',
      fillOpacity: 1,
      weight: 2
    }).addTo(this.map).bindTooltip('Port of Rotterdam (Main Port Zone)', { permanent: false });

    this.refreshMarkers();
    this.startShipAnimations();
  },

  getStatusColor(status) {
    const map = {
      'In Transit': '#2563eb',
      'Docked': '#059669',
      'Delayed': '#dc2626',
      'At Anchorage': '#d97706',
      'Departing': '#7c3aed'
    };
    return map[status] || '#2563eb';
  },

  createVesselIcon(vessel) {
    const c = this.getStatusColor(vessel.status);
    const pulse = vessel.status === 'Delayed' ? 'animation: vpulse 1.2s ease-in-out infinite;' : '';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
        <style>@keyframes vpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.2)}}</style>
        <circle cx="15" cy="15" r="13" fill="${c}" fill-opacity="0.22" stroke="${c}" stroke-width="1.8"/>
        <circle cx="15" cy="15" r="5" fill="${c}" style="${pulse}"/>
        <polygon points="15,4 12,10 18,10" fill="${c}"/>
      </svg>
    `;
    return L.divIcon({
      html: svg,
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  },

  refreshMarkers() {
    if (!this.map) return;
    for (const id in this.markers) {
      this.markers[id].remove();
    }
    this.markers = {};

    window.STATE.vessels.forEach(vessel => {
      const pos = this.vesselPositions[vessel.id] || [vessel.lat, vessel.lng];
      const marker = L.marker(pos, { icon: this.createVesselIcon(vessel) }).addTo(this.map);

      const popupHtml = `
        <div class="popup-inner">
          <h3>${vessel.name}</h3>
          <div class="popup-row"><span class="pk">IMO</span><span class="pv">${vessel.imo}</span></div>
          <div class="popup-row"><span class="pk">Flag</span><span class="pv">${vessel.flag || 'Liberia'}</span></div>
          <div class="popup-row"><span class="pk">Cargo</span><span class="pv">${vessel.cargo}</span></div>
          <div class="popup-row"><span class="pk">Status</span><span class="pv">${vessel.status}</span></div>
          <div class="popup-row"><span class="pk">ETA</span><span class="pv">${window.fmtDate(vessel.eta)}</span></div>
          <div class="popup-row"><span class="pk">Berth</span><span class="pv">${vessel.berth}</span></div>
          <div class="popup-row"><span class="pk">Priority</span><span class="pv">${vessel.priority}</span></div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });
      this.markers[vessel.id] = marker;
    });
  },

  startShipAnimations() {
    window.STATE.vessels.forEach(vessel => {
      this.animateVessel(vessel);
    });
  },

  animateVessel(vessel) {
    if (vessel.status === 'Docked') return;
    const startPos = this.vesselPositions[vessel.id] || [vessel.lat, vessel.lng];
    const endPos = [vessel.destLat || 51.985, vessel.destLng || 4.05];
    const duration = vessel.status === 'Departing' ? 30000 : 60000 + Math.random() * 20000;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const lat = startPos[0] + (endPos[0] - startPos[0]) * ease;
      const lng = startPos[1] + (endPos[1] - startPos[1]) * ease;

      this.vesselPositions[vessel.id] = [lat, lng];
      if (this.markers[vessel.id]) {
        this.markers[vessel.id].setLatLng([lat, lng]);
      }

      if (progress < 1) {
        this.animFrames[vessel.id] = requestAnimationFrame(step);
      }
    };

    this.animFrames[vessel.id] = requestAnimationFrame(step);
  },

  center() {
    if (this.map) {
      this.map.setView([51.94, 3.8], 10);
    }
  },

  destroy() {
    for (const id in this.animFrames) {
      cancelAnimationFrame(this.animFrames[id]);
    }
    this.animFrames = {};
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = {};
    this.vesselPositions = {};
  }
};
