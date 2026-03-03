const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = {
  getMesa: (id) => fetch(`${API}/api/mesa/${id}`).then(r => r.json()),
  getAdminMesa: (id) => fetch(`${API}/api/admin/mesa/${id}`).then(r => r.json()),
  getAdminMesas: () => fetch(`${API}/api/admin/mesas`).then(r => r.json()),

  crearPago: (data) => fetch(`${API}/api/pago`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json()),

  subirComprobante: (formData) => fetch(`${API}/api/comprobante`, {
    method: 'POST',
    body: formData,
  }).then(r => r.json()),

  actualizarEstadoPago: (pagoId, estado) => fetch(`${API}/api/pago/${pagoId}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  }).then(r => r.json()),
};

export function formatPrice(n) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);
}

export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff/3600)}h`;
  return date.toLocaleDateString('es-EC');
}