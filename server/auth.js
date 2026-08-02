import jwt from 'jsonwebtoken'

export const SECRET = process.env.JWT_SECRET || 'secreto_dev_cambiar'

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, SECRET)
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
