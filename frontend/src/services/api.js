const BASE_URL = process.env.REACT_APP_API_URL ;

const getToken = () => localStorage.getItem('token');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// Auth
export const signup = (body) =>
  fetch(`${BASE_URL}/auth/signup`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleResponse);

export const login = (body) =>
  fetch(`${BASE_URL}/auth/login`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleResponse);

// Dashboard
export const getDashboard = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/dashboard${qs ? `?${qs}` : ''}`, { headers: headers() }).then(handleResponse);
};

// Transactions
export const getTransactions = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/transactions${qs ? `?${qs}` : ''}`, { headers: headers() }).then(handleResponse);
};

export const getTransaction = (id) =>
  fetch(`${BASE_URL}/transactions/${id}`, { headers: headers() }).then(handleResponse);

export const createTransaction = (body) =>
  fetch(`${BASE_URL}/transactions`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleResponse);

export const updateTransaction = (id, body) =>
  fetch(`${BASE_URL}/transactions/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(handleResponse);

export const deleteTransaction = (id) =>
  fetch(`${BASE_URL}/transactions/${id}`, { method: 'DELETE', headers: headers() }).then(handleResponse);

// Analytics
export const getAnalytics = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/analytics${qs ? `?${qs}` : ''}`, { headers: headers() }).then(handleResponse);
};

// Upload CSV
export const uploadCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  }).then(handleResponse);
};

export const downloadCSVTemplate = () => {
  window.open(`${BASE_URL}/upload/template`, '_blank');
};

// Export transactions as CSV
export const exportTransactionsCSV = async (params = {}) => {
  const qs = new URLSearchParams({ ...params, limit: 10000 }).toString();
  const data = await fetch(`${BASE_URL}/transactions?${qs}`, { headers: headers() }).then(handleResponse);
  const rows = data.transactions;
  if (!rows.length) return;

  const cols = ['date', 'amount', 'type', 'category', 'subcategory', 'payment_method', 'source', 'description'];
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${(r[c] || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'transactions.csv'; a.click();
  URL.revokeObjectURL(url);
};
