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
			return res.status(400).json({ error: 'Заполните обязательные поля' })
		}
		const salt = await bcrypt.genSalt(10)
		const passwordHash = await bcrypt.hash(password, salt)
		const insertQuery = `
            INSERT INTO users (username, password_hash, first_name, last_name, role_id, phone, department_id, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true)
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
		])
		res.json({ message: 'Пользователь создан', user: result.rows[0] })
	} catch (error) {
		if (error.code === '23505')
			return res.status(400).json({ error: 'Логин занят' })
		res.status(500).json({ error: 'Ошибка сервера' })
	}
})

router.get('/list', authMiddleware, async (req, res) => {
	try {
		const query = `
            SELECT u.id, u.username, u.first_name, u.last_name, u.is_active, u.phone, 
            r.name as role_name, COALESCE(d.name, 'Не назначен') as department_name,
            COUNT(DISTINCT t.id) as total_tasks,
            CASE 
                WHEN COUNT(DISTINCT t.id) > 0 
                THEN ROUND((COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END)::numeric / COUNT(DISTINCT t.id)::numeric) * 100) 
                ELSE 0 
            END as efficiency
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN tasks t ON u.id = ANY(t.assigned_to)
            WHERE u.role_id != 1
            GROUP BY u.id, u.username, u.first_name, u.last_name, u.is_active, u.phone, r.name, d.name
            ORDER BY u.id ASC
        `
		const result = await pool.query(query)
		res.json(result.rows)
	} catch (error) {
		console.error('User list error:', error)
		res.status(500).json({ error: 'Ошибка получения списка пользователей' })
	}
})

router.get('/workers-only', authMiddleware, async (req, res) => {
	try {
		const query = `
            SELECT id, first_name, last_name, username 
            FROM users 
            WHERE role_id = 2 AND is_active = true 
            ORDER BY first_name ASC
        `
		const result = await pool.query(query)
		res.json(result.rows)
	} catch (error) {
		res.status(500).json({ error: 'Ошибка сервера' })
	}
})

router.delete('/:id', authMiddleware, async (req, res) => {
	const { id } = req.params
	try {
		await pool.query('DELETE FROM users WHERE id = $1 AND id != $2', [
			id,
			req.user.id,
		])
		res.json({ message: 'Удалено' })
	} catch (error) {
		res.status(500).json({ error: 'Ошибка удаления' })
	}
})

router.patch('/:id/toggle-status', authMiddleware, async (req, res) => {
	const { id } = req.params
	const { isActive } = req.body
	try {
		await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [
			isActive,
			id,
		])
		res.json({ message: 'Статус изменен' })
	} catch (error) {
		res.status(500).json({ error: 'Ошибка статуса' })
	}
})

module.exports = router
