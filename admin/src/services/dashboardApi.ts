import api from './api';

// ─── Analytics ──────────────────────────────────────────────────────────────
export async function fetchAnalyticsOverview() {
  const res = await api.get('/api/v1/admin/analytics/overview');
  return res.data.data;
}

// ─── Finance ────────────────────────────────────────────────────────────────
export async function fetchFinanceSummary() {
  const res = await api.get('/api/v1/admin/finance/summary');
  return res.data.data;
}

export async function fetchTransactions(params?: {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const res = await api.get('/api/v1/admin/finance/transactions', { params });
  return res.data.data;
}

// ─── Orders ─────────────────────────────────────────────────────────────────
export async function fetchAllOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}) {
  const res = await api.get('/api/v1/admin/orders', { params });
  return res.data.data;
}

export async function fetchOrderById(id: string) {
  const res = await api.get(`/api/v1/admin/orders/${id}`);
  return res.data.data;
}

export async function forceCancelOrder(id: string, reason: string) {
  const res = await api.patch(`/api/v1/admin/orders/${id}/cancel`, { reason });
  return res.data.data;
}

// ─── Users ──────────────────────────────────────────────────────────────────
export async function fetchAllUsers(params?: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}) {
  const res = await api.get('/api/v1/admin/users', { params });
  return res.data.data;
}

export async function fetchUserStats() {
  const res = await api.get('/api/v1/admin/users/stats');
  return res.data.data;
}

// ─── Delivery Partners ─────────────────────────────────────────────────────
export async function fetchDeliveryPartners(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const res = await api.get('/api/v1/admin/delivery-partners', { params });
  return res.data.data;
}

export async function fetchDeliveryStats() {
  const res = await api.get('/api/v1/admin/delivery-partners/stats');
  return res.data.data;
}

// ─── Stores ─────────────────────────────────────────────────────────────────
export async function fetchStorePerformance(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  const res = await api.get('/api/v1/admin/stores/performance', { params });
  return res.data.data;
}

export async function fetchStoreDetail(storeId: string) {
  const res = await api.get(`/api/v1/admin/stores/${storeId}/detail`);
  return res.data.data;
}
