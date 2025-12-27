const express = require('express')
const pool = require('../config/db')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

router.get('/list', authMiddleware, async (req, res) => {
	try {
		const query =
			'SELECT * FROM departments WHERE is_active = true ORDER BY name'
		const result = await pool.query(query)
		res.json(result.rows)
	} catch (error) {
		console.error('Get departments error:', error)
		res.status(500).json({ error: 'Ошибка получения отделов' })
	}
})

module.exports = router
