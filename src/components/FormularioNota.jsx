import { useState } from 'react'

function FormularioNota({ onAgregar }) {
  const [texto, setTexto] = useState('')

  function manejarSubmit(e) {
    e.preventDefault()
    const limpio = texto.trim()
    if (!limpio) return
    onAgregar(limpio)
    setTexto('')
  }

  return (
    <form className="fila" onSubmit={manejarSubmit}>
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escribe una nota..."
      />
      <button type="submit">Agregar</button>
    </form>
  )
}

export default FormularioNota
