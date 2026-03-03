const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { db, initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `comprobante_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

initDB();

app.get('/api/mesa/:id', (req, res) => {
  const mesaId = parseInt(req.params.id);
  const mesa = db.get('mesas').find({ id: mesaId }).value();
  if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });

  const productos = db.get('productos').filter({ mesa_id: mesaId }).value();
  const pagos = db.get('pagos').filter(p => p.mesa_id === mesaId && p.estado !== 'cancelado').value();

  const productosPagados = new Set();
  const productosEnProceso = new Set();
  pagos.forEach(pago => {
    const ids = JSON.parse(pago.productos_ids);
    ids.forEach(id => {
      if (pago.estado === 'pagado') productosPagados.add(id);
      else if (pago.estado === 'pendiente') productosEnProceso.add(id);
    });
  });

  const productosConEstado = productos.map(p => ({
    ...p,
    estado: productosPagados.has(p.id) ? 'pagado'
           : productosEnProceso.has(p.id) ? 'en_proceso'
           : 'pendiente',
  }));

  const totalMesa = productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  const totalPagado = productos
    .filter(p => productosPagados.has(p.id))
    .reduce((sum, p) => sum + p.precio * p.cantidad, 0);

  res.json({
    mesa,
    productos: productosConEstado,
    resumen: {
      total: +totalMesa.toFixed(2),
      pagado: +totalPagado.toFixed(2),
      pendiente: +(totalMesa - totalPagado).toFixed(2),
    },
  });
});

app.post('/api/pago', (req, res) => {
  const { mesa_id, productos_ids, cliente_nombre } = req.body;
  if (!mesa_id || !productos_ids || productos_ids.length === 0)
    return res.status(400).json({ error: 'Datos incompletos' });

  const mesa = db.get('mesas').find({ id: mesa_id }).value();
  if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });

  const productos = db.get('productos')
    .filter(p => productos_ids.includes(p.id) && p.mesa_id === mesa_id)
    .value();
  if (productos.length === 0)
    return res.status(400).json({ error: 'Productos no válidos' });

  const IVA = 0.15;
  const subtotal = productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  const impuesto = +(subtotal * IVA).toFixed(2);
  const total = +(subtotal + impuesto).toFixed(2);
  const pagoId = uuidv4();
  const linkPago = `https://pay.qrmesa.demo/checkout/${pagoId}?amount=${total}&mesa=${mesa_id}`;

  db.get('pagos').push({
    id: pagoId,
    mesa_id,
    cliente_nombre: cliente_nombre || 'Cliente',
    productos_ids: JSON.stringify(productos_ids),
    subtotal: +subtotal.toFixed(2),
    impuesto,
    total,
    estado: 'pendiente',
    link_pago: linkPago,
    created_at: new Date().toISOString(),
  }).write();

  res.json({
    pago_id: pagoId,
    productos,
    subtotal: +subtotal.toFixed(2),
    impuesto,
    total,
    link_pago: linkPago,
    estado: 'pendiente',
  });
});

app.post('/api/comprobante', upload.single('comprobante'), (req, res) => {
  const { pago_id, mesa_id } = req.body;
  if (!pago_id || !mesa_id || !req.file)
    return res.status(400).json({ error: 'Datos incompletos' });

  const pago = db.get('pagos').find({ id: pago_id }).value();
  if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

  const comprobanteId = uuidv4();
  db.get('comprobantes').push({
    id: comprobanteId,
    pago_id,
    mesa_id: parseInt(mesa_id),
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    tamaño: req.file.size,
    estado: 'verificado',
    created_at: new Date().toISOString(),
  }).write();

  db.get('pagos').find({ id: pago_id }).assign({ estado: 'pagado' }).write();

  res.json({
    comprobante_id: comprobanteId,
    filename: req.file.filename,
    pago_estado: 'pagado',
    mensaje: '✅ Pago confirmado',
  });
});

app.patch('/api/pago/:id/estado', (req, res) => {
  const { estado } = req.body;
  if (!['pendiente', 'pagado', 'cancelado'].includes(estado))
    return res.status(400).json({ error: 'Estado inválido' });
  db.get('pagos').find({ id: req.params.id }).assign({ estado }).write();
  res.json({ mensaje: 'Estado actualizado', estado });
});

app.get('/api/admin/mesa/:id', (req, res) => {
  const mesaId = parseInt(req.params.id);
  const mesa = db.get('mesas').find({ id: mesaId }).value();
  if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });

  const productos = db.get('productos').filter({ mesa_id: mesaId }).value();
  const pagos = db.get('pagos').filter({ mesa_id: mesaId }).orderBy('created_at', 'desc').value();
  const comprobantes = db.get('comprobantes').filter({ mesa_id: mesaId }).value();

  const pagosEnriquecidos = pagos.map(pago => {
    const ids = JSON.parse(pago.productos_ids);
    const prods = db.get('productos').filter(p => ids.includes(p.id)).value();
    const comps = comprobantes.filter(c => c.pago_id === pago.id);
    return { ...pago, productos: prods, comprobantes: comps };
  });

  const totalMesa = productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
  const totalPagado = pagos.filter(p => p.estado === 'pagado').reduce((s, p) => s + p.total, 0);

  res.json({
    mesa,
    productos,
    pagos: pagosEnriquecidos,
    resumen: {
      total_mesa: +totalMesa.toFixed(2),
      total_pagado: +totalPagado.toFixed(2),
      total_pendiente: +(totalMesa - totalPagado).toFixed(2),
      porcentaje_completado: totalMesa > 0 ? +((totalPagado / totalMesa) * 100).toFixed(1) : 0,
      num_pagos: pagos.length,
      pagos_confirmados: pagos.filter(p => p.estado === 'pagado').length,
      comprobantes_total: comprobantes.length,
    },
  });
});

app.get('/api/admin/mesas', (req, res) => {
  const mesas = db.get('mesas').value();
  const result = mesas.map(mesa => {
    const productos = db.get('productos').filter({ mesa_id: mesa.id }).value();
    const pagos = db.get('pagos').filter({ mesa_id: mesa.id, estado: 'pagado' }).value();
    const totalMesa = productos.reduce((s, p) => s + p.precio, 0);
    const totalPagado = pagos.reduce((s, p) => s + p.total, 0);
    return {
      ...mesa,
      total_productos: productos.length,
      total_mesa: +totalMesa.toFixed(2),
      total_pagado: +totalPagado.toFixed(2),
      porcentaje: totalMesa > 0 ? +((totalPagado / totalMesa) * 100).toFixed(0) : 0,
    };
  });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`\n🍔 QR Mesa API corriendo en http://localhost:${PORT}\n`);
});