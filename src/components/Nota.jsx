function Nota({ nota, onEliminar }) {
  return (
    <li>
      {nota.texto}
      <button onClick={onEliminar}>Eliminar</button>
    </li>
  )
}

export default Nota
