import { useState } from 'react'

function FormularioAuth({ titulo, onSubmit, alternativo }) {
  const [email, setEmail] = useState('') // Correo electronico
  const [password, setPassword] = useState('') // Contraseña
  const [error, setError] = useState('') // Mensaje de error
  // Funcion para verificar que los datos se hayan ingresado correctamente
  async function manejarSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await onSubmit(email, password)
    } catch (err) {
      setError(err.message)
    }
  }
  // Estructura HTML del formulario 
  return (
    <form className="auth" onSubmit={manejarSubmit}>
      <div className="auth-logo" aria-hidden="true" />
      <h2>{titulo}</h2>
      <p className="auth-sub">Tus notas, organizadas y con subtareas.</p>
      <input
        type="email"
        placeholder="Tu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Tu contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">{titulo}</button>
      <button type="button" className="link" onClick={alternativo}>
        {titulo === 'Bienvenido de nuevo'
          ? '¿No tenés cuenta? Creala'
          : '¿Ya tenés cuenta? Ingresá'}
      </button>
    </form>
  )
}

export default FormularioAuth
