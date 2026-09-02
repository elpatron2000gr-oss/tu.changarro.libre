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

let T = DARK
const G = 'linear-gradient(135deg,' + T.gold + ',' + T.goldDk + ')'
const FONTS = 'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap'
const CATEGORIAS = ['Todo','Electronica','Ropa','Hogar','Deportes','Servicios','Vehiculos','Inmuebles','Otro']

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Cordoba','Corrientes',
  'Entre Rios','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquen','Rio Negro','Salta','San Juan','San Luis','Santa Cruz',
  'Santa Fe','Santiago del Estero','Tierra del Fuego','Tucuman'
]

const NIVELES = {
  'Nuevo':     { color: T.muted,  siguiente: 'Confiable', minPuntaje: 0  },
  'Confiable': { color: T.blue,   siguiente: 'Experto',   minPuntaje: 20 },
  'Experto':   { color: T.purple, siguiente: 'Élite',     minPuntaje: 50 },
  'Élite':     { color: T.gold,   siguiente: null,        minPuntaje: 100 },
}

function Input({ value, onChange, placeholder, type='text', style={} }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} type={type}
      style={{ background:T.s2, color:T.text, border:'1px solid '+T.border2, borderRadius:12, padding:'13px 16px', fontSize:15, outline:'none', fontFamily:T.font, width:'100%', boxSizing:'border-box', ...style }}
    />
  )
}

function GBtn({ children, onClick, disabled, full, grad }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:full?'100%':'auto', padding:'13px 20px', borderRadius:14, border:'none', background:disabled?'#444':(grad||G), color:'#0a0a0a', fontWeight:700, fontSize:15, cursor:disabled?'not-allowed':'pointer', fontFamily:T.font, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
      {children}
    </button>
  )
}

function ReputationRing({ nivel, puntaje, size = 120 }) {
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
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:22, fontWeight:800, color:info.color }}>{puntaje}</div>
        <div style={{ fontSize:10, color:T.muted, letterSpacing:'0.05em' }}>PUNTOS</div>
      </div>
    </div>
  )
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!email || !pass) { setError('Completa correo y contrasena'); return }
    if (mode === 'register' && !name) { setError('Completa tu nombre'); return }
    setLoading(true)
    setError('')
    const buscar = await supabase.from('usuarios').select('*').eq('email', email).maybeSingle()
    if (buscar.error) { setLoading(false); setError('Error: ' + buscar.error.message); return }
    if (buscar.data) { setLoading(false); onAuth({ id: buscar.data.id, nombre: buscar.data.nombre }); return }
    if (mode === 'login') { setLoading(false); setError('No encontramos esa cuenta. Proba registrarte.'); return }
    const crear = await supabase.from('usuarios').insert([{ nombre: name, email: email }]).select().single()
    setLoading(false)
    if (crear.error) { setError('Error: ' + crear.error.message); return }
    onAuth({ id: crear.data.id, nombre: crear.data.nombre })
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
        <div style={{ display:'flex', marginBottom:24, background:T.s2, borderRadius:13, padding:4 }}>
          {['login','register'].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:10, borderRadius:10, background:mode===m?T.s4:'transparent', border:'none', color:mode===m?T.text:T.muted, fontFamily:T.font, fontWeight:mode===m?700:500, fontSize:14, cursor:'pointer' }}>
              {m==='login'?'Iniciar sesion':'Registrarse'}
            </button>
          ))}
        </div>
        {mode==='register'&&(
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Tu nombre</label>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Ana Garcia" />
          </div>
        )}
        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Correo electronico</label>
        <div style={{ marginBottom:16 }}><Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" type="email" /></div>
        <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Contrasena</label>
        <div style={{ position:'relative', marginBottom:22 }}>
          <Input value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type={showPass?'text':'password'} />
          <button onClick={()=>setShowPass(s=>!s)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:T.muted, cursor:'pointer', fontSize:13 }}>
            {showPass?'Ocultar':'Ver'}
          </button>
        </div>
        <GBtn full disabled={!email||!pass||loading} onClick={submit}>
          {loading?'Conectando...':mode==='login'?'Entrar al changarro':'Crear cuenta'}
        </GBtn>
        {error&&<p style={{ marginTop:14, color:T.red, fontSize:13, textAlign:'center' }}>{error}</p>}
      </div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState('')
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [favoritos, setFavoritos] = useState([])
  const [catActiva, setCatActiva] = useState('Todo')
  const [busqueda, setBusqueda] = useState('')
  const [chatProducto, setChatProducto] = useState(null)
  const [chatMensajes, setChatMensajes] = useState([])
  const [chatTexto, setChatTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [vista, setVista] = useState('home')
  const [titulo, setTitulo] = useState('')
  const [precio, setPrecio] = useState('')
  const [categoria, setCategoria] = useState('Electronica')
  const [descripcion, setDescripcion] = useState('')
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [publicando, setPublicando] = useState(false)
  const [mensajePublicar, setMensajePublicar] = useState('')

  const [perfilData, setPerfilData] = useState(null)
  const [misPublicaciones, setMisPublicaciones] = useState([])
  const [cargandoPerfil, setCargandoPerfil] = useState(false)

  const [editNombre, setEditNombre] = useState('')
  const [editCiudad, setEditCiudad] = useState('')
  const [editProvincia, setEditProvincia] = useState('')
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [mensajeEditar, setMensajeEditar] = useState('')

  async function handleAuth(user) {
    setUserId(user.id)
    setUserName(user.nombre)
    setAuthed(true)
    await cargarProductos()
    await cargarFavoritos(user.id)
  }

  async function cargarProductos() {
    setCargando(true)
    const res = await supabase.from('publicaciones').select('*').order('fecha_publicacion', { ascending: false })
    setCargando(false)
    if (!res.error) setProductos(res.data)
  }

  async function cargarFavoritos(uid) {
    const res = await supabase.from('favoritos').select('publicacion_id').eq('usuario_id', uid)
    if (!res.error) setFavoritos(res.data.map(f => f.publicacion_id))
  }

  async function toggleFavorito(pubId) {
    const esFav = favoritos.includes(pubId)
    if (esFav) {
      await supabase.from('favoritos').delete().eq('usuario_id', userId).eq('publicacion_id', pubId)
      setFavoritos(favoritos.filter(id => id !== pubId))
    } else {
      await supabase.from('favoritos').insert([{ usuario_id: userId, publicacion_id: pubId }])
      setFavoritos([...favoritos, pubId])
    }
  }

  async function abrirChat(p) {
    setChatProducto(p)
    setVista('chat')
    const res = await supabase.from('mensajes').select('*').eq('publicacion_id', p.id).order('fecha', { ascending: true })
    if (!res.error) setChatMensajes(res.data)
  }

  async function enviarMensaje() {
    if (!chatTexto.trim()) return
    setEnviando(true)
    const res = await supabase.from('mensajes').insert([{ de_usuario_id: userId, para_usuario_id: chatProducto.vendedor_id, publicacion_id: chatProducto.id, texto: chatTexto }]).select().single()
    setEnviando(false)
    if (!res.error) { setChatMensajes([...chatMensajes, res.data]); setChatTexto('') }
  }

  function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function publicar() {
    if (!titulo || !precio) { setMensajePublicar('Completa titulo y precio'); return }
    setPublicando(true)
    setMensajePublicar('')
    let fotoUrl = null
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop()
      const path = userId + '-' + Date.now() + '.' + ext
      const subida = await supabase.storage.from('fotos').upload(path, fotoFile)
      if (!subida.error) { const url = supabase.storage.from('fotos').getPublicUrl(path); fotoUrl = url.data.publicUrl }
    }
    const res = await supabase.from('publicaciones').insert([{ vendedor_id: userId, titulo, precio: Number(precio), categoria, descripcion, foto_url: fotoUrl }]).select().single()
    setPublicando(false)
    if (res.error) { setMensajePublicar('Error: ' + res.error.message); return }
    setTitulo(''); setPrecio(''); setDescripcion(''); setFotoFile(null); setFotoPreview(null)
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

  async function eliminarPublicacion(pubId) {
    const res = await supabase.from('publicaciones').delete().eq('id', pubId)
    if (!res.error) {
      setMisPublicaciones(misPublicaciones.filter(p => p.id !== pubId))
    }
  }

  function abrirEditarPerfil() {
    setEditNombre(perfilData?.nombre || '')
    setEditCiudad(perfilData?.ciudad || '')
    setEditProvincia(perfilData?.provincia || '')
    setMensajeEditar('')
    setVista('editarPerfil')
  }

  async function guardarPerfil() {
    if (!editNombre.trim()) { setMensajeEditar('El nombre no puede estar vacio'); return }
    setGuardandoPerfil(true)
    setMensajeEditar('')
    const res = await supabase.from('usuarios')
      .update({ nombre: editNombre, ciudad: editCiudad, provincia: editProvincia })
      .eq('id', userId)
      .select()
      .single()
    setGuardandoPerfil(false)
    if (res.error) { setMensajeEditar('Error: ' + res.error.message); return }
    setPerfilData(res.data)
    setUserName(res.data.nombre)
    setVista('perfil')
  }

  const productosFiltrados = productos.filter(p => {
    const matchCat = catActiva === 'Todo' || p.categoria === catActiva
    const matchBus = p.titulo.toLowerCase().includes(busqueda.toLowerCase())
    return matchCat && matchBus
  })

  if (!authed) return <AuthScreen onAuth={handleAuth} />

  if (vista === 'chat' && chatProducto) {
    return (
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', display:'flex', flexDirection:'column' }}>
        <link href={FONTS} rel="stylesheet" />
        <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
          <button onClick={()=>setVista('home')} style={{ background:'none', border:'none', color:T.gold, cursor:'pointer', fontSize:20, fontWeight:'bold', padding:0 }}>Volver</button>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>{chatProducto.titulo}</div>
            <div style={{ fontSize:11, color:T.muted }}>Chat del producto</div>
          </div>
          <div style={{ color:T.gold, fontWeight:800, fontSize:16 }}>${Number(chatProducto.precio).toLocaleString()}</div>
        </div>
        <div style={{ flex:1, padding:'18px', overflowY:'auto', display:'flex', flexDirection:'column', gap:10, minHeight:400 }}>
          {chatMensajes.length===0&&(
            <div style={{ textAlign:'center', padding:'40px 20px', color:T.muted }}>Se el primero en escribir</div>
          )}
          {chatMensajes.map(m=>(
            <div key={m.id} style={{ maxWidth:'80%', alignSelf:m.de_usuario_id===userId?'flex-end':'flex-start' }}>
              <div style={{ background:m.de_usuario_id===userId?T.gold:T.s2, color:m.de_usuario_id===userId?'#0a0a0a':T.text, padding:'10px 14px', borderRadius:14, fontSize:14 }}>
                {m.texto}
              </div>
              <div style={{ fontSize:10, color:T.muted, marginTop:4, textAlign:m.de_usuario_id===userId?'right':'left' }}>
                {new Date(m.fecha).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' })}
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

  if (vista === 'publicar') {
    return (
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:30 }}>
        <link href={FONTS} rel="stylesheet" />
        <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
          <button onClick={()=>setVista('home')} style={{ background:'none', border:'none', color:T.gold, cursor:'pointer', fontSize:20, fontWeight:'bold' }}>Volver</button>
          <div style={{ fontWeight:700, fontSize:17, flex:1 }}>Publicar producto</div>
        </div>
        <div style={{ padding:'20px 18px' }}>
          <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Foto del producto</label>
          <input type="file" accept="image/*" onChange={handleFoto} style={{ display:'none' }} id="fotoInput" />
          <label htmlFor="fotoInput" style={{ display:'block', width:'100%', height:180, borderRadius:16, border:'2px dashed '+(fotoPreview?T.gold:T.border2), background:T.s2, cursor:'pointer', marginBottom:18, overflow:'hidden', boxSizing:'border-box' }}>
            {fotoPreview
              ? <img src={fotoPreview} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:T.muted, gap:8 }}>
                  <div style={{ fontSize:36, color:T.gold, fontWeight:'bold' }}>+</div>
                  <div style={{ fontSize:13 }}>Toca para agregar foto</div>
                  <div style={{ fontSize:11 }}>Camara o galeria</div>
                </div>
            }
          </label>

          <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Titulo *</label>
          <Input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ej: iPhone 13, Bicicleta..." style={{ marginBottom:16 }} />

          <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Precio (ARS) *</label>
          <Input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="0" type="number" style={{ marginBottom:16 }} />

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
          <button onClick={()=>setVista('perfil')} style={{ background:'none', border:'none', color:T.gold, cursor:'pointer', fontSize:20, fontWeight:'bold' }}>Volver</button>
          <div style={{ fontWeight:700, fontSize:17, flex:1 }}>Editar perfil</div>
        </div>

        <div style={{ padding:'20px 18px' }}>
          <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Nombre *</label>
          <Input value={editNombre} onChange={e=>setEditNombre(e.target.value)} placeholder="Tu nombre" style={{ marginBottom:16 }} />

          <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Correo</label>
          <Input value={perfilData?.email || ''} onChange={()=>{}} style={{ marginBottom:6, opacity:0.5 }} />
          <div style={{ fontSize:11, color:T.muted, marginBottom:16 }}>El correo no se puede modificar</div>

          <label style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', display:'block', marginBottom:7, fontWeight:600, textTransform:'uppercase' }}>Ciudad</label>
          <Input value={editCiudad} onChange={e=>setEditCiudad(e.target.value)} placeholder="Ej: Rosario" style={{ marginBottom:16 }} />

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

  if (vista === 'perfil') {
    const nivel = perfilData?.nivel_reputacion || 'Nuevo'
    const info = NIVELES[nivel] || NIVELES['Nuevo']

    return (
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto', paddingBottom:40 }}>
        <link href={FONTS} rel="stylesheet" />
        <div style={{ background:T.s1, padding:'16px 18px', borderBottom:'1px solid '+T.border, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:60 }}>
          <button onClick={()=>setVista('home')} style={{ background:'none', border:'none', color:T.gold, cursor:'pointer', fontSize:20, fontWeight:'bold' }}>Volver</button>
          <div style={{ fontWeight:700, fontSize:17, flex:1 }}>Mi perfil</div>
          <button onClick={abrirEditarPerfil} style={{ background:T.s2, border:'1px solid '+T.border2, color:T.gold, borderRadius:12, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            Editar
          </button>
        </div>

        {cargandoPerfil && <p style={{ color:T.muted, textAlign:'center', padding:40 }}>Cargando perfil...</p>}

        {!cargandoPerfil && perfilData && (
          <div style={{ padding:'26px 18px' }}>

            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:26 }}>
              <ReputationRing nivel={nivel} puntaje={perfilData.puntaje_reputacion || 0} />
              <div style={{ fontSize:20, fontWeight:800, marginTop:14 }}>{perfilData.nombre}</div>
              <div style={{
                marginTop:8, padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700,
                color: info.color, border:'1px solid '+info.color, background: info.color+'18'
              }}>
                {nivel}
              </div>
            </div>

            <div style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:16, padding:'18px', marginBottom:20 }}>
              <div style={{ fontSize:11, color:T.muted, letterSpacing:'0.1em', fontWeight:600, marginBottom:14, textTransform:'uppercase' }}>Datos de la cuenta</div>

              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid '+T.border }}>
                <span style={{ color:T.muted, fontSize:13 }}>Correo</span>
                <span style={{ fontSize:13, fontWeight:600 }}>{perfilData.email}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid '+T.border }}>
                <span style={{ color:T.muted, fontSize:13 }}>Ciudad</span>
                <span style={{ fontSize:13, fontWeight:600 }}>{perfilData.ciudad || 'No especificada'}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid '+T.border }}>
                <span style={{ color:T.muted, fontSize:13 }}>Provincia</span>
                <span style={{ fontSize:13, fontWeight:600 }}>{perfilData.provincia || 'No especificada'}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}>
                <span style={{ color:T.muted, fontSize:13 }}>Ventas realizadas</span>
                <span style={{ fontSize:13, fontWeight:600, color:T.gold }}>{perfilData.cantidad_ventas || 0}</span>
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

            {misPublicaciones.map(p=>(
              <div key={p.id} style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:16, marginBottom:12, overflow:'hidden', display:'flex' }}>
                {p.foto_url
                  ? <img src={p.foto_url} alt={p.titulo} style={{ width:90, height:90, objectFit:'cover', flexShrink:0 }} />
                  : <div style={{ width:90, height:90, flexShrink:0, background:'linear-gradient(135deg,'+T.s3+','+T.s4+')', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:T.gold, fontWeight:'bold', textAlign:'center', padding:6 }}>{p.categoria?.toUpperCase()}</div>
                }
                <div style={{ padding:'12px 14px', flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{p.titulo}</div>
                  <div style={{ color:T.gold, fontWeight:800, fontSize:15, marginBottom:8 }}>${Number(p.precio).toLocaleString()}</div>
                  <button onClick={()=>eliminarPublicacion(p.id)} style={{ alignSelf:'flex-start', background:'none', border:'1px solid '+T.red, color:T.red, borderRadius:10, padding:'4px 12px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.font, maxWidth:430, margin:'0 auto' }}>
      <link href={FONTS} rel="stylesheet" />

      <div style={{ background:T.s1, padding:'14px 18px', borderBottom:'1px solid '+T.border, position:'sticky', top:0, zIndex:60 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:20, background:G, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700 }}>Tu Changarro Libre</div>
            <div style={{ fontSize:11, color:T.muted }}>Hola, {userName}</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={abrirPerfil} style={{ width:36, height:36, borderRadius:'50%', background:T.s2, border:'1px solid '+T.border2, color:T.gold, fontWeight:800, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {userName ? userName.charAt(0).toUpperCase() : 'P'}
            </button>
            <button onClick={()=>setVista('publicar')} style={{ background:G, border:'none', borderRadius:20, padding:'8px 16px', color:'#0a0a0a', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:T.font }}>
              + Publicar
            </button>
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

      <div style={{ padding:'0 18px 100px' }}>
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

        {productosFiltrados.map(p=>(
          <div key={p.id} style={{ background:T.s2, border:'1px solid '+T.border2, borderRadius:18, marginBottom:12, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.3)' }}>
            {p.foto_url
              ? <img src={p.foto_url} alt={p.titulo} style={{ width:'100%', height:200, objectFit:'cover', display:'block' }} />
              : <div style={{ height:100, background:'linear-gradient(135deg,'+T.s3+','+T.s4+')', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:T.gold, fontWeight:'bold' }}>{p.categoria?.toUpperCase()}</div>
            }
            <div style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:16, marginBottom:4, letterSpacing:'-0.01em' }}>{p.titulo}</div>
                  <div style={{ fontSize:12, color:T.muted, background:T.s3, display:'inline-block', padding:'2px 10px', borderRadius:20 }}>{p.categoria}</div>
                </div>
                <div style={{ color:T.gold, fontWeight:800, fontSize:20, marginLeft:12, flexShrink:0 }}>${Number(p.precio).toLocaleString()}</div>
              </div>
              {p.descripcion&&<div style={{ fontSize:13, color:T.sub, marginBottom:12, lineHeight:1.5 }}>{p.descripcion}</div>}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>abrirChat(p)} style={{ flex:1, padding:'10px', borderRadius:12, border:'none', background:G, color:'#0a0a0a', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:T.font }}>
                  Contactar vendedor
                </button>
                <button onClick={()=>toggleFavorito(p.id)} style={{ padding:'10px 14px', borderRadius:12, border:'1px solid '+(favoritos.includes(p.id)?T.gold:T.border2), background:favoritos.includes(p.id)?T.gold+'22':'transparent', color:favoritos.includes(p.id)?T.gold:T.muted, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  {favoritos.includes(p.id)?'FAV':'fav'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}