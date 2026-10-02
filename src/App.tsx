import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

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
const CATEGORIAS = ['Todo','Electronica','Ropa','Hogar','Deportes','Servicios','Vehiculos','Inmuebles','Otro']

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

function Toggle({ label, sub, value, onChange }: any) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid '+T.border }}>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{sub}</div>}
      </div>
      <button onClick={onChange} style={{
        width:48, height:28, borderRadius:20, border:'1px solid '+T.border2,
        background: value ? G : T.s3, position:'relative', cursor:'pointer', flexShrink:0
      }}>
        <div style={{
          width:20, height:20, borderRadius:'50%', background: value ? '#0a0a0a' : T.muted,
          position:'absolute', top:3, left: value ? 24 : 3, transition:'left 0.2s ease'
        }} />
      </button>
    </div>
  )
}

function InfoRow({ label, value, sub }: any) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 0', borderBottom:'1px solid '+T.border }}>
      <span style={{ color:T.muted, fontSize:13 }}>{label}</span>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:13, fontWeight:600 }}>{value}</div>
        {sub && <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function BackBtn({ onClick }: any) {
  return (
    <button onClick={onClick} style={{ background:'none', border:'none', color:T.gold, cursor:'pointer', fontSize:22, fontWeight:'bold', padding:0, lineHeight:1, width:28 }}>
      ←
    </button>
  )
}

function ReputationRing({ nivel, puntaje, avatarUrl, iniciales, size = 120 }: any) {
  const info = NIVELES[nivel] || NIVELES['Nuevo']
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const pctVisual = Math.min(100, puntaje)
  const [animado, setAnimado] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimado(pctVisual), 100)
    return () => clearTimeout(t)
  }, [pctVisual])

  const offset = circumference - (animado / 100) * circumference
  const inner = size - 26

  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={T.s3} strokeWidth={8} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={info.color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition:'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {avatarUrl
          ? <img src={avatarUrl} style={{ width:inner, height:inner, borderRadius:'50%', objectFit:'cover' }} />
          : <div style={{ width:inner, height:inner, borderRadius:'50%', background:G, display:'flex', alignItems:'center', justifyContent:'center', fontSize:Math.round(inner*0.36), fontWeight:800, color:'#0a0a0a' }}>
              {iniciales}
            </div>
        }
      </div>
    </div>
  )
}

function BottomNav({ vista, setVista, abrirPerfil, abrirBandejaMensajes }: any) {
  const item = (label: string, activo: boolean, onClick: any) => (
    <button onClick={onClick} style={{
      background:'none', border:'none', cursor:'pointer', flex:1,
      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
      padding:'8px 0', color: activo ? T.gold : T.muted, fontFamily:T.font
    }}>
      <div style={{ fontSize:11, fontWeight: activo ? 800 : 600 }}>{label}</div>
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
      {item('Mensajes', vista==='mensajes', abrirBandejaMensajes)}

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

function AuthScreen({ onAuth }: any) {
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
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password: pass })
      if (signUpError) { setLoading(false); setError('Error: ' + signUpError.message); return }
      const authId = data.user?.id
      if (!authId) { setLoading(false); setError('No se pudo crear la cuenta'); return }
      const crear = await supabase.from('usuarios').insert([{ auth_id: authId, nombre: name, email }]).select().single()
      setLoading(false)
      if (crear.error) { setError('Error: ' + crear.error.message); return }
      onAuth({ id: crear.data.id, nombre: crear.data.nombre })
    } else {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (loginError) { setLoading(false); setError('Correo o contrasena incorrectos'); return }
      const authId = data.user?.id
      const buscar = await supabase.from('usuarios').select('*').eq('auth_id', authId).maybeSingle()
      setLoading(false)
      if (buscar.error || !buscar.data) { setError('No encontramos tu perfil'); return }
      onAuth({ id: buscar.data.id, nombre: buscar.data.nombre })
    }
  }

  async function enviarRecuperacion() {
    if (!email) { setError('Ingresa tu correo'); return }
    setLoading(true)
    setError('')
    setMensajeExito('')
    const { error: recError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    setLoading(false)
    if (recError) { setError('Error: ' + recError.message); return }
    setMensajeExito('Listo! Si ese correo tiene cuenta, te enviamos un link para elegir una nueva contrasena. Revisa tambien la carpeta de spam.')
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', fontFamily:T.font }}>
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
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', fontFamily:T.font }}>
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
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [userId, setUserId] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [productos, setProductos] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [favoritos, setFavoritos] = useState<any[]>([])
  const [catActiva, setCatActiva] = useState('Todo')
  const [busqueda, setBusqueda] = useState('')
  const [chatProducto, setChatProducto] = useState<any>(null)
  const [chatOtroUsuario, setChatOtroUsuario] = useState<any>(null)
  const [chatOtroNombre, setChatOtroNombre] = useState('')
  const [chatOrigen, setChatOrigen] = useState('home')
  const [chatMensajes, setChatMensajes] = useState<any[]>([])
  const [chatTexto, setChatTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
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
  const [editProvincia, setEditProvincia] = useState('')
  const [avatarFile, setAvatarFile] = useState<any>(null)
  const [avatarPreview, setAvatarPreview] = useState<any>(null)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [mensajeEditar, setMensajeEditar] = useState('')

  const [isDarkMode, setIsDarkMode] = useState(true)
  const [notificacionesActivas, setNotificacionesActivas] = useState(true)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false)
  const [mensajeConfig, setMensajeConfig] = useState('')

  const [detalleProducto, setDetalleProducto] = useState<any>(null)
  const [detalleIndex, setDetalleIndex] = useState(0)
  const [detalleVendedor, setDetalleVendedor] = useState<any>(null)
  const [detalleOrigen, setDetalleOrigen] = useState('home')

  async function handleAuth(user: any) {
    setUserId(user.id)
    setUserName(user.nombre)
    setAuthed(true)
    await cargarProductos()
    await cargarFavoritos(user.id)
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

  async function cargarProductos() {
    setCargando(true)
    const res = await supabase.from('publicaciones').select('*').order('fecha_publicacion', { ascending: false })
    setCargando(false)
    if (!res.error) setProductos(res.data)
  }

  async function cargarFavoritos(uid: any) {
    const res = await supabase.from('favoritos').select('publicacion_id').eq('usuario_id', uid)
    if (!res.error) setFavoritos(res.data.map((f:any) => f.publicacion_id))
  }

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

  async function abrirDetalle(p: any, origen: string = 'home') {
    if (p.vendedor_id !== userId) {
      supabase.from('publicaciones').update({ vistas: (p.vistas || 0) + 1 }).eq('id', p.id).then(()=>{})
    }
    setDetalleProducto(p)
    setDetalleIndex(0)
    setDetalleVendedor(null)
    setDetalleOrigen(origen)
    setVista('detalle')
    const resVend = await supabase.from('usuarios').select('nombre,ciudad,provincia,nivel_reputacion,avatar_url').eq('id', p.vendedor_id).maybeSingle()
    if (!resVend.error) setDetalleVendedor(resVend.data)
  }

  async function abrirChat(p: any, otroUsuarioId: any, origen: string = 'home', nombreOtro: string = '') {
    setChatProducto(p)
    setChatOtroUsuario(otroUsuarioId)
    setChatOtroNombre(nombreOtro || '')
    setChatOrigen(origen)
    setChatMensajes([])
    setVista('chat')
    const filtro =
      'and(emisor_id.eq.' + userId + ',receptor_id.eq.' + otroUsuarioId + '),' +
      'and(emisor_id.eq.' + otroUsuarioId + ',receptor_id.eq.' + userId + ')'
    const res = await supabase.from('mensajes')
      .select('*')
      .eq('publicacion_id', p.id)
      .or(filtro)
      .order('fecha', { ascending: true })
    if (!res.error) setChatMensajes(res.data)
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
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
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
      for (let i = 0; i < fotoFiles.length; i++) {
        const file = fotoFiles[i]
        const ext = file.name.split('.').pop()
        const path = userId + '-' + Date.now() + '-' + i + '.' + ext
        const subida = await supabase.storage.from('fotos').upload(path, file)
        if (subida.error) { setPublicando(false); setMensajePublicar('Error subiendo una foto: ' + subida.error.message); return }
        const url = supabase.storage.from('fotos').getPublicUrl(path).data.publicUrl
        if (i === 0) fotoUrl = url
        else fotosExtra.push(url)
      }
    }

    let videoUrl = null
    if (videoFile) {
      const ext = videoFile.name.split('.').pop()
      const path = userId + '-' + Date.now() + '-v.' + ext
      const subidaVideo = await supabase.storage.from('videos').upload(path, videoFile)
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
    if (!resPublicaciones.error) setMisPublicaciones(resPublicaciones.data)
  }

  async function eliminarPublicacion(pubId: any) {
    const res = await supabase.from('publicaciones').delete().eq('id', pubId)
    if (!res.error) {
      setMisPublicaciones(misPublicaciones.filter((p:any) => p.id !== pubId))
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

    setMisMensajes(conversaciones)
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
    setAvatarFile(null)
    setAvatarPreview(perfilData?.avatar_url || null)
    setMensajeEditar('')
    setVista('editarPerfil')
  }

  async function guardarPerfil() {
    if (!editNombre.trim()) { setMensajeEditar('El nombre no puede estar vacio'); return }
    setGuardandoPerfil(true)
    setMensajeEditar('')
    let avatarUrl = perfilData?.avatar_url || null
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = 'avatar-' + userId + '-' + Date.now() + '.' + ext
      const subida = await supabase.storage.from('fotos').upload(path, avatarFile)
      if (subida.error) { setGuardandoPerfil(false); setMensajeEditar('Error subiendo la foto: ' + subida.error.message); return }
      const url = supabase.storage.from('fotos').getPublicUrl(path)
      avatarUrl = url.data.publicUrl
    }
    const res = await supabase.from('usuarios')
      .update({ nombre: editNombre, ciudad: editCiudad, provincia: editProvincia, avatar_url: avatarUrl })
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

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setAuthed(false)
    setUserId(null)
    setUserName('')
    setProductos([])
    setFavoritos([])
    setPerfilData(null)
    setMisPublicaciones([])
    setVista('home')
  }

  async function eliminarCuenta() {
    setEliminandoCuenta(true)
    setMensajeConfig('')
    const res = await supabase.from('usuarios').delete().eq('id', userId)
    if (res.error) { setEliminandoCuenta(false); setMensajeConfig('Error: ' + res.error.message); return }
    setEliminandoCuenta(false)
    cerrarSesion()
  }

  const productosFiltrados = productos.filter(p => {
    const matchCat = catActiva === 'Todo' || p.categoria === catActiva
    const matchBus = p.titulo.toLowerCase().includes(busqueda.toLowerCase())
    return matchCat && matchBus
  })

  const vistasTotales = misPublicaciones.reduce((acc:any, p:any) => acc + (p.vistas || 0), 0)

  T = isDarkMode ? DARK : LIGHT

  if (checandoSesion) {
    return (
      <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.font, color:T.muted }}>
        <link href={FONTS} rel="stylesheet" />
        Cargando...
      </div>
    )
  }

  if (recoveryMode) {
    return (
      <NuevaPasswordScreen onDone={async ()=>{ setRecoveryMode(false); await cerrarSesion() }} />
    )
  }

  if (!authed) return <AuthScreen onAuth={handleAuth} />

  if (vista === 'detalle' && detalleProducto) {
    const p = detalleProducto
    const medios: any[] = []
    if (p.foto_url) medios.push({ tipo:'img', url:p.foto_url })
    if (p.fotos_extra_urls) p.fotos_extra_urls.forEach((u:any)=> medios.push({ tipo:'img', url:u }))
    if (p.video_url) medios.push({ tipo:'video', url:p.video_url })

    const esFav = favoritos.includes(p.id)

    return (
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:90 }}>
        <link href={FONTS} rel="stylesheet" />
        <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
          <BackBtn onClick={()=>setVista(detalleOrigen)} />
          <div style={{ fontWeight:700, fontSize:16, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.titulo}</div>
        </div>

        <div style={{ position:'relative', background:T.s2 }}>
          {medios.length === 0 ? (
            <div style={{ height:280, background:'linear-gradient(135deg,'+T.s3+','+T.s4+')', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:T.gold, fontWeight:'bold' }}>
              {p.categoria?.toUpperCase()}
            </div>
          ) : medios[detalleIndex].tipo === 'video' ? (
            <video src={medios[detalleIndex].url} controls style={{ width:'100%', height:280, objectFit:'cover', display:'block', background:'#000' }} />
          ) : (
            <img src={medios[detalleIndex].url} style={{ width:'100%', height:280, objectFit:'cover', display:'block' }} />
          )}

          {medios.length > 1 && (
            <>
              {detalleIndex > 0 && (
                <button onClick={()=>setDetalleIndex(i=>i-1)} style={{
                  position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
                  background:'rgba(0,0,0,0.5)', color:'#fff', border:'none', borderRadius:'50%',
                  width:34, height:34, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'
                }}>←</button>
              )}
              {detalleIndex < medios.length - 1 && (
                <button onClick={()=>setDetalleIndex(i=>i+1)} style={{
                  position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                  background:'rgba(0,0,0,0.5)', color:'#fff', border:'none', borderRadius:'50%',
                  width:34, height:34, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'
                }}>→</button>
              )}
              <div style={{ position:'absolute', bottom:10, left:0, right:0, display:'flex', justifyContent:'center', gap:6 }}>
                {medios.map((_:any,i:number)=>(
                  <div key={i} onClick={()=>setDetalleIndex(i)} style={{
                    width:7, height:7, borderRadius:'50%', cursor:'pointer',
                    background: i===detalleIndex ? T.gold : 'rgba(255,255,255,0.5)'
                  }} />
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding:'18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>{p.titulo}</div>
              <div style={{ fontSize:12, color:T.muted, background:T.s3, display:'inline-block', padding:'2px 10px', borderRadius:20 }}>{p.categoria}</div>
            </div>
            <div style={{ color:T.gold, fontWeight:800, fontSize:22, marginLeft:12 }}>${Number(p.precio).toLocaleString()}</div>
          </div>

          <div style={{ fontSize:11, color:T.muted, marginBottom:16 }}>
            {p.vistas || 0} vistas · {tiempoTranscurrido(p.fecha_publicacion)}
          </div>

          {p.descripcion && (
            <div style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:16, padding:'16px', marginBottom:16 }}>
              <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', fontWeight:600, marginBottom:10, textTransform:'uppercase' }}>Descripcion</div>
              <div style={{ fontSize:14, color:T.sub, lineHeight:1.6 }}>{p.descripcion}</div>
            </div>
          )}

          {detalleVendedor && (
            <div style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:16, padding:'14px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
              {detalleVendedor.avatar_url
                ? <img src={detalleVendedor.avatar_url} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} />
                : <div style={{ width:44, height:44, borderRadius:'50%', background:G, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#0a0a0a' }}>
                    {(detalleVendedor.nombre || '?').charAt(0).toUpperCase()}
                  </div>
              }
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{detalleVendedor.nombre}</div>
                <div style={{ fontSize:11, color:T.muted }}>
                  {[detalleVendedor.ciudad, detalleVendedor.provincia].filter(Boolean).join(', ') || 'Ubicacion no especificada'}
                </div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:(NIVELES[detalleVendedor.nivel_reputacion]||NIVELES['Nuevo']).color }}>
                {detalleVendedor.nivel_reputacion || 'Nuevo'}
              </div>
            </div>
          )}
        </div>

        <div style={{
          position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
          width:'100%', maxWidth:430, background:T.s1, borderTop:'1px solid '+T.border,
          padding:'12px 18px', display:'flex', gap:10, zIndex:70
        }}>
          <GBtn full onClick={()=>abrirChat(p, p.vendedor_id, 'detalle', detalleVendedor?.nombre || '')}>Contactar vendedor</GBtn>
          <button onClick={()=>toggleFavorito(p.id)} style={{
            padding:'0 16px', borderRadius:14, border:'1px solid '+(esFav?T.gold:T.border2),
            background:esFav?T.gold+'22':'transparent', color:esFav?T.gold:T.muted, fontWeight:700, fontSize:13, cursor:'pointer'
          }}>
            {esFav?'FAV':'fav'}
          </button>
        </div>
      </div>
    )
  }

  if (vista === 'chat' && chatProducto) {
    return (
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', display:'flex', flexDirection:'column' }}>
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
          <div style={{ color:T.gold, fontWeight:800, fontSize:16 }}>${Number(chatProducto.precio).toLocaleString()}</div>
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
      </div>
    )
  }

  if (vista === 'mensajes') {
    return (
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:100 }}>
        <link href={FONTS} rel="stylesheet" />
        <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
          <div style={{ fontWeight:700, fontSize:17, flex:1 }}>Mensajes</div>
        </div>

        <div style={{ padding:'8px 0' }}>
          {cargandoMensajes && <p style={{ color:T.muted, textAlign:'center', padding:40 }}>Cargando conversaciones...</p>}

          {!cargandoMensajes && misMensajes.length===0 && (
            <div style={{ textAlign:'center', padding:'60px 20px', color:T.muted }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Todavia no tenes conversaciones</div>
              <div style={{ fontSize:12 }}>Cuando alguien te escriba va a aparecer aca</div>
            </div>
          )}

          {misMensajes.map((c:any)=>{
            const nombre = c.interlocutor?.nombre || 'Usuario'
            const avatar = c.interlocutor?.avatar_url
            const yoEscribi = c.emisor_id === userId
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
                  <div style={{ fontSize:13, color:T.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {yoEscribi ? 'Vos: ' : ''}{c.contenido}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <BottomNav vista={vista} setVista={setVista} abrirPerfil={abrirPerfil} abrirBandejaMensajes={abrirBandejaMensajes} />
      </div>
    )
  }

  if (vista === 'publicar') {
    return (
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:30 }}>
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
                  <div style={{ fontSize:11 }}>Opcional, mejora tus chances de venta</div>
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
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:30 }}>
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
    return (
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:100 }}>
        <link href={FONTS} rel="stylesheet" />
        <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
          <BackBtn onClick={()=>setVista('home')} />
          <div style={{ fontWeight:700, fontSize:17, flex:1 }}>Configuracion</div>
        </div>

        <div style={{ padding:'20px 18px' }}>

          <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Apariencia</div>
          <div style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:16, padding:'4px 16px', marginBottom:24 }}>
            <Toggle
              label="Modo oscuro"
              sub={isDarkMode ? 'Activado' : 'Desactivado'}
              value={isDarkMode}
              onChange={()=>setIsDarkMode(!isDarkMode)}
            />
          </div>

          <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Notificaciones</div>
          <div style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:16, padding:'4px 16px', marginBottom:24 }}>
            <Toggle
              label="Notificaciones de mensajes"
              sub="Proximamente"
              value={notificacionesActivas}
              onChange={()=>setNotificacionesActivas(!notificacionesActivas)}
            />
          </div>

          <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Preferencias</div>
          <div style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:16, padding:'4px 16px', marginBottom:24 }}>
            <InfoRow label="Idioma" value="Espanol" sub="Mas idiomas proximamente" />
            <InfoRow label="Moneda" value="Pesos Argentinos (ARS)" />
          </div>

          <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Informacion</div>
          <div style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:16, padding:'4px 16px', marginBottom:24 }}>
            <InfoRow label="Version de la app" value="1.0.0" />
            <InfoRow label="Ayuda y soporte" value="Proximamente" />
            <InfoRow label="Terminos y condiciones" value="Proximamente" />
            <InfoRow label="Politica de privacidad" value="Proximamente" />
          </div>

          <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Cuenta</div>
          <div style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:16, padding:'18px', marginBottom:24 }}>
            <button onClick={cerrarSesion} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
              Cerrar sesion
            </button>
          </div>

          <div style={{ fontSize:11, color:T.red, letterSpacing:'0.1em', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Zona de peligro</div>
          <div style={{ background:T.s2, border:'1px solid '+T.red, borderRadius:16, padding:'18px' }}>
            <div style={{ fontSize:13, color:T.sub, marginBottom:14, lineHeight:1.5 }}>
              Eliminar tu cuenta borra tu perfil de forma permanente. Esta accion no se puede deshacer.
            </div>

            {!confirmandoEliminar ? (
              <button onClick={()=>setConfirmandoEliminar(true)} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1px solid '+T.red, background:'transparent', color:T.red, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:T.font }}>
                Eliminar cuenta
              </button>
            ) : (
              <div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:12, color:T.text }}>
                  Estas seguro? Esto no se puede deshacer.
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>setConfirmandoEliminar(false)} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid '+T.border2, background:'transparent', color:T.text, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:T.font }}>
                    Cancelar
                  </button>
                  <button onClick={eliminarCuenta} disabled={eliminandoCuenta} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:T.red, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:T.font }}>
                    {eliminandoCuenta ? 'Eliminando...' : 'Si, eliminar'}
                  </button>
                </div>
              </div>
            )}
            {mensajeConfig && <p style={{ marginTop:14, color:T.red, fontSize:13, textAlign:'center' }}>{mensajeConfig}</p>}
          </div>
        </div>
        <BottomNav vista={vista} setVista={setVista} abrirPerfil={abrirPerfil} abrirBandejaMensajes={abrirBandejaMensajes} />
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
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:100 }}>
        <link href={FONTS} rel="stylesheet" />
        <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
          <div style={{ fontWeight:700, fontSize:17, flex:1 }}>Mi perfil</div>
          <button onClick={abrirEditarPerfil} style={{ background:T.s2, border:'1px solid '+T.border2, color:T.gold, borderRadius:12, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            Editar
          </button>
        </div>

        {cargandoPerfil && <p style={{ color:T.muted, textAlign:'center', padding:40 }}>Cargando perfil...</p>}

        {!cargandoPerfil && perfilData && (
          <div style={{ padding:'20px 18px' }}>

            <div style={{ borderRadius:24, overflow:'hidden', border:'1px solid '+T.border2, marginBottom:16, boxShadow:'0 0 40px '+T.glow3 }}>
              <div style={{ height:76, background:G }} />
              <div style={{ background:T.s2, padding:'0 22px 22px', textAlign:'center' }}>
                <div style={{
                  marginTop:-46, display:'inline-block', border:'4px solid '+T.s2,
                  borderRadius:'50%', background:T.s2, lineHeight:0
                }}>
                  <ReputationRing nivel={nivel} puntaje={puntaje} avatarUrl={perfilData.avatar_url} iniciales={iniciales} size={104} />
                </div>
                <div style={{ fontSize:20, fontWeight:800, marginTop:12 }}>{perfilData.nombre}</div>
                <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{puntaje} puntos</div>
                <div style={{
                  marginTop:8, padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700,
                  color: info.color, border:'1px solid '+info.color, background: info.color+'18',
                  display:'inline-block'
                }}>
                  {nivel}
                </div>

                {siguienteNivel ? (
                  <div style={{ marginTop:18 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.muted, marginBottom:6 }}>
                      <span>{nivel}</span>
                      <span>{siguienteNivel}</span>
                    </div>
                    <div style={{ height:6, borderRadius:10, background:T.s3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:pctProgreso+'%', background:G, borderRadius:10, transition:'width 1s ease-out' }} />
                    </div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:8 }}>
                      Te faltan {puntosFaltan} puntos para llegar a {siguienteNivel}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop:16, fontSize:12, color:T.gold, fontWeight:700 }}>
                    Alcanzaste el nivel maximo del changarro
                  </div>
                )}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
              <div style={{ background:T.s2, border:'1px solid '+T.border2, borderTop:'3px solid '+T.gold, borderRadius:14, padding:'14px 8px', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color:T.gold }}>{misPublicaciones.length}</div>
                <div style={{ fontSize:10, color:T.muted, marginTop:4 }}>Publicados</div>
              </div>
              <div style={{ background:T.s2, border:'1px solid '+T.border2, borderTop:'3px solid '+T.green, borderRadius:14, padding:'14px 8px', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color:T.green }}>{perfilData.cantidad_ventas || 0}</div>
                <div style={{ fontSize:10, color:T.muted, marginTop:4 }}>Vendidos</div>
              </div>
              <div style={{ background:T.s2, border:'1px solid '+T.border2, borderTop:'3px solid '+T.blue, borderRadius:14, padding:'14px 8px', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color:T.blue }}>{vistasTotales}</div>
                <div style={{ fontSize:10, color:T.muted, marginTop:4 }}>Vistas</div>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, marginBottom:20 }}>
              <button onClick={abrirBandejaMensajes} style={{
                flex:1, background:T.s2, border:'1px solid '+T.border2, borderRadius:16,
                padding:'14px', cursor:'pointer', textAlign:'left'
              }}>
                <div style={{ fontSize:11, color:T.muted, marginBottom:2 }}>Bandeja</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.gold }}>Mensajes →</div>
              </button>
              <div style={{ flex:1, background:T.s2, border:'1px solid '+T.border2, borderRadius:16, padding:'14px' }}>
                <div style={{ fontSize:11, color:T.muted, marginBottom:2 }}>Ubicacion</div>
                <div style={{ fontSize:14, fontWeight:700 }}>{ubicacion || 'No especificada'}</div>
              </div>
            </div>

            <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', marginBottom:14, fontWeight:600 }}>
              MIS PUBLICACIONES ({misPublicaciones.length})
            </div>

            {misPublicaciones.length===0 && (
              <div style={{ textAlign:'center', padding:'40px 20px', color:T.muted, background:T.s2, borderRadius:16, border:'1px solid '+T.border2 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Todavia no publicaste nada</div>
                <div style={{ fontSize:12 }}>Tus productos van a aparecer aca</div>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {misPublicaciones.map((p:any)=>(
                <div key={p.id} onClick={()=>abrirDetalle(p,'perfil')} style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:16, overflow:'hidden', cursor:'pointer' }}>
                  <div style={{ position:'relative' }}>
                    {p.foto_url
                      ? <img src={p.foto_url} alt={p.titulo} style={{ width:'100%', height:110, objectFit:'cover', display:'block' }} />
                      : <div style={{ height:90, background:'linear-gradient(135deg,'+T.s3+','+T.s4+')', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:T.gold, fontWeight:'bold', textAlign:'center', padding:6 }}>{p.categoria?.toUpperCase()}</div>
                    }
                    <div style={{
                      position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.65)', color:'#fff',
                      fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20
                    }}>
                      {p.vistas || 0} vistas
                    </div>
                  </div>
                  <div style={{ padding:'10px 12px' }}>
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:4, lineHeight:1.3 }}>{p.titulo}</div>
                    <div style={{ color:T.gold, fontWeight:800, fontSize:15, marginBottom:4 }}>${Number(p.precio).toLocaleString()}</div>
                    <div style={{ fontSize:10, color:T.muted, marginBottom:8 }}>{tiempoTranscurrido(p.fecha_publicacion)}</div>
                    <button onClick={(e:any)=>{ e.stopPropagation(); eliminarPublicacion(p.id) }} style={{ width:'100%', background:'none', border:'1px solid '+T.red, color:T.red, borderRadius:10, padding:'6px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <BottomNav vista={vista} setVista={setVista} abrirPerfil={abrirPerfil} abrirBandejaMensajes={abrirBandejaMensajes} />
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:100 }}>
      <link href={FONTS} rel="stylesheet" />

      <div style={{ background:T.s1, padding:'14px 18px', borderBottom:'1px solid '+T.border, position:'sticky', top:0, zIndex:60 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:20, background:G, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700 }}>Tu Changarro Libre</div>
            <div style={{ fontSize:11, color:T.muted }}>Bienvenido, {userName}</div>
          </div>
        </div>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar productos..."
          style={{ width:'100%', padding:'10px 16px', borderRadius:24, border:'1px solid '+T.border2, background:T.s2, color:T.text, fontSize:14, outline:'none', fontFamily:T.font, boxSizing:'border-box' }}
        />
      </div>

      <div style={{ display:'flex', gap:8, padding:'12px 18px', overflowX:'auto' }}>
        {CATEGORIAS.map(c=>(
          <button key={c} onClick={()=>setCatActiva(c)} style={{ padding:'6px 14px', borderRadius:20, border:'none', background:catActiva===c?G:T.s2, color:catActiva===c?'#0a0a0a':T.sub, fontWeight:catActiva===c?700:500, fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontFamily:T.font }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ padding:'0 18px 20px' }}>
        <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', marginBottom:14, fontWeight:600 }}>
          {productosFiltrados.length} PRODUCTOS{catActiva!=='Todo'?' EN '+catActiva.toUpperCase():''}
        </div>

        {cargando&&<p style={{ color:T.muted, textAlign:'center', padding:40 }}>Cargando productos...</p>}

        {!cargando&&productosFiltrados.length===0&&(
          <div style={{ textAlign:'center', padding:'60px 20px', color:T.muted }}>
            <div style={{ fontSize:40, marginBottom:12, color:T.gold, fontWeight:'bold' }}>TCL</div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>No hay productos todavia</div>
            <div style={{ fontSize:13 }}>Se el primero en publicar</div>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {productosFiltrados.map(p=>(
            <div key={p.id} onClick={()=>abrirDetalle(p,'home')} style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column', cursor:'pointer' }}>
              <div style={{ position:'relative' }}>
                {p.video_url
                  ? <video src={p.video_url} autoPlay muted loop playsInline style={{ width:'100%', height:120, objectFit:'cover', display:'block' }} />
                  : p.foto_url
                    ? <img src={p.foto_url} alt={p.titulo} style={{ width:'100%', height:120, objectFit:'cover', display:'block' }} />
                    : <div style={{ height:90, background:'linear-gradient(135deg,'+T.s3+','+T.s4+')', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:T.gold, fontWeight:'bold', textAlign:'center', padding:6 }}>{p.categoria?.toUpperCase()}</div>
                }
                {p.fotos_extra_urls && p.fotos_extra_urls.length > 0 && (
                  <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.65)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20 }}>
                    +{p.fotos_extra_urls.length}
                  </div>
                )}
                <button onClick={(e:any)=>{ e.stopPropagation(); toggleFavorito(p.id) }} style={{
                  position:'absolute', bottom:8, right:8, padding:'6px 10px', borderRadius:10,
                  border:'1px solid '+(favoritos.includes(p.id)?T.gold:'transparent'),
                  background:favoritos.includes(p.id)?T.gold+'cc':'rgba(0,0,0,0.5)',
                  color:favoritos.includes(p.id)?'#0a0a0a':'#fff', fontWeight:700, fontSize:10, cursor:'pointer'
                }}>
                  {favoritos.includes(p.id)?'FAV':'fav'}
                </button>
              </div>
              <div style={{ padding:'10px 12px', flex:1, display:'flex', flexDirection:'column' }}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:4, letterSpacing:'-0.01em', lineHeight:1.3 }}>{p.titulo}</div>
                <div style={{ color:T.gold, fontWeight:800, fontSize:16, marginBottom:4 }}>${Number(p.precio).toLocaleString()}</div>
                <div style={{ fontSize:10, color:T.muted }}>{tiempoTranscurrido(p.fecha_publicacion)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav vista={vista} setVista={setVista} abrirPerfil={abrirPerfil} abrirBandejaMensajes={abrirBandejaMensajes} />
    </div>
  )
}