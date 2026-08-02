# Mis Notas 📝

Aplicación fullstack de notas con registro de usuarios y base de datos. Cada usuario ve y administra sus propias notas, con subtareas y checkboxes.

**🔗 Demo en producción:** https://notas-app-ebon.vercel.app

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite (desplegado en Vercel) |
| Backend | Node.js + Express (desplegado en Render) |
| Base de datos | PostgreSQL (Neon, serverless) |
| Autenticación | JWT + bcrypt |
| Tests | Vitest (frontend), node:test (backend) |

## Funcionalidades

- Registro e inicio de sesión con JWT
- Crear, listar y eliminar notas
- Tareas con subtareas y checkboxes (se tachan al completar)
- Cada usuario solo ve y modifica sus propias notas
- Persistencia en PostgreSQL
- Cobertura de tests en frontend y backend

## Requisitos

- Node.js 18+
- PostgreSQL 14+ corriendo en `localhost:5432`

## Setup

### 1. Base de datos

```bash
sudo -u postgres psql -c "CREATE USER notas_user WITH PASSWORD 'notas_pass';" \
  -c "CREATE DATABASE notas_db OWNER notas_user;"
```

```bash
cd server
PGPASSWORD=notas_pass psql -h localhost -U notas_user -d notas_db -f schema.sql
```

### 2. Backend

```bash
cd server
npm install
node index.js   # escucha en http://localhost:3001
```

### 3. Frontend

```bash
npm install
npm run dev     # http://localhost:5173
```

## Despliegue en producción

| Servicio | URL | Costo |
|----------|-----|-------|
| Frontend (Vercel) | https://notas-app-ebon.vercel.app | $0 |
| Backend (Render) | https://notas-app-api.onrender.com | $0 |
| Base de datos (Neon) | PostgreSQL serverless | $0 |

### Cómo está configurado

- **Render**: web service del repo, root directory `server`, `npm start`. Variables de entorno: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`.
- **Vercel**: detecta Vite automáticamente, variable `VITE_API_URL` apunta a la API de Render.
- **Neon**: base de datos en la nube, el schema se aplicó con `schema.sql`.
- **UptimeRobot** (opcional y gratis): un ping cada 5 min evita que el backend de Render "duerma" tras 15 min de inactividad (cold start).

### Variables de entorno

Ver `.env.example`. En producción se configuran en el panel de cada servicio.

## Tests

```bash
# Backend (en server/)
node --test

# Frontend (en la raíz)
npm test
```

## Estructura

```
├── server/            # API Express
│   ├── app.js         # rutas y lógica de la API
│   ├── auth.js        # middleware JWT
│   ├── db.js          # conexión a PostgreSQL
│   ├── schema.sql     # esquema de tablas
│   └── test.js        # tests de la API
└── src/               # frontend React
    ├── components/
    │   ├── FormularioAuth.jsx
    │   ├── FormularioNota.jsx
    │   ├── ListaNotas.jsx
    │   └── Nota.jsx
    └── App.jsx
```

## Seguridad

- Contraseñas hasheadas con bcrypt (nunca se guardan en texto plano)
- Tokens JWT firmados, con expiración
- Queries con parámetros (`$1`) que previenen inyección SQL
- Las rutas de notas verifican que el recurso pertenezca al usuario autenticado

> **Nota:** el secreto JWT y las credenciales de la base de datos están en el código por simplicidad del proyecto de aprendizaje. En producción deben ir en variables de entorno.
