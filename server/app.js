import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from './db.js'
import { authMiddleware, SECRET } from './auth.js'

const app = express()
app.use(cors())
app.use(express.json())

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password || password.length < 6) {
    return res
      .status(400)
      .json({ error: 'Email válido y contraseña de al menos 6 caracteres' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    )
    const token = jwt.sign({ userId: rows[0].id }, SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El email ya está registrado' })
    }
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    const user = rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const correcta = await bcrypt.compare(password, user.password_hash)
    if (!correcta) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, email: user.email } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/notas', authMiddleware, async (req, res) => {
  try {
    const { rows: notas } = await pool.query(
      'SELECT * FROM notas WHERE user_id = $1 ORDER BY creada_en DESC',
      [req.userId]
    )
    const { rows: subtareas } = await pool.query(
      'SELECT * FROM subtareas WHERE nota_id = ANY($1::int[]) ORDER BY id',
      [notas.length ? notas.map((n) => n.id) : [0]]
    )
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

app.post('/api/notas', authMiddleware, async (req, res) => {
  const { texto } = req.body
  if (!texto || !texto.trim()) {
    return res.status(400).json({ error: 'El campo "texto" es obligatorio' })
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO notas (user_id, texto) VALUES ($1, $2) RETURNING *',
      [req.userId, texto.trim()]
    )
    res.status(201).json({ ...rows[0], subtareas: [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/notas/:id', authMiddleware, async (req, res) => {
  const { completada } = req.body
  try {
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

app.post('/api/notas/:id/subtareas', authMiddleware, async (req, res) => {
  const { texto } = req.body
  if (!texto || !texto.trim()) {
    return res.status(400).json({ error: 'El campo "texto" es obligatorio' })
  }
  try {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM notas WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Nota no encontrada' })
    }
    const { rows } = await pool.query(
      'INSERT INTO subtareas (nota_id, texto) VALUES ($1, $2) RETURNING *',
      [req.params.id, texto.trim()]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/subtareas/:id', authMiddleware, async (req, res) => {
  const { completada } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE subtareas s
       SET completada = $1
       FROM notas n
       WHERE s.id = $2 AND s.nota_id = n.id AND n.user_id = $3
       RETURNING s.*`,
      [completada, req.params.id, req.userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subtarea no encontrada' })
    }
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/subtareas/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM subtareas s
       USING notas n
       WHERE s.id = $1 AND s.nota_id = n.id AND n.user_id = $2
       RETURNING s.id`,
      [req.params.id, req.userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subtarea no encontrada' })
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/notas/:id', authMiddleware, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM notas WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Nota no encontrada' })
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default app
