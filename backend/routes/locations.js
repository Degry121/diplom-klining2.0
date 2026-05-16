const express = require('express')
const pool = require('../config/db')

// Оставляем твой middleware для защиты роута
const authMiddleware = require('../middleware/auth')

const router = express.Router()

router.get('/list', authMiddleware, async (req, res) => {
	try {
		// Убрали "WHERE is_active = true", чтобы избежать падения сервера,
		// если такой колонки в таблице пока нет
		const query = 'SELECT id, name, address FROM locations ORDER BY name'

		const result = await pool.query(query)
		res.json(result.rows)
	} catch (error) {
		console.error('Get locations error:', error)
		res.status(500).json({ error: 'Ошибка получения объектов' })
	}
})

module.exports = router
