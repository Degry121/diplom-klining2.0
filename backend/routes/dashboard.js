const express = require('express')
const pool = require('../config/db')
const jwt = require('jsonwebtoken')

const router = express.Router()

const adminAuthMiddleware = (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(' ')[1]

		if (!token) {
			return res.status(401).json({ error: 'Токен не предоставлен' })
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET)

		if (decoded.role_id !== 1) {
			return res
				.status(403)
				.json({ error: 'Доступ только для администраторов' })
		}

		req.user = decoded
		next()
	} catch (error) {
		return res.status(401).json({ error: 'Неверный токен' })
	}
}

router.get('/stats', adminAuthMiddleware, async (req, res) => {
	try {
		const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users')
		const activeUsers = await pool.query(
			'SELECT COUNT(*) as count FROM users WHERE role_id != 1',
		)

		let locationsCount = 0
		let tasksCount = 0

		try {
			const locations = await pool.query(
				'SELECT COUNT(*) as count FROM locations',
			)
			locationsCount = parseInt(locations.rows[0].count)
		} catch (e) {}

		try {
			const tasks = await pool.query('SELECT COUNT(*) as count FROM tasks')
			tasksCount = parseInt(tasks.rows[0].count)
		} catch (e) {}

		res.json({
			totalUsers: parseInt(totalUsers.rows[0].count),
			activeUsers: parseInt(activeUsers.rows[0].count),
			locations: locationsCount,
			totalTasks: tasksCount,
		})
	} catch (error) {
		res.status(500).json({ error: 'Ошибка получения статистики' })
	}
})

router.get('/activity', adminAuthMiddleware, async (req, res) => {
	try {
		const query = `
            SELECT 
                t.id, 
                t.title, 
                t.status, 
                t.created_at,
                u.first_name, 
                u.last_name,
                l.name as location_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN locations l ON t.location_id = l.id
            ORDER BY t.created_at DESC
            LIMIT 5
        `
		const result = await pool.query(query)

		const activities = result.rows.map(task => {
			const workerName = task.first_name
				? `${task.first_name} ${task.last_name}`
				: 'Не назначено'
			const locName = task.location_name || 'Без объекта'

			return {
				id: task.id,
				name: task.title,
				action: `Исполнитель: ${workerName} | Объект: ${locName}`,
				time: new Date(task.created_at).toLocaleString('ru-RU', {
					day: 'numeric',
					month: 'long',
					hour: '2-digit',
					minute: '2-digit',
				}),
				status: task.status,
			}
		})

		res.json(activities)
	} catch (error) {
		res.status(500).json({ error: 'Ошибка получения активности' })
	}
})

module.exports = router
