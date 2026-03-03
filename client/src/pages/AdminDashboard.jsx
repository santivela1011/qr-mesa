import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice } from '../hooks/api';

export default function AdminDashboard() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const result = await api.getAdminMesas();
        setMesas(Array.isArray(result) ? result : []);
      } finally {
        setLoading(false);
      }
    };
    cargar();
    const interval = setInterval(cargar, 6000);
    return () => clearInterval(interval);
  }, []);

  const totalGeneral = mesas.reduce((s, m) => s + (m.total_mesa || 0), 0);
  const totalPagado = mesas.reduce((s, m) => s + (m.total_pagado || 0), 0);

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'var(--cream)'}}>

      {/* Sidebar */}
      <aside style={{width:220,background:'var(--black)',color:'white',display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh'}}>
        <div style={{padding:'24px 20px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:20,color:'white',marginBottom:6}}>🍽 QR<strong>Mesa</strong></div>
          <span style={{display:'inline-block',background:'rgba(232,160,32,0.2)',color:'var(--amber)',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600}}>Panel Admin</span>
        </div>
        <nav style={{padding:'16px 12px',flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,0.08)',color:'white',fontSize:14}}>
            📊 Dashboard
          </div>
        </nav>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'16px 20px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:'#4ade80',boxShadow:'0 0 8px #4ade80',display:'inline-block'}} />
          <span style={{fontSize:12,color:'#4ade80'}}>Actualización en vivo</span>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,padding:'32px'}}>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:32,fontWeight:800,marginBottom:4}}>Dashboard General</h1>
        <p style={{color:'var(--gray-400)',fontSize:14,marginBottom:32,textTransform:'capitalize'}}>
          {new Date().toLocaleDateString('es-EC', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </p>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:32}} className="stagger">
          {[
            {icon:'🪑',value:mesas.length,label:'Mesas activas',color:'var(--black)'},
            {icon:'💰',value:formatPrice(totalGeneral),label:'Total en mesa',color:'var(--amber-dark)'},
            {icon:'✅',value:formatPrice(totalPagado),label:'Total cobrado',color:'var(--green)'},
            {icon:'⏳',value:formatPrice(totalGeneral-totalPagado),label:'Por cobrar',color:'#c07010'},
          ].map((kpi,i) => (
            <div key={i} style={{background:'white',borderRadius:'var(--radius)',padding:20,boxShadow:'var(--shadow)'}}>
              <div style={{fontSize:28,marginBottom:8}}>{kpi.icon}</div>
              <div style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,color:kpi.color,marginBottom:4}}>{kpi.value}</div>
              <div style={{fontSize:13,color:'var(--gray-400)'}}>{kpi.label}</div>
            </div>
          ))}
        </div>

        <h2 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,marginBottom:16}}>Mesas activas</h2>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:48}}>
            <div className="spinner" style={{width:40,height:40}} />
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}} className="stagger">
            {mesas.map(mesa => {
              const pct = mesa.porcentaje || 0;
              const color = pct===100?'#1a7a4a':pct>50?'#e8a020':'#0a0a0a';
              return (
                <div key={mesa.id} style={{background:'white',borderRadius:'var(--radius)',padding:20,boxShadow:'var(--shadow)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                    <div>
                      <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,marginBottom:3}}>{mesa.nombre}</div>
                      <div style={{fontSize:13,color:'var(--gray-400)'}}>{mesa.total_productos} productos</div>
                    </div>
                    <div style={{padding:'6px 12px',borderRadius:20,fontSize:15,fontWeight:800,fontFamily:'var(--font-display)',background:`${color}18`,color}}>
                      {pct}%
                    </div>
                  </div>
                  <div style={{height:6,background:'var(--gray-100)',borderRadius:3,overflow:'hidden',marginBottom:14}}>
                    <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3,transition:'width 0.8s ease'}} />
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
                    <div>
                      <div style={{fontSize:12,color:'var(--gray-400)',marginBottom:2}}>Total</div>
                      <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:16}}>{formatPrice(mesa.total_mesa)}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:12,color:'var(--gray-400)',marginBottom:2}}>Pagado</div>
                      <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:16,color:'#1a7a4a'}}>{formatPrice(mesa.total_pagado)}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <Link to={`/admin/mesa/${mesa.id}`} style={{flex:1,padding:9,background:'var(--black)',color:'white',borderRadius:8,textDecoration:'none',textAlign:'center',fontSize:13,fontWeight:600,fontFamily:'var(--font-display)'}}>
                      Ver detalles →
                    </Link>
                    <Link to={`/mesa/${mesa.id}`} target="_blank" style={{flex:1,padding:9,background:'var(--cream)',color:'var(--black)',borderRadius:8,textDecoration:'none',textAlign:'center',fontSize:13,fontWeight:600,border:'1.5px solid var(--gray-200)'}}>
                      Vista cliente ↗
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}