import { useState } from 'react'

function FormularioAuth({ titulo, onSubmit, alternativo }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function manejarSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await onSubmit(email, password)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="auth" onSubmit={manejarSubmit}>
      <h2>{titulo}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">{titulo}</button>
      <button type="button" className="link" onClick={alternativo}>
        {titulo === 'Ingresar' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Ingresá'}
      </button>
    </form>
  )
}

export default FormularioAuth
