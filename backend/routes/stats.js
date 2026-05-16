const express = require('express')
const pool = require('../config/db')
const authMiddleware = require('../middleware/auth')
const router = express.Router()

router.get('/global', authMiddleware, async (req, res) => {
	try {
		const tasksQuery = `
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress
            FROM tasks
        `
		const locationsQuery = `
            SELECT l.name, COUNT(t.id) as task_count
            FROM locations l
            LEFT JOIN tasks t ON l.id = t.location_id
            GROUP BY l.id, l.name
        `

		const tasksStats = await pool.query(tasksQuery)
		const locationStats = await pool.query(locationsQuery)

		res.json({
			summary: tasksStats.rows[0],
			locations: locationStats.rows,
		})
	} catch (error) {
		res.status(500).json({ error: 'Ошибка сервера' })
	}
})

module.exports = router
