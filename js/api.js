/**
 * SmartPort Connect — API Service Layer
 * Communicates with PHP backend with seamless fallback to client storage
 */

const API = {
  baseUrl: 'api',

  // Check if PHP backend is available
  async request(endpoint, options = {}) {
    try {
      const res = await fetch(`${this.baseUrl}/${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        ...options
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`[API] Fallback for ${endpoint}:`, err.message);
      return null;
    }
  },

  // Auth
  async login(email, password) {
    const data = await this.request('auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return data;
  },

  async signup(name, email, role, password) {
    const data = await this.request('auth.php?action=signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, role, password })
    });
    return data;
  },

  async logout() {
    return await this.request('auth.php?action=logout');
  },

  async checkSession() {
    return await this.request('auth.php?action=check');
  },

  // Vessels
  async getVessels(search = '', status = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const data = await this.request(`vessels.php?${params.toString()}`);
    return data && data.success ? data.data : null;
  },

  async saveVessel(vesselData, id = null) {
    if (id) {
      return await this.request('vessels.php', {
        method: 'PUT',
        body: JSON.stringify({ ...vesselData, id })
      });
    } else {
      return await this.request('vessels.php', {
        method: 'POST',
        body: JSON.stringify(vesselData)
      });
    }
  },

  async deleteVessel(id) {
    return await this.request(`vessels.php?id=${id}`, {
      method: 'DELETE'
    });
  },

  // Alerts
  async getAlerts() {
    const data = await this.request('alerts.php');
    return data && data.success ? data.data : null;
  },

  async clearAlerts() {
    return await this.request('alerts.php', { method: 'DELETE' });
  },

  // Users
  async getUsers() {
    const data = await this.request('users.php');
    return data && data.success ? data.data : null;
  },

  async createUser(userData) {
    return await this.request('users.php', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async deleteUser(id) {
    return await this.request(`users.php?id=${id}`, {
      method: 'DELETE'
    });
  },

  // Schedule
  async getSchedule() {
    const data = await this.request('schedule.php');
    return data && data.success ? data : null;
  }
};
