// backend/routes/departments.js
const express = require('express')
const router = express.Router()
const pool = require('../config/db')

// Роут: GET /api/departments/list
router.get('/list', async (req, res) => {
	try {
		const result = await pool.query(
			'SELECT id, name FROM departments ORDER BY id ASC',
		)
		res.json(result.rows) // Отправляем массив отделов
	} catch (error) {
		console.error('Ошибка при получении отделов:', error)
		res.status(500).json({ error: 'Ошибка сервера' })
	}
})

module.exports = router
