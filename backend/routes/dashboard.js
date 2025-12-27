const express = require('express')
const pool = require('../config/db')
const jwt = require('jsonwebtoken')

const router = express.Router()

// middleware только для администратора
const adminAuthMiddleware = (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(' ')[1]

		if (!token) {
			return res.status(401).json({ error: 'Токен не предоставлен' })
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET)

		// только админ, например role_id = 1
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

// статистика доступна только админу
router.get('/stats', adminAuthMiddleware, async (req, res) => {
	try {
		const totalUsersQuery =
			'SELECT COUNT(*) as count FROM users WHERE is_active = true'
		const totalUsers = await pool.query(totalUsersQuery)

		const activeUsersQuery = `
      SELECT COUNT(*) as count FROM users 
      WHERE is_active = true AND role_id = 2
    `
		const activeUsers = await pool.query(activeUsersQuery)

		const locationsQuery =
			'SELECT COUNT(*) as count FROM locations WHERE is_active = true'
		const locations = await pool.query(locationsQuery)

		const tasksQuery = 'SELECT COUNT(*) as count FROM tasks'
		const tasks = await pool.query(tasksQuery)

		res.json({
			totalUsers: parseInt(totalUsers.rows[0].count),
			activeUsers: parseInt(activeUsers.rows[0].count),
			locations: parseInt(locations.rows[0].count),
			totalTasks: parseInt(tasks.rows[0].count),
		})
	} catch (error) {
		console.error('Stats error:', error)
		res.status(500).json({ error: 'Ошибка получения статистики' })
	}
})

// активность тоже только для админа
router.get('/activity', adminAuthMiddleware, async (req, res) => {
	try {
		const activityQuery = `
      SELECT 
        wl.id,
        u.first_name || ' ' || u.last_name as user_name,
        l.name as location_name,
        t.title as task_title,
        wl.check_in_time,
        wl.check_out_time,
        wl.status,
        EXTRACT(EPOCH FROM (NOW() - wl.check_in_time))/60 as minutes_ago
      FROM work_logs wl
      JOIN users u ON wl.user_id = u.id
      JOIN locations l ON wl.location_id = l.id
      LEFT JOIN tasks t ON wl.task_id = t.id
      ORDER BY wl.check_in_time DESC
      LIMIT 5
    `

		const result = await pool.query(activityQuery)

		const activities = result.rows.map(row => ({
			id: row.id,
			name: row.user_name,
			action: `Завершил задачу в ${row.location_name}`,
			time: `${Math.floor(row.minutes_ago)} минут назад`,
			status:
				row.status === 'completed'
					? 'completed'
					: row.status === 'in_progress'
					? 'in_progress'
					: 'pending',
		}))

		res.json(activities)
	} catch (error) {
		console.error('Activity error:', error)
		res.status(500).json({ error: 'Ошибка получения активности' })
	}
})

module.exports = router
