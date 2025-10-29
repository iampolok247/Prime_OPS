// Adding notes parameter to updateLeadStatus
// web/src/lib/api.js
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

async function handleJson(res, defaultMsg) {
  if (!res.ok) {
    let errBody = {};
    try { errBody = await res.json(); } catch (_) {}
    const msg = errBody?.message || errBody?.code || `${defaultMsg} (${res.status})`;
    throw new Error(msg);
  }
  let data = {};
  try { data = await res.json(); } catch (_) {}
  return data;
}

// ---------- (Optional) shared formatters you may use in UI ----------
export function fmtBDT(n) {
  try {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(n || 0);
  } catch {
    return `৳${Number(n || 0).toLocaleString('bn-BD')}`;
  }
}

// English formatted BDT (use Latin digits)
export function fmtBDTEn(n) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(n || 0);
  } catch {
    return `৳${Number(n || 0).toLocaleString('en-US')}`;
  }
}

export function fmtDate(d) {
  const dt = d ? new Date(d) : new Date();
  const DD = String(dt.getDate()).padStart(2, '0');
  const MM = String(dt.getMonth() + 1).padStart(2, '0');
  const YYYY = dt.getFullYear();
  return `${DD}.${MM}.${YYYY}`;
}

export const api = {
  // ---- small helpers ----
  _normalizeDate(d) {
    if (!d) return '';
    // already ISO YYYY-MM-DD?
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
    // handle DD/MM/YYYY (used in UI)
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    // last resort
    const dt = new Date(d);
    if (!isNaN(dt)) {
      const DD = String(dt.getDate()).padStart(2, '0');
      const MM = String(dt.getMonth() + 1).padStart(2, '0');
      const YYYY = dt.getFullYear();
      return `${YYYY}-${MM}-${DD}`;
    }
    return d;
  },

  // ---- Auth ----
  async login(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleJson(res, 'Login failed');
    if (!data || typeof data !== 'object') throw new Error('Invalid login response');
    return data;
  },
  async me() {
    const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
    const data = await handleJson(res, 'Auth check failed');
    if (!data || typeof data !== 'object') throw new Error('Invalid /me response');
    return data;
  },
  async logout() {
    const res = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST', credentials: 'include'
    });
    return handleJson(res, 'Logout failed');
  },
  async updateMe(payload) {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await handleJson(res, 'Update failed');
    if (!data || typeof data !== 'object') throw new Error('Invalid update response');
    return data;
  },

  // ---- Users ----
  async listUsers() {
    const res = await fetch(`${API_BASE}/api/users`, { credentials: 'include' });
    return handleJson(res, 'Load users failed');
  },
  async listUsersPublic() {
    // lightweight list for dropdowns; backend returns { users }
    const res = await fetch(`${API_BASE}/api/users/list`, { credentials: 'include' });
    return handleJson(res, 'Load public users failed');
  },
  async listAdmissionUsers() {
    const res = await fetch(`${API_BASE}/api/users/admission`, { credentials: 'include' });
    return handleJson(res, 'Load admission users failed');
  },
  async createUser(payload) {
    const res = await fetch(`${API_BASE}/api/users`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Create user failed');
  },
  async updateUser(id, payload) {
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Update user failed');
  },
  async deleteUser(id) {
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      method: 'DELETE', credentials: 'include'
    });
    return handleJson(res, 'Delete user failed');
  },

  // ---- Tasks ----
  async listAllTasks(status) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/api/tasks${q}`, { credentials: 'include' });
    return handleJson(res, 'Load tasks failed');
  },
  async listMyTasks(status) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/api/tasks/my${q}`, { credentials: 'include' });
    return handleJson(res, 'Load my tasks failed');
  },
  async assignTask(payload) {
    const res = await fetch(`${API_BASE}/api/tasks/assign`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Assign task failed');
  },
  async addSelfTask(payload) {
    const res = await fetch(`${API_BASE}/api/tasks/self`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Add self task failed');
  },
  async updateTaskStatus(id, status) {
    const res = await fetch(`${API_BASE}/api/tasks/${id}/status`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return handleJson(res, 'Update task status failed');
  },

  // ---- Courses ----
  async listCourses() {
    const res = await fetch(`${API_BASE}/api/courses`, { credentials: 'include' });
    return handleJson(res, 'Load courses failed');
  },
  async createCourse(payload) {
    const res = await fetch(`${API_BASE}/api/courses`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Create course failed');
  },
  async updateCourse(id, payload) {
    const res = await fetch(`${API_BASE}/api/courses/${id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Update course failed');
  },
  async deleteCourse(id) {
    const res = await fetch(`${API_BASE}/api/courses/${id}`, {
      method: 'DELETE', credentials: 'include'
    });
    return handleJson(res, 'Delete course failed');
  },

  // ---- Leads (DM & SA/Admin view) ----
  async listLeads(status) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/api/leads${q}`, { credentials: 'include' });
    return handleJson(res, 'Load leads failed');
  },
  async assignLead(id, assignedTo) {
    const res = await fetch(`${API_BASE}/api/leads/${id}/assign`, {
      method: 'POST', // must be POST to match backend
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedTo })
    });
    return handleJson(res, 'Assign lead failed');
  },
  async createLead(payload) {
    const res = await fetch(`${API_BASE}/api/leads`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Create lead failed');
  },
  async bulkUploadLeads(csvText) {
    const res = await fetch(`${API_BASE}/api/leads/bulk`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: csvText })
    });
    return handleJson(res, 'Bulk upload failed');
  },

  // ---- Admission pipeline ----
  async listAdmissionLeads(status) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/api/admission/leads${q}`, { credentials: 'include' });
    return handleJson(res, 'Load admission leads failed');
  },
  async updateLeadStatus(id, status, notes) {
    const body = { status };
    if (notes !== undefined && notes !== null) body.notes = notes;
    const res = await fetch(`${API_BASE}/api/admission/leads/${id}/status`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleJson(res, 'Update lead status failed');
  },

  // ---- Admission fees ----
  async listAdmissionFees() {
    const res = await fetch(`${API_BASE}/api/admission/fees`, { credentials: 'include' });
    return handleJson(res, 'Load fees failed');
  },
  async createAdmissionFee(payload) {
    const res = await fetch(`${API_BASE}/api/admission/fees`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Create fee failed');
  },

  // ---- Accounting (Accountant/Admin/SA) ----
  async listFeesForApproval(status) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/api/accounting/fees${q}`, { credentials: 'include' });
    return handleJson(res, 'Load fees failed');
  },
  async approveFee(id) {
    const res = await fetch(`${API_BASE}/api/accounting/fees/${id}/approve`, {
      method: 'PATCH', credentials: 'include'
    });
    return handleJson(res, 'Approve failed');
  },
  async rejectFee(id) {
    const res = await fetch(`${API_BASE}/api/accounting/fees/${id}/reject`, {
      method: 'PATCH', credentials: 'include'
    });
    return handleJson(res, 'Reject failed');
  },

  async listIncome() {
    const res = await fetch(`${API_BASE}/api/accounting/income`, { credentials: 'include' });
    return handleJson(res, 'Load income failed');
  },
  async addIncome(payload) {
    const res = await fetch(`${API_BASE}/api/accounting/income`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Add income failed');
  },

  async listExpenses() {
    const res = await fetch(`${API_BASE}/api/accounting/expense`, { credentials: 'include' });
    return handleJson(res, 'Load expenses failed');
  },
  async addExpense(payload) {
    const res = await fetch(`${API_BASE}/api/accounting/expense`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Add expense failed');
  },
  async deleteExpense(id) {
    const res = await fetch(`${API_BASE}/api/accounting/expense/${id}`, {
      method: 'DELETE', credentials: 'include'
    });
    return handleJson(res, 'Delete expense failed');
  },

  async accountingSummary(from, to) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/accounting/summary${q}`, { credentials: 'include' });
    return handleJson(res, 'Load summary failed');
  },

  // =========================================================
  // ================== Recruitment (Updated) ================
  // =========================================================

  // ---- Dashboard Stats ----
  async getRecruitmentStats() {
    const res = await fetch(`${API_BASE}/api/recruitment/stats`, { credentials: 'include' });
    return handleJson(res, 'Load recruitment stats failed');
  },
  // keep old name as alias to avoid breaking existing imports
  async getRecruitmentSummary() { return this.getRecruitmentStats(); },

  // ---- Employers CRUD ----
  async listEmployers() {
    const res = await fetch(`${API_BASE}/api/recruitment/employers`, { credentials: 'include' });
    return handleJson(res, 'Load employers failed');
  },
  async createEmployer(payload) {
    const res = await fetch(`${API_BASE}/api/recruitment/employers`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Create employer failed');
  },
  async updateEmployer(id, payload) {
    const res = await fetch(`${API_BASE}/api/recruitment/employers/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Update employer failed');
  },
  async deleteEmployer(id) {
    const res = await fetch(`${API_BASE}/api/recruitment/employers/${id}`, {
      method: 'DELETE', credentials: 'include'
    });
    return handleJson(res, 'Delete employer failed');
  },

  // ---- Job Positions CRUD ----
  async listJobs() {
    const res = await fetch(`${API_BASE}/api/recruitment/jobs`, { credentials: 'include' });
    return handleJson(res, 'Load jobs failed');
  },
  async createJob(payload) {
    const res = await fetch(`${API_BASE}/api/recruitment/jobs`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Create job failed');
  },
  async updateJob(id, payload) {
    const res = await fetch(`${API_BASE}/api/recruitment/jobs/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Update job failed');
  },
  async deleteJob(id) {
    const res = await fetch(`${API_BASE}/api/recruitment/jobs/${id}`, {
      method: 'DELETE', credentials: 'include'
    });
    return handleJson(res, 'Delete job failed');
  },

  // ---- Candidates CRUD + Recruit Action ----
  async listCandidates(status) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/api/recruitment/candidates${q}`, { credentials: 'include' });
    return handleJson(res, 'Load candidates failed');
  },
  async createCandidate(payload) {
    const res = await fetch(`${API_BASE}/api/recruitment/candidates`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Create candidate failed');
  },
  async updateCandidate(id, payload) {
    const res = await fetch(`${API_BASE}/api/recruitment/candidates/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleJson(res, 'Update candidate failed');
  },
  async deleteCandidate(id) {
    const res = await fetch(`${API_BASE}/api/recruitment/candidates/${id}`, {
      method: 'DELETE', credentials: 'include'
    });
    return handleJson(res, 'Delete candidate failed');
  },
  async recruitCandidate(id, payload) {
    const res = await fetch(`${API_BASE}/api/recruitment/candidates/${id}/recruit`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) // { employerId, jobId, date }
    });
    return handleJson(res, 'Recruit candidate failed');
  },

  // ---- Recruited List (alias via status filter) ----
  async listRecruited() { return this.listCandidates('recruited'); },

  // ---- Recruitment Income ----
  async listRecIncome() {
    const res = await fetch(`${API_BASE}/api/recruitment/income`, { credentials: 'include' });
    return handleJson(res, 'Load recruitment income failed');
  },
  async addRecIncome(payload) {
    const body = { ...payload, date: this._normalizeDate(payload?.date) };
    const res = await fetch(`${API_BASE}/api/recruitment/income`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleJson(res, 'Add recruitment income failed');
  },
  async deleteRecIncome(id) {
    const res = await fetch(`${API_BASE}/api/recruitment/income/${id}`, {
      method: 'DELETE', credentials: 'include'
    });
    return handleJson(res, 'Delete recruitment income failed');
  },
  async updateRecIncome() {
    throw new Error('updateRecIncome is not supported by the backend (use add/delete).');
  },

  // ---- Recruitment Expenses ----
  async listRecExpense() {
    const res = await fetch(`${API_BASE}/api/recruitment/expenses`, { credentials: 'include' });
    return handleJson(res, 'Load recruitment expenses failed');
  },
  async addRecExpense(payload) {
    const body = { ...payload, date: this._normalizeDate(payload?.date) };
    const res = await fetch(`${API_BASE}/api/recruitment/expenses`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleJson(res, 'Add recruitment expense failed');
  },
  async deleteRecExpense(id) {
    const res = await fetch(`${API_BASE}/api/recruitment/expenses/${id}`, {
      method: 'DELETE', credentials: 'include'
    });
    return handleJson(res, 'Delete recruitment expense failed');
  },
  async updateRecExpense() {
    throw new Error('updateRecExpense is not supported by the backend (use add/delete).');
  },

  // =========================================================
  // ================== Digital Marketing (FIX) ==============
  // =========================================================
  // DMExpense, SocialMetrics, SEOWork

  // ---- DM Costs / Expense ----
  async listDMCosts(date, channel) {
    const params = new URLSearchParams();
    if (date) params.set('date', this._normalizeDate(date));
    if (channel) params.set('channel', channel);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/dm/expense${q}`, { credentials: 'include' });
    return handleJson(res, 'Load DM costs failed');
  },
  async addDMCost(payload) {
    const body = { ...payload, date: this._normalizeDate(payload?.date) };
    const res = await fetch(`${API_BASE}/api/dm/expense`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body) // { date, channel, purpose, amount }
    });
    return handleJson(res, 'Add DM cost failed');
  },
  async deleteDMCost(id) {
    const res = await fetch(`${API_BASE}/api/dm/expense/${id}`, {
      method: 'DELETE', credentials: 'include'
    });
    return handleJson(res, 'Delete DM cost failed');
  },

  // ---- Social Media Metrics ----
  // Try /api/dm/social; if 404, retry /api/dm/social-metrics
  async listSocial(date) {
    const q = date ? `?date=${encodeURIComponent(this._normalizeDate(date))}` : '';
    let res = await fetch(`${API_BASE}/api/dm/social${q}`, { credentials: 'include' });
    if (!res.ok && res.status === 404) {
      res = await fetch(`${API_BASE}/api/dm/social-metrics${q}`, { credentials: 'include' });
    }
    return handleJson(res, 'Load social metrics failed');
  },
  async addSocial(payload) {
    // Server expects a payload like { metrics: { ... } } and currently exposes a PUT /api/dm/social
    const bodyMetrics = { ...payload };
    // frontend form includes a date field but server stores metrics object; remove date from metrics
    if (bodyMetrics.date) delete bodyMetrics.date;
    const body = { metrics: bodyMetrics };

    let res = await fetch(`${API_BASE}/api/dm/social`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok && res.status === 404) {
      // fallback if older route exists
      res = await fetch(`${API_BASE}/api/dm/social-metrics`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }
    return handleJson(res, 'Add social metrics failed');
  },
  async deleteSocial(id) {
    let res = await fetch(`${API_BASE}/api/dm/social/${id}`, {
      method: 'DELETE', credentials: 'include'
    });
    if (!res.ok && res.status === 404) {
      res = await fetch(`${API_BASE}/api/dm/social-metrics/${id}`, {
        method: 'DELETE', credentials: 'include'
      });
    }
    return handleJson(res, 'Delete social metrics failed');
  },

  // ---- SEO Work Reports ----
  async listSEO(date) {
    const q = date ? `?date=${encodeURIComponent(this._normalizeDate(date))}` : '';
    const res = await fetch(`${API_BASE}/api/dm/seo${q}`, { credentials: 'include' });
    return handleJson(res, 'Load SEO reports failed');
  },
  async createSEO(payload) {
    const body = { ...payload, date: this._normalizeDate(payload?.date) };
    const res = await fetch(`${API_BASE}/api/dm/seo`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleJson(res, 'Create SEO report failed');
  },
  async deleteSEO(id) {
    const res = await fetch(`${API_BASE}/api/dm/seo/${id}`, {
      method: 'DELETE', credentials: 'include'
    });
    return handleJson(res, 'Delete SEO report failed');
  },

  // ===== Aliases for backward compatibility =====
  // Employers
  async addEmployer(payload) { return this.createEmployer(payload); },
  async editEmployer(id, payload) { return this.updateEmployer(id, payload); },
  async removeEmployer(id) { return this.deleteEmployer(id); },
  // Jobs
  async addJob(payload) { return this.createJob(payload); },
  async editJob(id, payload) { return this.updateJob(id, payload); },
  async removeJob(id) { return this.deleteJob(id); },
  // Candidates
  async addCandidate(payload) { return this.createCandidate(payload); },
  async editCandidate(id, payload) { return this.updateCandidate(id, payload); },
  async removeCandidate(id) { return this.deleteCandidate(id); },
  // Recruitment Income/Expense
  async removeRecIncome(id) { return this.deleteRecIncome(id); },
  async removeRecExpense(id) { return this.deleteRecExpense(id); },
  // DM aliases (so your UI calls keep working)
  async createDMCost(payload) { return this.addDMCost(payload); },
  async createSocial(payload) { return this.addSocial(payload); },
  async updateSocial(payload) { return this.addSocial(payload); },

// ================== Motion Graphics ==================
async mgStats() {
  const res = await fetch(`${API_BASE}/api/mg/stats`, { credentials: 'include' });
  return handleJson(res, 'Load MG stats failed');
},
async listMGWorks(params = {}) {
  const u = new URLSearchParams();
  if (params.date) u.set('date', params.date);      // expect YYYY-MM-DD; UI helper will convert
  if (params.status) u.set('status', params.status);
  const q = u.toString() ? `?${u.toString()}` : '';
  const res = await fetch(`${API_BASE}/api/mg/works${q}`, { credentials: 'include' });
  return handleJson(res, 'Load MG works failed');
},
async createMGWork(payload) {
  const res = await fetch(`${API_BASE}/api/mg/works`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(res, 'Create MG work failed');
},
async updateMGWork(id, payload) {
  const res = await fetch(`${API_BASE}/api/mg/works/${id}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(res, 'Update MG work failed');
},
async deleteMGWork(id) {
  const res = await fetch(`${API_BASE}/api/mg/works/${id}`, {
    method: 'DELETE', credentials: 'include'
  });
  return handleJson(res, 'Delete MG work failed');
},

// ---- Consolidated Reports (Phase 8) ----
async reportsOverview(from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const q = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/api/reports/overview${q}`, { credentials: 'include' });
  return handleJson(res, 'Load consolidated report failed');
},

};
