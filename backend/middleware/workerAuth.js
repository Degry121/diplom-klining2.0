const jwt = require('jsonwebtoken')

// Middleware для проверки что пользователь - работник или админ
const workerAuthMiddleware = (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(' ')[1]

		if (!token) {
			return res.status(401).json({ error: 'Токен не предоставлен' })
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET)

		// Проверяем что пользователь либо админ (role_id = 1), либо работник (role_id = 2)
		if (decoded.role_id !== 1 && decoded.role_id !== 2) {
			return res.status(403).json({ error: 'Доступ запрещен' })
		}

		req.user = decoded
		next()
	} catch (error) {
		console.error('Worker auth error:', error)
		return res.status(401).json({ error: 'Неверный токен' })
	}
}

module.exports = workerAuthMiddleware
