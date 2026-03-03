import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import MesaCliente from './pages/MesaCliente';
import AdminMesa from './pages/AdminMesa';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/mesa/:id" element={<MesaCliente />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/mesa/:id" element={<AdminMesa />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}