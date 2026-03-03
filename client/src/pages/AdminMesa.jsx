import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatPrice, timeAgo } from '../hooks/api';

export default function AdminMesa() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [actualizando, setActualizando] = useState({});

  const cargar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await api.getAdminMesa(id);
      if (!result.error) {
        setData(result);
        setLastUpdated(new Date());
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
    const interval = setInterval(() => cargar(true), 4000);
    return () => clearInterval(interval);
  }, [cargar]);

  const cambiarEstado = async (pagoId, estado) => {
    setActualizando(prev => ({ ...prev, [pagoId]: true }));
    await api.actualizarEstadoPago(pagoId, estado);
    await cargar(true);
    setActualizando(prev => ({ ...prev, [pagoId]: false }));
  };

  if (loading && !data) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--cream)'}}>
      <div className="spinner" style={{width:44,height:44}} />
    </div>
  );

  if (!data) return null;

  const { mesa, productos, pagos, resumen } = data;

  const productosPagados = new Set();
  const productosEnProceso = new Set();
  pagos.forEach(p => {
    if (p.estado === 'pagado') JSON.parse(p.productos_ids || '[]').forEach(id => productosPagados.add(id));
    else if (p.estado === 'pendiente') JSON.parse(p.productos_ids || '[]').forEach(id => productosEnProceso.add(id));
  });

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'var(--cream)'}}>

      {/* Sidebar */}
      <aside style={{width:220,background:'var(--black)',color:'white',display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh'}}>
        <div style={{padding:'24px 20px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:20,color:'white',marginBottom:6}}>🍽 QR<strong>Mesa</strong></div>
          <span style={{display:'inline-block',background:'rgba(232,160,32,0.2)',color:'var(--amber)',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600}}>Panel Admin</span>
        </div>
        <nav style={{padding:'16px 12px',flex:1}}>
          <Link to="/admin" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,color:'rgba(255,255,255,0.6)',textDecoration:'none',fontSize:14,marginBottom:4}}>
            <span>📊</span> Dashboard
          </Link>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,0.08)',color:'white',fontSize:14,marginBottom:4}}>
            <span>🪑</span> {mesa.nombre}
          </div>
          <Link to={`/mesa/${id}`} target="_blank" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,color:'rgba(255,255,255,0.6)',textDecoration:'none',fontSize:14}}>
            <span>👤</span> Vista cliente ↗
          </Link>
        </nav>
        <div style={{padding:'16px 20px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:4}}>Última actualización</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.7)',marginBottom:8}}>
            {lastUpdated ? lastUpdated.toLocaleTimeString('es-EC') : '—'}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,color:'#4ade80',fontSize:12}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#4ade80',boxShadow:'0 0 8px #4ade80',display:'inline-block'}} />
            En vivo
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,padding:'32px 28px',overflowY:'auto'}}>

        {/* Top bar */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}>
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:28,fontWeight:800,marginBottom:4}}>{mesa.nombre}</h1>
            <p style={{color:'var(--gray-400)',fontSize:14}}>Seguimiento de pagos en tiempo real</p>
          </div>
          <span style={{background:mesa.estado==='abierta'?'#e8f5ee':'#f0ece4',color:mesa.estado==='abierta'?'#1a7a4a':'#5a5248',padding:'6px 14px',borderRadius:20,fontSize:13,fontWeight:600}}>
            {mesa.estado === 'abierta' ? '🟢 Abierta' : '⚫ Cerrada'}
          </span>
        </div>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}} className="stagger">
          {[
            {label:'Total Mesa',value:formatPrice(resumen.total_mesa),icon:'💰',color:'#e8a020'},
            {label:'Pagado',value:formatPrice(resumen.total_pagado),icon:'✅',color:'#1a7a4a'},
            {label:'Pendiente',value:formatPrice(resumen.total_pendiente),icon:'⏳',color:'#c07010'},
            {label:'Completado',value:`${resumen.porcentaje_completado}%`,icon:'📈',color:'#0a0a0a'},
          ].map(kpi => (
            <div key={kpi.label} style={{background:'white',borderRadius:'var(--radius)',padding:18,boxShadow:'var(--shadow)',borderTop:`3px solid ${kpi.color}`}}>
              <div style={{fontSize:24,marginBottom:8}}>{kpi.icon}</div>
              <div style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,color:kpi.color,marginBottom:4}}>{kpi.value}</div>
              <div style={{fontSize:13,color:'var(--gray-400)'}}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Barra de progreso */}
        <div style={{background:'white',borderRadius:'var(--radius)',padding:'16px 20px',marginBottom:16,boxShadow:'var(--shadow)'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontWeight:700,fontFamily:'var(--font-display)'}}>Progreso de liquidación</span>
            <span style={{fontWeight:700,color:'var(--amber-dark)'}}>{resumen.porcentaje_completado}%</span>
          </div>
          <div style={{height:8,background:'var(--gray-100)',borderRadius:4,overflow:'hidden',marginBottom:8}}>
            <div style={{height:'100%',width:`${resumen.porcentaje_completado}%`,background:'linear-gradient(90deg, var(--amber), var(--amber-dark))',borderRadius:4,transition:'width 0.8s ease'}} />
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--gray-400)'}}>
            <span>{resumen.pagos_confirmados} pago{resumen.pagos_confirmados!==1?'s':''} confirmado{resumen.pagos_confirmados!==1?'s':''}</span>
            <span>{resumen.comprobantes_total} comprobante{resumen.comprobantes_total!==1?'s':''}</span>
          </div>
        </div>

        {/* Grid productos + pagos */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

          {/* Productos */}
          <div style={{background:'white',borderRadius:'var(--radius)',padding:20,boxShadow:'var(--shadow)'}}>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,marginBottom:16}}>📋 Productos de la mesa</h2>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'2px solid var(--gray-100)'}}>
                  <th style={{padding:'8px 0',fontSize:12,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:600,textAlign:'left'}}>Producto</th>
                  <th style={{padding:'8px 0',fontSize:12,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:600,textAlign:'right'}}>Precio</th>
                  <th style={{padding:'8px 0',fontSize:12,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:600,textAlign:'center'}}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => {
                  const estado = productosPagados.has(p.id) ? 'pagado' : productosEnProceso.has(p.id) ? 'en_proceso' : 'pendiente';
                  const cfg = {pagado:{bg:'#e8f5ee',color:'#1a7a4a',label:'✓ Pagado'},en_proceso:{bg:'#fff8e6',color:'#c07010',label:'⏳ Proceso'},pendiente:{bg:'#f0ece4',color:'#5a5248',label:'• Pendiente'}}[estado];
                  return (
                    <tr key={p.id} style={{borderBottom:'1px solid var(--gray-100)'}}>
                      <td style={{padding:'10px 0',fontSize:14}}>{p.nombre}</td>
                      <td style={{padding:'10px 0',fontSize:14,textAlign:'right',fontFamily:'var(--font-display)',fontWeight:700}}>{formatPrice(p.precio)}</td>
                      <td style={{padding:'10px 0',textAlign:'center'}}>
                        <span style={{background:cfg.bg,color:cfg.color,padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagos */}
          <div style={{background:'white',borderRadius:'var(--radius)',padding:20,boxShadow:'var(--shadow)'}}>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,marginBottom:16}}>💳 Pagos registrados</h2>
            {pagos.length === 0 ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,padding:32,color:'var(--gray-400)',fontSize:14}}>
                <span style={{fontSize:40}}>💳</span><p>Sin pagos aún</p>
              </div>
            ) : pagos.map(pago => {
              const color = {pagado:'#1a7a4a',pendiente:'#c07010',cancelado:'#c0392b'}[pago.estado]||'#5a5248';
              return (
                <div key={pago.id} style={{border:'1.5px solid var(--gray-100)',borderRadius:'var(--radius-sm)',padding:14,marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:16,fontFamily:'var(--font-display)'}}>{formatPrice(pago.total)}</div>
                      <div style={{fontSize:12,color:'var(--gray-400)',marginTop:2}}>{pago.cliente_nombre} · {timeAgo(pago.created_at)}</div>
                    </div>
                    <span style={{background:`${color}15`,color,padding:'4px 10px',borderRadius:20,fontSize:12,fontWeight:700}}>{pago.estado}</span>
                  </div>
                  <div style={{fontSize:13,color:'var(--gray-600)',marginBottom:10}}>{pago.productos?.map(p=>p.nombre).join(', ')}</div>
                  <div style={{display:'flex',gap:6}}>
                    {pago.estado !== 'pagado' && (
                      <button style={{padding:'6px 14px',borderRadius:8,background:'#e8f5ee',color:'#1a7a4a',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}} onClick={() => cambiarEstado(pago.id,'pagado')} disabled={actualizando[pago.id]}>
                        {actualizando[pago.id] ? '...' : '✓ Confirmar'}
                      </button>
                    )}
                    {pago.estado !== 'cancelado' && pago.estado !== 'pagado' && (
                      <button style={{padding:'6px 14px',borderRadius:8,background:'#fdf0ef',color:'#c0392b',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}} onClick={() => cambiarEstado(pago.id,'cancelado')} disabled={actualizando[pago.id]}>
                        ✕ Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comprobantes */}
        <div style={{background:'white',borderRadius:'var(--radius)',padding:20,boxShadow:'var(--shadow)',marginTop:16}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,marginBottom:16}}>📎 Comprobantes subidos</h2>
          {pagos.every(p => !p.comprobantes?.length) ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:32,color:'var(--gray-400)',fontSize:14}}>
              <span style={{fontSize:40}}>📭</span><p>No hay comprobantes aún</p>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
              {pagos.flatMap(p => (p.comprobantes||[]).map(c => (
                <div key={c.id} style={{background:'var(--cream)',borderRadius:'var(--radius-sm)',padding:14,border:'1.5px solid var(--gray-200)'}}>
                  <div style={{fontSize:32,marginBottom:8}}>{c.mimetype?.includes('pdf')?'📄':'🖼️'}</div>
                  <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{c.filename}</div>
                  <div style={{fontSize:12,color:'var(--gray-400)',marginBottom:8}}>{p.cliente_nombre} · {timeAgo(c.created_at)}</div>
                  <span style={{background:c.estado==='verificado'?'#e8f5ee':'#fff8e6',color:c.estado==='verificado'?'#1a7a4a':'#c07010',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600}}>
                    {c.estado === 'verificado' ? '✓ Verificado' : '⏳ Pendiente'}
                  </span>
                </div>
              )))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}