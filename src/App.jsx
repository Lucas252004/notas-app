import { useState, useEffect } from 'react'
import FormularioNota from './components/FormularioNota'
import FormularioAuth from './components/FormularioAuth'
import ListaNotas from './components/ListaNotas'
import './App.css'

const API = 'http://localhost:3001/api'

function App() {
  // Estado de los tokens, notas, las vistas del registro y de cargas
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [notas, setNotas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [vistaRegistro, setVistaRegistro] = useState(false)
  // Verficio si esta el token activo
  useEffect(() => {
    if (!token) {
      setCargando(false)
      return
    }
    // Comienzo a cargar la vista 
    async function cargar() {
      try {
        // Llamo a la API enviandole el token
        const res = await fetch(`${API}/notas`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Sesión expirada, volvé a ingresar') // En caso de estar expirada devuelvo un mensaje de error
        const data = await res.json() // Obtengo un JSON con todos sus datos
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
  // Funcion para cerrar sesion del usuario y por ende remover el token actual
  function cerrarSesion() {
    setToken(null)
    localStorage.removeItem('token')
    setNotas([])
  }
  // Creo solicitud POST para agregar una nota enviandole tambien el token
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
    setNotas([nueva, ...notas]) // Agrego esta nueva nota
  }
  // Genero una solicitud de tipo DELETE para borrar una nota
  async function eliminar(id) {
    await fetch(`${API}/notas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    // INMUTABILIDAD: nunca modifico `notas` directamente, creo un array NUEVO con filter
    // y ese es el que le paso a setNotas. React necesita un valor nuevo para re-renderizar.
    setNotas(notas.filter((n) => n.id !== id))
  }
  // Genero una solicitud de tipo PATCH para actualizar la NOTA (tarea principal) completada o no
  // Ojo: no confundir con alternarSubtarea (abajo), que actualiza una subtarea
  async function alternarCompletada(nota) {
    const completada = !nota.completada
    const res = await fetch(`${API}/notas/${nota.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completada }),
    })
    const actualizada = await res.json()
    // "..." (spread) copia la nota y solo reemplaza lo que cambió.
    // Sin copiar, mutaríamos el objeto original y React no detectaría el cambio.
    setNotas(notas.map((n) => (n.id === nota.id ? actualizada : n)))
  }
  // Solicitud de tipo POST para agregar una subtarea a una nota
  async function agregarSubtarea(notaId, texto) {
    const res = await fetch(`${API}/notas/${notaId}/subtareas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ texto }),
    })
    const nueva = await res.json() 
    // Agrego esta nueva subtarea a la lista de subtareas que tiene la nota
    setNotas(
      notas.map((n) =>
        n.id === notaId ? { ...n, subtareas: [...n.subtareas, nueva] } : n
      )
    )
  }

  async function alternarSubtarea(notaId, subtareaId, completada) {
    const res = await fetch(`${API}/subtareas/${subtareaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completada: !completada }),
    })
    const actualizada = await res.json()
    setNotas(
      notas.map((n) =>
        n.id === notaId
          ? {
              ...n,
              subtareas: n.subtareas.map((s) =>
                s.id === subtareaId ? actualizada : s
              ),
            }
          : n
      )
    )
  }
// Genero solicitud de tipo DELETE a la API para eliminar una subtarea
  async function eliminarSubtarea(notaId, subtareaId) {
    await fetch(`${API}/subtareas/${subtareaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    // Actualizo el array de subtareas para eliminar esa tarea
    setNotas(
      notas.map((n) =>
        n.id === notaId
          ? { ...n, subtareas: n.subtareas.filter((s) => s.id !== subtareaId) }
          : n
      )
    )
  }
  // Verifico si no hay un token, en ese caso envio al usuario a la ventana de autenticacion
  if (!token) {
    return (
      <main className="notas">
        <h1>Mis Notas</h1>
        {vistaRegistro ? (
          <FormularioAuth
            titulo="Crear cuenta"
            onSubmit={(email, password) => pedirToken(email, password, 'register')}
            alternativo={() => setVistaRegistro(false)}
          />
        ) : (
          <FormularioAuth
            titulo="Bienvenido de nuevo"
            onSubmit={(email, password) => pedirToken(email, password, 'login')}
            alternativo={() => setVistaRegistro(true)}
          />
        )}
      </main>
    )
  }
// Devuelvo de manera visual para el usuario la vista principal de la aplicacion
  return (
    <main className="notas">
      <div className="barra">
        <h1>Mis Notas</h1>
        <button className="link" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>
      <FormularioNota onAgregar={agregar} />
      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <ListaNotas
          notas={notas}
          onEliminar={eliminar}
          onAlternarCompletada={alternarCompletada}
          onAgregarSubtarea={agregarSubtarea}
          onAlternarSubtarea={alternarSubtarea}
          onEliminarSubtarea={eliminarSubtarea}
        />
      )}
    </main>
  )
}

export default App
