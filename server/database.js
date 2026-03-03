const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const adapter = new FileSync(path.join(dbDir, 'qrmesa.json'));
const db = low(adapter);

function initDB() {
  db.defaults({ mesas: [], productos: [], pagos: [], comprobantes: [] }).write();

  const mesaExists = db.get('mesas').find({ id: 12 }).value();
  if (!mesaExists) {
    db.get('mesas').push({ id: 12, nombre: 'Mesa 12', estado: 'abierta', created_at: new Date().toISOString() }).write();

    const productos = [
      { nombre: 'Lomo BBQ', precio: 12.99 },
      { nombre: 'Coca Cola', precio: 2.50 },
      { nombre: 'Hamburguesa Clásica', precio: 10.99 },
      { nombre: 'Papas Fritas', precio: 3.99 },
      { nombre: 'Limonada Natural', precio: 2.75 },
      { nombre: 'Costillas BBQ', precio: 15.99 },
    ];
    productos.forEach((p, i) => {
      db.get('productos').push({ id: i + 1, mesa_id: 12, nombre: p.nombre, precio: p.precio, cantidad: 1 }).write();
    });
    console.log('✅ Datos demo Mesa 12 cargados');
  }

  const mesasExtra = [
    { id: 5, nombre: 'Mesa 5' },
    { id: 8, nombre: 'Mesa 8' },
    { id: 15, nombre: 'Mesa 15' },
  ];
  let nextId = db.get('productos').size().value() + 1;
  mesasExtra.forEach(({ id, nombre }) => {
    const exists = db.get('mesas').find({ id }).value();
    if (!exists) {
      db.get('mesas').push({ id, nombre, estado: 'abierta', created_at: new Date().toISOString() }).write();
      [
        { nombre: 'Pollo a la Plancha', precio: 9.99 },
        { nombre: 'Agua Sin Gas', precio: 1.50 },
        { nombre: 'Brownie con Helado', precio: 5.99 },
      ].forEach(p => {
        db.get('productos').push({ id: nextId++, mesa_id: id, nombre: p.nombre, precio: p.precio, cantidad: 1 }).write();
      });
    }
  });

  console.log('✅ Base de datos lista');
}

module.exports = { db, initDB };