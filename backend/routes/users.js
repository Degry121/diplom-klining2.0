const express = require('express')
const bcrypt = require('bcryptjs')
const pool = require('../config/db')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

router.post('/create', authMiddleware, async (req, res) => {
	const {
		username,
		password,
		firstName,
		lastName,
		roleId,
		phone,
		departmentId,
	} = req.body

	try {
		if (!username || !password || !firstName || !lastName || !roleId) {
			return res.status(400).json({ error: 'Заполните все обязательные поля' })
		}

		const salt = await bcrypt.genSalt(10)
		const passwordHash = await bcrypt.hash(password, salt)

		const insertQuery = `
            INSERT INTO users (username, password_hash, first_name, last_name, role_id, phone, department_id, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, username, first_name, last_name
        `

		const result = await pool.query(insertQuery, [
			username,
			passwordHash,
			firstName,
			lastName,
			roleId,
			phone || null,
			departmentId || null,
			req.user.id,
		])

		res.json({ message: 'Пользователь создан', user: result.rows[0] })
	} catch (error) {
		console.error('Create user error:', error)
		if (error.code === '23505') {
			return res
				.status(400)
				.json({ error: 'Пользователь с таким именем уже существует' })
		}
		res.status(500).json({ error: 'Ошибка создания пользователя' })
	}
})

router.get('/list', authMiddleware, async (req, res) => {
	try {
		const query = `
            SELECT 
                u.id, 
                u.username, 
                u.first_name, 
                u.last_name, 
                u.is_active, 
                u.phone, 
                r.name as role_name,
                d.name as department_name,
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
                CASE 
                    WHEN COUNT(DISTINCT t.id) > 0 
                    THEN ROUND((COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END)::numeric / COUNT(DISTINCT t.id)::numeric) * 100)
                    ELSE 0 
                END as efficiency
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN tasks t ON t.assigned_to = u.id
            GROUP BY u.id, u.username, u.first_name, u.last_name, u.is_active, u.phone, r.name, d.name
            ORDER BY u.created_at DESC
        `
		const result = await pool.query(query)
		res.json(result.rows)
	} catch (error) {
		console.error('Get users error:', error)
		res.status(500).json({ error: 'Ошибка получения пользователей' })
	}
})

router.delete('/:id', authMiddleware, async (req, res) => {
	const { id } = req.params

	try {
		const deleteQuery =
			'DELETE FROM users WHERE id = $1 AND id != $2 RETURNING id'
		const result = await pool.query(deleteQuery, [id, req.user.id])

		if (result.rows.length === 0) {
			return res
				.status(400)
				.json({ error: 'Нельзя удалить себя или пользователь не найден' })
		}

		res.json({ message: 'Пользователь удален' })
	} catch (error) {
		console.error('Delete user error:', error)
		res.status(500).json({ error: 'Ошибка удаления пользователя' })
	}
})

router.patch('/:id/toggle-status', authMiddleware, async (req, res) => {
	const { id } = req.params
	const { isActive } = req.body

	try {
		const updateQuery =
			'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, is_active'
		const result = await pool.query(updateQuery, [isActive, id])

		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Пользователь не найден' })
		}

		res.json({ message: 'Статус обновлен', user: result.rows[0] })
	} catch (error) {
		console.error('Toggle status error:', error)
		res.status(500).json({ error: 'Ошибка обновления статуса' })
	}
})

module.exports = router
