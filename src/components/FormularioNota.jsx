import { useState } from 'react'

function FormularioNota({ onAgregar }) {
  const [texto, setTexto] = useState('') // Estado del campo texto
  // Funcion para manejar el texto ingresado
  function manejarSubmit(e) {
    e.preventDefault()
    const limpio = texto.trim()
    if (!limpio) return
    onAgregar(limpio)
    setTexto('')
  }
  // Estructura visual para escribir una nota con el boton de agregar
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
