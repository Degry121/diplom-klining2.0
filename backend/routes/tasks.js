const express = require('express')
const pool = require('../config/db')
const authMiddleware = require('../middleware/auth')
const multer = require('multer')
const path = require('path')

const router = express.Router()

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/')
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
		cb(
			null,
			file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname),
		)
	},
})

const upload = multer({ storage: storage })

const adminOnly = async (req, res, next) => {
	try {
		const userResult = await pool.query(
			'SELECT role_id FROM users WHERE id = $1',
			[req.user.id],
		)
		if (userResult.rows.length === 0 || userResult.rows[0].role_id !== 1) {
			return res.status(403).json({ error: 'Доступ запрещен' })
		}
		next()
	} catch (error) {
		res.status(500).json({ error: 'Ошибка сервера' })
	}
}

const workerOrAdmin = async (req, res, next) => {
	try {
		const userResult = await pool.query(
			'SELECT role_id FROM users WHERE id = $1',
			[req.user.id],
		)
		if (userResult.rows.length === 0)
			return res.status(404).json({ error: 'Пользователь не найден' })

		const roleId = userResult.rows[0].role_id
		if (roleId !== 1 && roleId !== 2)
			return res.status(403).json({ error: 'Доступ запрещен' })

		req.user.role_id = roleId
		next()
	} catch (error) {
		res.status(500).json({ error: 'Ошибка сервера' })
	}
}

router.post('/create', authMiddleware, adminOnly, async (req, res) => {
	const { title, description, locationId, assignedTo, priority, dueDate } =
		req.body
	try {
		if (!title || !locationId)
			return res.status(400).json({ error: 'Заполните поля' })
		const result = await pool.query(
			`INSERT INTO tasks (title, description, location_id, assigned_to, assigned_by, priority, due_date, status, progress)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 0) RETURNING *`,
			[
				title,
				description || null,
				locationId,
				assignedTo || [],
				req.user.id,
				priority || 'medium',
				dueDate || null,
			],
		)
		res.json(result.rows[0])
	} catch (error) {
		res.status(500).json({ error: 'Ошибка создания' })
	}
})

router.get('/list', authMiddleware, adminOnly, async (req, res) => {
	try {
		const result = await pool.query(`
            SELECT t.*, l.name as location_name, l.address as location_address,
            (SELECT string_agg(first_name || ' ' || last_name, ', ') FROM users WHERE id = ANY(t.assigned_to)) as assigned_to_name
            FROM tasks t LEFT JOIN locations l ON t.location_id = l.id ORDER BY t.created_at DESC`)
		res.json(result.rows)
	} catch (error) {
		res.status(500).json({ error: 'Ошибка списка' })
	}
})

router.get('/my-tasks', authMiddleware, workerOrAdmin, async (req, res) => {
	try {
		const result = await pool.query(
			`
            SELECT t.*, l.name as location_name, l.address as location_address
            FROM tasks t LEFT JOIN locations l ON t.location_id = l.id 
            WHERE $1 = ANY(t.assigned_to) ORDER BY t.created_at DESC`,
			[req.user.id],
		)
		res.json(result.rows)
	} catch (error) {
		res.status(500).json({ error: 'Ошибка задач' })
	}
})

router.get('/my-stats', authMiddleware, workerOrAdmin, async (req, res) => {
	try {
		const query = `
            SELECT 
                COUNT(*) as total_tasks,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
                COALESCE(ROUND(AVG(progress)::numeric, 0), 0) as avg_progress,
                COUNT(*) FILTER (WHERE DATE(due_date) = CURRENT_DATE) as today_tasks
            FROM tasks
            WHERE $1 = ANY(assigned_to)
        `
		const result = await pool.query(query, [req.user.id])
		const stats = result.rows[0]

		res.json({
			total_tasks: parseInt(stats.total_tasks) || 0,
			completed_tasks: parseInt(stats.completed_tasks) || 0,
			in_progress_tasks: parseInt(stats.in_progress_tasks) || 0,
			pending_tasks: parseInt(stats.pending_tasks) || 0,
			avg_progress: parseInt(stats.avg_progress) || 0,
			today_tasks: parseInt(stats.today_tasks) || 0,
		})
	} catch (error) {
		res.status(500).json({ error: 'Ошибка статистики' })
	}
})

router.get('/:id', authMiddleware, workerOrAdmin, async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [
			req.params.id,
		])
		if (result.rows.length === 0)
			return res.status(404).json({ error: 'Не найдено' })
		res.json(result.rows[0])
	} catch (error) {
		res.status(500).json({ error: 'Ошибка сервера' })
	}
})

router.patch('/:id/status', authMiddleware, workerOrAdmin, async (req, res) => {
	const { status } = req.body
	try {
		const result = await pool.query(
			`UPDATE tasks SET status = $1::text, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
			[status, req.params.id],
		)
		res.json(result.rows[0])
	} catch (error) {
		res.status(500).json({ error: 'Ошибка обновления' })
	}
})

router.patch(
	'/:id/complete',
	authMiddleware,
	workerOrAdmin,
	upload.array('photos', 5),
	async (req, res) => {
		const { id } = req.params
		const imageUrls = req.files
			? req.files.map(f => `/uploads/${f.filename}`)
			: []
		try {
			const checkQuery =
				req.user.role_id === 1
					? 'SELECT * FROM tasks WHERE id = $1'
					: 'SELECT * FROM tasks WHERE id = $1 AND $2 = ANY(assigned_to)'
			const checkParams = req.user.role_id === 1 ? [id] : [id, req.user.id]

			const check = await pool.query(checkQuery, checkParams)
			if (check.rows.length === 0)
				return res.status(403).json({ error: 'Доступ запрещен' })

			const result = await pool.query(
				`UPDATE tasks SET status = 'in_review', progress = 100, images = $1::jsonb, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
				[JSON.stringify(imageUrls), id],
			)
			res.json(result.rows[0])
		} catch (error) {
			res.status(500).json({ error: 'Ошибка завершения' })
		}
	},
)

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
	try {
		await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id])
		res.json({ message: 'Удалено' })
	} catch (error) {
		res.status(500).json({ error: 'Ошибка удаления' })
	}
})

module.exports = router
