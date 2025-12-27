const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')

const router = express.Router()

// Регистрация (только для админов, создающих других пользователей)
router.post('/register', async (req, res) => {
	const { username, password, firstName, lastName, roleId, departmentId } =
		req.body

	try {
		// Проверка существования пользователя
		const userCheck = await pool.query(
			'SELECT * FROM users WHERE username = $1',
			[username]
		)

		if (userCheck.rows.length > 0) {
			return res.status(400).json({ error: 'Пользователь уже существует' })
		}

		// Хэширование пароля
		const passwordHash = await bcrypt.hash(password, 10)

		// Вставка нового пользователя
		const result = await pool.query(
			`INSERT INTO users (username, password_hash, first_name, last_name, role_id, department_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, username, first_name, last_name, role_id`,
			[username, passwordHash, firstName, lastName, roleId, departmentId]
		)

		res.status(201).json({
			message: 'Пользователь создан',
			user: result.rows[0],
		})
	} catch (error) {
		console.error('Register error:', error)
		res.status(500).json({ error: 'Ошибка регистрации' })
	}
})

// Вход в систему (для всех пользователей - админов и работников)
router.post('/login', async (req, res) => {
	const { username, password } = req.body

	try {
		// Поиск пользователя
		const result = await pool.query('SELECT * FROM users WHERE username = $1', [
			username,
		])

		if (result.rows.length === 0) {
			return res.status(401).json({ error: 'Неверные учетные данные' })
		}

		const user = result.rows[0]

		// Проверка пароля
		const isValidPassword = await bcrypt.compare(password, user.password_hash)

		if (!isValidPassword) {
			return res.status(401).json({ error: 'Неверные учетные данные' })
		}

		// Создание токена (БЕЗ проверки роли)
		const token = jwt.sign(
			{
				id: user.id,
				username: user.username,
				role_id: user.role_id,
			},
			process.env.JWT_SECRET,
			{ expiresIn: '24h' }
		)

		res.json({
			message: 'Вход выполнен успешно',
			token,
			user: {
				id: user.id,
				username: user.username,
				first_name: user.first_name,
				last_name: user.last_name,
				role_id: user.role_id,
				department_id: user.department_id,
			},
		})
	} catch (error) {
		console.error('Login error:', error)
		res.status(500).json({ error: 'Ошибка входа' })
	}
})

module.exports = router
