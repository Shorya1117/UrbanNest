import api from "./axios";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  adminLogin: (data) => api.post("/auth/admin/login", data),
  superAdminLogin: (data) => api.post("/auth/superadmin/login", data),
  sendOTP: (email) => api.post("/auth/otp/send", { email }),
  verifyOTP: (email, otp) => api.post("/auth/otp/verify", { email, otp }),
  changePassword: (data) => api.put("/auth/change-password", data),
  getMe: () => api.get("/auth/me"),
};

// ─── Societies ────────────────────────────────────────────────────────────────
export const societyAPI = {
  getAll: () => api.get("/societies"),
  getOne: (id) => api.get(`/societies/${id}`),
  create: (data) => api.post("/societies", data),
  update: (id, data) => api.put(`/societies/${id}`, data),
  assignAdmin: (id, data) => api.post(`/societies/${id}/assign-admin`, data),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const userAPI = {
  getAll: (params) => api.get("/users", { params }),
  getOne: (id) => api.get(`/users/${id}`),
  add: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
  getPending: () => api.get("/users/pending"),
  uploadAvatar: (id, formData) =>
    api.put(`/users/${id}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ─── Flats ────────────────────────────────────────────────────────────────────
export const flatAPI = {
  getAll: () => api.get("/flats"),
  getOne: (id) => api.get(`/flats/${id}`),
  create: (data) => api.post("/flats", data),
  update: (id, data) => api.put(`/flats/${id}`, data),
  remove: (id) => api.delete(`/flats/${id}`),
};

// ─── Listings ─────────────────────────────────────────────────────────────────
export const listingAPI = {
  getAll: (params) => api.get("/listings", { params }),
  getMy: () => api.get("/listings/my"),
  getOne: (id) => api.get(`/listings/${id}`),
  create: (formData) =>
    api.post("/listings", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) => api.put(`/listings/${id}`, data),
  markSold: (id, buyerId) => api.patch(`/listings/${id}/sold`, { buyerId }),
  remove: (id) => api.delete(`/listings/${id}`),
};

// ─── Complaints ───────────────────────────────────────────────────────────────
export const complaintAPI = {
  getAll: (params) => api.get("/complaints", { params }),
  getOne: (id) => api.get(`/complaints/${id}`),
  getStats: () => api.get("/complaints/stats"),
  create: (formData) =>
    api.post("/complaints", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateStatus: (id, data) => api.patch(`/complaints/${id}/status`, data),
  remove: (id) => api.delete(`/complaints/${id}`),
};

// ─── Services ─────────────────────────────────────────────────────────────────
export const serviceAPI = {
  getAll: (params) => api.get("/services", { params }),
  getOne: (id) => api.get(`/services/${id}`),
  getTypes: () => api.get("/services/types"),
  add: (formData) =>
    api.post("/services", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, formData) =>
    api.put(`/services/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id) => api.delete(`/services/${id}`),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewAPI = {
  getAll: (params) => api.get("/reviews", { params }),
  add: (data) => api.post("/reviews", data),
  remove: (id) => api.delete(`/reviews/${id}`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  getHistory: (params) => api.get("/notifications/history", { params }), // Admin: broadcast history
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
  broadcast: (data) => api.post("/notifications/broadcast", data),
  sendToUser: (data) => api.post("/notifications/send-to-user", data),
  remove: (id) => api.delete(`/notifications/${id}`),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoryAPI = {
  getAll: (params) => api.get("/categories", { params }),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

// ─── Excel Import ─────────────────────────────────────────────────────────────
export const excelAPI = {
  downloadTemplate: () => api.get("/excel/template", { responseType: "blob" }),
  preview: (formData) =>
    api.post("/excel/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  import: (formData) =>
    api.post("/excel/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
