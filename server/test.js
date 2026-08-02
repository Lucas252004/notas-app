import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import pool from './db.js'
import app from './app.js'

let server

before(async () => {
  server = app.listen(0)
})

after(async () => {
  server.close()
  await pool.end()
})

function peticion(path, { headers, ...rest } = {}) {
  const base = `http://localhost:${server.address().port}`
  return fetch(base + path, {
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    ...rest,
  })
}

async function registrarUsuario(email) {
  const res = await peticion('/api/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'secreto123' }),
  })
  const data = await res.json()
  return data.token
}

test('registro crea un usuario y devuelve token', async () => {
  const res = await peticion('/api/register', {
    method: 'POST',
    body: JSON.stringify({ email: `test1-${Date.now()}@test.com`, password: 'secreto123' }),
  })
  assert.equal(res.status, 201)
  const data = await res.json()
  assert.ok(data.token)
  assert.ok(data.user.email.startsWith('test1-'))
})

test('registro rechaza contraseña corta', async () => {
  const res = await peticion('/api/register', {
    method: 'POST',
    body: JSON.stringify({ email: 'test2@test.com', password: '123' }),
  })
  assert.equal(res.status, 400)
})

test('login con credenciales incorrectas falla', async () => {
  const res = await peticion('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'noexiste@test.com', password: 'clave123' }),
  })
  assert.equal(res.status, 401)
})

test('GET /api/notas sin token da 401', async () => {
  const res = await peticion('/api/notas')
  assert.equal(res.status, 401)
})

test('flujo completo: login, crear nota, listarla y borrarla', async () => {
  const token = await registrarUsuario(`flujo-${Date.now()}@test.com`)

  const creada = await peticion('/api/notas', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ texto: 'Mi nota de prueba' }),
  })
  assert.equal(creada.status, 201)
  const nota = await creada.json()
  assert.equal(nota.texto, 'Mi nota de prueba')

  const listada = await peticion('/api/notas', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const notas = await listada.json()
  assert.ok(notas.some((n) => n.id === nota.id))

  const borrada = await peticion(`/api/notas/${nota.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  assert.equal(borrada.status, 200)
})

test('un usuario no puede borrar notas de otro', async () => {
  const tokenA = await registrarUsuario(`borrador-${Date.now()}@test.com`)
  const tokenB = await registrarUsuario(`victima-${Date.now()}@test.com`)

  const creada = await peticion('/api/notas', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ texto: 'Nota ajena' }),
  })
  const nota = await creada.json()

  const borrada = await peticion(`/api/notas/${nota.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  })
  assert.equal(borrada.status, 404)
})

test('flujo de subtareas: crear, completar y listar con la nota', async () => {
  const token = await registrarUsuario(`subs-${Date.now()}@test.com`)

  const creada = await peticion('/api/notas', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ texto: 'Tarea con subtareas' }),
  })
  const nota = await creada.json()

  const sub1 = await peticion(`/api/notas/${nota.id}/subtareas`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ texto: 'Paso uno' }),
  })
  assert.equal(sub1.status, 201)
  const sub1Data = await sub1.json()
  assert.equal(sub1Data.nota_id, nota.id)

  const completada = await peticion(`/api/subtareas/${sub1Data.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ completada: true }),
  })
  assert.equal((await completada.json()).completada, true)

  const listada = await peticion('/api/notas', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const notas = await listada.json()
  const conSubs = notas.find((n) => n.id === nota.id)
  assert.equal(conSubs.subtareas.length, 1)
  assert.equal(conSubs.subtareas[0].completada, true)
})

test('no se puede completar la nota de otro usuario', async () => {
  const tokenA = await registrarUsuario(`dueno-${Date.now()}@test.com`)
  const tokenB = await registrarUsuario(`intruso-${Date.now()}@test.com`)

  const creada = await peticion('/api/notas', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ texto: 'Nota protegida' }),
  })
  const nota = await creada.json()

  const res = await peticion(`/api/notas/${nota.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({ completada: true }),
  })
  assert.equal(res.status, 404)
})
