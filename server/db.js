import pkg from 'pg'
const { Pool } = pkg

// En producción usa DATABASE_URL (lo configura Render/Neon).
// En local, las credenciales de desarrollo.
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        user: 'notas_user',
        password: 'notas_pass',
        host: 'localhost',
        port: 5432,
        database: 'notas_db',
      }
)

export default pool
