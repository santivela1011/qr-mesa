import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api, formatPrice } from '../hooks/api';

const ESTADOS_COLOR = {
  pendiente: { bg: '#f0ece4', text: '#5a5248', dot: '#9a9080' },
  en_proceso: { bg: '#fff8e6', text: '#c07010', dot: '#e8a020' },
  pagado: { bg: '#e8f5ee', text: '#1a7a4a', dot: '#1a7a4a' },
};

export default function MesaCliente() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seleccionados, setSeleccionados] = useState([]);
  const [step, setStep] = useState('seleccion');
  const [pago, setPago] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [error, setError] = useState(null);

  const cargarMesa = useCallback(async () => {
    try {
      const result = await api.getMesa(id);
      if (result.error) { setError(result.error); return; }
      setData(result);
    } catch (e) {
      setError('No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargarMesa();
    const interval = setInterval(cargarMesa, 5000);
    return () => clearInterval(interval);
  }, [cargarMesa]);

  const toggleSeleccion = (prod) => {
    if (prod.estado !== 'pendiente') return;
    setSeleccionados(prev =>
      prev.includes(prod.id) ? prev.filter(i => i !== prod.id) : [...prev, prod.id]
    );
  };

  const productosSeleccionados = data?.productos?.filter(p => seleccionados.includes(p.id)) || [];
  const subtotal = productosSeleccionados.reduce((s, p) => s + p.precio * p.cantidad, 0);
  const impuesto = subtotal * 0.15;
  const total = subtotal + impuesto;

  const generarPago = async () => {
    if (seleccionados.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.crearPago({
        mesa_id: parseInt(id),
        productos_ids: seleccionados,
        cliente_nombre: nombreCliente || 'Cliente',
      });
      if (result.error) { setError(result.error); setLoading(false); return; }
      setPago(result);
      setStep('pago');
    } catch (e) {
      setError('Error al generar el pago');
    } finally {
      setLoading(false);
    }
  };

  const subirComprobante = async (e) => {
    const file = e.target.files[0];
    if (!file || !pago) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('comprobante', file);
    formData.append('pago_id', pago.pago_id);
    formData.append('mesa_id', id);
    try {
      const result = await api.subirComprobante(formData);
      if (result.error) { setError(result.error); return; }
      setStep('completado');
      cargarMesa();
    } catch (e) {
      setError('Error al subir el comprobante');
    } finally {
      setUploading(false);
    }
  };

  if (loading && !data) return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,background:'var(--cream)'}}>
      <div className="spinner" style={{width:44,height:44}} />
      <p style={{color:'var(--gray-400)'}}>Cargando mesa...</p>
    </div>
  );

  if (error && !data) return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:32,textAlign:'center'}}>
      <div style={{fontSize:56}}>🍽️</div>
      <h2 style={{fontFamily:'var(--font-display)',fontWeight:800}}>Mesa no disponible</h2>
      <p style={{color:'var(--gray-400)'}}>{error}</p>
    </div>
  );

  if (!data) return null;

  return (
    <div style={{minHeight:'100vh',background:'var(--cream)',display:'flex',flexDirection:'column'}}>
      <header style={{background:'var(--black)',color:'white',padding:'16px 20px'}}>
        <div style={{maxWidth:480,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontSize:20}}>🍽</span>
              <span style={{fontFamily:'var(--font-display)',fontSize:20,color:'white'}}>QR<strong>Mesa</strong></span>
            </div>
            <div style={{display:'inline-block',background:'var(--amber)',color:'var(--black)',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700}}>
              {data.mesa.nombre}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,textAlign:'right'}}>
            <div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',textTransform:'uppercase'}}>Total mesa</div>
              <div style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-display)'}}>{formatPrice(data.resumen.total)}</div>
            </div>
            <div style={{width:1,background:'rgba(255,255,255,0.2)',height:30}} />
            <div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',textTransform:'uppercase'}}>Pendiente</div>
              <div style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-display)',color:'#f5c060'}}>{formatPrice(data.resumen.pendiente)}</div>
            </div>
          </div>
        </div>
      </header>

      <div style={{flex:1,maxWidth:480,margin:'0 auto',width:'100%',padding:'24px 16px'}}>

        {/* Steps */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,margin:'0 0 24px'}}>
          {[['seleccion','Seleccionar'],['pago','Pagar'],['comprobante','Comprobante'],['completado','Listo']].map(([key,label],i,arr) => {
            const idx = arr.findIndex(s => s[0] === step);
            const isCurrent = key === step;
            const isDone = i < idx;
            return (
              <React.Fragment key={key}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,background:isDone?'var(--green)':isCurrent?'var(--amber)':'var(--gray-200)',color:isDone||isCurrent?'white':'var(--gray-400)'}}>
                    {isDone ? '✓' : i+1}
                  </div>
                  <span style={{fontSize:10,color:isCurrent?'var(--amber-dark)':'var(--gray-400)',fontWeight:isCurrent?600:400}}>{label}</span>
                </div>
                {i < arr.length-1 && <div style={{width:40,height:2,background:isDone?'var(--green)':'var(--gray-200)',margin:'0 4px',marginBottom:18}} />}
              </React.Fragment>
            );
          })}
        </div>

        {step === 'seleccion' && (
          <div className="stagger">
            <div style={{background:'white',borderRadius:'var(--radius)',padding:20,marginBottom:12,boxShadow:'var(--shadow)'}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:8,color:'var(--gray-600)'}}>Tu nombre (opcional)</label>
              <input style={{width:'100%',padding:'12px 14px',borderRadius:'var(--radius-sm)',border:'1.5px solid var(--gray-200)',fontSize:15,fontFamily:'var(--font-body)',outline:'none',background:'var(--cream)'}} placeholder="Ej. Carlos" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} />
            </div>

            <div style={{background:'white',borderRadius:'var(--radius)',padding:20,marginBottom:12,boxShadow:'var(--shadow)'}}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,marginBottom:4}}>Consumos de la mesa</h2>
              <p style={{fontSize:14,color:'var(--gray-400)',marginBottom:16}}>Selecciona los productos que consumiste</p>
              {data.productos.map(prod => {
                const disabled = prod.estado !== 'pendiente';
                const seleccionado = seleccionados.includes(prod.id);
                return (
                  <div key={prod.id} onClick={!disabled ? () => toggleSeleccion(prod) : undefined} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--gray-100)',cursor:disabled?'default':'pointer',opacity:disabled?0.7:1}}>
                    <div style={{width:22,height:22,borderRadius:6,border:seleccionado?'none':'2px solid var(--gray-200)',background:seleccionado?'var(--amber)':disabled?'var(--gray-100)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {seleccionado && <span style={{color:'white',fontSize:13,fontWeight:700}}>✓</span>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500,fontSize:15}}>{prod.nombre}</div>
                      <div style={{fontSize:13,color:'var(--gray-400)'}}>x{prod.cantidad}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:700,fontSize:16,fontFamily:'var(--font-display)'}}>{formatPrice(prod.precio)}</div>
                      {disabled && (
                        <span style={{display:'inline-block',marginTop:2,padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,background:ESTADOS_COLOR[prod.estado]?.bg,color:ESTADOS_COLOR[prod.estado]?.text}}>
                          {prod.estado === 'pagado' ? '✓ Pagado' : '⏳ En proceso'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {seleccionados.length > 0 && (
              <div className="animate-fadeIn" style={{background:'white',borderRadius:'var(--radius)',padding:20,marginBottom:12,boxShadow:'var(--shadow)',border:'2px solid var(--amber)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:15}}>
                  <span style={{color:'var(--gray-600)'}}>Subtotal ({seleccionados.length} producto{seleccionados.length>1?'s':''})</span>
                  <span style={{fontWeight:600}}>{formatPrice(subtotal)}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:15}}>
                  <span style={{color:'var(--gray-600)'}}>IVA 15%</span>
                  <span style={{fontWeight:600}}>{formatPrice(impuesto)}</span>
                </div>
                <div style={{height:1,background:'var(--gray-200)',margin:'12px 0'}} />
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:18}}>
                  <span>Total a pagar</span>
                  <span style={{color:'var(--amber-dark)'}}>{formatPrice(total)}</span>
                </div>
                <button style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',padding:16,borderRadius:'var(--radius-sm)',marginTop:16,background:'var(--black)',color:'white',border:'none',cursor:'pointer',fontFamily:'var(--font-display)',fontSize:16,fontWeight:700}} onClick={generarPago} disabled={loading}>
                  {loading ? <span className="spinner" style={{width:20,height:20}} /> : '💳 Generar link de pago'}
                </button>
              </div>
            )}
            {error && <div style={{background:'var(--red-light)',color:'var(--red)',padding:'12px 16px',borderRadius:'var(--radius-sm)',fontSize:14,marginTop:8}}>⚠️ {error}</div>}
          </div>
        )}

        {step === 'pago' && pago && (
          <div className="stagger">
            <div style={{background:'white',borderRadius:'var(--radius)',padding:20,marginBottom:12,boxShadow:'var(--shadow)'}}>
              <div style={{textAlign:'center',marginBottom:20}}>
                <div style={{fontSize:48}}>💳</div>
                <h2 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,marginBottom:4}}>Pago generado</h2>
                <div style={{fontFamily:'var(--font-display)',fontSize:44,fontWeight:800,color:'var(--amber-dark)'}}>{formatPrice(pago.total)}</div>
              </div>
              <div style={{background:'var(--cream)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:16}}>
                {pago.productos.map(p => (
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:15}}>
                    <span>{p.nombre}</span><span>{formatPrice(p.precio)}</span>
                  </div>
                ))}
                <div style={{height:1,background:'var(--gray-200)',margin:'8px 0'}} />
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:700}}>
                  <span>Total</span><span>{formatPrice(pago.total)}</span>
                </div>
              </div>
              <a href={pago.link_pago} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',padding:16,borderRadius:'var(--radius-sm)',background:'var(--black)',color:'white',border:'none',cursor:'pointer',fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,textDecoration:'none'}}>
                🔗 Ir al link de pago
              </a>
              <div style={{display:'flex',alignItems:'center',gap:12,margin:'16px 0'}}>
                <div style={{flex:1,height:1,background:'var(--gray-200)'}} />
                <span style={{fontSize:12,color:'var(--gray-400)'}}>o si ya pagaste</span>
                <div style={{flex:1,height:1,background:'var(--gray-200)'}} />
              </div>
              <button style={{display:'block',width:'100%',padding:14,borderRadius:'var(--radius-sm)',background:'transparent',color:'var(--black)',border:'2px solid var(--gray-200)',cursor:'pointer',fontFamily:'var(--font-display)',fontSize:15,fontWeight:600}} onClick={() => setStep('comprobante')}>
                📤 Subir comprobante
              </button>
            </div>
          </div>
        )}

        {step === 'comprobante' && pago && (
          <div className="stagger">
            <div style={{background:'white',borderRadius:'var(--radius)',padding:20,marginBottom:12,boxShadow:'var(--shadow)'}}>
              <div style={{textAlign:'center',marginBottom:24}}>
                <div style={{fontSize:48}}>📤</div>
                <h2 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,marginBottom:4}}>Sube tu comprobante</h2>
                <p style={{fontSize:14,color:'var(--gray-400)'}}>Foto del comprobante de transferencia o pago digital</p>
              </div>
              <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px dashed var(--gray-200)',borderRadius:'var(--radius-sm)',padding:32,cursor:'pointer',gap:4}}>
                <div style={{fontSize:40}}>📎</div>
                <span style={{fontWeight:600,color:'var(--gray-600)'}}>Toca para seleccionar archivo</span>
                <span style={{fontSize:12,color:'var(--gray-400)'}}>JPG, PNG o PDF — máx. 5MB</span>
                <input type="file" accept="image/*,.pdf" onChange={subirComprobante} style={{display:'none'}} disabled={uploading} />
              </label>
              {uploading && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,padding:16,color:'var(--gray-600)'}}>
                  <div className="spinner" /><span>Subiendo comprobante...</span>
                </div>
              )}
              {error && <div style={{background:'var(--red-light)',color:'var(--red)',padding:'12px 16px',borderRadius:'var(--radius-sm)',fontSize:14,marginTop:8}}>⚠️ {error}</div>}
              <button style={{display:'block',width:'100%',padding:14,borderRadius:'var(--radius-sm)',marginTop:12,background:'transparent',color:'var(--black)',border:'2px solid var(--gray-200)',cursor:'pointer',fontFamily:'var(--font-display)',fontSize:15,fontWeight:600}} onClick={() => setStep('pago')}>
                ← Volver
              </button>
            </div>
          </div>
        )}

        {step === 'completado' && (
          <div className="animate-fadeIn">
            <div style={{background:'white',borderRadius:'var(--radius)',padding:20,marginBottom:12,boxShadow:'var(--shadow)'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'20px 0'}}>
                <div className="animate-checkmark" style={{width:72,height:72,borderRadius:'50%',background:'var(--green)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,fontWeight:700,marginBottom:16}}>✓</div>
                <h2 style={{fontFamily:'var(--font-display)',fontSize:28,fontWeight:800,marginBottom:8}}>¡Pago confirmado!</h2>
                <p style={{color:'var(--gray-600)',marginBottom:24,lineHeight:1.6}}>
                  Tu pago de <strong>{formatPrice(pago?.total || 0)}</strong> fue recibido.<br />¡Gracias por tu visita!
                </p>
                <span style={{background:'var(--green-light)',color:'var(--green)',padding:'8px 20px',borderRadius:20,fontWeight:600,fontSize:14}}>✓ Comprobante verificado</span>
              </div>
            </div>
            <button style={{display:'block',width:'100%',padding:14,borderRadius:'var(--radius-sm)',background:'transparent',color:'var(--black)',border:'2px solid var(--gray-200)',cursor:'pointer',fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,textAlign:'center'}} onClick={() => { setStep('seleccion'); setSeleccionados([]); setPago(null); cargarMesa(); }}>
              Ver mesa actualizada
            </button>
          </div>
        )}
      </div>

      <footer style={{textAlign:'center',padding:16,fontSize:12,color:'var(--gray-400)'}}>
        <span>QRMesa © 2026 — </span>
        <a href={`/admin/mesa/${id}`} style={{color:'var(--amber-dark)',textDecoration:'none',fontWeight:600}}>Vista restaurante →</a>
      </footer>
    </div>
  );
}