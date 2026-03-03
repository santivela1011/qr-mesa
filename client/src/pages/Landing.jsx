import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{minHeight:'100vh',background:'var(--black)',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 16px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232,160,32,0.15) 0%, transparent 60%)',pointerEvents:'none'}} />
      <div style={{maxWidth:560,width:'100%',position:'relative',zIndex:1}}>

        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32,justifyContent:'center'}} className="animate-fadeUp">
          <span style={{fontSize:28}}>🍽</span>
          <span style={{fontFamily:'var(--font-display)',fontSize:24,color:'white',letterSpacing:'-0.5px'}}>QR<strong>Mesa</strong></span>
        </div>

        <h1 className="animate-fadeUp" style={{fontFamily:'var(--font-display)',fontSize:48,fontWeight:800,color:'white',textAlign:'center',lineHeight:1.1,marginBottom:16,letterSpacing:'-1px'}}>
          Divide la cuenta.<br />
          <span style={{color:'var(--amber)'}}>Sin fricción.</span>
        </h1>

        <p className="animate-fadeUp" style={{textAlign:'center',color:'rgba(255,255,255,0.5)',fontSize:16,lineHeight:1.7,marginBottom:40}}>
          Sistema de pago individual por mesa mediante QR.<br />
          Del escaneo al comprobante en menos de 2 minutos.
        </p>

        <div className="animate-fadeUp" style={{background:'white',borderRadius:20,padding:24,marginBottom:32}}>
          <div style={{display:'inline-block',background:'var(--amber)',color:'var(--black)',padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:700,marginBottom:12}}>
            🎯 Demo para inversores
          </div>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:800,marginBottom:16}}>Mesa 12 — Precargada</h2>

          <div style={{background:'var(--cream)',borderRadius:12,padding:16,marginBottom:20}}>
            {[['Lomo BBQ','$12.99'],['Coca Cola','$2.50'],['Hamburguesa Clásica','$10.99'],['Papas Fritas','$3.99']].map(([n,p]) => (
              <div key={n} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:15}}>
                <span>{n}</span>
                <span style={{fontFamily:'var(--font-display)',fontWeight:700}}>{p}</span>
              </div>
            ))}
            <div style={{height:1,background:'var(--gray-200)',margin:'8px 0'}} />
            <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontFamily:'var(--font-display)',fontSize:18}}>
              <span>Total mesa</span>
              <span style={{color:'var(--amber-dark)'}}>$30.47</span>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <Link to="/mesa/12" style={{display:'block',padding:14,background:'var(--black)',color:'white',borderRadius:10,textDecoration:'none',textAlign:'center',fontFamily:'var(--font-display)',fontWeight:700,fontSize:15}}>
              👤 Vista cliente
            </Link>
            <Link to="/admin/mesa/12" style={{display:'block',padding:14,background:'var(--cream)',color:'var(--black)',borderRadius:10,textDecoration:'none',textAlign:'center',fontFamily:'var(--font-display)',fontWeight:700,fontSize:15,border:'2px solid var(--gray-200)'}}>
              📊 Panel admin
            </Link>
          </div>
          <Link to="/admin" style={{display:'block',padding:12,background:'transparent',color:'var(--gray-600)',borderRadius:10,textDecoration:'none',textAlign:'center',fontSize:14,border:'1.5px solid var(--gray-200)'}}>
            🗂 Dashboard general →
          </Link>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:32}} className="stagger">
          {[
            ['📱','QR único por mesa','Cada mesa tiene su propio link'],
            ['✂️','División automática','Cada comensal elige sus consumos'],
            ['💳','Pago digital','Link de pago generado al instante'],
            ['📊','Tiempo real','El restaurante ve todo en vivo']
          ].map(([icon,title,desc]) => (
            <div key={title} style={{background:'rgba(255,255,255,0.05)',borderRadius:14,padding:18,border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{fontSize:28,marginBottom:8}}>{icon}</div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:700,color:'white',fontSize:15,marginBottom:4}}>{title}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.45)',lineHeight:1.5}}>{desc}</div>
            </div>
          ))}
        </div>

        <p style={{textAlign:'center',color:'rgba(255,255,255,0.25)',fontSize:12}}>QRMesa MVP v1.0 · Ecuador 2026</p>
      </div>
    </div>
  );
}