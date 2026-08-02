import Nota from './Nota'

function ListaNotas({ notas, onEliminar }) {
  if (notas.length === 0) {
    return <p>No hay notas todavía.</p>
  }

  return (
    <ul>
      {notas.map((nota) => (
        <Nota key={nota.id} nota={nota} onEliminar={() => onEliminar(nota.id)} />
      ))}
    </ul>
  )
}

export default ListaNotas
