const express = require('express')
const pool = require('../config/db')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// Middleware для проверки что пользователь - админ
const adminOnly = async (req, res, next) => {
	try {
		const userResult = await pool.query(
			'SELECT role_id FROM users WHERE id = $1',
			[req.user.id]
		)

		if (userResult.rows.length === 0) {
			return res.status(404).json({ error: 'Пользователь не найден' })
		}

		if (userResult.rows[0].role_id !== 1) {
			return res
				.status(403)
				.json({ error: 'Доступ запрещен. Только для администраторов' })
		}

		next()
	} catch (error) {
		console.error('Admin check error:', error)
		return res.status(500).json({ error: 'Ошибка проверки прав доступа' })
	}
}

// Middleware для проверки что пользователь - работник или админ
const workerOrAdmin = async (req, res, next) => {
	try {
		const userResult = await pool.query(
			'SELECT role_id FROM users WHERE id = $1',
			[req.user.id]
		)

		if (userResult.rows.length === 0) {
			return res.status(404).json({ error: 'Пользователь не найден' })
		}

		const roleId = userResult.rows[0].role_id

		// Разрешаем доступ только админам (1) и работникам (2)
		if (roleId !== 1 && roleId !== 2) {
			return res.status(403).json({ error: 'Доступ запрещен' })
		}

		req.user.role_id = roleId
		next()
	} catch (error) {
		console.error('Worker/Admin check error:', error)
		return res.status(500).json({ error: 'Ошибка проверки прав доступа' })
	}
}

// ============= АДМИНСКИЕ РОУТЫ =============

// Создать задачу (только админ)
router.post('/create', authMiddleware, adminOnly, async (req, res) => {
	const { title, description, locationId, assignedTo, priority, dueDate } =
		req.body

	try {
		if (!title || !locationId) {
			return res.status(400).json({ error: 'Заполните обязательные поля' })
		}

		const insertQuery = `
            INSERT INTO tasks (title, description, location_id, assigned_to, assigned_by, priority, due_date, status, progress)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `

		const result = await pool.query(insertQuery, [
			title,
			description || null,
			locationId,
			assignedTo || null,
			req.user.id,
			priority || 'medium',
			dueDate || null,
			'pending',
			0,
		])

		res.json({ message: 'Задача создана', task: result.rows[0] })
	} catch (error) {
		console.error('Create task error:', error)
		res.status(500).json({ error: 'Ошибка создания задачи' })
	}
})

// Получить все задачи (только админ)
router.get('/list', authMiddleware, adminOnly, async (req, res) => {
	try {
		const query = `
            SELECT t.*, 
                   l.name as location_name,
                   l.address as location_address,
                   u.first_name || ' ' || u.last_name as assigned_to_name,
                   creator.first_name || ' ' || creator.last_name as assigned_by_name,
                   d.name as department_name
            FROM tasks t
            LEFT JOIN locations l ON t.location_id = l.id
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN users creator ON t.assigned_by = creator.id
            LEFT JOIN departments d ON u.department_id = d.id
            ORDER BY t.created_at DESC
        `
		const result = await pool.query(query)
		res.json(result.rows)
	} catch (error) {
		console.error('Get tasks error:', error)
		res.status(500).json({ error: 'Ошибка получения задач' })
	}
})

// Удалить задачу (только админ)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
	const { id } = req.params

	try {
		const checkQuery = 'SELECT * FROM tasks WHERE id = $1'
		const checkResult = await pool.query(checkQuery, [id])

		if (checkResult.rows.length === 0) {
			return res.status(404).json({ error: 'Задача не найдена' })
		}

		await pool.query('DELETE FROM tasks WHERE id = $1', [id])
		res.json({ message: 'Задача удалена' })
	} catch (error) {
		console.error('Delete task error:', error)
		res.status(500).json({ error: 'Ошибка удаления задачи' })
	}
})

// ============= РОУТЫ ДЛЯ РАБОТНИКОВ И АДМИНОВ =============

// Получить задачи текущего пользователя
router.get('/my-tasks', authMiddleware, workerOrAdmin, async (req, res) => {
	try {
		const query = `
            SELECT t.*, 
                   l.name as location_name,
                   l.address as location_address,
                   creator.first_name || ' ' || creator.last_name as assigned_by_name,
                   d.name as department_name
            FROM tasks t
            LEFT JOIN locations l ON t.location_id = l.id
            LEFT JOIN users creator ON t.assigned_by = creator.id
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE t.assigned_to = $1
            ORDER BY 
                CASE 
                    WHEN t.status = 'in_progress' THEN 1
                    WHEN t.status = 'pending' THEN 2
                    WHEN t.status = 'completed' THEN 3
                END,
                t.due_date ASC NULLS LAST,
                t.created_at DESC
        `
		const result = await pool.query(query, [req.user.id])
		res.json(result.rows)
	} catch (error) {
		console.error('Get my tasks error:', error)
		res.status(500).json({ error: 'Ошибка получения задач' })
	}
})

// Получить статистику задач
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
            WHERE assigned_to = $1
        `
		const result = await pool.query(query, [req.user.id])

		const stats = result.rows[0]
		res.json({
			total_tasks: parseInt(stats.total_tasks),
			completed_tasks: parseInt(stats.completed_tasks),
			in_progress_tasks: parseInt(stats.in_progress_tasks),
			pending_tasks: parseInt(stats.pending_tasks),
			avg_progress: parseInt(stats.avg_progress),
			today_tasks: parseInt(stats.today_tasks),
		})
	} catch (error) {
		console.error('Get stats error:', error)
		res.status(500).json({ error: 'Ошибка получения статистики' })
	}
})

// Получить одну задачу по ID
router.get('/:id', authMiddleware, workerOrAdmin, async (req, res) => {
	const { id } = req.params

	try {
		const query = `
            SELECT t.*, 
                   l.name as location_name,
                   l.address as location_address,
                   u.first_name || ' ' || u.last_name as assigned_to_name,
                   creator.first_name || ' ' || creator.last_name as assigned_by_name
            FROM tasks t
            LEFT JOIN locations l ON t.location_id = l.id
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN users creator ON t.assigned_by = creator.id
            WHERE t.id = $1
        `
		const result = await pool.query(query, [id])

		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Задача не найдена' })
		}

		res.json(result.rows[0])
	} catch (error) {
		console.error('Get task error:', error)
		res.status(500).json({ error: 'Ошибка получения задачи' })
	}
})

// Обновить задачу
router.patch('/:id', authMiddleware, workerOrAdmin, async (req, res) => {
	const { id } = req.params
	const { status, progress } = req.body

	try {
		// Проверяем доступ
		const checkQuery = 'SELECT * FROM tasks WHERE id = $1 AND assigned_to = $2'
		const checkResult = await pool.query(checkQuery, [id, req.user.id])

		if (checkResult.rows.length === 0) {
			return res.status(403).json({ error: 'Нет доступа к этой задаче' })
		}

		// Проверка валидности progress
		if (progress !== undefined && (progress < 0 || progress > 100)) {
			return res.status(400).json({ error: 'Прогресс должен быть от 0 до 100' })
		}

		const updateQuery = `
            UPDATE tasks 
            SET status = COALESCE($1, status), 
                progress = COALESCE($2, progress),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `

		const result = await pool.query(updateQuery, [
			status || null,
			progress !== undefined ? progress : null,
			id,
		])

		res.json({ message: 'Задача обновлена', task: result.rows[0] })
	} catch (error) {
		console.error('Update task error:', error)
		res.status(500).json({ error: 'Ошибка обновления задачи' })
	}
})

// Отметить задачу как выполненную
router.patch(
	'/:id/complete',
	authMiddleware,
	workerOrAdmin,
	async (req, res) => {
		const { id } = req.params

		try {
			// Проверяем доступ
			const checkQuery =
				'SELECT * FROM tasks WHERE id = $1 AND assigned_to = $2'
			const checkResult = await pool.query(checkQuery, [id, req.user.id])

			if (checkResult.rows.length === 0) {
				return res.status(403).json({ error: 'Нет доступа к этой задаче' })
			}

			const updateQuery = `
            UPDATE tasks 
            SET status = 'completed', 
                progress = 100,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `

			const result = await pool.query(updateQuery, [id])

			res.json({
				message: 'Задача отмечена как выполненная',
				task: result.rows[0],
			})
		} catch (error) {
			console.error('Complete task error:', error)
			res.status(500).json({ error: 'Ошибка при завершении задачи' })
		}
	}
)

module.exports = router
