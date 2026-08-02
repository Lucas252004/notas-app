import app from './app.js'
// Defino el puerto de la API
const PORT = 3001
// Punto de entrada del servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
})
