import pkg from 'pg'
const { Pool } = pkg
// Credenciales de la base de datos para conectarsse a la aplicacion
const pool = new Pool({
  user: 'notas_user',
  password: 'notas_pass',
  host: 'localhost',
  port: 5432,
  database: 'notas_db',
})

export default pool
