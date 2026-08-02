import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from './db.js'
import { authMiddleware, SECRET } from './auth.js'

const app = express()
app.use(cors())
app.use(express.json())
// Solicitud POST para registrar un usuario
app.post('/api/register', async (req, res) => {
  // Obtenemos el correo electronico y la contraseña ingresada
  const { email, password } = req.body
  // Corroboramos los requisitos de las credenciales
  if (!email || !password || password.length < 6) {
    // Devuelvo un mensaje de error en caso que no se cumpla
    return res
      .status(400)
      .json({ error: 'Email válido y contraseña de al menos 6 caracteres' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10) // Encripto la contraseña para mayor seguridad
    // Realizo la solicitud SQL para que se ingrese un usuario nuevo con los datos ingresados
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    )
    const token = jwt.sign({ userId: rows[0].id }, SECRET, { expiresIn: '7d' }) // Genero un token de duracion de 7d hasta volver a iniciar sesion
    res.status(201).json({ token, user: rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El email ya está registrado' }) // devuelvo un mensaje de error si el correo electronico ya existe
    }
    res.status(500).json({ error: err.message })
  }
})
// Solicitud de tipo POST para loguear un usuario existenete
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body // Obtengo los valores de email y password del formulario
  try {
    // Realizo la consulta SQL con el valor de email para obtener los datos del usuario
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    const user = rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' }) // En caso que el correo no exita doy mensaje de error
    }

    const correcta = await bcrypt.compare(password, user.password_hash) // Comparo la contraseña ingresada por la que esta guardada en la base de datos
    if (!correcta) {
      return res.status(401).json({ error: 'Credenciales inválidas' }) // Devuelvo error si esta es incorrecta
    }

    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' }) // Doy un token de duracion de 7 dias hasta que expire en caso de que todo este correcto
    res.json({ token, user: { id: user.id, email: user.email } }) // Devuelvo un JSON con los datos del usuario
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Solicitud de tipo GET para dirigirme a la seccion de notas
app.get('/api/notas', authMiddleware, async (req, res) => {
  try {
    // Solicitud SQL para obtener todas las notas del usuario por medio de su ID donde esta ordenado por fecha mas recientes
    const { rows: notas } = await pool.query(
      'SELECT * FROM notas WHERE user_id = $1 ORDER BY creada_en DESC',
      [req.userId]
    )
    // Obtengo todas las subtareas de TODAS las notas del usuario en UNA sola consulta,
    // en vez de hacer una consulta por nota (evita el problema N+1).
    // ANY($1::int[]) = "que nota_id esté dentro de la lista de ids de notas".
    const { rows: subtareas } = await pool.query(
      'SELECT * FROM subtareas WHERE nota_id = ANY($1::int[]) ORDER BY id',
      [notas.length ? notas.map((n) => n.id) : [0]]
    )
    // Agrupo las subtareas por nota en un objeto: { idNota: [sub1, sub2], ... }
    // para después adjuntarlas a cada nota sin repetir consultas.
    const subPorNota = {}
    for (const s of subtareas) {
      if (!subPorNota[s.nota_id]) subPorNota[s.nota_id] = []
      subPorNota[s.nota_id].push(s)
    }
    const conSubtareas = notas.map((n) => ({
      ...n,
      subtareas: subPorNota[n.id] || [],
    }))
    res.json(conSubtareas)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Solicitud de tipo POST para agregar una nota
app.post('/api/notas', authMiddleware, async (req, res) => {
  const { texto } = req.body // Obtengo el valor del nombre de la nota
  if (!texto || !texto.trim()) {
    return res.status(400).json({ error: 'El campo "texto" es obligatorio' }) // Doy una advertencia en caso que no se haya escrito nada
  }
  try {
    // Realizo la solicitud SQL para agregar en notas el valor dado segun el id del cliente
    const { rows } = await pool.query(
      'INSERT INTO notas (user_id, texto) VALUES ($1, $2) RETURNING *',
      [req.userId, texto.trim()]
    )
    res.status(201).json({ ...rows[0], subtareas: [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Solicitud para actualizar si la tarea se completo o no
app.patch('/api/notas/:id', authMiddleware, async (req, res) => {
  const { completada } = req.body
  try {
    // Actualizo en la base de datos que la tarea sea a actualizado con los datos de completada, id del usuario y de la nota
    const { rows } = await pool.query(
      'UPDATE notas SET completada = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [completada, req.params.id, req.userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Nota no encontrada' })
    }
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Solicitud de tipo POST para agregar una subtarea en una nota
app.post('/api/notas/:id/subtareas', authMiddleware, async (req, res) => {
  const { texto } = req.body // obtengo el texto de la subtarea
  if (!texto || !texto.trim()) {
    return res.status(400).json({ error: 'El campo "texto" es obligatorio' }) // Verifico que el texto no este vacio
  }
  try {
    // Obtengo la nota donde voy a agregar la subtarea
    const { rowCount } = await pool.query(
      'SELECT 1 FROM notas WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Nota no encontrada' })
    }
    // Inserto la nueva subtarea en la base de datos con los datos obtenidos
    const { rows } = await pool.query(
      'INSERT INTO subtareas (nota_id, texto) VALUES ($1, $2) RETURNING *',
      [req.params.id, texto.trim()]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Solicitud para actualizar si una tarea se completo o no
app.patch('/api/subtareas/:id', authMiddleware, async (req, res) => {
  const { completada } = req.body // Obtengo los datos de la checkbox
  try {
    // SEGURIDAD: el JOIN con notas (FROM ... USING) verifica que la subtarea pertenezca
    // a una nota del usuario autenticado. Sin esto, un usuario podría pasar el id de
    // una subtarea de otro usuario y modificarla.
    // Inyección SQL: los $1, $2, $3 son PARÁMETROS, no texto concatenado.
    // Nunca hagas `SELECT ... WHERE id = ' + req.params.id` porque el usuario
    // podría inyectar SQL malicioso. Los parámetros de pg lo previenen.
    const { rows } = await pool.query(
      `UPDATE subtareas s
       SET completada = $1
       FROM notas n
       WHERE s.id = $2 AND s.nota_id = n.id AND n.user_id = $3
       RETURNING s.*`,
      [completada, req.params.id, req.userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subtarea no encontrada' }) // Devuelvo un error si la subtarea no fue encontrada
    }
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Solicitud de tipo DELETE para eliminar una subtarea
app.delete('/api/subtareas/:id', authMiddleware, async (req, res) => {
  try { 
    // Solicitud SQL para eliminar la subtarea en base al id de la subtarea, la id de la nota y el id del usuario
    const { rows } = await pool.query(
      `DELETE FROM subtareas s
       USING notas n
       WHERE s.id = $1 AND s.nota_id = n.id AND n.user_id = $2
       RETURNING s.id`,
      [req.params.id, req.userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subtarea no encontrada' }) // Mensaje de error en caso que la subtarea no exista
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Solicitud de tipo DELETE para eliminar una nota completa
app.delete('/api/notas/:id', authMiddleware, async (req, res) => {
  try {
    // Obtengo el valor de rowCount para saber cual es la nota a borrar y realizo la solicitud SQL
    const { rowCount } = await pool.query(
      'DELETE FROM notas WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Nota no encontrada' }) // Mensaje de error en caso de no encontrarse
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default app
