const jwt = require('jsonwebtoken')

const adminAuthMiddleware = (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(' ')[1]

		if (!token) {
			return res.status(401).json({ error: 'Токен не предоставлен' })
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET)

		// только админ
		if (decoded.role_id !== 1) {
			return res
				.status(403)
				.json({ error: 'Доступ только для администраторов' })
		}

		req.user = decoded
		next()
	} catch (error) {
		console.error('Admin auth error:', error)
		return res.status(401).json({ error: 'Неверный токен' })
	}
}

module.exports = adminAuthMiddleware
