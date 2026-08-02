import { useState, useEffect } from 'react'
import FormularioNota from './components/FormularioNota'
import FormularioAuth from './components/FormularioAuth'
import ListaNotas from './components/ListaNotas'
import './App.css'

const API = 'http://localhost:3001/api'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [notas, setNotas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [vistaRegistro, setVistaRegistro] = useState(false)

  useEffect(() => {
    if (!token) {
      setCargando(false)
      return
    }
    async function cargar() {
      try {
        const res = await fetch(`${API}/notas`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Sesión expirada, volvé a ingresar')
        const data = await res.json()
        setNotas(data)
      } catch (err) {
        console.error(err)
        cerrarSesion()
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [token])

  async function pedirToken(email, password, endpoint) {
    const res = await fetch(`${API}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error en la autenticación')
    setToken(data.token)
    localStorage.setItem('token', data.token)
  }

  function cerrarSesion() {
    setToken(null)
    localStorage.removeItem('token')
    setNotas([])
  }

  async function agregar(texto) {
    const res = await fetch(`${API}/notas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ texto }),
    })
    const nueva = await res.json()
    setNotas([nueva, ...notas])
  }

  async function eliminar(id) {
    await fetch(`${API}/notas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotas(notas.filter((n) => n.id !== id))
  }

  if (!token) {
    return (
      <main className="notas">
        <h1>Mis Notas</h1>
        {vistaRegistro ? (
          <FormularioAuth
            titulo="Registrarse"
            onSubmit={(email, password) => pedirToken(email, password, 'register')}
            alternativo={() => setVistaRegistro(false)}
          />
        ) : (
          <FormularioAuth
            titulo="Ingresar"
            onSubmit={(email, password) => pedirToken(email, password, 'login')}
            alternativo={() => setVistaRegistro(true)}
          />
        )}
      </main>
    )
  }

  return (
    <main className="notas">
      <div className="barra">
        <h1>Mis Notas</h1>
        <button className="link" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>
      <FormularioNota onAgregar={agregar} />
      {cargando ? <p>Cargando...</p> : <ListaNotas notas={notas} onEliminar={eliminar} />}
    </main>
  )
}

export default App
