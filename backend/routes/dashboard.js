const express = require('express')
const pool = require('../config/db')
const jwt = require('jsonwebtoken')

const router = express.Router()

const adminAuthMiddleware = (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(' ')[1]

		if (!token) {
			return res.status(401).json({ error: 'Token is required' })
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET)

		if (decoded.role_id !== 1) {
			return res.status(403).json({ error: 'Admin access only' })
		}

		req.user = decoded
		next()
	} catch (error) {
		return res.status(401).json({ error: 'Invalid token' })
	}
}

router.get('/stats', adminAuthMiddleware, async (req, res) => {
	try {
		const stats = await pool.query(`
            SELECT
                (SELECT COUNT(*)::int FROM users) as "totalUsers",
                (SELECT COUNT(*)::int FROM users WHERE role_id != 1 AND is_active = true) as "activeUsers",
                (SELECT COUNT(*)::int FROM locations) as "locations",
                (SELECT COUNT(*)::int FROM tasks) as "totalTasks"
        `)
		const statusDistribution = await pool.query(`
            SELECT status as name, COUNT(*)::int as value
            FROM tasks
            GROUP BY status
            ORDER BY status
        `)
		const locationLoad = await pool.query(`
            SELECT l.name, COUNT(t.id)::int as value
            FROM locations l
            LEFT JOIN tasks t ON l.id = t.location_id
            GROUP BY l.id, l.name
            ORDER BY l.name
            LIMIT 5
        `)

		res.json({
			...stats.rows[0],
			charts: {
				status: statusDistribution.rows,
				locations: locationLoad.rows,
			},
		})
	} catch (error) {
		console.error('Dashboard stats error:', error)
		res.status(500).json({ error: 'Stats query failed', details: error.message })
	}
})

router.get('/activity', adminAuthMiddleware, async (req, res) => {
	try {
		const result = await pool.query(`
            SELECT
                t.id,
                t.title,
                t.status,
                t.created_at,
                workers.assigned_to_name,
                l.name as location_name
            FROM tasks t
            LEFT JOIN locations l ON t.location_id = l.id
            LEFT JOIN LATERAL (
                SELECT string_agg(
                    trim(concat_ws(' ', u.first_name, u.last_name)),
                    ', '
                ) as assigned_to_name
                FROM users u
                WHERE u.id = ANY(t.assigned_to)
            ) workers ON true
            ORDER BY t.created_at DESC
            LIMIT 5
        `)

		const activities = result.rows.map(task => {
			const workerName = task.assigned_to_name || 'Не назначено'
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
		console.error('Dashboard activity error:', error)
		res.status(500).json({ error: 'Activity query failed', details: error.message })
	}
})

module.exports = router
