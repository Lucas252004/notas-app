import Nota from './Nota'
// Funcion con la lista de las notas y con todas sus funcionalidades
function ListaNotas({
  notas,
  onEliminar,
  onAlternarCompletada,
  onAgregarSubtarea,
  onAlternarSubtarea,
  onEliminarSubtarea,
}) {
  if (notas.length === 0) {
    return <p>No hay notas todavía. ¡Creá la primera!</p>
  }
  // Despliego todas las notas que tiene almacenado el usuario
  return (
    <ul>
      {notas.map((nota) => (
        <Nota
          key={nota.id}
          nota={nota}
          onEliminar={onEliminar}
          onAlternarCompletada={onAlternarCompletada}
          onAgregarSubtarea={onAgregarSubtarea}
          onAlternarSubtarea={onAlternarSubtarea}
          onEliminarSubtarea={onEliminarSubtarea}
        />
      ))}
    </ul>
  )
}

export default ListaNotas
