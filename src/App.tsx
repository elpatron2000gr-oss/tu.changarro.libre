import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

// CAMBIAR: poner aca tu correo de soporte real
const EMAIL_SOPORTE = 'tuchangarrolibre@gmail.com'

// Adonde vuelve el link del mail de recuperacion de contrasena.
// Cuando empaquetemos para las tiendas, cambiamos esta linea por la URL de Vercel.
const REDIRECT_URL = window.location.origin

// Detecta si la persona llego desde el link de recuperacion (antes de que Supabase limpie la direccion)
const LLEGO_DE_RECUPERACION = window.location.hash.indexOf('type=recovery') !== -1

// Direccion publica de la app (la que se comparte por WhatsApp)
const URL_APP = 'https://tu-changarro-libre-tuchangarrolibre.vercel.app'

// Si alguien llega desde un link compartido (?p=numero), lo guardamos para abrir esa publicacion
const PUB_COMPARTIDA = new URLSearchParams(window.location.search).get('p')

// Portadas del perfil. Cuando tengas las imagenes de la app, pega sus direcciones aca adentro,
// entre comillas y separadas por coma. Se elige una al azar. Vacio = portada simple con el nombre.
const PORTADAS: string[] = []
const PORTADA_ELEGIDA = PORTADAS.length > 0 ? PORTADAS[Math.floor(Math.random() * PORTADAS.length)] : ''

// Animaciones y detalles visuales de toda la app
const ESTILOS_TCL = [
  '@keyframes tcl-fade{from{opacity:.35}to{opacity:1}}',
  '@keyframes tcl-fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
  '@keyframes tcl-sheet{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}',
  '@keyframes tcl-fondo{from{opacity:0}to{opacity:1}}',
  '@keyframes tcl-pop{0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)}}',
  '@keyframes tcl-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}',
  '@keyframes tcl-pulso{0%,100%{transform:scale(.94);opacity:.7}50%{transform:scale(1);opacity:1}}',
  '.tcl-pantalla{animation:tcl-fade .2s ease-out backwards}',
  '.tcl-modal-fondo{animation:tcl-fondo .2s ease-out backwards}',
  '.tcl-modal-panel{animation:tcl-sheet .28s cubic-bezier(.2,.8,.2,1) backwards}',
  '.tcl-aparece{animation:tcl-fade-up .42s ease-out backwards}',
  '.tcl-corazon-pop{animation:tcl-pop .4s ease-out;transform-box:fill-box;transform-origin:center}',
  '.tcl-skel{animation:tcl-shimmer 1.4s linear infinite}',
  '.tcl-pulso{animation:tcl-pulso 1.4s ease-in-out infinite}',
  '.tcl-tarjeta{transition:transform .15s ease}',
  '.tcl-tarjeta:active{transform:scale(.98)}',
  '.tcl-sinbarra{scrollbar-width:none}',
  '.tcl-sinbarra::-webkit-scrollbar{display:none}',
  'button{transition:transform .12s ease,opacity .12s ease;-webkit-tap-highlight-color:transparent}',
  'button:active{transform:scale(.97)}',
  '@media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important}}'
].join('\n')

if (typeof document !== 'undefined' && !document.getElementById('tcl-estilos')) {
  const estiloEl = document.createElement('style')
  estiloEl.id = 'tcl-estilos'
  estiloEl.textContent = ESTILOS_TCL
  document.head.appendChild(estiloEl)
}

const DARK = {
  bg:'#070707', s1:'#0F0F0F', s2:'#161616', s3:'#1F1F1F', s4:'#292929',
  border:'#232323', border2:'#303030',
  gold:'#D4A843', goldLt:'#F0C060', goldDk:'#A07828',
  glow:'rgba(212,168,67,0.22)', glow2:'rgba(212,168,67,0.11)', glow3:'rgba(212,168,67,0.05)',
  purple:'#8B5CF6', purpleLt:'#A78BFA', purpleGlow:'rgba(139,92,246,0.15)',
  text:'#F5F2ED', sub:'#A8A39D', muted:'#555555', dim:'#2A2A2A',
  green:'#2ECC71', red:'#E74C3C', blue:'#3B82F6', orange:'#F97316',
  font:"'Sora',sans-serif", serif:"'Libre Baskerville',serif",
  isDark:true,
}

const LIGHT = {
  bg:'#F5F2ED', s1:'#FFFFFF', s2:'#F0EDE6', s3:'#E8E4DA', s4:'#DDD8CB',
  border:'#DDD8CB', border2:'#C9C3B5',
  gold:'#D4A843', goldLt:'#F0C060', goldDk:'#A07828',
  glow:'rgba(212,168,67,0.18)', glow2:'rgba(212,168,67,0.09)', glow3:'rgba(212,168,67,0.04)',
  purple:'#8B5CF6', purpleLt:'#A78BFA', purpleGlow:'rgba(139,92,246,0.12)',
  text:'#1A1A1A', sub:'#4A453D', muted:'#8A8578', dim:'#EDE9DE',
  green:'#219653', red:'#C0392B', blue:'#2B6CB0', orange:'#D9720F',
  font:"'Sora',sans-serif", serif:"'Libre Baskerville',serif",
  isDark:false,
}

let T = DARK
const G = 'linear-gradient(135deg,' + DARK.gold + ',' + DARK.goldDk + ')'
const FONTS = 'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap'
const CATEGORIAS = ['Todo','Servicios','Electronica','Ropa','Hogar','Deportes','Vehiculos','Inmuebles','Otro']

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Cordoba','Corrientes',
  'Entre Rios','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquen','Rio Negro','Salta','San Juan','San Luis','Santa Cruz',
  'Santa Fe','Santiago del Estero','Tierra del Fuego','Tucuman'
]

const NIVELES = {
  'Nuevo':     { color: DARK.muted,  siguiente: 'Confiable', minPuntaje: 0  },
  'Confiable': { color: DARK.blue,   siguiente: 'Experto',   minPuntaje: 20 },
  'Experto':   { color: DARK.purple, siguiente: 'Élite',     minPuntaje: 50 },
  'Élite':     { color: DARK.gold,   siguiente: null,        minPuntaje: 100 },
}

const MOTIVOS_REPORTE = [
  'Estafa o fraude',
  'Producto prohibido o ilegal',
  'Contenido ofensivo o inapropiado',
  'Spam o publicidad',
  'Acoso o mal trato',
  'Otro motivo'
]

const TERMINOS = [
  { t:'Ultima actualizacion', p:'Octubre 2026' },
  { t:'1. Que es Tu Changarro Libre', p:'Tu Changarro Libre es una plataforma que conecta a personas que quieren comprar y vender productos y servicios en Argentina. No participamos en las operaciones entre usuarios: no vendemos, no cobramos, no entregamos ni garantizamos los productos.' },
  { t:'2. Tu cuenta', p:'Tenes que tener al menos 18 anos para usar la app. Sos responsable de tu cuenta y de todo lo que se publica con ella. Los datos que cargues tienen que ser verdaderos.' },
  { t:'3. Reglas de publicacion', p:'No esta permitido publicar productos ilegales, robados o falsificados, armas, drogas, contenido sexual ni contenido enganoso o que infrinja derechos de terceros. Las publicaciones tienen que ser reales, con precio y descripcion verdaderos.' },
  { t:'4. Conducta', p:'Se respetuoso. No se permite el acoso, las amenazas, el spam ni los intentos de estafa. Podes reportar publicaciones y usuarios, y bloquear usuarios, desde la app.' },
  { t:'5. Moderacion', p:'Podemos eliminar publicaciones y suspender o eliminar cuentas que incumplan estas reglas, con o sin aviso previo cuando sea necesario para proteger a la comunidad.' },
  { t:'6. Operaciones entre usuarios', p:'Los acuerdos de pago y entrega son entre vos y la otra persona. Te recomendamos verificar el producto antes de pagar y desconfiar de ofertas sospechosas. Tu Changarro Libre no se responsabiliza por danos o perdidas que surjan de esas operaciones.' },
  { t:'7. Eliminar tu cuenta', p:'Podes eliminar tu cuenta en cualquier momento desde Ajustes. Se borran tu perfil, tus publicaciones, tus mensajes y tus favoritos.' },
  { t:'8. Cambios en los terminos', p:'Podemos actualizar estos terminos. Si seguis usando la app despues de un cambio, aceptas la version vigente.' },
  { t:'9. Contacto', p:'Por cualquier consulta escribinos a ' + EMAIL_SOPORTE + '.' }
]

const PRIVACIDAD = [
  { t:'Ultima actualizacion', p:'Octubre 2026' },
  { t:'1. Que datos guardamos', p:'Tu nombre, tu correo, tu ciudad y provincia (opcional), tu foto de perfil (opcional), tus publicaciones (fotos, videos, descripcion y precio), tus mensajes, tus favoritos, y los reportes y bloqueos que hagas.' },
  { t:'2. Para que los usamos', p:'Para que puedas usar la app: crear tu cuenta, publicar, chatear con otros usuarios, mostrar tu perfil y mantener la seguridad de la comunidad (reportes y bloqueos).' },
  { t:'3. Que ven otros usuarios', p:'Tu nombre, tu foto, tu ubicacion (ciudad y provincia), tu nivel de reputacion y tus publicaciones. Tu correo no se muestra en la app a otros usuarios. Tus mensajes solo los ven las personas con las que chateas.' },
  { t:'4. Donde se guardan', p:'Usamos Supabase como proveedor de base de datos, autenticacion y almacenamiento de archivos, y Vercel para alojar la app. No vendemos tus datos ni los usamos para publicidad.' },
  { t:'5. Tus derechos', p:'Podes ver y editar tus datos desde Perfil > Editar. Podes eliminar tu cuenta y todos tus datos desde Ajustes > Eliminar cuenta. La Ley 25.326 de Proteccion de Datos Personales de Argentina te da derecho de acceso, rectificacion y supresion de tus datos. La Agencia de Acceso a la Informacion Publica es el organo de control de esa ley.' },
  { t:'6. Menores de edad', p:'La app no esta dirigida a menores de 18 anos.' },
  { t:'7. Contacto', p:'Para consultas sobre tus datos escribinos a ' + EMAIL_SOPORTE + '.' }
]

const AYUDA = [
  { t:'Como reportar una publicacion', p:'Abri la publicacion y toca "Reportar publicacion". Elegi el motivo y envia el reporte. Lo revisamos y, si incumple las reglas, la eliminamos.' },
  { t:'Como reportar o bloquear a un usuario', p:'Dentro de un chat, toca los tres puntos de arriba a la derecha y elegi "Reportar usuario" o "Bloquear usuario". Tambien podes bloquear al vendedor desde su publicacion.' },
  { t:'Como desbloquear a alguien', p:'Anda a Ajustes > Usuarios bloqueados y toca "Desbloquear".' },
  { t:'Como eliminar mi cuenta', p:'Anda a Ajustes, baja hasta "Zona de peligro" y toca "Eliminar cuenta". Se borra todo de forma permanente.' },
  { t:'Contacto', p:'Si tenes algun problema o consulta, escribinos a ' + EMAIL_SOPORTE + '.' }
]

function tiempoTranscurrido(fechaStr: any) {
  if (!fechaStr) return ''
  const diff = Date.now() - new Date(fechaStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return 'hace ' + mins + ' min'
  const horas = Math.floor(mins / 60)
  if (horas < 24) return 'hace ' + horas + ' h'
  const dias = Math.floor(horas / 24)
  if (dias < 30) return 'hace ' + dias + ' d'
  const meses = Math.floor(dias / 30)
  return 'hace ' + meses + (meses > 1 ? ' meses' : ' mes')
}

function Input({ value, onChange, placeholder, type='text', style={} }: any) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} type={type}
      style={{ background:T.s2, color:T.text, border:'1px solid '+T.border2, borderRadius:12, padding:'13px 16px', fontSize:15, outline:'none', fontFamily:T.font, width:'100%', boxSizing:'border-box', ...style }}
    />
  )
}

function GBtn({ children, onClick, disabled, full, grad }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:full?'100%':'auto', padding:'13px 20px', borderRadius:14, border:'none', background:disabled?'#444':(grad||G), color:'#0a0a0a', fontWeight:700, fontSize:15, cursor:disabled?'not-allowed':'pointer', fontFamily:T.font, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
      {children}
    </button>
  )
}


function InfoRow({ label, value }: any) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px 0', borderBottom:'1px solid '+T.border }}>
      <span style={{ fontSize:14, fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:13, color:T.muted }}>{value}</span>
    </div>
  )
}

function LinkRow({ label, value, onClick, destacado }: any) {
  return (
    <button onClick={onClick} style={{
      width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'15px 0', background:'none', border:'none', borderBottom:'1px solid '+T.border,
      cursor:'pointer', fontFamily:T.font, color: destacado ? T.red : T.text, textAlign:'left'
    }}>
      <span style={{ fontSize:14, fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:13, color:T.muted }}>{value ? value + '  ' : ''}{destacado ? '' : '>'}</span>
    </button>
  )
}

function BackBtn({ onClick }: any) {
  return (
    <button onClick={onClick} style={{ background:'none', border:'none', cursor:'pointer', padding:0, width:32, height:32, display:'flex', alignItems:'center', color:T.text }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}

function PantallaTexto({ titulo, onBack, secciones, extra }: any) {
  return (
    <div className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:40 }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
        <BackBtn onClick={onBack} />
        <div style={{ fontWeight:700, fontSize:17, flex:1 }}>{titulo}</div>
      </div>
      <div style={{ padding:'20px 18px' }}>
        {secciones.map((s:any, i:number)=>(
          <div key={i} style={{ marginBottom:18 }}>
            <div style={{ fontSize:14, fontWeight:800, color:T.gold, marginBottom:6 }}>{s.t}</div>
            <div style={{ fontSize:13, color:T.sub, lineHeight:1.6 }}>{s.p}</div>
          </div>
        ))}
        {extra}
      </div>
    </div>
  )
}

function pantallaLegal(tipo: string, onBack: any) {
  if (tipo === 'terminos') {
    return <PantallaTexto titulo="Terminos y condiciones" onBack={onBack} secciones={TERMINOS} />
  }
  if (tipo === 'privacidad') {
    return <PantallaTexto titulo="Politica de privacidad" onBack={onBack} secciones={PRIVACIDAD} />
  }
  return (
    <PantallaTexto
      titulo="Ayuda y soporte"
      onBack={onBack}
      secciones={AYUDA}
      extra={
        <a href={'mailto:' + EMAIL_SOPORTE} style={{
          display:'block', textAlign:'center', padding:'13px 20px', borderRadius:14, background:G,
          color:'#0a0a0a', fontWeight:700, fontSize:15, textDecoration:'none', fontFamily:T.font
        }}>
          Escribir a soporte
        </a>
      }
    />
  )
}

function ModalReporte({ objetivo, motivo, setMotivo, detalle, setDetalle, enviando, mensaje, enviado, onEnviar, onCerrar }: any) {
  if (!objetivo) return null
  return (
    <div className="tcl-modal-fondo" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="tcl-modal-panel" style={{ width:'100%', maxWidth:390, maxHeight:'90vh', overflowY:'auto', background:T.s1, border:'1px solid '+T.border2, borderRadius:20, padding:'22px 20px', fontFamily:T.font, color:T.text, boxSizing:'border-box' }}>
        {enviado ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, color:T.green, marginBottom:8 }}>Reporte enviado</div>
            <div style={{ fontSize:13, color:T.muted, lineHeight:1.5, marginBottom:20 }}>
              Gracias por avisarnos. Vamos a revisarlo y tomar medidas si corresponde.
            </div>
            <GBtn full onClick={onCerrar}>Cerrar</GBtn>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>Reportar</div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:16, lineHeight:1.4 }}>
              {objetivo.nombre}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
              {MOTIVOS_REPORTE.map((m:string)=>(
                <button key={m} onClick={()=>setMotivo(m)} style={{
                  textAlign:'left', padding:'11px 14px', borderRadius:12, fontSize:13, fontWeight:600,
                  cursor:'pointer', fontFamily:T.font,
                  border:'1px solid '+(motivo===m?T.gold:T.border2),
                  background: motivo===m ? T.gold+'22' : T.s2,
                  color: motivo===m ? T.gold : T.text
                }}>
                  {m}
                </button>
              ))}
            </div>
            <textarea value={detalle} onChange={(e:any)=>setDetalle(e.target.value)} placeholder="Detalles (opcional)"
              style={{ width:'100%', padding:'12px 14px', marginBottom:16, minHeight:70, borderRadius:12, border:'1px solid '+T.border2, background:T.s2, color:T.text, fontSize:14, boxSizing:'border-box', resize:'none', fontFamily:T.font }}
            />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onCerrar} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
                Cancelar
              </button>
              <button onClick={onEnviar} disabled={enviando||!motivo} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:(enviando||!motivo)?'#444':G, color:'#0a0a0a', fontWeight:700, fontSize:14, cursor:(enviando||!motivo)?'not-allowed':'pointer', fontFamily:T.font }}>
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
            {mensaje && <p style={{ marginTop:12, color:T.red, fontSize:13, textAlign:'center' }}>{mensaje}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function ModalBloqueo({ objetivo, bloqueando, onConfirmar, onCancelar }: any) {
  if (!objetivo) return null
  return (
    <div className="tcl-modal-fondo" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="tcl-modal-panel" style={{ width:'100%', maxWidth:390, background:T.s1, border:'1px solid '+T.border2, borderRadius:20, padding:'22px 20px', fontFamily:T.font, color:T.text, boxSizing:'border-box' }}>
        <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Bloquear a {objetivo.nombre}?</div>
        <div style={{ fontSize:13, color:T.muted, lineHeight:1.5, marginBottom:20 }}>
          No vas a ver mas sus publicaciones ni sus mensajes. Podes desbloquearlo cuando quieras desde Ajustes.
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancelar} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={bloqueando} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:T.red, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
            {bloqueando ? 'Bloqueando...' : 'Bloquear'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BottomNav({ vista, setVista, abrirPerfil, abrirBandejaMensajes, sinLeer }: any) {
  const item = (label: string, activo: boolean, onClick: any, punto?: boolean) => (
    <button onClick={onClick} style={{
      background:'none', border:'none', cursor:'pointer', flex:1,
      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
      padding:'8px 0', color: activo ? T.gold : T.muted, fontFamily:T.font
    }}>
      <div style={{ fontSize:11, fontWeight: activo ? 800 : 600, position:'relative' }}>
        {label}
        {punto ? <span style={{ position:'absolute', top:-3, right:-9, width:7, height:7, borderRadius:'50%', background:T.gold }} /> : null}
      </div>
    </button>
  )

  return (
    <div style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:430, background:T.s1, borderTop:'1px solid '+T.border,
      display:'flex', alignItems:'center', padding:'6px 8px calc(6px + env(safe-area-inset-bottom))',
      zIndex:70
    }}>
      {item('Inicio', vista==='home', ()=>setVista('home'))}
      {item('Mensajes', vista==='mensajes', abrirBandejaMensajes, sinLeer > 0)}

      <button onClick={()=>setVista('publicar')} style={{
        width:52, height:52, borderRadius:'50%', background:G, border:'4px solid '+T.s1,
        color:'#0a0a0a', fontSize:26, fontWeight:800, cursor:'pointer', flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center', marginTop:-24,
        boxShadow:'0 4px 14px '+T.glow
      }}>
        +
      </button>

      {item('Ajustes', vista==='configuracion', ()=>setVista('configuracion'))}
      {item('Perfil', vista==='perfil', abrirPerfil)}
    </div>
  )
}

function IconoCorazon({ activo, size = 22, animar }: any) {
  return (
    <svg className={animar ? 'tcl-corazon-pop' : undefined} width={size} height={size} viewBox="0 0 24 24" fill={activo ? T.gold : 'none'} stroke={activo ? T.gold : '#fff'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

// Reduce el tamano de una foto antes de subirla (misma calidad a simple vista en el celular).
async function comprimirImagen(file: any, maxLado: number, calidad: number): Promise<any> {
  try {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) return file
    if (file.type === 'image/gif') return file
    const url = URL.createObjectURL(file)
    const img: any = await new Promise((resolve, reject) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = () => reject(new Error('no se pudo leer la imagen'))
      im.src = url
    })
    URL.revokeObjectURL(url)
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (!w || !h) return file
    const escala = Math.min(1, maxLado / Math.max(w, h))
    w = Math.round(w * escala)
    h = Math.round(h * escala)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    const blob: any = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', calidad))
    if (!blob) return file
    if (escala === 1 && blob.size >= file.size) return file
    return blob
  } catch (e) {
    return file
  }
}

function ModalOferta({ abierto, pub, monto, setMonto, enviando, mensaje, onEnviar, onCerrar }: any) {
  if (!abierto || !pub) return null
  const precio = Number(pub.precio) || 0
  const redondear = (v: number) => (precio >= 1000 ? Math.round(v / 100) * 100 : Math.round(v))
  const sugerencias = [5, 10, 15].map(d => redondear(precio * (100 - d) / 100))
  const formato = (n: any) => Number(n).toLocaleString('es-AR')
  return (
    <div className="tcl-modal-fondo" onClick={onCerrar} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div className="tcl-modal-panel" onClick={(e:any)=>e.stopPropagation()} style={{ width:'100%', maxWidth:430, background:T.s1, borderRadius:'20px 20px 0 0', padding:'22px 22px calc(22px + env(safe-area-inset-bottom))', fontFamily:T.font, color:T.text, boxSizing:'border-box' }}>
        <div style={{ fontSize:18, fontWeight:800 }}>Hacer una oferta</div>
        <div style={{ fontSize:12, color:T.muted, marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {pub.titulo} - Precio publicado ${formato(precio)}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:6, margin:'20px 0 14px', borderBottom:'1px solid '+T.border2, paddingBottom:8 }}>
          <span style={{ fontSize:26, fontWeight:700, color:T.muted }}>$</span>
          <input value={monto ? formato(monto) : ''} onChange={(e:any)=>setMonto(String(e.target.value).replace(/[^0-9]/g, '').slice(0, 10))}
            inputMode="numeric" placeholder="0"
            style={{ flex:1, minWidth:0, background:'none', border:'none', outline:'none', color:T.text, fontSize:26, fontWeight:700, fontFamily:T.font }} />
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:6 }}>
          {sugerencias.map((s, i) => (
            <button key={i} onClick={()=>setMonto(String(s))} style={{ flex:1, padding:'9px 4px', borderRadius:20, border:'1px solid '+T.border2, background:'transparent', color:T.sub, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>
              ${formato(s)}
            </button>
          ))}
        </div>

        {mensaje && <p style={{ color:T.red, fontSize:13, margin:'12px 0 0' }}>{mensaje}</p>}

        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={onCerrar} style={{ flex:1, padding:'13px', borderRadius:14, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
            Cancelar
          </button>
          <button onClick={onEnviar} disabled={enviando} style={{ flex:1.4, padding:'13px', borderRadius:14, border:'none', background:G, color:'#0a0a0a', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
            {enviando ? 'Enviando...' : 'Enviar oferta'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalAccionesPub({ pub, onEditar, onVendido, onEliminar, onCerrar }: any) {
  if (!pub) return null
  const fila = (texto: string, onClick: any, color?: string) => (
    <button onClick={onClick} style={{ width:'100%', padding:'16px 4px', background:'none', border:'none', borderBottom:'1px solid '+T.border, color: color || T.text, fontSize:15, fontWeight:500, textAlign:'left', cursor:'pointer', fontFamily:T.font }}>
      {texto}
    </button>
  )
  return (
    <div className="tcl-modal-fondo" onClick={onCerrar} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div className="tcl-modal-panel" onClick={(e:any)=>e.stopPropagation()} style={{ width:'100%', maxWidth:430, background:T.s1, borderRadius:'20px 20px 0 0', padding:'18px 22px calc(18px + env(safe-area-inset-bottom))', fontFamily:T.font, color:T.text, boxSizing:'border-box' }}>
        <div style={{ fontSize:12, color:T.muted, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pub.titulo}</div>
        {fila('Editar publicación', onEditar)}
        {fila(pub.vendida ? 'Volver a publicar' : 'Marcar como vendido', onVendido)}
        {fila('Eliminar', onEliminar, T.red)}
        <button onClick={onCerrar} style={{ width:'100%', padding:'16px 4px 4px', background:'none', border:'none', color:T.muted, fontSize:14, fontWeight:600, textAlign:'center', cursor:'pointer', fontFamily:T.font }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function ModalEditarPub({ pub, titulo, setTitulo, precio, setPrecio, categoria, setCategoria, descripcion, setDescripcion, guardando, mensaje, onGuardar, onCerrar }: any) {
  if (!pub) return null
  const campo: any = { width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid '+T.border2, background:T.s2, color:T.text, fontSize:14, outline:'none', fontFamily:T.font, boxSizing:'border-box' }
  const etiqueta: any = { fontSize:11, color:T.muted, letterSpacing:'0.1em', fontWeight:600, marginBottom:6, marginTop:14 }
  return (
    <div className="tcl-modal-fondo" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="tcl-modal-panel" style={{ width:'100%', maxWidth:390, maxHeight:'90vh', overflowY:'auto', background:T.s1, border:'1px solid '+T.border2, borderRadius:20, padding:'22px 20px', fontFamily:T.font, color:T.text, boxSizing:'border-box' }}>
        <div style={{ fontSize:18, fontWeight:800 }}>Editar publicación</div>
        <div style={etiqueta}>TÍTULO</div>
        <input value={titulo} onChange={(e:any)=>setTitulo(e.target.value)} style={campo} />
        <div style={etiqueta}>PRECIO</div>
        <input value={precio} onChange={(e:any)=>setPrecio(e.target.value)} inputMode="decimal" style={campo} />
        <div style={etiqueta}>CATEGORÍA</div>
        <select value={categoria} onChange={(e:any)=>setCategoria(e.target.value)} style={campo}>
          {CATEGORIAS.filter(c => c !== 'Todo').map(c => <option key={c} value={c}>{c==='Electronica' ? 'Electrónica' : c==='Vehiculos' ? 'Vehículos' : c}</option>)}
        </select>
        <div style={etiqueta}>DESCRIPCIÓN</div>
        <textarea value={descripcion} onChange={(e:any)=>setDescripcion(e.target.value)} rows={4} style={{ ...campo, resize:'none' }} />
        {mensaje && <p style={{ color:T.red, fontSize:13, margin:'12px 0 0' }}>{mensaje}</p>}
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={onCerrar} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
            Cancelar
          </button>
          <button onClick={onGuardar} disabled={guardando} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:G, color:'#0a0a0a', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Estrellas({ valor, size = 14, onElegir }: any) {
  return (
    <div style={{ display:'flex', gap: onElegir ? 10 : 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} onClick={onElegir ? () => onElegir(n) : undefined} width={size} height={size} viewBox="0 0 24 24"
          fill={n <= valor ? T.gold : 'none'} stroke={n <= valor ? T.gold : T.muted} strokeWidth={1.8} strokeLinejoin="round"
          style={{ cursor: onElegir ? 'pointer' : 'default', flexShrink:0 }}>
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </div>
  )
}

function ModalResena({ abierto, nombre, estrellas, setEstrellas, comentario, setComentario, enviando, mensaje, onEnviar, onCerrar }: any) {
  if (!abierto) return null
  return (
    <div className="tcl-modal-fondo" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="tcl-modal-panel" style={{ width:'100%', maxWidth:390, background:T.s1, border:'1px solid '+T.border2, borderRadius:20, padding:'22px 20px', fontFamily:T.font, color:T.text, boxSizing:'border-box' }}>
        <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>Reseña para {nombre}</div>
        <div style={{ fontSize:12, color:T.muted, marginBottom:18 }}>Contá cómo fue tu experiencia.</div>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
          <Estrellas valor={estrellas} size={34} onElegir={setEstrellas} />
        </div>
        <textarea value={comentario} onChange={(e:any)=>setComentario(e.target.value)} maxLength={300} rows={4} placeholder="Comentario (opcional)"
          style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid '+T.border2, background:T.s2, color:T.text, fontSize:14, outline:'none', fontFamily:T.font, boxSizing:'border-box', resize:'none' }} />
        {mensaje && <p style={{ color:T.red, fontSize:13, margin:'12px 0 0' }}>{mensaje}</p>}
        <div style={{ display:'flex', gap:10, marginTop:18 }}>
          <button onClick={onCerrar} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
            Cancelar
          </button>
          <button onClick={onEnviar} disabled={enviando} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:G, color:'#0a0a0a', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
            {enviando ? 'Enviando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function IconoCompartir({ size = 20 }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  )
}

// Acepta "instagram.com/usuario" o un link completo; solo permite http/https. Devuelve '' si no sirve.
function normalizarEnlace(texto: string): string {
  let e = (texto || '').trim()
  if (!e) return ''
  if (!/^https?:\/\//i.test(e)) e = 'https://' + e
  try {
    const u = new URL(e)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return ''
    if (u.hostname.indexOf('.') === -1) return ''
    return u.toString()
  } catch (err) {
    return ''
  }
}

function textoEnlace(url: string): string {
  const s = (url || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
  return s.length > 32 ? s.slice(0, 31) + '…' : s
}

function IconoEnlace({ size = 13 }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function BioPerfil({ bio, enlace }: any) {
  if (!bio && !enlace) return null
  return (
    <>
      {bio ? (
        <div style={{ fontSize:13, color:T.sub, marginTop:10, lineHeight:1.5, maxWidth:300, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{bio}</div>
      ) : null}
      {enlace ? (
        <a href={enlace} target="_blank" rel="noopener noreferrer nofollow" style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:10, fontSize:12, fontWeight:600, color:T.text, textDecoration:'none', border:'1px solid '+T.border2, borderRadius:20, padding:'6px 14px', maxWidth:'100%', boxSizing:'border-box' }}>
          <IconoEnlace />
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{textoEnlace(enlace)}</span>
        </a>
      ) : null}
    </>
  )
}

function Insignias({ usuario, extra, centrado }: any) {
  const completo = !!(usuario && usuario.avatar_url && usuario.ciudad && usuario.bio)
  const rapido = !!(extra && extra.responde_rapido)
  const destacado = !!(extra && extra.destacado)
  if (!completo && !rapido && !destacado) return null
  const pastilla = (texto: string, icono: any, fuerte?: boolean) => (
    <span key={texto} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, color: fuerte ? T.text : T.sub, border:'1px solid '+T.border2, borderRadius:20, padding:'4px 10px' }}>
      {icono}
      {texto}
    </span>
  )
  const svg = (hijos: any, relleno?: string) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={relleno || 'none'} stroke={relleno || 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
      {hijos}
    </svg>
  )
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent: centrado ? 'center' : 'flex-start', marginTop:12 }}>
      {destacado && pastilla('Vendedor destacado', svg(<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />, T.gold), true)}
      {rapido && pastilla('Responde rápido', svg(<path d="M13 2L4 14h7l-1 8 9-12h-7z" />))}
      {completo && pastilla('Perfil completo', svg(<><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></>))}
    </div>
  )
}

// Imagen que aparece suavemente cuando termina de cargar
function Img({ src, alt, style, prioridad, ...resto }: any) {
  const [listo, setListo] = useState(false)
  return (
    <img
      src={src}
      alt={alt || ''}
      loading={prioridad ? 'eager' : 'lazy'}
      decoding="async"
      ref={(el: any) => { if (el && el.complete && el.naturalWidth > 0 && !listo) setListo(true) }}
      onLoad={() => setListo(true)}
      style={{ ...style, opacity: listo ? 1 : 0, transition: 'opacity .35s ease' }}
      {...resto}
    />
  )
}

function Skel({ w, h, r, style }: any) {
  return (
    <div className="tcl-skel" style={{
      width: w, height: h, borderRadius: r === undefined ? 8 : r, flexShrink: 0,
      backgroundImage: 'linear-gradient(90deg,' + T.s2 + ' 25%,' + T.s3 + ' 50%,' + T.s2 + ' 75%)',
      backgroundSize: '800px 100%', ...style
    }} />
  )
}

function SkelTarjetas() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:'22px 12px' }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div key={i}>
          <Skel w="100%" h="auto" r={14} style={{ aspectRatio:'1 / 1' }} />
          <Skel w="70%" h={12} style={{ marginTop:10 }} />
          <Skel w="42%" h={16} style={{ marginTop:8 }} />
          <Skel w="55%" h={10} style={{ marginTop:8 }} />
        </div>
      ))}
    </div>
  )
}

function SkelFilas() {
  return (
    <div>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{ display:'flex', gap:14, alignItems:'center', padding:'14px 18px', borderBottom:'1px solid '+T.border }}>
          <Skel w={54} h={54} r={27} />
          <div style={{ flex:1 }}>
            <Skel w="40%" h={13} />
            <Skel w="75%" h={11} style={{ marginTop:9 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkelPerfil() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0 22px' }}>
      <Skel w={88} h={88} r={44} style={{ marginTop:-40, border:'4px solid '+T.bg, boxSizing:'content-box', position:'relative', zIndex:2 }} />
      <Skel w={160} h={20} style={{ marginTop:14 }} />
      <Skel w={100} h={12} style={{ marginTop:10 }} />
      <Skel w="70%" h={12} style={{ marginTop:18 }} />
      <Skel w="55%" h={12} style={{ marginTop:8 }} />
    </div>
  )
}

function EstadoVacio({ icono, titulo, texto, textoBoton, onBoton }: any) {
  return (
    <div style={{ textAlign:'center', padding:'52px 24px' }}>
      <div style={{ width:64, height:64, borderRadius:'50%', border:'1px solid '+T.border2, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', color:T.muted }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">{icono}</svg>
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:6 }}>{titulo}</div>
      <div style={{ fontSize:13, color:T.muted, lineHeight:1.5 }}>{texto}</div>
      {textoBoton && (
        <button onClick={onBoton} style={{ marginTop:20, background:'none', border:'1px solid '+T.border2, color:T.text, borderRadius:20, padding:'10px 22px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>
          {textoBoton}
        </button>
      )}
    </div>
  )
}

function TarjetaBusqueda({ b, esMia, onResponder, onCerrar }: any) {
  return (
    <div style={{ padding:'18px 0', borderBottom:'1px solid '+T.border }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div style={{ fontSize:15, fontWeight:600, lineHeight:1.35, wordBreak:'break-word', minWidth:0 }}>{b.titulo}</div>
        {b.presupuesto ? (
          <div style={{ fontSize:12, fontWeight:700, flexShrink:0, border:'1px solid '+T.border2, borderRadius:20, padding:'4px 10px' }}>
            Hasta ${Number(b.presupuesto).toLocaleString('es-AR')}
          </div>
        ) : null}
      </div>
      {b.descripcion ? (
        <div style={{ fontSize:13, color:T.sub, lineHeight:1.5, marginTop:6, wordBreak:'break-word' }}>{b.descripcion}</div>
      ) : null}
      <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'4px 12px', fontSize:11, color:T.muted, marginTop:10 }}>
        {b.ciudad ? (
          <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><IconoUbicacion size={11} />{b.ciudad}</span>
        ) : null}
        <span>{b.categoria === 'Electronica' ? 'Electrónica' : b.categoria === 'Vehiculos' ? 'Vehículos' : b.categoria}</span>
        <span>{tiempoTranscurrido(b.fecha)}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginTop:14 }}>
        <div style={{ fontSize:12, color:T.sub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>
          {esMia ? 'Tu pedido' : b.autor_nombre}
        </div>
        {esMia ? (
          <button onClick={onCerrar} style={{ background:'none', border:'1px solid '+T.border2, color:T.sub, borderRadius:20, padding:'8px 16px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font, flexShrink:0 }}>
            Cerrar pedido
          </button>
        ) : (
          <button onClick={onResponder} style={{ background:T.text, border:'none', color:T.bg, borderRadius:20, padding:'8px 18px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:T.font, flexShrink:0 }}>
            Tengo uno
          </button>
        )}
      </div>
    </div>
  )
}
// ==== FIN PARTE 1 de 4 - pega la parte 2 justo debajo ====
// ==== INICIO PARTE 2 de 4 ====
function ModalNuevaBusqueda({ abierto, titulo, setTitulo, desc, setDesc, categoria, setCategoria, presupuesto, setPresupuesto, enviando, mensaje, onEnviar, onCerrar }: any) {
  if (!abierto) return null
  const campo: any = { width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid '+T.border2, background:T.s2, color:T.text, fontSize:14, outline:'none', fontFamily:T.font, boxSizing:'border-box' }
  const etiqueta: any = { fontSize:11, color:T.muted, letterSpacing:'0.1em', fontWeight:600, marginBottom:6, marginTop:14 }
  return (
    <div className="tcl-modal-fondo" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="tcl-modal-panel" style={{ width:'100%', maxWidth:390, maxHeight:'90vh', overflowY:'auto', background:T.s1, border:'1px solid '+T.border2, borderRadius:20, padding:'22px 20px', fontFamily:T.font, color:T.text, boxSizing:'border-box' }}>
        <div style={{ fontSize:18, fontWeight:800 }}>¿Qué estás buscando?</div>
        <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>Los vendedores te van a escribir con lo que tengan.</div>
        <div style={etiqueta}>PEDIDO</div>
        <input value={titulo} onChange={(e:any)=>setTitulo(e.target.value.slice(0, 80))} placeholder="Ej: Bici rodado 29 usada" style={campo} />
        <div style={etiqueta}>DETALLES (OPCIONAL)</div>
        <textarea value={desc} onChange={(e:any)=>setDesc(e.target.value.slice(0, 200))} rows={3} placeholder="Marca, estado, medidas, lo que te importe" style={{ ...campo, resize:'none' }} />
        <div style={etiqueta}>CATEGORÍA</div>
        <select value={categoria} onChange={(e:any)=>setCategoria(e.target.value)} style={campo}>
          {CATEGORIAS.filter(c => c !== 'Todo').map(c => <option key={c} value={c}>{c==='Electronica' ? 'Electrónica' : c==='Vehiculos' ? 'Vehículos' : c}</option>)}
        </select>
        <div style={etiqueta}>PRESUPUESTO MÁXIMO (OPCIONAL)</div>
        <input value={presupuesto ? Number(presupuesto).toLocaleString('es-AR') : ''} onChange={(e:any)=>setPresupuesto(String(e.target.value).replace(/[^0-9]/g, '').slice(0, 10))} inputMode="numeric" placeholder="$" style={campo} />
        {mensaje && <p style={{ color:T.red, fontSize:13, margin:'12px 0 0' }}>{mensaje}</p>}
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={onCerrar} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
            Cancelar
          </button>
          <button onClick={onEnviar} disabled={enviando} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:G, color:'#0a0a0a', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
            {enviando ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalResponderBusqueda({ busqueda, pubs, cargando, seleccion, setSeleccion, enviando, mensaje, onEnviar, onCerrar, onPublicar }: any) {
  if (!busqueda) return null
  return (
    <div className="tcl-modal-fondo" onClick={onCerrar} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div className="tcl-modal-panel" onClick={(e:any)=>e.stopPropagation()} style={{ width:'100%', maxWidth:430, maxHeight:'85vh', overflowY:'auto', background:T.s1, borderRadius:'20px 20px 0 0', padding:'22px 22px calc(22px + env(safe-area-inset-bottom))', fontFamily:T.font, color:T.text, boxSizing:'border-box' }}>
        <div style={{ fontSize:18, fontWeight:800 }}>¿Cuál tenés para ofrecer?</div>
        <div style={{ fontSize:12, color:T.muted, marginTop:4, marginBottom:16, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Pedido: {busqueda.titulo}</div>

        {cargando && <Skel w="100%" h={56} r={12} />}

        {!cargando && pubs.length === 0 && (
          <div style={{ textAlign:'center', padding:'18px 0 6px' }}>
            <div style={{ fontSize:13, color:T.muted, lineHeight:1.5 }}>Todavía no tenés publicaciones activas para ofrecer.</div>
            <button onClick={onPublicar} style={{ marginTop:16, background:'none', border:'1px solid '+T.border2, color:T.text, borderRadius:20, padding:'10px 22px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>
              Publicar ahora
            </button>
          </div>
        )}

        {!cargando && pubs.map((x:any) => {
          const activa = String(seleccion) === String(x.id)
          return (
            <div key={x.id} onClick={()=>setSeleccion(String(x.id))} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px', marginBottom:8, borderRadius:14, border:'1px solid '+(activa ? T.text : T.border), cursor:'pointer' }}>
              {x.foto_url
                ? <Img src={x.foto_url} style={{ width:46, height:46, borderRadius:10, objectFit:'cover', flexShrink:0 }} />
                : <div style={{ width:46, height:46, borderRadius:10, background:T.s2, flexShrink:0 }} />
              }
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{x.titulo}</div>
                <div style={{ fontSize:13, fontWeight:700, marginTop:3 }}>${Number(x.precio).toLocaleString('es-AR')}</div>
              </div>
              <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid '+(activa ? T.text : T.border2), background: activa ? T.text : 'transparent', flexShrink:0 }} />
            </div>
          )
        })}

        {mensaje && <p style={{ color:T.red, fontSize:13, margin:'10px 0 0' }}>{mensaje}</p>}

        {pubs.length > 0 && (
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button onClick={onCerrar} style={{ flex:1, padding:'13px', borderRadius:14, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
              Cancelar
            </button>
            <button onClick={onEnviar} disabled={enviando} style={{ flex:1.4, padding:'13px', borderRadius:14, border:'none', background:G, color:'#0a0a0a', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function IconoPlay({ size = 16 }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" style={{ display:'block' }}>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function IconoUbicacion({ size = 12 }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function IconoAtras({ size = 22 }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function DetalleProducto({ p, vendedor, esFav, esMio, onBack, onFav, onContactar, onReportar, onBloquear, onVerVendedor, onCompartir, onOfertar, insignias, modales }: any) {
  const [idx, setIdx] = useState(0)
  const [menu, setMenu] = useState(false)
  const [pop, setPop] = useState(false)
  const [verMas, setVerMas] = useState(false)
  const toqueX = useRef<any>(null)

  const medios: any[] = []
  if (p.foto_url) medios.push({ tipo:'img', url:p.foto_url })
  if (p.fotos_extra_urls) p.fotos_extra_urls.forEach((u:any)=> medios.push({ tipo:'img', url:u }))
  if (p.video_url) medios.push({ tipo:'video', url:p.video_url })

  function irA(n: number) {
    if (n < 0 || n > medios.length - 1) return
    setIdx(n)
  }

  function inicioToque(e: any) {
    toqueX.current = e.touches[0].clientX
  }

  function finToque(e: any) {
    if (toqueX.current === null) return
    const dx = e.changedTouches[0].clientX - toqueX.current
    toqueX.current = null
    if (dx < -40) irA(idx + 1)
    else if (dx > 40) irA(idx - 1)
  }

  const desc = p.descripcion || ''
  const larga = desc.length > 160
  const ubicacion = vendedor ? [vendedor.ciudad, vendedor.provincia].filter(Boolean).join(', ') : ''
  const ciudadTxt = (vendedor && (vendedor.ciudad || vendedor.provincia)) || p.ubicacion_vendedor || ''
  const nivel = (vendedor && vendedor.nivel_reputacion) ? vendedor.nivel_reputacion : 'Nuevo'
  const colorNivel = (NIVELES[nivel] || NIVELES['Nuevo']).color

  const botonCirculo: any = {
    width:40, height:40, borderRadius:'50%', background:'rgba(0,0,0,0.45)', border:'none',
    display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0
  }

  return (
    <div className="tcl-pantalla" style={{ minHeight:'100vh', width:'100%', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:96, textAlign:'left', boxSizing:'border-box' }}>
      <link href={FONTS} rel="stylesheet" />

      <div onTouchStart={inicioToque} onTouchEnd={finToque} style={{ position:'relative', width:'100%', aspectRatio:'1 / 1', background:T.s2, overflow:'hidden' }}>
        {medios.length === 0 ? (
          <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,'+T.s3+','+T.s4+')', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:T.gold, fontWeight:700, letterSpacing:'0.1em' }}>
            {(p.categoria || '').toUpperCase()}
          </div>
        ) : medios[idx].tipo === 'video' ? (
          <video src={medios[idx].url} controls playsInline preload="metadata" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', background:'#000' }} />
        ) : (
          <Img key={medios[idx].url} src={medios[idx].url} prioridad style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        )}

        <div style={{ position:'absolute', top:12, left:12, right:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={onBack} style={botonCirculo}>
            <IconoAtras />
          </button>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onCompartir} style={botonCirculo}>
              <IconoCompartir />
            </button>
            {!esMio && (
              <>
                <button onClick={()=>{ setPop(true); setTimeout(()=>setPop(false), 450); onFav() }} style={botonCirculo}>
                  <IconoCorazon activo={esFav} animar={pop} />
                </button>
                <button onClick={()=>setMenu(!menu)} style={{ ...botonCirculo, color:'#fff', fontSize:20, fontWeight:'bold', lineHeight:1 }}>
                  ⋯
                </button>
              </>
            )}
          </div>
        </div>

        {menu && (
          <div>
            <div onClick={()=>setMenu(false)} style={{ position:'fixed', inset:0, zIndex:4 }} />
            <div style={{ position:'absolute', top:60, right:12, background:T.s2, border:'1px solid '+T.border2, borderRadius:14, overflow:'hidden', zIndex:5, minWidth:200 }}>
              <button onClick={()=>{ setMenu(false); onReportar() }} style={{ width:'100%', textAlign:'left', padding:'13px 16px', background:'none', border:'none', borderBottom:'1px solid '+T.border, color:T.text, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>
                Reportar publicacion
              </button>
              <button onClick={()=>{ setMenu(false); onBloquear() }} style={{ width:'100%', textAlign:'left', padding:'13px 16px', background:'none', border:'none', color:T.red, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>
                Bloquear vendedor
              </button>
            </div>
          </div>
        )}

        {medios.length > 1 && (
          <div>
            <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 }}>
              {(idx + 1) + '/' + medios.length}
            </div>
            <div style={{ position:'absolute', bottom:16, left:0, right:0, display:'flex', justifyContent:'center', gap:6 }}>
              {medios.map((_:any, i:number)=>(
                <div key={i} onClick={()=>irA(i)} style={{
                  width: i===idx ? 18 : 6, height:6, borderRadius:6, cursor:'pointer',
                  background: i===idx ? T.gold : 'rgba(255,255,255,0.55)', transition:'width 0.2s ease'
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:'22px 20px 0' }}>
        <div style={{ fontSize:28, fontWeight:700, color:T.text, letterSpacing:'-0.02em', lineHeight:1.1 }}>
          ${Number(p.precio).toLocaleString('es-AR')}
          {p.vendida && <span style={{ marginLeft:12, fontSize:11, fontWeight:700, letterSpacing:'0.14em', color:T.muted, border:'1px solid '+T.border2, borderRadius:20, padding:'3px 10px', verticalAlign:'middle' }}>VENDIDO</span>}
        </div>
        <div style={{ fontSize:19, fontWeight:600, marginTop:8, lineHeight:1.3 }}>{p.titulo}</div>
        {ciudadTxt ? (
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:T.sub, marginTop:8 }}>
            <IconoUbicacion size={13} />
            <span>{ciudadTxt}</span>
          </div>
        ) : null}
        <div style={{ fontSize:12, color:T.muted, marginTop:8 }}>
          {p.categoria} · {tiempoTranscurrido(p.fecha_publicacion)} · {p.vistas || 0} vistas
        </div>

        {desc && (
          <div style={{ marginTop:24 }}>
            <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', fontWeight:600, textTransform:'uppercase', marginBottom:8 }}>Descripcion</div>
            <div style={{
              fontSize:14, color:T.sub, lineHeight:1.65, whiteSpace:'pre-wrap',
              ...((larga && !verMas) ? { display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', overflow:'hidden' } : {})
            } as any}>
              {desc}
            </div>
            {larga && (
              <button onClick={()=>setVerMas(!verMas)} style={{ background:'none', border:'none', color:T.gold, fontSize:13, fontWeight:700, cursor:'pointer', padding:'8px 0 0', fontFamily:T.font }}>
                {verMas ? 'Ver menos' : 'Ver mas'}
              </button>
            )}
          </div>
        )}

        <div style={{ height:1, background:T.border, margin:'24px 0' }} />

        {vendedor ? (
          <div onClick={onVerVendedor} style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
            {vendedor.avatar_url
              ? <img src={vendedor.avatar_url} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
              : <div style={{ width:44, height:44, borderRadius:'50%', background:G, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#0a0a0a', flexShrink:0 }}>
                  {(vendedor.nombre || '?').charAt(0).toUpperCase()}
                </div>
            }
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{vendedor.nombre}</div>
              <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{ubicacion || 'Ubicacion no especificada'}</div>
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:colorNivel, border:'1px solid '+colorNivel, borderRadius:20, padding:'3px 10px', flexShrink:0 }}>
              {nivel}
            </div>
            <span style={{ color:T.muted, fontSize:16 }}>{'>'}</span>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Skel w={44} h={44} r={22} />
            <div style={{ flex:1 }}>
              <Skel w="45%" h={13} />
              <Skel w="30%" h={11} style={{ marginTop:8 }} />
            </div>
          </div>
        )}
        {vendedor && <Insignias usuario={vendedor} extra={insignias} />}
      </div>

      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430, background:T.s1, borderTop:'1px solid '+T.border,
        padding:'12px 18px calc(12px + env(safe-area-inset-bottom))', zIndex:70, boxSizing:'border-box'
      }}>
        {esMio ? (
          <div style={{ textAlign:'center', padding:'13px', borderRadius:14, background:T.s2, border:'1px solid '+T.border2, color:T.muted, fontSize:14, fontWeight:700 }}>
            Esta es tu publicacion
          </div>
        ) : p.vendida ? (
          <div style={{ textAlign:'center', padding:'13px', borderRadius:14, background:T.s2, border:'1px solid '+T.border2, color:T.muted, fontSize:14, fontWeight:700 }}>
            Esta publicación ya fue vendida
          </div>
        ) : (
          <div style={{ display:'flex', gap:10 }}>
            {Number(p.precio) > 0 && (
              <button onClick={onOfertar} style={{ flex:1, padding:'13px 10px', borderRadius:14, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:T.font }}>
                Ofertar
              </button>
            )}
            <div style={{ flex:1.6 }}>
              <GBtn full onClick={onContactar}>Contactar vendedor</GBtn>
            </div>
          </div>
        )}
      </div>
      {modales}
    </div>
  )
}

function AuthScreen({ onAuth, onLegal }: any) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  function cambiarModo(m: string) {
    setMode(m)
    setError('')
    setMensajeExito('')
  }

  async function submit() {
    if (!email || !pass) { setError('Completa correo y contrasena'); return }
    if (mode === 'register' && !name) { setError('Completa tu nombre'); return }
    if (pass.length < 6) { setError('La contrasena debe tener al menos 6 caracteres'); return }
    setLoading(true)
    setError('')

    if (mode === 'register') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { nombre: name } }
      })
      if (signUpError) { setLoading(false); setError('Error: ' + signUpError.message); return }
      const authId = data.user?.id
      if (!authId) { setLoading(false); setError('No se pudo crear la cuenta'); return }
      if (!data.session) {
        setLoading(false)
        setMode('login')
        setMensajeExito('Te enviamos un correo para confirmar tu cuenta. Confirmala y despues inicia sesion.')
        return
      }
      const crear = await supabase.from('usuarios').insert([{ auth_id: authId, nombre: name, email }]).select().single()
      setLoading(false)
      if (crear.error) { setError('Error: ' + crear.error.message); return }
      onAuth({ id: crear.data.id, nombre: crear.data.nombre })
    } else {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (loginError) { setLoading(false); setError('Correo o contrasena incorrectos'); return }
      const authId = data.user?.id
      const buscar = await supabase.from('usuarios').select('*').eq('auth_id', authId).maybeSingle()
      let perfil = buscar.data
      if (!perfil && !buscar.error) {
        const meta: any = data.user?.user_metadata
        const nombreMeta = (meta && meta.nombre) ? meta.nombre : email.split('@')[0]
        const crear = await supabase.from('usuarios').insert([{ auth_id: authId, nombre: nombreMeta, email }]).select().single()
        if (!crear.error) perfil = crear.data
      }
      setLoading(false)
      if (!perfil) { setError('No encontramos tu perfil'); return }
      onAuth({ id: perfil.id, nombre: perfil.nombre })
    }
  }

  async function enviarRecuperacion() {
    if (!email) { setError('Ingresa tu correo'); return }
    setLoading(true)
    setError('')
    setMensajeExito('')
    const { error: recError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: REDIRECT_URL })
    setLoading(false)
    if (recError) { setError('Error: ' + recError.message); return }
    setMensajeExito('Listo! Si ese correo tiene cuenta, te enviamos un link para elegir una nueva contrasena. Revisa tambien la carpeta de spam.')
  }

  return (
    <div className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', fontFamily:T.font }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{ width:68, height:68, borderRadius:22, background:G, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 0 36px '+T.glow, fontSize:22, color:'#0a0a0a', fontWeight:'bold' }}>TCL</div>
        <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:28, background:G, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700 }}>Tu Changarro Libre</div>
        <div style={{ fontSize:10, color:T.muted, letterSpacing:'0.2em', marginTop:5, fontWeight:800 }}>MARKETPLACE</div>
      </div>

      <div style={{ width:'100%', maxWidth:390, background:T.s1, borderRadius:24, padding:'28px 24px', border:'1px solid '+T.border2 }}>

        {mode === 'recuperar' ? (
          <div>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:6, color:T.text }}>Recuperar contrasena</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:22, lineHeight:1.5 }}>
              Ingresa tu correo y te enviamos un link para elegir una contrasena nueva.
            </div>
            <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Correo electronico</label>
            <div style={{ marginBottom:22 }}>
              <Input value={email} onChange={(e:any)=>setEmail(e.target.value)} placeholder="tu@email.com" type="email" />
            </div>
            <GBtn full disabled={!email||loading} onClick={enviarRecuperacion}>
              {loading?'Enviando...':'Enviar link de recuperacion'}
            </GBtn>
            <button onClick={()=>cambiarModo('login')} style={{ width:'100%', marginTop:16, background:'none', border:'none', color:T.gold, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:T.font }}>
              ← Volver a iniciar sesion
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display:'flex', marginBottom:24, background:T.s2, borderRadius:13, padding:4 }}>
              {['login','register'].map(m=>(
                <button key={m} onClick={()=>cambiarModo(m)} style={{ flex:1, padding:10, borderRadius:10, background:mode===m?T.s4:'transparent', border:'none', color:mode===m?T.text:T.muted, fontFamily:T.font, fontWeight:mode===m?700:500, fontSize:14, cursor:'pointer' }}>
                  {m==='login'?'Iniciar sesion':'Registrarse'}
                </button>
              ))}
            </div>
            {mode==='register'&&(
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Tu nombre</label>
                <Input value={name} onChange={(e:any)=>setName(e.target.value)} placeholder="Ej: Ana Garcia" />
              </div>
            )}
            <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Correo electronico</label>
            <div style={{ marginBottom:16 }}><Input value={email} onChange={(e:any)=>setEmail(e.target.value)} placeholder="tu@email.com" type="email" /></div>
            <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Contrasena</label>
            <div style={{ position:'relative', marginBottom: mode==='login' ? 10 : 22 }}>
              <Input value={pass} onChange={(e:any)=>setPass(e.target.value)} placeholder="Minimo 6 caracteres" type={showPass?'text':'password'} />
              <button onClick={()=>setShowPass(s=>!s)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:T.muted, cursor:'pointer', fontSize:13 }}>
                {showPass?'Ocultar':'Ver'}
              </button>
            </div>
            {mode==='login' && (
              <div style={{ textAlign:'right', marginBottom:18 }}>
                <button onClick={()=>cambiarModo('recuperar')} style={{ background:'none', border:'none', color:T.gold, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:T.font, padding:0 }}>
                  Olvidaste tu contrasena?
                </button>
              </div>
            )}
            <GBtn full disabled={!email||!pass||loading} onClick={submit}>
              {loading?'Conectando...':mode==='login'?'Entrar al changarro':'Crear cuenta'}
            </GBtn>
          </div>
        )}

        {error&&<p style={{ marginTop:14, color:T.red, fontSize:13, textAlign:'center' }}>{error}</p>}
        {mensajeExito&&<p style={{ marginTop:14, color:T.green, fontSize:13, textAlign:'center', lineHeight:1.5 }}>{mensajeExito}</p>}
      </div>

      <div style={{ width:'100%', maxWidth:390, marginTop:18, fontSize:11, color:T.muted, textAlign:'center', lineHeight:1.7 }}>
        Al continuar aceptas los{' '}
        <span onClick={()=>onLegal('terminos')} style={{ color:T.gold, fontWeight:700, cursor:'pointer' }}>Terminos y condiciones</span>
        {' y la '}
        <span onClick={()=>onLegal('privacidad')} style={{ color:T.gold, fontWeight:700, cursor:'pointer' }}>Politica de privacidad</span>
        {'. '}
        <span onClick={()=>onLegal('ayuda')} style={{ color:T.gold, fontWeight:700, cursor:'pointer' }}>Ayuda</span>
      </div>
    </div>
  )
}

function NuevaPasswordScreen({ onDone }: any) {
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  async function guardar() {
    if (pass.length < 6) { setError('La contrasena debe tener al menos 6 caracteres'); return }
    if (pass !== pass2) { setError('Las contrasenas no coinciden'); return }
    setLoading(true)
    setError('')
    const { error: upError } = await supabase.auth.updateUser({ password: pass })
    setLoading(false)
    if (upError) { setError('Error: ' + upError.message); return }
    setExito(true)
  }

  return (
    <div className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', fontFamily:T.font }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{ width:68, height:68, borderRadius:22, background:G, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 0 36px '+T.glow, fontSize:22, color:'#0a0a0a', fontWeight:'bold' }}>TCL</div>
        <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:24, background:G, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700 }}>Tu Changarro Libre</div>
      </div>

      <div style={{ width:'100%', maxWidth:390, background:T.s1, borderRadius:24, padding:'28px 24px', border:'1px solid '+T.border2 }}>
        {exito ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:8, color:T.green }}>Contrasena actualizada</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:22, lineHeight:1.5 }}>
              Ya podes entrar al changarro con tu nueva contrasena.
            </div>
            <GBtn full onClick={onDone}>Iniciar sesion</GBtn>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:6, color:T.text }}>Elegi tu nueva contrasena</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:22, lineHeight:1.5 }}>
              Escribila dos veces para confirmar. Minimo 6 caracteres.
            </div>

            <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Nueva contrasena</label>
            <div style={{ position:'relative', marginBottom:16 }}>
              <Input value={pass} onChange={(e:any)=>setPass(e.target.value)} placeholder="Nueva contrasena" type={showPass?'text':'password'} />
              <button onClick={()=>setShowPass(s=>!s)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:T.muted, cursor:'pointer', fontSize:13 }}>
                {showPass?'Ocultar':'Ver'}
              </button>
            </div>

            <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Repetir contrasena</label>
            <div style={{ marginBottom:22 }}>
              <Input value={pass2} onChange={(e:any)=>setPass2(e.target.value)} placeholder="Repeti la contrasena" type={showPass?'text':'password'} />
            </div>

            <GBtn full disabled={!pass||!pass2||loading} onClick={guardar}>
              {loading?'Guardando...':'Guardar nueva contrasena'}
            </GBtn>
            {error&&<p style={{ marginTop:14, color:T.red, fontSize:13, textAlign:'center' }}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [checandoSesion, setCheandoSesion] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(LLEGO_DE_RECUPERACION)
  const [legalAuth, setLegalAuth] = useState<any>(null)
  const [userId, setUserId] = useState<any>(null)
  const [, setUserName] = useState('')
  const [productos, setProductos] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [favoritos, setFavoritos] = useState<any[]>([])
  const [sinLeer, setSinLeer] = useState(0)
  const [catActiva, setCatActiva] = useState('Todo')
  const [busqueda, setBusqueda] = useState('')
  const [filtroCiudad, setFiltroCiudad] = useState('')
  const [menuPub, setMenuPub] = useState<any>(null)
  const [seccionHome, setSeccionHome] = useState('publicaciones')
  const [busquedas, setBusquedas] = useState<any[]>([])
  const [cargandoBusq, setCargandoBusq] = useState(false)
  const [busqNuevaAbierta, setBusqNuevaAbierta] = useState(false)
  const [bTitulo, setBTitulo] = useState('')
  const [bDesc, setBDesc] = useState('')
  const [bCat, setBCat] = useState('Otro')
  const [bPres, setBPres] = useState('')
  const [enviandoBusq, setEnviandoBusq] = useState(false)
  const [mensajeBusq, setMensajeBusq] = useState('')
  const [busqResponder, setBusqResponder] = useState<any>(null)
  const [misPubsResp, setMisPubsResp] = useState<any[]>([])
  const [cargandoResp, setCargandoResp] = useState(false)
  const [respSeleccion, setRespSeleccion] = useState('')
  const [enviandoResp, setEnviandoResp] = useState(false)
  const [mensajeResp, setMensajeResp] = useState('')
  const [favAnim, setFavAnim] = useState<any>(null)
  const [detalleInsignias, setDetalleInsignias] = useState<any>(null)
  const [vendInsignias, setVendInsignias] = useState<any>(null)
  const [misInsignias, setMisInsignias] = useState<any>(null)
  const [ofertaAbierta, setOfertaAbierta] = useState(false)
  const [ofertaMonto, setOfertaMonto] = useState('')
  const [enviandoOferta, setEnviandoOferta] = useState(false)
  const [mensajeOferta, setMensajeOferta] = useState('')
  const [panelResenas, setPanelResenas] = useState<any>(null)
  const [pubCompartida, setPubCompartida] = useState<string | null>(PUB_COMPARTIDA)
  const [vendPerfil, setVendPerfil] = useState<any>(null)
  const [vendPubs, setVendPubs] = useState<any[]>([])
  const [vendResenas, setVendResenas] = useState<any[]>([])
  const [cargandoVend, setCargandoVend] = useState(false)
  const [resenaAbierta, setResenaAbierta] = useState(false)
  const [resenaEstrellas, setResenaEstrellas] = useState(0)
  const [resenaTexto, setResenaTexto] = useState('')
  const [enviandoResena, setEnviandoResena] = useState(false)
  const [mensajeResena, setMensajeResena] = useState('')
  const [editPub, setEditPub] = useState<any>(null)
  const [pubEditTitulo, setPubEditTitulo] = useState('')
  const [pubEditPrecio, setPubEditPrecio] = useState('')
  const [pubEditCategoria, setPubEditCategoria] = useState('Electronica')
  const [pubEditDescripcion, setPubEditDescripcion] = useState('')
  const [guardandoPubEdit, setGuardandoPubEdit] = useState(false)
  const [mensajePubEdit, setMensajePubEdit] = useState('')
  const [orden, setOrden] = useState('recientes')
  const [chatProducto, setChatProducto] = useState<any>(null)
  const [chatOtroUsuario, setChatOtroUsuario] = useState<any>(null)
  const [chatOtroNombre, setChatOtroNombre] = useState('')
  const [chatOrigen, setChatOrigen] = useState('home')
  const [chatMensajes, setChatMensajes] = useState<any[]>([])
  const [chatTexto, setChatTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [menuChat, setMenuChat] = useState(false)
  const [vista, setVista] = useState('home')
  const [titulo, setTitulo] = useState('')
  const [precio, setPrecio] = useState('')
  const [categoria, setCategoria] = useState('Electronica')
  const [descripcion, setDescripcion] = useState('')
  const [fotoFiles, setFotoFiles] = useState<any[]>([])
  const [fotoPreviews, setFotoPreviews] = useState<any[]>([])
  const [videoFile, setVideoFile] = useState<any>(null)
  const [videoPreview, setVideoPreview] = useState<any>(null)
  const [publicando, setPublicando] = useState(false)
  const [mensajePublicar, setMensajePublicar] = useState('')

  const [perfilData, setPerfilData] = useState<any>(null)
  const [misPublicaciones, setMisPublicaciones] = useState<any[]>([])
  const [cargandoPerfil, setCargandoPerfil] = useState(false)

  const [misMensajes, setMisMensajes] = useState<any[]>([])
  const [cargandoMensajes, setCargandoMensajes] = useState(false)

  const [editNombre, setEditNombre] = useState('')
  const [editCiudad, setEditCiudad] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editEnlace, setEditEnlace] = useState('')
  const [editProvincia, setEditProvincia] = useState('')
  const [avatarFile, setAvatarFile] = useState<any>(null)
  const [avatarPreview, setAvatarPreview] = useState<any>(null)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [mensajeEditar, setMensajeEditar] = useState('')

  const [isDarkMode, setIsDarkMode] = useState(true)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false)
  const [mensajeConfig, setMensajeConfig] = useState('')

  const [detalleProducto, setDetalleProducto] = useState<any>(null)
  const [detalleIndex, setDetalleIndex] = useState(0)
  const [detalleVendedor, setDetalleVendedor] = useState<any>(null)
  const [detalleOrigen, setDetalleOrigen] = useState('home')

  const [bloqueados, setBloqueados] = useState<any[]>([])
  const [bloqueadosInfo, setBloqueadosInfo] = useState<any[]>([])
  const [cargandoBloqueados, setCargandoBloqueados] = useState(false)
  const [bloqueoObjetivo, setBloqueoObjetivo] = useState<any>(null)
  const [bloqueando, setBloqueando] = useState(false)
  const [reporteObjetivo, setReporteObjetivo] = useState<any>(null)
  const [reporteMotivo, setReporteMotivo] = useState('')
  const [reporteDetalle, setReporteDetalle] = useState('')
  const [enviandoReporte, setEnviandoReporte] = useState(false)
  const [mensajeReporte, setMensajeReporte] = useState('')
  const [reporteEnviado, setReporteEnviado] = useState(false)

  async function handleAuth(user: any) {
    setUserId(user.id)
    setUserName(user.nombre)
    setAuthed(true)
    await cargarProductos()
    await cargarFavoritos(user.id)
    await cargarBloqueos(user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const authId = data.session.user.id
        const res = await supabase.from('usuarios').select('*').eq('auth_id', authId).maybeSingle()
        if (res.data) await handleAuth({ id: res.data.id, nombre: res.data.nombre })
      }
      setCheandoSesion(false)
    })
  }, [])

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event: any) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
    })
    return () => { listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (userId) cargarSinLeer(userId)
  }, [userId, vista])

  useEffect(() => {
    if (!userId || !pubCompartida) return
    const id = pubCompartida
    setPubCompartida(null)
    window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    supabase.from('publicaciones').select('*').eq('id', id).maybeSingle().then(async (res: any) => {
      if (res.error || !res.data) { window.alert('Esta publicación ya no está disponible.'); return }
      const pub = res.data
      const rU = await supabase.from('usuarios').select('ciudad,provincia').eq('id', pub.vendedor_id).maybeSingle()
      pub.ubicacion_vendedor = rU.data ? (rU.data.ciudad || rU.data.provincia || '') : ''
      abrirDetalle(pub, 'home')
    })
  }, [userId])

  function compartirPublicacion(pub: any, vend: any) {
    const ciudad = (vend && (vend.ciudad || vend.provincia)) || pub.ubicacion_vendedor || ''
    const link = URL_APP + '/?p=' + pub.id
    const texto = pub.titulo + ' - $' + Number(pub.precio).toLocaleString('es-AR') + (ciudad ? ' - ' + ciudad : '') + '\nMirala en Tu Changarro Libre: ' + link
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank')
  }

  async function cargarSinLeer(uid?: any) {
    const id = uid || userId
    if (!id) return
    const res = await supabase.from('mensajes').select('id', { count: 'exact', head: true }).eq('receptor_id', id).eq('leido', false)
    if (!res.error) setSinLeer(res.count || 0)
  }

  async function cargarProductos() {
    setCargando(true)
    const res = await supabase.from('publicaciones').select('*').order('fecha_publicacion', { ascending: false })
    if (res.error) { setCargando(false); return }
    const lista: any[] = res.data || []
    const ids = Array.from(new Set(lista.map((p:any) => p.vendedor_id).filter(Boolean)))
    const mapa: any = {}
    if (ids.length > 0) {
      const resU = await supabase.from('usuarios').select('id,ciudad,provincia').in('id', ids)
      if (!resU.error && resU.data) {
        resU.data.forEach((u:any) => { mapa[u.id] = u.ciudad || u.provincia || '' })
      }
    }
    setProductos(lista.map((p:any) => ({ ...p, ubicacion_vendedor: mapa[p.vendedor_id] || '' })))
    setCargando(false)
  }

  async function cargarFavoritos(uid: any) {
    const res = await supabase.from('favoritos').select('publicacion_id').eq('usuario_id', uid)
    if (!res.error) setFavoritos(res.data.map((f:any) => f.publicacion_id))
  }

  async function cargarBloqueos(uid: any) {
    const res = await supabase.from('bloqueos').select('bloqueado_id').eq('bloqueador_id', uid)
    if (!res.error) setBloqueados(res.data.map((b:any) => b.bloqueado_id))
  }

  async function bloquearUsuario(otroId: any) {
    const res = await supabase.from('bloqueos').insert([{ bloqueador_id: userId, bloqueado_id: otroId }])
    if (!res.error || res.error.code === '23505') {
      if (!bloqueados.includes(otroId)) setBloqueados([...bloqueados, otroId])
      return true
    }
    return false
  }

  async function confirmarBloqueo() {
    if (!bloqueoObjetivo) return
    setBloqueando(true)
    const ok = await bloquearUsuario(bloqueoObjetivo.usuarioId)
    setBloqueando(false)
    setBloqueoObjetivo(null)
    if (ok) {
      setVista('home')
    } else {
      window.alert('No se pudo bloquear. Intenta de nuevo.')
    }
  }

  async function abrirBloqueados() {
    setVista('bloqueados')
    setCargandoBloqueados(true)
    if (bloqueados.length === 0) {
      setBloqueadosInfo([])
      setCargandoBloqueados(false)
      return
    }
    const res = await supabase.from('usuarios').select('id,nombre,avatar_url').in('id', bloqueados)
    setCargandoBloqueados(false)
    if (!res.error) setBloqueadosInfo(res.data)
  }

  async function desbloquearUsuario(otroId: any) {
    const res = await supabase.from('bloqueos').delete().eq('bloqueador_id', userId).eq('bloqueado_id', otroId)
    if (!res.error) {
      setBloqueados(bloqueados.filter((id:any) => id !== otroId))
      setBloqueadosInfo(bloqueadosInfo.filter((u:any) => u.id !== otroId))
    }
  }

  function abrirReporte(obj: any) {
    setReporteObjetivo(obj)
    setReporteMotivo('')
    setReporteDetalle('')
    setMensajeReporte('')
    setReporteEnviado(false)
  }

  function cerrarReporte() {
    setReporteObjetivo(null)
    setReporteEnviado(false)
  }

  async function enviarReporte() {
    if (!reporteMotivo) { setMensajeReporte('Elegi un motivo'); return }
    setEnviandoReporte(true)
    setMensajeReporte('')
    const motivoFinal = reporteMotivo + (reporteDetalle.trim() ? ': ' + reporteDetalle.trim() : '')
    const res = await supabase.from('reportes').insert([{
      reportante_id: userId,
      publicacion_id: reporteObjetivo.publicacionId || null,
      usuario_reportado_id: reporteObjetivo.usuarioId || null,
      motivo: motivoFinal
    }])
    setEnviandoReporte(false)
    if (res.error) { setMensajeReporte('Error: ' + res.error.message); return }
    setReporteEnviado(true)
  }
// ==== FIN PARTE 2 de 4 - pega la parte 3 justo debajo ====
// ==== INICIO PARTE 3 de 4 ====
async function toggleFavorito(pubId: any) {
  const esFav = favoritos.includes(pubId)
  if (esFav) {
    await supabase.from('favoritos').delete().eq('usuario_id', userId).eq('publicacion_id', pubId)
    setFavoritos(favoritos.filter(id => id !== pubId))
  } else {
    await supabase.from('favoritos').insert([{ usuario_id: userId, publicacion_id: pubId }])
    setFavoritos([...favoritos, pubId])
  }
}

function animarFav(id: any) {
  setFavAnim(id)
  setTimeout(() => setFavAnim(null), 450)
}

async function pedirInsignias(id: any) {
  const r = await supabase.rpc('insignias_vendedor', { p_vendedor: String(id) })
  return (!r.error && r.data) ? r.data : null
}

async function abrirDetalle(p: any, origen: string = 'home') {
  if (p.vendedor_id !== userId) {
    supabase.from('publicaciones').update({ vistas: (p.vistas || 0) + 1 }).eq('id', p.id).then(()=>{})
  }
  setDetalleProducto(p)
  setDetalleIndex(0)
  setDetalleVendedor(null)
  setDetalleInsignias(null)
  setDetalleOrigen(origen)
  setVista('detalle')
  const resVend = await supabase.from('usuarios').select('nombre,ciudad,provincia,nivel_reputacion,avatar_url,bio').eq('id', p.vendedor_id).maybeSingle()
  if (!resVend.error) setDetalleVendedor(resVend.data)
  pedirInsignias(p.vendedor_id).then(setDetalleInsignias)
}

async function abrirChat(p: any, otroUsuarioId: any, origen: string = 'home', nombreOtro: string = '') {
  if (otroUsuarioId === userId) return
  setChatProducto(p)
  setChatOtroUsuario(otroUsuarioId)
  setChatOtroNombre(nombreOtro || '')
  setChatOrigen(origen)
  setChatMensajes([])
  setMenuChat(false)
  setVista('chat')
  const filtro =
    'and(emisor_id.eq.' + userId + ',receptor_id.eq.' + otroUsuarioId + '),' +
    'and(emisor_id.eq.' + otroUsuarioId + ',receptor_id.eq.' + userId + ')'
  const res = await supabase.from('mensajes')
    .select('*')
    .eq('publicacion_id', p.id)
    .or(filtro)
    .order('fecha', { ascending: true })
  if (!res.error) {
    setChatMensajes(res.data)
    await supabase.rpc('marcar_mensajes_leidos', { p_pub: String(p.id), p_otro: String(otroUsuarioId) })
    cargarSinLeer()
  }
}

useEffect(() => {
  if (userId && seccionHome === 'busquedas') cargarBusquedas()
}, [userId, seccionHome])

async function cargarBusquedas() {
  setCargandoBusq(true)
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const res = await supabase.from('busquedas').select('*').eq('activa', true).gte('fecha', desde).order('fecha', { ascending: false }).limit(100)
  if (res.error) { setBusquedas([]); setCargandoBusq(false); return }
  const lista: any[] = res.data || []
  const ids = Array.from(new Set(lista.map((b:any) => b.usuario_id)))
  const mapa: any = {}
  if (ids.length > 0) {
    const rU = await supabase.from('usuarios').select('id,nombre').in('id', ids)
    if (!rU.error && rU.data) rU.data.forEach((u:any) => { mapa[String(u.id)] = u.nombre })
  }
  setBusquedas(lista.map((b:any) => ({ ...b, autor_nombre: mapa[String(b.usuario_id)] || 'Usuario' })))
  setCargandoBusq(false)
}

async function crearBusqueda() {
  const tituloLimpio = bTitulo.trim()
  if (tituloLimpio.length < 3) { setMensajeBusq('Escribí qué estás buscando'); return }
  setEnviandoBusq(true)
  setMensajeBusq('')
  const rU = await supabase.from('usuarios').select('ciudad,provincia').eq('id', userId).maybeSingle()
  const ciudad = rU.data ? (rU.data.ciudad || rU.data.provincia || '') : ''
  const pres = Number(String(bPres).replace(/[^0-9]/g, ''))
  const res = await supabase.rpc('crear_busqueda', {
    p_titulo: tituloLimpio, p_descripcion: bDesc.trim(), p_categoria: bCat,
    p_presupuesto: pres > 0 ? pres : null, p_ciudad: ciudad
  })
  setEnviandoBusq(false)
  if (res.error) {
    const m = res.error.message || ''
    setMensajeBusq(m.indexOf('limite') !== -1 ? 'Ya tenés 5 pedidos activos. Cerrá alguno para publicar otro.' : 'No se pudo publicar: ' + m)
    return
  }
  setBusqNuevaAbierta(false)
  setBTitulo('')
  setBDesc('')
  setBPres('')
  cargarBusquedas()
}

async function cerrarBusqueda(b: any) {
  if (!window.confirm('¿Cerrar este pedido? Deja de mostrarse para los demás.')) return
  const res = await supabase.rpc('cerrar_busqueda', { p_id: b.id })
  if (res.error) { window.alert('No se pudo cerrar: ' + res.error.message); return }
  cargarBusquedas()
}

async function abrirResponder(b: any) {
  setBusqResponder(b)
  setRespSeleccion('')
  setMensajeResp('')
  setMisPubsResp([])
  setCargandoResp(true)
  const res = await supabase.from('publicaciones').select('*').eq('vendedor_id', userId).order('fecha_publicacion', { ascending: false })
  setMisPubsResp((res.data || []).filter((x:any) => !x.vendida))
  setCargandoResp(false)
}

async function enviarRespuestaBusqueda() {
  if (!busqResponder) return
  const pub = misPubsResp.find((x:any) => String(x.id) === String(respSeleccion))
  if (!pub) { setMensajeResp('Elegí una de tus publicaciones'); return }
  setEnviandoResp(true)
  setMensajeResp('')
  const texto = 'Hola! Vi que buscás "' + busqResponder.titulo + '". Tengo esto: "' + pub.titulo + '" ($' + Number(pub.precio).toLocaleString('es-AR') + '). ¿Te interesa?'
  const res = await supabase.from('mensajes').insert([{ emisor_id: userId, receptor_id: busqResponder.usuario_id, publicacion_id: pub.id, contenido: texto }])
  setEnviandoResp(false)
  if (res.error) { setMensajeResp('No se pudo enviar: ' + res.error.message); return }
  const destino = busqResponder
  setBusqResponder(null)
  abrirChat(pub, destino.usuario_id, 'home', destino.autor_nombre || '')
}

function abrirOferta() {
  setOfertaMonto('')
  setMensajeOferta('')
  setOfertaAbierta(true)
}

async function enviarOferta() {
  if (!detalleProducto) return
  const pub = detalleProducto
  const monto = Number(String(ofertaMonto).replace(/[^0-9]/g, ''))
  if (!monto || monto < 1) { setMensajeOferta('Ingresá un monto'); return }
  if (monto >= Number(pub.precio)) { setMensajeOferta('La oferta tiene que ser menor al precio publicado'); return }
  setEnviandoOferta(true)
  setMensajeOferta('')
  const texto = 'Hola! Te ofrezco $' + monto.toLocaleString('es-AR') + ' por "' + pub.titulo + '". ¿Te interesa?'
  const res = await supabase.from('mensajes').insert([{ emisor_id: userId, receptor_id: pub.vendedor_id, publicacion_id: pub.id, contenido: texto }])
  setEnviandoOferta(false)
  if (res.error) { setMensajeOferta('No se pudo enviar: ' + res.error.message); return }
  setOfertaAbierta(false)
  abrirChat(pub, pub.vendedor_id, 'detalle', detalleVendedor?.nombre || '')
}

async function enviarMensaje() {
  if (!chatTexto.trim()) return
  setEnviando(true)
  const res = await supabase.from('mensajes').insert([{ emisor_id: userId, receptor_id: chatOtroUsuario, publicacion_id: chatProducto.id, contenido: chatTexto }]).select().single()
  setEnviando(false)
  if (!res.error) { setChatMensajes([...chatMensajes, res.data]); setChatTexto('') }
}

function handleFotos(e: any) {
  const files = Array.from(e.target.files || []) as any[]
  if (files.length === 0) return
  setFotoFiles(prev => [...prev, ...files])
  const previews = files.map((f:any) => URL.createObjectURL(f))
  setFotoPreviews(prev => [...prev, ...previews])
  e.target.value = ''
}

function quitarFoto(idx: number) {
  setFotoFiles(prev => prev.filter((_,i)=>i!==idx))
  setFotoPreviews(prev => prev.filter((_,i)=>i!==idx))
}

function handleVideo(e: any) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 50 * 1024 * 1024) {
    setMensajePublicar('El video pesa mas de 50 MB. Elegi uno mas corto.')
    e.target.value = ''
    return
  }
  setMensajePublicar('')
  const input = e.target
  const urlTemp = URL.createObjectURL(file)
  const v = document.createElement('video')
  v.preload = 'metadata'
  v.onloadedmetadata = () => {
    const dur = v.duration
    if (dur && isFinite(dur) && dur > 31) {
      URL.revokeObjectURL(urlTemp)
      setMensajePublicar('El video dura mas de 30 segundos. Elegi uno mas corto.')
      input.value = ''
      return
    }
    setVideoFile(file)
    setVideoPreview(urlTemp)
  }
  v.onerror = () => {
    setVideoFile(file)
    setVideoPreview(urlTemp)
  }
  v.src = urlTemp
}

function handleAvatar(e: any) {
  const file = e.target.files[0]
  if (!file) return
  setAvatarFile(file)
  const reader = new FileReader()
  reader.onload = (ev:any) => setAvatarPreview(ev.target.result)
  reader.readAsDataURL(file)
}

async function publicar() {
  if (!titulo || !precio) { setMensajePublicar('Completa titulo y precio'); return }
  setPublicando(true)
  setMensajePublicar('')

  let fotoUrl = null
  let fotosExtra: string[] = []
  if (fotoFiles.length > 0) {
    setMensajePublicar('Optimizando fotos...')
    for (let i = 0; i < fotoFiles.length; i++) {
      const original = fotoFiles[i]
      const file = await comprimirImagen(original, 1280, 0.8)
      const nueva = file !== original
      const ext = nueva ? 'jpg' : original.name.split('.').pop()
      const path = userId + '-' + Date.now() + '-' + i + '.' + ext
      const subida = await supabase.storage.from('fotos').upload(path, file, { contentType: nueva ? 'image/jpeg' : original.type, cacheControl: '31536000' })
      if (subida.error) { setPublicando(false); setMensajePublicar('Error subiendo una foto: ' + subida.error.message); return }
      const url = supabase.storage.from('fotos').getPublicUrl(path).data.publicUrl
      if (i === 0) fotoUrl = url
      else fotosExtra.push(url)
    }
    setMensajePublicar('')
  }

  let videoUrl = null
  if (videoFile) {
    const ext = videoFile.name.split('.').pop()
    const path = userId + '-' + Date.now() + '-v.' + ext
    const subidaVideo = await supabase.storage.from('videos').upload(path, videoFile, { cacheControl: '31536000' })
    if (!subidaVideo.error) { const url = supabase.storage.from('videos').getPublicUrl(path); videoUrl = url.data.publicUrl }
    else { setPublicando(false); setMensajePublicar('Error subiendo el video: ' + subidaVideo.error.message); return }
  }

  const res = await supabase.from('publicaciones').insert([{
    vendedor_id: userId, titulo, precio: Number(precio), categoria, descripcion,
    foto_url: fotoUrl, fotos_extra_urls: fotosExtra.length ? fotosExtra : null, video_url: videoUrl
  }]).select().single()
  setPublicando(false)
  if (res.error) { setMensajePublicar('Error: ' + res.error.message); return }
  setTitulo(''); setPrecio(''); setDescripcion(''); setFotoFiles([]); setFotoPreviews([]); setVideoFile(null); setVideoPreview(null)
  setVista('home')
  cargarProductos()
}

async function abrirPerfil() {
  setVista('perfil')
  setCargandoPerfil(true)
  const [resUsuario, resPublicaciones] = await Promise.all([
    supabase.from('usuarios').select('*').eq('id', userId).single(),
    supabase.from('publicaciones').select('*').eq('vendedor_id', userId).order('fecha_publicacion', { ascending: false })
  ])
  setCargandoPerfil(false)
  if (!resUsuario.error) setPerfilData(resUsuario.data)
  pedirInsignias(userId).then(setMisInsignias)
  if (!resPublicaciones.error) setMisPublicaciones(resPublicaciones.data)
}

async function abrirPanel() {
  setPanelResenas(null)
  setVista('panel')
  const res = await supabase.from('resenas').select('estrellas').eq('vendedor_id', String(userId))
  if (!res.error && res.data) {
    const n = res.data.length
    setPanelResenas({ n: n, prom: n > 0 ? res.data.reduce((a:number, r:any) => a + r.estrellas, 0) / n : 0 })
  }
}

async function abrirVendedor(id: any) {
  setVendPerfil(null)
  setVendPubs([])
  setVendResenas([])
  setVendInsignias(null)
  setCargandoVend(true)
  setVista('vendedor')
  const [rU, rP, rR] = await Promise.all([
    supabase.from('usuarios').select('id,nombre,ciudad,provincia,nivel_reputacion,avatar_url,cantidad_ventas,bio,enlace').eq('id', id).maybeSingle(),
    supabase.from('publicaciones').select('*').eq('vendedor_id', id).order('fecha_publicacion', { ascending: false }),
    supabase.from('resenas').select('*').eq('vendedor_id', String(id)).order('fecha', { ascending: false }).limit(100)
  ])
  const usuario: any = rU.data
  const ciudad = usuario ? (usuario.ciudad || usuario.provincia || '') : ''
  setVendPerfil(usuario)
  pedirInsignias(id).then(setVendInsignias)
  setVendPubs((rP.data || []).filter((x:any) => !x.vendida).map((x:any) => ({ ...x, ubicacion_vendedor: ciudad })))
  let resenas: any[] = rR.error ? [] : (rR.data || [])
  const ids = Array.from(new Set(resenas.map((r:any) => r.autor_id)))
  const mapa: any = {}
  if (ids.length > 0) {
    const rA = await supabase.from('usuarios').select('id,nombre').in('id', ids)
    if (!rA.error && rA.data) rA.data.forEach((u:any) => { mapa[String(u.id)] = u.nombre })
  }
  resenas = resenas.map((r:any) => ({ ...r, autor_nombre: mapa[String(r.autor_id)] || 'Usuario' }))
  setVendResenas(resenas)
  setCargandoVend(false)
}

function abrirModalResena() {
  const mia = vendResenas.find((r:any) => String(r.autor_id) === String(userId))
  setResenaEstrellas(mia ? mia.estrellas : 0)
  setResenaTexto(mia ? (mia.comentario || '') : '')
  setMensajeResena('')
  setResenaAbierta(true)
}

async function enviarResena() {
  if (!vendPerfil) return
  if (resenaEstrellas < 1) { setMensajeResena('Elegí de 1 a 5 estrellas'); return }
  setEnviandoResena(true)
  setMensajeResena('')
  const res = await supabase.rpc('dejar_resena', { p_vendedor: String(vendPerfil.id), p_estrellas: resenaEstrellas, p_comentario: resenaTexto.trim() })
  setEnviandoResena(false)
  if (res.error) {
    const m = res.error.message || ''
    setMensajeResena(m.indexOf('contacto') !== -1 ? 'Para dejar una reseña tenés que haber hablado antes con este vendedor.' : 'No se pudo enviar: ' + m)
    return
  }
  setResenaAbierta(false)
  abrirVendedor(vendPerfil.id)
}

function abrirEditarPub(p: any) {
  setMenuPub(null)
  setEditPub(p)
  setPubEditTitulo(p.titulo || '')
  setPubEditPrecio(String(p.precio ?? ''))
  setPubEditCategoria(p.categoria || 'Electronica')
  setPubEditDescripcion(p.descripcion || '')
  setMensajePubEdit('')
}

async function guardarEdicionPub() {
  if (!editPub) return
  const tituloLimpio = pubEditTitulo.trim()
  const precioNum = Number(pubEditPrecio)
  if (!tituloLimpio) { setMensajePubEdit('Poné un título'); return }
  if (!pubEditPrecio || isNaN(precioNum) || precioNum < 0) { setMensajePubEdit('Revisá el precio'); return }
  setGuardandoPubEdit(true)
  setMensajePubEdit('')
  const res = await supabase.rpc('editar_publicacion', {
    p_id: String(editPub.id), p_titulo: tituloLimpio, p_precio: precioNum,
    p_categoria: pubEditCategoria, p_descripcion: pubEditDescripcion.trim()
  })
  setGuardandoPubEdit(false)
  if (res.error) { setMensajePubEdit('Error: ' + res.error.message); return }
  setEditPub(null)
  await abrirPerfil()
  cargarProductos()
}

async function alternarVendida(p: any) {
  setMenuPub(null)
  const res = await supabase.rpc('marcar_publicacion_vendida', { p_id: String(p.id), p_vendida: !p.vendida })
  if (res.error) { window.alert('No se pudo actualizar: ' + res.error.message); return }
  await abrirPerfil()
  cargarProductos()
}

async function eliminarPublicacion(pubId: any) {
  if (!window.confirm('Eliminar esta publicacion? No se puede deshacer.')) return
  const res = await supabase.from('publicaciones').delete().eq('id', pubId)
  if (!res.error) {
    setMisPublicaciones(misPublicaciones.filter((p:any) => p.id !== pubId))
    setProductos(productos.filter((p:any) => p.id !== pubId))
  }
}

async function abrirBandejaMensajes() {
  setVista('mensajes')
  setCargandoMensajes(true)
  const res = await supabase.from('mensajes')
    .select('*')
    .or('emisor_id.eq.' + userId + ',receptor_id.eq.' + userId)
    .order('fecha', { ascending: false })
  if (res.error) { setCargandoMensajes(false); return }

  const vistos = new Set()
  const conversaciones: any[] = []
  for (const m of res.data) {
    const otro = m.emisor_id === userId ? m.receptor_id : m.emisor_id
    const key = m.publicacion_id + '-' + otro
    if (!vistos.has(key)) {
      vistos.add(key)
      conversaciones.push({ ...m, otro })
    }
  }

  const pubIds = [...new Set(conversaciones.map((c:any) => c.publicacion_id))]
  if (pubIds.length > 0) {
    const resPub = await supabase.from('publicaciones').select('id,titulo,foto_url,precio,vendedor_id').in('id', pubIds)
    const pubMap: any = {}
    if (!resPub.error) resPub.data.forEach((p:any) => pubMap[p.id] = p)
    conversaciones.forEach((c:any) => c.producto = pubMap[c.publicacion_id])
  }

  const otroIds = [...new Set(conversaciones.map((c:any) => c.otro))]
  if (otroIds.length > 0) {
    const resUsers = await supabase.from('usuarios').select('id,nombre,avatar_url').in('id', otroIds)
    const userMap: any = {}
    if (!resUsers.error) resUsers.data.forEach((u:any) => userMap[u.id] = u)
    conversaciones.forEach((c:any) => c.interlocutor = userMap[c.otro])
  }

  setMisMensajes(conversaciones.filter((c:any) => !bloqueados.includes(c.otro)))
  setCargandoMensajes(false)
}

function abrirConversacion(c: any) {
  if (!c.producto) return
  abrirChat(c.producto, c.otro, 'mensajes', c.interlocutor?.nombre || '')
}

function abrirEditarPerfil() {
  setEditNombre(perfilData?.nombre || '')
  setEditCiudad(perfilData?.ciudad || '')
  setEditProvincia(perfilData?.provincia || '')
  setEditBio(perfilData?.bio || '')
  setEditEnlace(perfilData?.enlace || '')
  setAvatarFile(null)
  setAvatarPreview(perfilData?.avatar_url || null)
  setMensajeEditar('')
  setVista('editarPerfil')
}

async function guardarPerfil() {
  if (!editNombre.trim()) { setMensajeEditar('El nombre no puede estar vacio'); return }
  const enlaceFinal = normalizarEnlace(editEnlace)
  if (editEnlace.trim() && !enlaceFinal) { setMensajeEditar('El link no parece válido. Probá con algo como instagram.com/tuusuario'); return }
  setGuardandoPerfil(true)
  setMensajeEditar('')
  let avatarUrl = perfilData?.avatar_url || null
  if (avatarFile) {
    const avatarOpt = await comprimirImagen(avatarFile, 600, 0.85)
    const avatarNueva = avatarOpt !== avatarFile
    const ext = avatarNueva ? 'jpg' : avatarFile.name.split('.').pop()
    const path = 'avatar-' + userId + '-' + Date.now() + '.' + ext
    const subida = await supabase.storage.from('fotos').upload(path, avatarOpt, { contentType: avatarNueva ? 'image/jpeg' : avatarFile.type, cacheControl: '31536000' })
    if (subida.error) { setGuardandoPerfil(false); setMensajeEditar('Error subiendo la foto: ' + subida.error.message); return }
    const url = supabase.storage.from('fotos').getPublicUrl(path)
    avatarUrl = url.data.publicUrl
  }
  const res = await supabase.from('usuarios')
    .update({ nombre: editNombre, ciudad: editCiudad, provincia: editProvincia, avatar_url: avatarUrl, bio: editBio.trim().replace(/\n{2,}/g, '\n'), enlace: enlaceFinal || null })
    .eq('id', userId)
    .select()
    .single()
  setGuardandoPerfil(false)
  if (res.error) { setMensajeEditar('Error: ' + res.error.message); return }
  setPerfilData(res.data)
  setUserName(res.data.nombre)
  setAvatarFile(null)
  setVista('perfil')
}

async function cambiarContrasena() {
  if (!window.confirm('Te vamos a enviar un correo para que cambies tu contraseña. ¿Continuar?')) return
  const u = await supabase.auth.getUser()
  const email = u.data && u.data.user ? u.data.user.email : ''
  if (!email) { window.alert('No pudimos encontrar tu correo.'); return }
  const res = await supabase.auth.resetPasswordForEmail(email, { redirectTo: REDIRECT_URL })
  window.alert(res.error ? 'No se pudo enviar el correo: ' + res.error.message : 'Te enviamos un correo a ' + email + ' para cambiar tu contraseña.')
}

function invitarAmigos() {
  const texto = 'Mirá Tu Changarro Libre, el marketplace argentino para comprar y vender cerca tuyo: ' + URL_APP
  window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank')
}

async function cerrarSesion() {
  await supabase.auth.signOut()
  setAuthed(false)
  setUserId(null)
  setSinLeer(0)
  setUserName('')
  setProductos([])
  setFavoritos([])
  setBloqueados([])
  setBloqueadosInfo([])
  setPerfilData(null)
  setMisPublicaciones([])
  setMisMensajes([])
  setConfirmandoEliminar(false)
  setVista('home')
}

async function eliminarCuenta() {
  setEliminandoCuenta(true)
  setMensajeConfig('')
  const res = await supabase.rpc('eliminar_mi_cuenta')
  if (res.error) { setEliminandoCuenta(false); setMensajeConfig('Error: ' + res.error.message); return }
  setEliminandoCuenta(false)
  setConfirmandoEliminar(false)
  cerrarSesion()
}

const productosFiltrados = productos.filter(p => {
  const matchCat = catActiva === 'Todo' || p.categoria === catActiva
  const matchBus = p.titulo.toLowerCase().includes(busqueda.toLowerCase())
  const matchCiudad = !filtroCiudad || p.ubicacion_vendedor === filtroCiudad
  return matchCat && matchBus && matchCiudad && !p.vendida && !bloqueados.includes(p.vendedor_id)
}).sort((a:any, b:any) => {
  if (orden === 'menor') return Number(a.precio) - Number(b.precio)
  if (orden === 'mayor') return Number(b.precio) - Number(a.precio)
  return new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime()
})

const ciudadesDisponibles: string[] = Array.from(new Set(productos.map((p:any) => p.ubicacion_vendedor).filter(Boolean))).sort() as string[]
const hayFiltros = !!(filtroCiudad || busqueda || catActiva !== 'Todo')

const busquedasFiltradas = busquedas.filter((b:any) =>
  (catActiva === 'Todo' || b.categoria === catActiva) &&
  (!busqueda || b.titulo.toLowerCase().includes(busqueda.toLowerCase())) &&
  !bloqueados.map(String).includes(String(b.usuario_id))
)

function limpiarFiltros() {
  setFiltroCiudad('')
  setBusqueda('')
  setCatActiva('Todo')
  setOrden('recientes')
}

T = isDarkMode ? DARK : LIGHT

const modales = (
  <>
    <ModalReporte
      objetivo={reporteObjetivo}
      motivo={reporteMotivo} setMotivo={setReporteMotivo}
      detalle={reporteDetalle} setDetalle={setReporteDetalle}
      enviando={enviandoReporte} mensaje={mensajeReporte} enviado={reporteEnviado}
      onEnviar={enviarReporte} onCerrar={cerrarReporte}
    />
    <ModalOferta
      abierto={ofertaAbierta}
      pub={detalleProducto}
      monto={ofertaMonto} setMonto={setOfertaMonto}
      enviando={enviandoOferta} mensaje={mensajeOferta}
      onEnviar={enviarOferta} onCerrar={()=>setOfertaAbierta(false)}
    />
    <ModalBloqueo
      objetivo={bloqueoObjetivo}
      bloqueando={bloqueando}
      onConfirmar={confirmarBloqueo}
      onCancelar={()=>setBloqueoObjetivo(null)}
    />
  </>
)

if (checandoSesion) {
  return (
    <div className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.font }}>
      <link href={FONTS} rel="stylesheet" />
      <div className="tcl-pulso" style={{ width:68, height:68, borderRadius:22, background:G, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 36px '+T.glow, fontSize:22, color:'#0a0a0a', fontWeight:'bold' }}>TCL</div>
    </div>
  )
}

if (recoveryMode) {
  return (
    <NuevaPasswordScreen onDone={async ()=>{ setRecoveryMode(false); await cerrarSesion() }} />
  )
}

if (!authed) {
  return (
    <div>
      <div style={{ display: legalAuth ? 'none' : 'block' }}>
        <AuthScreen onAuth={handleAuth} onLegal={setLegalAuth} />
      </div>
      {legalAuth && pantallaLegal(legalAuth, ()=>setLegalAuth(null))}
    </div>
  )
}

if (vista === 'terminos' || vista === 'privacidad' || vista === 'ayuda') {
  return pantallaLegal(vista, ()=>setVista('configuracion'))
}

if (vista === 'bloqueados') {
  return (
    <div key="bloqueados" className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:40 }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
        <BackBtn onClick={()=>setVista('configuracion')} />
        <div style={{ fontWeight:700, fontSize:17, flex:1 }}>Usuarios bloqueados</div>
      </div>
      <div style={{ padding:'20px 18px' }}>
        {cargandoBloqueados && <p style={{ color:T.muted, textAlign:'center', padding:40 }}>Cargando...</p>}

        {!cargandoBloqueados && bloqueadosInfo.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', color:T.muted }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>No bloqueaste a nadie</div>
            <div style={{ fontSize:12 }}>Los usuarios que bloquees van a aparecer aca</div>
          </div>
        )}

        {bloqueadosInfo.map((u:any)=>(
          <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid '+T.border }}>
            {u.avatar_url
              ? <img src={u.avatar_url} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} />
              : <div style={{ width:44, height:44, borderRadius:'50%', background:G, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#0a0a0a' }}>
                  {(u.nombre || '?').charAt(0).toUpperCase()}
                </div>
            }
            <div style={{ flex:1, fontWeight:700, fontSize:14 }}>{u.nombre}</div>
            <button onClick={()=>desbloquearUsuario(u.id)} style={{ padding:'8px 14px', borderRadius:12, border:'1px solid '+T.gold, background:'transparent', color:T.gold, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:T.font }}>
              Desbloquear
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

if (vista === 'detalle' && detalleProducto) {
  const p = detalleProducto
  return (
    <DetalleProducto
      key={p.id}
      p={p}
      vendedor={detalleVendedor}
      esFav={favoritos.includes(p.id)}
      esMio={p.vendedor_id === userId}
      onBack={()=>setVista(detalleOrigen)}
      onFav={()=>toggleFavorito(p.id)}
      onContactar={()=>abrirChat(p, p.vendedor_id, 'detalle', detalleVendedor?.nombre || '')}
      onReportar={()=>abrirReporte({ publicacionId:p.id, usuarioId:p.vendedor_id, nombre:p.titulo })}
      onBloquear={()=>setBloqueoObjetivo({ usuarioId:p.vendedor_id, nombre: detalleVendedor?.nombre || 'este vendedor' })}
      onVerVendedor={()=>abrirVendedor(p.vendedor_id)}
      onCompartir={()=>compartirPublicacion(p, detalleVendedor)}
      onOfertar={abrirOferta}
      insignias={detalleInsignias}
      modales={modales}
    />
  )
}

if (vista === 'panel') {
  const vistasTot = misPublicaciones.reduce((a:number, x:any) => a + (x.vistas || 0), 0)
  const activas = misPublicaciones.filter((x:any) => !x.vendida).length
  const topVistas = [...misPublicaciones].sort((a:any, b:any) => (b.vistas || 0) - (a.vistas || 0)).slice(0, 5)
  const maxVistas = topVistas.length > 0 ? Math.max(1, topVistas[0].vistas || 0) : 1
  const etiqueta: any = { fontSize:11, color:T.muted, letterSpacing:'0.14em', marginBottom:14, fontWeight:600 }
  const bloque = (valor: any, texto: string) => (
    <div style={{ padding:'18px 0' }}>
      <div style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.02em' }}>{valor}</div>
      <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{texto}</div>
    </div>
  )
  const proximamente = (titulo: string, texto: string) => (
    <div style={{ border:'1px solid '+T.border, borderRadius:16, padding:'16px', marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div style={{ fontSize:14, fontWeight:600 }}>{titulo}</div>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:T.muted, border:'1px solid '+T.border2, borderRadius:20, padding:'3px 10px', flexShrink:0 }}>PRÓXIMAMENTE</span>
      </div>
      <div style={{ fontSize:12, color:T.muted, marginTop:6, lineHeight:1.5 }}>{texto}</div>
    </div>
  )

  return (
    <div key="panel" className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, width:'100vw', maxWidth:430, boxSizing:'border-box', overflowX:'hidden', margin:'0 auto', paddingBottom:100 }}>
      <link href={FONTS} rel="stylesheet" />

      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 18px 8px' }}>
        <BackBtn onClick={()=>setVista('perfil')} />
        <div style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.01em' }}>Panel profesional</div>
      </div>

      <div style={{ padding:'8px 22px 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 20px', borderTop:'1px solid '+T.border, borderBottom:'1px solid '+T.border, margin:'10px 0 28px' }}>
          {bloque(vistasTot, 'Vistas totales')}
          {bloque(activas, 'Publicaciones activas')}
          <div style={{ borderTop:'1px solid '+T.border }}>{bloque(perfilData?.cantidad_ventas || 0, 'Vendidos')}</div>
          <div style={{ borderTop:'1px solid '+T.border }}>
            {bloque(panelResenas && panelResenas.n > 0 ? panelResenas.prom.toFixed(1).replace('.', ',') : '-', panelResenas && panelResenas.n > 0 ? 'Reseñas (' + panelResenas.n + ')' : 'Sin reseñas todavía')}
          </div>
        </div>

        <div style={etiqueta}>TUS PUBLICACIONES MÁS VISTAS</div>
        {topVistas.length === 0 && (
          <div style={{ fontSize:13, color:T.muted, padding:'10px 0 24px' }}>Cuando publiques, acá vas a ver cuáles llaman más la atención.</div>
        )}
        <div style={{ marginBottom:30 }}>
          {topVistas.map((x:any) => (
            <div key={x.id} onClick={()=>abrirDetalle(x, 'panel')} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', cursor:'pointer' }}>
              {x.foto_url
                ? <Img src={x.foto_url} style={{ width:46, height:46, borderRadius:10, objectFit:'cover', flexShrink:0 }} />
                : <div style={{ width:46, height:46, borderRadius:10, background:T.s2, flexShrink:0 }} />
              }
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{x.titulo}</div>
                <div style={{ height:3, borderRadius:3, background:T.s3, marginTop:8, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:Math.round(((x.vistas || 0) / maxVistas) * 100) + '%', background:T.sub, borderRadius:3 }} />
                </div>
              </div>
              <div style={{ fontSize:12, color:T.sub, flexShrink:0, minWidth:56, textAlign:'right' }}>{(x.vistas || 0) + ' vistas'}</div>
            </div>
          ))}
        </div>

        <div style={etiqueta}>IMPULSÁ TUS VENTAS</div>
        {proximamente('Destacar publicaciones', 'Aparecé primero en el inicio y llegá a más gente.')}
        {proximamente('Plan profesional', 'Más herramientas para quienes venden seguido.')}
      </div>

      <BottomNav vista="perfil" setVista={setVista} abrirPerfil={abrirPerfil} abrirBandejaMensajes={abrirBandejaMensajes} sinLeer={sinLeer} />
    </div>
  )
}

if (vista === 'vendedor') {
  const resenasVisibles = vendResenas.filter((r:any) => !bloqueados.map(String).includes(String(r.autor_id)))
  const promedio = resenasVisibles.length > 0 ? resenasVisibles.reduce((a:number, r:any) => a + r.estrellas, 0) / resenasVisibles.length : 0
  const esPropio = !!vendPerfil && String(vendPerfil.id) === String(userId)
  const ubic = vendPerfil ? [vendPerfil.ciudad, vendPerfil.provincia].filter(Boolean).join(', ') : ''
  const nivelV = (vendPerfil && vendPerfil.nivel_reputacion) ? vendPerfil.nivel_reputacion : 'Nuevo'
  const inicial = vendPerfil ? (vendPerfil.nombre || '?').charAt(0).toUpperCase() : '?'
  const etiquetaSec: any = { fontSize:11, color:T.muted, letterSpacing:'0.14em', marginBottom:14, fontWeight:600 }

  return (
    <div key="vendedor" className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, width:'100vw', maxWidth:430, boxSizing:'border-box', overflowX:'hidden', margin:'0 auto', paddingBottom:50 }}>
      <link href={FONTS} rel="stylesheet" />

      <div style={{ position:'relative', height:112, background: PORTADA_ELEGIDA ? T.s2 : 'linear-gradient(160deg,'+T.s2+','+T.s1+')', overflow:'hidden' }}>
        {PORTADA_ELEGIDA
          ? <img src={PORTADA_ELEGIDA} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          : <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.serif, fontSize:13, letterSpacing:'0.3em', color:T.muted, textTransform:'uppercase' }}>
              Tu Changarro Libre
            </div>
        }
        <button onClick={()=>setVista(detalleProducto ? 'detalle' : 'home')} style={{ position:'absolute', top:14, left:14, width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.45)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
          <IconoAtras size={20} />
        </button>
      </div>

      {cargandoVend && <SkelPerfil />}
      {!cargandoVend && !vendPerfil && <p style={{ color:T.muted, textAlign:'center', padding:40 }}>No se pudo cargar este perfil.</p>}

      {!cargandoVend && vendPerfil && (
        <div style={{ padding:'0 22px 20px' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
            <div style={{ position:'relative', zIndex:2, marginTop:-40, width:88, height:88, boxSizing:'content-box', border:'4px solid '+T.bg, borderRadius:'50%', background:T.bg, overflow:'hidden', flexShrink:0 }}>
              {vendPerfil.avatar_url
                ? <img src={vendPerfil.avatar_url} alt="" style={{ width:88, height:88, objectFit:'cover', display:'block' }} />
                : <div style={{ width:88, height:88, background:T.s3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:700, color:T.sub, lineHeight:1 }}>{inicial}</div>
              }
            </div>
            <div style={{ fontSize:22, fontWeight:700, marginTop:12, letterSpacing:'-0.01em' }}>{vendPerfil.nombre}</div>
            {ubic ? <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>{ubic}</div> : null}
            <BioPerfil bio={vendPerfil.bio} enlace={vendPerfil.enlace} />
            <Insignias usuario={vendPerfil} extra={vendInsignias} centrado />
            <div style={{ fontSize:12, color:T.sub, marginTop:8 }}>Nivel {nivelV}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
              {resenasVisibles.length > 0 ? (
                <>
                  <Estrellas valor={Math.round(promedio)} size={15} />
                  <span style={{ fontSize:13, fontWeight:600 }}>{promedio.toFixed(1).replace('.', ',')}</span>
                  <span style={{ fontSize:12, color:T.muted }}>({resenasVisibles.length})</span>
                </>
              ) : (
                <span style={{ fontSize:12, color:T.muted }}>Todavía sin reseñas</span>
              )}
            </div>
          </div>

          <div style={{ display:'flex', margin:'24px 0 20px', borderTop:'1px solid '+T.border, borderBottom:'1px solid '+T.border, padding:'16px 0' }}>
            <div style={{ flex:1, textAlign:'center', borderRight:'1px solid '+T.border }}>
              <div style={{ fontSize:20, fontWeight:700 }}>{vendPubs.length}</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:3 }}>Publicados</div>
            </div>
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:700 }}>{vendPerfil.cantidad_ventas || 0}</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:3 }}>Vendidos</div>
            </div>
          </div>

          {!esPropio && (
            <button onClick={abrirModalResena} style={{ width:'100%', padding:'12px', borderRadius:14, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:T.font, marginBottom:26 }}>
              {vendResenas.some((r:any) => String(r.autor_id) === String(userId)) ? 'Editar mi reseña' : 'Dejar una reseña'}
            </button>
          )}

          {resenasVisibles.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <div style={etiquetaSec}>RESEÑAS</div>
              {resenasVisibles.slice(0, 20).map((r:any) => (
                <div key={r.id} style={{ padding:'14px 0', borderBottom:'1px solid '+T.border }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                    <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.autor_nombre}</div>
                    <div style={{ fontSize:11, color:T.muted, flexShrink:0 }}>{tiempoTranscurrido(r.fecha)}</div>
                  </div>
                  <div style={{ marginTop:6 }}><Estrellas valor={r.estrellas} size={12} /></div>
                  {r.comentario ? <div style={{ fontSize:13, color:T.sub, lineHeight:1.55, marginTop:8, whiteSpace:'pre-wrap' }}>{r.comentario}</div> : null}
                </div>
              ))}
            </div>
          )}

          <div style={etiquetaSec}>PUBLICACIONES</div>
          {vendPubs.length === 0 && (
            <div style={{ textAlign:'center', padding:'30px 20px', color:T.muted, fontSize:13 }}>No tiene publicaciones activas</div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:'20px 12px' }}>
            {vendPubs.map((x:any) => (
              <div key={x.id} className="tcl-tarjeta" onClick={()=>abrirDetalle(x, 'vendedor')} style={{ cursor:'pointer', minWidth:0 }}>
                <div style={{ position:'relative', borderRadius:14, overflow:'hidden', background:T.s2 }}>
                  {x.foto_url
                    ? <Img src={x.foto_url} alt={x.titulo} style={{ width:'100%', aspectRatio:'1 / 1', objectFit:'cover', display:'block' }} />
                    : <div style={{ width:'100%', aspectRatio:'1 / 1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:T.muted, fontWeight:600, letterSpacing:'0.08em', textAlign:'center', padding:6, boxSizing:'border-box' }}>{x.categoria?.toUpperCase()}</div>
                  }
                </div>
                <div style={{ padding:'8px 2px 0' }}>
                  <div style={{ fontWeight:500, fontSize:13, lineHeight:1.3, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{x.titulo}</div>
                  <div style={{ color:T.text, fontWeight:700, fontSize:15, marginTop:3 }}>${Number(x.precio).toLocaleString('es-AR')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ModalResena
        abierto={resenaAbierta}
        nombre={vendPerfil ? vendPerfil.nombre : ''}
        estrellas={resenaEstrellas} setEstrellas={setResenaEstrellas}
        comentario={resenaTexto} setComentario={setResenaTexto}
        enviando={enviandoResena} mensaje={mensajeResena}
        onEnviar={enviarResena} onCerrar={()=>setResenaAbierta(false)}
      />
    </div>
  )
}
// ==== FIN PARTE 3 de 4 - pega la parte 4 justo debajo ====
// ==== INICIO PARTE 4 de 4 ====
if (vista === 'chat' && chatProducto) {
  const nombreChat = chatOtroNombre || 'este usuario'
  return (
    <div key="chat" className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', display:'flex', flexDirection:'column' }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ background:T.s1, padding:'14px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
        <BackBtn onClick={()=>setVista(chatOrigen)} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {chatOtroNombre || chatProducto.titulo}
          </div>
          <div style={{ fontSize:11, color:T.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {chatOtroNombre ? chatProducto.titulo : 'Chat del producto'}
          </div>
        </div>
        <div style={{ color:T.text, fontWeight:700, fontSize:16 }}>${Number(chatProducto.precio).toLocaleString()}</div>
        <button onClick={()=>setMenuChat(!menuChat)} style={{ background:'none', border:'none', color:T.text, fontSize:22, fontWeight:'bold', cursor:'pointer', padding:'0 4px', lineHeight:1 }}>
          ⋯
        </button>
        {menuChat && (
          <div style={{ position:'absolute', right:12, top:'100%', marginTop:6, background:T.s2, border:'1px solid '+T.border2, borderRadius:14, overflow:'hidden', zIndex:80, minWidth:200 }}>
            <button onClick={()=>{ setMenuChat(false); abrirReporte({ publicacionId:chatProducto.id, usuarioId:chatOtroUsuario, nombre:nombreChat }) }} style={{ width:'100%', textAlign:'left', padding:'13px 16px', background:'none', border:'none', borderBottom:'1px solid '+T.border, color:T.text, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>
              Reportar usuario
            </button>
            <button onClick={()=>{ setMenuChat(false); setBloqueoObjetivo({ usuarioId:chatOtroUsuario, nombre:nombreChat }) }} style={{ width:'100%', textAlign:'left', padding:'13px 16px', background:'none', border:'none', color:T.red, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>
              Bloquear usuario
            </button>
          </div>
        )}
      </div>
      <div style={{ flex:1, padding:'18px', overflowY:'auto', display:'flex', flexDirection:'column', gap:10, minHeight:400 }}>
        {chatMensajes.length===0&&(
          <div style={{ textAlign:'center', padding:'40px 20px', color:T.muted }}>Se el primero en escribir</div>
        )}
        {chatMensajes.map(m=>(
          <div key={m.id} style={{ maxWidth:'80%', alignSelf:m.emisor_id===userId?'flex-end':'flex-start' }}>
            <div style={{ background:m.emisor_id===userId?T.gold:T.s2, color:m.emisor_id===userId?'#0a0a0a':T.text, padding:'10px 14px', borderRadius:14, fontSize:14 }}>
              {m.contenido}
            </div>
            <div style={{ fontSize:10, color:T.muted, marginTop:4, textAlign:m.emisor_id===userId?'right':'left' }}>
              {tiempoTranscurrido(m.fecha)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'16px 18px', borderTop:'1px solid '+T.border, display:'flex', gap:10 }}>
        <input value={chatTexto} onChange={e=>setChatTexto(e.target.value)} onKeyDown={e=>e.key==='Enter'&&enviarMensaje()} placeholder="Escribi tu mensaje"
          style={{ flex:1, padding:'12px 16px', borderRadius:24, border:'1px solid '+T.border2, background:T.s2, color:T.text, fontSize:14, outline:'none', fontFamily:T.font }}
        />
        <button onClick={enviarMensaje} disabled={enviando} style={{ padding:'12px 20px', borderRadius:24, border:'none', background:G, color:'#0a0a0a', fontWeight:'bold', fontSize:13, cursor:'pointer' }}>
          {enviando?'...':'Enviar'}
        </button>
      </div>
      {modales}
    </div>
  )
}

if (vista === 'mensajes') {
  return (
    <div key="mensajes" className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:100 }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
        <div style={{ fontWeight:700, fontSize:17, flex:1 }}>Mensajes</div>
      </div>

      <div style={{ padding:'8px 0' }}>
        {cargandoMensajes && <SkelFilas />}

        {!cargandoMensajes && misMensajes.length===0 && (
          <EstadoVacio icono={<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />} titulo="Todavía no tenés conversaciones" texto="Cuando alguien te escriba, o vos le escribas a un vendedor, va a aparecer acá." />
        )}

        {misMensajes.map((c:any)=>{
          const nombre = c.interlocutor?.nombre || 'Usuario'
          const avatar = c.interlocutor?.avatar_url
          const yoEscribi = c.emisor_id === userId
          const convSinLeer = c.receptor_id === userId && c.leido === false
          return (
            <button key={c.publicacion_id+'-'+c.otro} onClick={()=>abrirConversacion(c)} style={{
              width:'100%', textAlign:'left', display:'flex', gap:14, alignItems:'center',
              background:'transparent', border:'none', borderBottom:'1px solid '+T.border,
              padding:'14px 18px', cursor:'pointer', fontFamily:T.font, color:T.text
            }}>
              <div style={{ position:'relative', width:54, height:54, flexShrink:0 }}>
                {avatar
                  ? <img src={avatar} style={{ width:54, height:54, borderRadius:'50%', objectFit:'cover' }} />
                  : <div style={{ width:54, height:54, borderRadius:'50%', background:G, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#0a0a0a' }}>
                      {nombre.charAt(0).toUpperCase()}
                    </div>
                }
                {c.producto?.foto_url && (
                  <img src={c.producto.foto_url} style={{
                    position:'absolute', right:-4, bottom:-4, width:24, height:24, borderRadius:8,
                    objectFit:'cover', border:'2px solid '+T.bg
                  }} />
                )}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8, marginBottom:2 }}>
                  <div style={{ fontWeight:700, fontSize:15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nombre}</div>
                  <div style={{ fontSize:10, color:T.muted, flexShrink:0 }}>{tiempoTranscurrido(c.fecha)}</div>
                </div>
                <div style={{ fontSize:11, color:T.gold, fontWeight:600, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {c.producto?.titulo || 'Publicacion eliminada'}
                </div>
                <div style={{ fontSize:13, color: convSinLeer ? T.text : T.muted, fontWeight: convSinLeer ? 600 : 400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {yoEscribi ? 'Vos: ' : ''}{c.contenido}
                </div>
              </div>
              {convSinLeer && <div style={{ width:9, height:9, borderRadius:'50%', background:T.gold, flexShrink:0 }} />}
            </button>
          )
        })}
      </div>
      <BottomNav vista={vista} setVista={setVista} abrirPerfil={abrirPerfil} abrirBandejaMensajes={abrirBandejaMensajes} sinLeer={sinLeer} />
    </div>
  )
}

if (vista === 'publicar') {
  return (
    <div key="publicar" className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:30 }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
        <BackBtn onClick={()=>setVista('home')} />
        <div style={{ fontWeight:700, fontSize:17, flex:1 }}>Publicar producto</div>
      </div>
      <div style={{ padding:'20px 18px' }}>
        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Fotos del producto</label>
        <input type="file" accept="image/*" multiple onChange={handleFotos} style={{ display:'none' }} id="fotoInput" />
        <div style={{ display:'flex', gap:10, overflowX:'auto', marginBottom:18, paddingBottom:4 }}>
          {fotoPreviews.map((src:any, i:number)=>(
            <div key={i} style={{ position:'relative', width:90, height:90, flexShrink:0, borderRadius:14, overflow:'hidden' }}>
              <img src={src} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              <button onClick={()=>quitarFoto(i)} style={{
                position:'absolute', top:4, right:4, width:20, height:20, borderRadius:'50%',
                background:'rgba(0,0,0,0.7)', color:'#fff', border:'none', fontSize:12, cursor:'pointer', lineHeight:1
              }}>×</button>
              {i===0 && (
                <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.6)', color:T.gold, fontSize:9, fontWeight:700, textAlign:'center', padding:'2px 0' }}>
                  PORTADA
                </div>
              )}
            </div>
          ))}
          <label htmlFor="fotoInput" style={{
            width:90, height:90, flexShrink:0, borderRadius:14, border:'2px dashed '+T.border2, background:T.s2,
            cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, color:T.muted
          }}>
            <div style={{ fontSize:24, color:T.gold, fontWeight:'bold' }}>+</div>
            <div style={{ fontSize:10 }}>Agregar</div>
          </label>
        </div>

        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Video del producto (opcional)</label>
        <input type="file" accept="video/*" onChange={handleVideo} style={{ display:'none' }} id="videoInput" />
        <label htmlFor="videoInput" style={{ display:'block', width:'100%', height:180, borderRadius:16, border:'2px dashed '+(videoPreview?T.gold:T.border2), background:T.s2, cursor:'pointer', marginBottom:18, overflow:'hidden', boxSizing:'border-box' }}>
          {videoPreview
            ? <video src={videoPreview} controls style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:T.muted, gap:8 }}>
                <div style={{ fontSize:36, color:T.gold, fontWeight:'bold' }}>+</div>
                <div style={{ fontSize:13 }}>Toca para agregar video</div>
                <div style={{ fontSize:11 }}>Opcional, hasta 30 segundos</div>
              </div>
          }
        </label>

        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Titulo *</label>
        <Input value={titulo} onChange={(e:any)=>setTitulo(e.target.value)} placeholder="Ej: iPhone 13, Bicicleta..." style={{ marginBottom:16 }} />

        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Precio (ARS) *</label>
        <Input value={precio} onChange={(e:any)=>setPrecio(e.target.value)} placeholder="0" type="number" style={{ marginBottom:16 }} />

        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Categoria</label>
        <select value={categoria} onChange={e=>setCategoria(e.target.value)}
          style={{ width:'100%', padding:'13px 16px', marginBottom:16, borderRadius:12, border:'1px solid '+T.border2, background:T.s2, color:T.text, fontSize:15, boxSizing:'border-box', fontFamily:T.font }}
        >
          {CATEGORIAS.filter(c=>c!=='Todo').map(c=><option key={c} value={c}>{c}</option>)}
        </select>

        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Descripcion</label>
        <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} placeholder="Describe el estado, que incluye..."
          style={{ width:'100%', padding:'13px 16px', marginBottom:22, minHeight:90, borderRadius:12, border:'1px solid '+T.border2, background:T.s2, color:T.text, fontSize:15, boxSizing:'border-box', resize:'none', fontFamily:T.font }}
        />

        <GBtn full disabled={!titulo||!precio||publicando} onClick={publicar}>
          {publicando?'Publicando...':'Publicar en el changarro'}
        </GBtn>
        {mensajePublicar&&<p style={{ marginTop:14, color:T.red, fontSize:13, textAlign:'center' }}>{mensajePublicar}</p>}
      </div>
    </div>
  )
}

if (vista === 'editarPerfil') {
  return (
    <div key="editarPerfil" className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:30 }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
        <BackBtn onClick={()=>setVista('perfil')} />
        <div style={{ fontWeight:700, fontSize:17, flex:1 }}>Editar perfil</div>
      </div>

      <div style={{ padding:'20px 18px' }}>
        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:12, fontWeight:600, textTransform:'uppercase', textAlign:'center' }}>Foto de perfil</label>
        <input type="file" accept="image/*" onChange={handleAvatar} style={{ display:'none' }} id="avatarInput" />
        <label htmlFor="avatarInput" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginBottom:26, cursor:'pointer' }}>
          {avatarPreview
            ? <img src={avatarPreview} style={{ width:96, height:96, borderRadius:'50%', objectFit:'cover', border:'2px solid '+T.gold }} />
            : <div style={{ width:96, height:96, borderRadius:'50%', background:T.s2, border:'2px dashed '+T.border2, display:'flex', alignItems:'center', justifyContent:'center', color:T.gold, fontSize:28, fontWeight:800 }}>
                {(editNombre || '?').charAt(0).toUpperCase()}
              </div>
          }
          <div style={{ fontSize:12, color:T.gold, fontWeight:700 }}>Cambiar foto</div>
        </label>

        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Nombre *</label>
        <Input value={editNombre} onChange={(e:any)=>setEditNombre(e.target.value)} placeholder="Tu nombre" style={{ marginBottom:16 }} />

        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Descripción</label>
        <textarea value={editBio} onChange={(e:any)=>setEditBio(e.target.value.slice(0, 150))} rows={3} placeholder="Contá algo sobre vos o tu negocio"
          style={{ background:T.s2, color:T.text, border:'1px solid '+T.border2, borderRadius:12, padding:'13px 16px', fontSize:15, outline:'none', fontFamily:T.font, width:'100%', boxSizing:'border-box', resize:'none' }} />
        <div style={{ fontSize:11, color:T.muted, textAlign:'right', margin:'6px 0 16px' }}>{editBio.length}/150</div>

        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Link</label>
        <Input value={editEnlace} onChange={(e:any)=>setEditEnlace(e.target.value.slice(0, 200))} placeholder="Instagram, Google Maps, tu página..." style={{ marginBottom:6 }} />
        <div style={{ fontSize:11, color:T.muted, marginBottom:16 }}>Podés poner un solo link: tu red social, tu ubicación en Maps o tu web.</div>

        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Correo</label>
        <Input value={perfilData?.email || ''} onChange={()=>{}} style={{ marginBottom:6, opacity:0.5 }} />
        <div style={{ fontSize:11, color:T.muted, marginBottom:16 }}>El correo no se puede modificar</div>

        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Ciudad</label>
        <Input value={editCiudad} onChange={(e:any)=>setEditCiudad(e.target.value)} placeholder="Ej: Rosario" style={{ marginBottom:16 }} />

        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Provincia</label>
        <select value={editProvincia} onChange={e=>setEditProvincia(e.target.value)}
          style={{ width:'100%', padding:'13px 16px', marginBottom:22, borderRadius:12, border:'1px solid '+T.border2, background:T.s2, color:T.text, fontSize:15, boxSizing:'border-box', fontFamily:T.font }}
        >
          <option value="">Seleccionar provincia</option>
          {PROVINCIAS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>

        <GBtn full disabled={!editNombre.trim()||guardandoPerfil} onClick={guardarPerfil}>
          {guardandoPerfil?'Guardando...':'Guardar cambios'}
        </GBtn>
        {mensajeEditar&&<p style={{ marginTop:14, color:T.red, fontSize:13, textAlign:'center' }}>{mensajeEditar}</p>}
      </div>
    </div>
  )
}

if (vista === 'configuracion') {
  const seccion = (titulo: string) => (
    <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.14em', fontWeight:600, marginBottom:2 }}>{titulo}</div>
  )
  const opcionTema = (texto: string, activo: boolean, oscuro: boolean) => (
    <button onClick={()=>setIsDarkMode(oscuro)} style={{
      padding:'6px 16px', borderRadius:16, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font,
      background: activo ? T.text : 'transparent', color: activo ? T.bg : T.muted
    }}>
      {texto}
    </button>
  )
  return (
    <div key="configuracion" className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, width:'100vw', maxWidth:430, boxSizing:'border-box', overflowX:'hidden', margin:'0 auto', paddingBottom:100 }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 18px 8px' }}>
        <BackBtn onClick={()=>setVista('home')} />
        <div style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.01em' }}>Ajustes</div>
      </div>

      <div style={{ padding:'14px 22px 20px' }}>

        {seccion('CUENTA')}
        <div style={{ marginBottom:30 }}>
          <LinkRow label="Editar perfil" onClick={abrirEditarPerfil} />
          <LinkRow label="Cambiar contraseña" onClick={cambiarContrasena} />
          <LinkRow label="Usuarios bloqueados" value={bloqueados.length > 0 ? String(bloqueados.length) : ''} onClick={abrirBloqueados} />
        </div>

        {seccion('APARIENCIA')}
        <div style={{ marginBottom:30 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid '+T.border }}>
            <span style={{ fontSize:14, fontWeight:500 }}>Tema</span>
            <div style={{ display:'flex', background:T.s2, borderRadius:20, padding:3 }}>
              {opcionTema('Oscuro', isDarkMode, true)}
              {opcionTema('Claro', !isDarkMode, false)}
            </div>
          </div>
          <InfoRow label="Idioma" value="Español" />
          <InfoRow label="Moneda" value="Peso argentino (ARS)" />
        </div>

        {seccion('COMUNIDAD')}
        <div style={{ marginBottom:30 }}>
          <LinkRow label="Invitar amigos" onClick={invitarAmigos} />
        </div>

        {seccion('AYUDA Y LEGAL')}
        <div style={{ marginBottom:30 }}>
          <LinkRow label="Ayuda y soporte" onClick={()=>setVista('ayuda')} />
          <LinkRow label="Términos y condiciones" onClick={()=>setVista('terminos')} />
          <LinkRow label="Política de privacidad" onClick={()=>setVista('privacidad')} />
        </div>

        {seccion('SESIÓN')}
        <div>
          <LinkRow label="Cerrar sesión" onClick={cerrarSesion} />
          {!confirmandoEliminar ? (
            <LinkRow label="Eliminar cuenta" destacado onClick={()=>setConfirmandoEliminar(true)} />
          ) : (
            <div style={{ padding:'16px 0', borderBottom:'1px solid '+T.border }}>
              <div style={{ fontSize:13, color:T.sub, marginBottom:14, lineHeight:1.55 }}>
                Eliminar tu cuenta borra de forma permanente tu perfil, tus publicaciones, tus mensajes y tus favoritos. Esta acción no se puede deshacer.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setConfirmandoEliminar(false)} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:T.font }}>
                  Cancelar
                </button>
                <button onClick={eliminarCuenta} disabled={eliminandoCuenta} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:T.red, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:T.font }}>
                  {eliminandoCuenta ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          )}
          {mensajeConfig && <p style={{ marginTop:14, color:T.red, fontSize:13, textAlign:'center' }}>{mensajeConfig}</p>}
        </div>

        <div style={{ textAlign:'center', fontSize:11, color:T.muted, marginTop:34 }}>Tu Changarro Libre · Versión 1.0.0</div>
      </div>
      <BottomNav vista={vista} setVista={setVista} abrirPerfil={abrirPerfil} abrirBandejaMensajes={abrirBandejaMensajes} sinLeer={sinLeer} />
    </div>
  )
}

if (vista === 'perfil') {
  const nivel = perfilData?.nivel_reputacion || 'Nuevo'
  const info = NIVELES[nivel] || NIVELES['Nuevo']
  const puntaje = perfilData?.puntaje_reputacion || 0
  const siguienteNivel = info.siguiente
  const siguienteInfo = siguienteNivel ? NIVELES[siguienteNivel] : null
  const minActual = info.minPuntaje
  const minSiguiente = siguienteInfo ? siguienteInfo.minPuntaje : 100
  const pctProgreso = Math.max(0, Math.min(100, ((puntaje - minActual) / (minSiguiente - minActual)) * 100))
  const puntosFaltan = siguienteNivel ? Math.max(0, minSiguiente - puntaje) : 0
  const ubicacion = [perfilData?.ciudad, perfilData?.provincia].filter(Boolean).join(', ')
  const iniciales = perfilData ? (perfilData.nombre || '?').charAt(0).toUpperCase() : '?'

  return (
    <div key="perfil" className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, width:'100vw', maxWidth:430, boxSizing:'border-box', overflowX:'hidden', margin:'0 auto', paddingBottom:100 }}>
      <link href={FONTS} rel="stylesheet" />

      <div style={{ position:'relative', height:112, background: PORTADA_ELEGIDA ? T.s2 : 'linear-gradient(160deg,'+T.s2+','+T.s1+')', overflow:'hidden' }}>
        {PORTADA_ELEGIDA
          ? <img src={PORTADA_ELEGIDA} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          : <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.serif, fontSize:13, letterSpacing:'0.3em', color:T.muted, textTransform:'uppercase' }}>
              Tu Changarro Libre
            </div>
        }
        <button onClick={abrirEditarPerfil} style={{
          position:'absolute', top:14, right:14, background:'rgba(0,0,0,0.45)', color:'#fff',
          border:'none', borderRadius:20, padding:'7px 16px', fontSize:12, fontWeight:600,
          cursor:'pointer', fontFamily:T.font
        }}>
          Editar
        </button>
      </div>

      {cargandoPerfil && <SkelPerfil />}

      {!cargandoPerfil && perfilData && (
        <div style={{ padding:'0 22px 20px' }}>

          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
            <div style={{ position:'relative', zIndex:2, marginTop:-40, width:88, height:88, boxSizing:'content-box', border:'4px solid '+T.bg, borderRadius:'50%', background:T.bg, overflow:'hidden', flexShrink:0 }}>
              {perfilData.avatar_url
                ? <img src={perfilData.avatar_url} alt="" style={{ width:88, height:88, objectFit:'cover', display:'block' }} />
                : <div style={{ width:88, height:88, background:T.s3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:700, color:T.sub, lineHeight:1 }}>
                    {iniciales}
                  </div>
              }
            </div>
            <div style={{ fontSize:22, fontWeight:700, marginTop:12, letterSpacing:'-0.01em' }}>{perfilData.nombre}</div>
            {ubicacion ? <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>{ubicacion}</div> : null}
            <BioPerfil bio={perfilData.bio} enlace={perfilData.enlace} />
            {!perfilData.bio && !perfilData.enlace && (
              <button onClick={abrirEditarPerfil} style={{ background:'none', border:'none', color:T.muted, fontSize:12, marginTop:10, cursor:'pointer', fontFamily:T.font, textDecoration:'underline' }}>
                Agregá una descripción y un link
              </button>
            )}
            <Insignias usuario={perfilData} extra={misInsignias} centrado />
            <div style={{ fontSize:12, color:T.sub, marginTop:8 }}>
              Nivel {nivel} - {puntaje} puntos
            </div>
          </div>

          <div style={{ marginTop:18 }}>
            <div style={{ height:2, borderRadius:2, background:T.s3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:(siguienteNivel ? pctProgreso : 100)+'%', background:T.gold, borderRadius:2, transition:'width 1s ease-out' }} />
            </div>
            <div style={{ fontSize:11, color:T.muted, marginTop:8, textAlign:'center' }}>
              {siguienteNivel ? ('Te faltan ' + puntosFaltan + ' puntos para llegar a ' + siguienteNivel) : 'Alcanzaste el nivel maximo'}
            </div>
          </div>

          <div style={{ height:26 }} />

          <button onClick={abrirBandejaMensajes} style={{
            width:'100%', background:'none', border:'none', borderTop:'1px solid '+T.border, borderBottom:'1px solid '+T.border,
            padding:'16px 2px', display:'flex', alignItems:'center', justifyContent:'space-between',
            cursor:'pointer', color:T.text, fontFamily:T.font, fontSize:14, fontWeight:500
          }}>
            <span style={{ display:'flex', alignItems:'center', gap:10 }}>
              Mensajes
              {sinLeer > 0 && (
                <span style={{ background:T.text, color:T.bg, fontSize:11, fontWeight:700, minWidth:18, height:18, borderRadius:9, padding:'0 6px', boxSizing:'border-box', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                  {sinLeer > 99 ? '99+' : sinLeer}
                </span>
              )}
            </span>
            <span style={{ color:T.muted }}>{'>'}</span>
          </button>

          <button onClick={abrirPanel} style={{
            width:'100%', background:'none', border:'none', borderBottom:'1px solid '+T.border,
            padding:'16px 2px', display:'flex', alignItems:'center', justifyContent:'space-between',
            cursor:'pointer', color:T.text, fontFamily:T.font, textAlign:'left', marginBottom:28
          }}>
            <span>
              <span style={{ display:'block', fontSize:14, fontWeight:500 }}>Panel profesional</span>
              <span style={{ display:'block', fontSize:11, color:T.muted, marginTop:3 }}>Estadísticas y herramientas para vender más</span>
            </span>
            <span style={{ color:T.muted }}>{'>'}</span>
          </button>

          <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.14em', marginBottom:14, fontWeight:600 }}>
            MIS PUBLICACIONES
          </div>

          {misPublicaciones.length===0 && (
            <EstadoVacio icono={<><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>} titulo="Todavía no publicaste nada" texto="Tus productos y servicios van a aparecer acá." textoBoton="Publicar ahora" onBoton={()=>setVista('publicar')} />
          )}

          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:'18px 12px' }}>
            {misPublicaciones.map((p:any)=>(
              <div key={p.id} className="tcl-tarjeta" onClick={()=>abrirDetalle(p,'perfil')} style={{ cursor:'pointer', minWidth:0 }}>
                <div style={{ position:'relative', borderRadius:14, overflow:'hidden', background:T.s2 }}>
                  {p.foto_url
                    ? <Img src={p.foto_url} alt={p.titulo} style={{ width:'100%', aspectRatio:'1 / 1', objectFit:'cover', display:'block' }} />
                    : <div style={{ width:'100%', aspectRatio:'1 / 1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:T.muted, fontWeight:600, textAlign:'center', padding:6 }}>{p.categoria?.toUpperCase()}</div>
                  }
                  <div style={{ position:'absolute', top:8, left:8, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:20 }}>
                    {p.vistas || 0} vistas
                  </div>
                  {p.vendida && (
                    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700, letterSpacing:'0.18em' }}>
                      VENDIDO
                    </div>
                  )}
                </div>
                <div style={{ padding:'8px 2px 0' }}>
                  <div style={{ fontWeight:500, fontSize:13, lineHeight:1.3, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.titulo}</div>
                  <div style={{ color:T.text, fontWeight:700, fontSize:15, marginTop:3 }}>${Number(p.precio).toLocaleString()}</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:3 }}>
                    <span style={{ fontSize:10, color:T.muted }}>{tiempoTranscurrido(p.fecha_publicacion)}</span>
                    <button onClick={(e:any)=>{ e.stopPropagation(); setMenuPub(p) }} style={{ background:'none', border:'none', color:T.sub, fontSize:20, lineHeight:1, cursor:'pointer', padding:'2px 0 2px 12px', fontFamily:T.font }}>
                      ⋯
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <ModalAccionesPub
        pub={menuPub}
        onEditar={()=>abrirEditarPub(menuPub)}
        onVendido={()=>alternarVendida(menuPub)}
        onEliminar={()=>{ const id = menuPub.id; setMenuPub(null); eliminarPublicacion(id) }}
        onCerrar={()=>setMenuPub(null)}
      />
      <ModalEditarPub
        pub={editPub}
        titulo={pubEditTitulo} setTitulo={setPubEditTitulo}
        precio={pubEditPrecio} setPrecio={setPubEditPrecio}
        categoria={pubEditCategoria} setCategoria={setPubEditCategoria}
        descripcion={pubEditDescripcion} setDescripcion={setPubEditDescripcion}
        guardando={guardandoPubEdit} mensaje={mensajePubEdit}
        onGuardar={guardarEdicionPub} onCerrar={()=>setEditPub(null)}
      />
      <BottomNav vista={vista} setVista={setVista} abrirPerfil={abrirPerfil} abrirBandejaMensajes={abrirBandejaMensajes} sinLeer={sinLeer} />
    </div>
  )
}

return (
  <div key="home" className="tcl-pantalla" style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:100 }}>
    <link href={FONTS} rel="stylesheet" />

    <div style={{ background:T.bg, padding:'18px 18px 12px', position:'sticky', top:0, zIndex:60 }}>
      <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:17, background:G, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, marginBottom:14, letterSpacing:'0.01em' }}>
        Tu Changarro Libre
      </div>
      <div style={{ position:'relative' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:T.muted, pointerEvents:'none' }}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder={seccionHome === 'busquedas' ? 'Buscar entre los pedidos...' : 'Buscar productos o servicios...'}
          style={{ width:'100%', padding:'11px 16px 11px 40px', borderRadius:14, border:'none', background:T.s2, color:T.text, fontSize:14, outline:'none', fontFamily:T.font, boxSizing:'border-box' }}
        />
      </div>
    </div>

    <div style={{ padding:'0 18px 12px' }}>
      <div style={{ display:'flex', background:T.s2, borderRadius:20, padding:3 }}>
        {[['publicaciones', 'Publicaciones'], ['busquedas', 'Se busca']].map(par => (
          <button key={par[0]} onClick={()=>setSeccionHome(par[0])} style={{
            flex:1, padding:'8px 0', borderRadius:17, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font,
            background: seccionHome === par[0] ? T.text : 'transparent', color: seccionHome === par[0] ? T.bg : T.muted
          }}>
            {par[1]}
          </button>
        ))}
      </div>
    </div>

    <div className="tcl-sinbarra" style={{ display:'flex', gap:24, padding:'0 18px', overflowX:'auto', borderBottom:'1px solid '+T.border }}>
      {CATEGORIAS.map(c=>(
        <button key={c} onClick={()=>setCatActiva(c)} style={{
          background:'none', border:'none', borderBottom:'2px solid '+(catActiva===c?T.text:'transparent'),
          padding:'13px 0 11px', color:catActiva===c?T.text:T.muted, fontWeight:catActiva===c?700:500,
          fontSize:13, cursor:'pointer', whiteSpace:'nowrap', fontFamily:T.font, flexShrink:0
        }}>
          {c==='Electronica' ? 'Electrónica' : c==='Vehiculos' ? 'Vehículos' : c}
        </button>
      ))}
    </div>

    {seccionHome === 'busquedas' ? (
      <div style={{ padding:'16px 18px 20px' }}>
        <button onClick={()=>{ setMensajeBusq(''); setBusqNuevaAbierta(true) }} style={{ width:'100%', padding:'13px', borderRadius:14, border:'1px dashed '+T.border2, background:'transparent', color:T.text, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
          + Publicar lo que busco
        </button>

        {cargandoBusq && <div style={{ marginTop:10 }}><SkelFilas /></div>}

        {!cargandoBusq && busquedasFiltradas.length === 0 && (
          <EstadoVacio icono={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>} titulo="Todavía no hay pedidos" texto="Publicá lo que necesitás y los vendedores te responden con lo que tengan." />
        )}

        {!cargandoBusq && busquedasFiltradas.map((b:any) => (
          <TarjetaBusqueda key={b.id} b={b} esMia={String(b.usuario_id) === String(userId)} onResponder={()=>abrirResponder(b)} onCerrar={()=>cerrarBusqueda(b)} />
        ))}
      </div>
    ) : (
    <div style={{ padding:'16px 18px 20px' }}>
      <div style={{ display:'flex', gap:8, marginBottom:18 }}>
        <select value={filtroCiudad} onChange={e=>setFiltroCiudad(e.target.value)} style={{ flex:1, minWidth:0, padding:'10px 12px', borderRadius:12, border:'none', background:T.s2, color:T.text, fontSize:12, fontWeight:500, outline:'none', fontFamily:T.font }}>
          <option value="">Todas las ciudades</option>
          {ciudadesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={orden} onChange={e=>setOrden(e.target.value)} style={{ flex:1, minWidth:0, padding:'10px 12px', borderRadius:12, border:'none', background:T.s2, color:T.text, fontSize:12, fontWeight:500, outline:'none', fontFamily:T.font }}>
          <option value="recientes">Más recientes</option>
          <option value="menor">Menor precio</option>
          <option value="mayor">Mayor precio</option>
        </select>
      </div>
      <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', marginBottom:14, fontWeight:600 }}>
        {productosFiltrados.length} {catActiva==='Servicios' ? 'SERVICIOS' : 'PRODUCTOS'}{(catActiva!=='Todo' && catActiva!=='Servicios') ? ' EN '+catActiva.toUpperCase() : ''}
      </div>

      {cargando && <SkelTarjetas />}

      {!cargando && productosFiltrados.length === 0 && (
        hayFiltros
          ? <EstadoVacio icono={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>} titulo="No encontramos resultados" texto="Probá cambiando los filtros o la búsqueda." textoBoton="Limpiar filtros" onBoton={limpiarFiltros} />
          : <EstadoVacio icono={<><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>} titulo="Todavía no hay publicaciones" texto="Sé el primero en publicar algo." textoBoton="Publicar ahora" onBoton={()=>setVista('publicar')} />
      )}

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:'22px 12px' }}>
        {productosFiltrados.map((p:any, i:number)=>(
          <div key={p.id} className="tcl-tarjeta tcl-aparece" onClick={()=>abrirDetalle(p,'home')} style={{ cursor:'pointer', minWidth:0, animationDelay: (Math.min(i, 8) * 40) + 'ms' }}>
            <div style={{ position:'relative', borderRadius:14, overflow:'hidden', background:T.s2 }}>
              {p.foto_url
                ? <Img src={p.foto_url} alt={p.titulo} style={{ width:'100%', aspectRatio:'1 / 1', objectFit:'cover', display:'block' }} />
                : p.video_url
                  ? <video src={p.video_url + '#t=0.1'} preload="metadata" muted playsInline style={{ width:'100%', aspectRatio:'1 / 1', objectFit:'cover', display:'block', background:'#000' }} />
                  : <div style={{ width:'100%', aspectRatio:'1 / 1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:T.muted, fontWeight:600, letterSpacing:'0.08em', textAlign:'center', padding:6, boxSizing:'border-box' }}>{p.categoria?.toUpperCase()}</div>
              }
              {p.video_url && (
                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', paddingLeft:2, pointerEvents:'none' }}>
                  <IconoPlay size={16} />
                </div>
              )}
              {p.fotos_extra_urls && p.fotos_extra_urls.length > 0 && (
                <div style={{ position:'absolute', bottom:8, left:8, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:20 }}>
                  +{p.fotos_extra_urls.length}
                </div>
              )}
              <button onClick={(e:any)=>{ e.stopPropagation(); animarFav(p.id); toggleFavorito(p.id) }} style={{
                position:'absolute', top:8, right:8, width:32, height:32, borderRadius:'50%', border:'none', padding:0,
                background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
              }}>
                <IconoCorazon activo={favoritos.includes(p.id)} size={16} animar={favAnim === p.id} />
              </button>
            </div>
            <div style={{ padding:'9px 2px 0' }}>
              <div style={{ fontWeight:500, fontSize:13, lineHeight:1.3, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.titulo}</div>
              <div style={{ color:T.text, fontWeight:700, fontSize:16, marginTop:3, letterSpacing:'-0.01em' }}>${Number(p.precio).toLocaleString('es-AR')}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, fontSize:10, color:T.muted, marginTop:4 }}>
                {p.ubicacion_vendedor
                  ? <span style={{ display:'flex', alignItems:'center', gap:3, minWidth:0 }}>
                      <IconoUbicacion size={11} />
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.ubicacion_vendedor}</span>
                    </span>
                  : <span />
                }
                <span style={{ flexShrink:0 }}>{tiempoTranscurrido(p.fecha_publicacion)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    )}

    <ModalNuevaBusqueda
      abierto={busqNuevaAbierta}
      titulo={bTitulo} setTitulo={setBTitulo}
      desc={bDesc} setDesc={setBDesc}
      categoria={bCat} setCategoria={setBCat}
      presupuesto={bPres} setPresupuesto={setBPres}
      enviando={enviandoBusq} mensaje={mensajeBusq}
      onEnviar={crearBusqueda} onCerrar={()=>setBusqNuevaAbierta(false)}
    />
    <ModalResponderBusqueda
      busqueda={busqResponder} pubs={misPubsResp} cargando={cargandoResp}
      seleccion={respSeleccion} setSeleccion={setRespSeleccion}
      enviando={enviandoResp} mensaje={mensajeResp}
      onEnviar={enviarRespuestaBusqueda} onCerrar={()=>setBusqResponder(null)}
      onPublicar={()=>{ setBusqResponder(null); setVista('publicar') }}
    />

    <BottomNav vista={vista} setVista={setVista} abrirPerfil={abrirPerfil} abrirBandejaMensajes={abrirBandejaMensajes} sinLeer={sinLeer} />
  </div>
)
}
