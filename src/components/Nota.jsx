import { useState } from 'react'

function Nota({
  nota,
  onEliminar,
  onAlternarCompletada,
  onAgregarSubtarea,
  onAlternarSubtarea,
  onEliminarSubtarea,
}) {
  const [nuevaSubtarea, setNuevaSubtarea] = useState('')

  function agregar(e) {
    e.preventDefault()
    const texto = nuevaSubtarea.trim()
    if (!texto) return
    onAgregarSubtarea(nota.id, texto)
    setNuevaSubtarea('')
  }

  return (
    <li>
      <div className="nota-titulo">
        <div
          className={`texto${nota.completada ? ' completada' : ''}`}
          onClick={() => onAlternarCompletada(nota)}
        >
          <span
            className={`check${nota.completada ? ' completada' : ''}`}
            role="checkbox"
            aria-checked={nota.completada}
          />
          {nota.texto}
        </div>
        <div className="acciones">
          <button onClick={() => onEliminar(nota.id)}>Eliminar</button>
        </div>
      </div>

      {nota.subtareas && nota.subtareas.length > 0 && (
        <div className="subtareas">
          {nota.subtareas.map((s) => (
            <div className="subtarea" key={s.id}>
              <div
                className={`texto${s.completada ? ' completada' : ''}`}
                onClick={() => onAlternarSubtarea(nota.id, s.id, s.completada)}
              >
                <span
                  className={`check${s.completada ? ' completada' : ''}`}
                  role="checkbox"
                  aria-checked={s.completada}
                />
                {s.texto}
              </div>
              <button className="link" onClick={() => onEliminarSubtarea(nota.id, s.id)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="agregar-subtarea" onSubmit={agregar}>
        <input
          placeholder="Agregar subtarea..."
          value={nuevaSubtarea}
          onChange={(e) => setNuevaSubtarea(e.target.value)}
        />
        <button type="submit">+</button>
      </form>
    </li>
  )
}

export default Nota
