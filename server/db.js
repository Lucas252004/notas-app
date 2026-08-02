import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  user: 'notas_user',
  password: 'notas_pass',
  host: 'localhost',
  port: 5432,
  database: 'notas_db',
})

export default pool
