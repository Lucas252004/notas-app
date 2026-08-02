-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
-- Tabla de Notas
CREATE TABLE IF NOT EXISTS notas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  completada BOOLEAN DEFAULT false,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);
-- Tabla de Subtareas
CREATE TABLE IF NOT EXISTS subtareas (
  id SERIAL PRIMARY KEY,
  nota_id INTEGER NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  completada BOOLEAN DEFAULT false,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);
