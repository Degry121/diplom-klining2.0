const express = require('express')
const pool = require('../config/db')
const authMiddleware = require('../middleware/auth')
const router = express.Router()

console.log('📡 Файл роутов admin.js успешно загружен!')

const adminOnly = async (req, res, next) => {
	console.log(
		`[AdminCheck] Старт. ID юзера: ${req.user ? req.user.id : 'ПУСТО'}`,
	)
	try {
		const userResult = await pool.query(
			'SELECT role_id FROM users WHERE id = $1',
			[req.user.id],
		)

		if (userResult.rows.length === 0) {
			console.log('❌ [AdminCheck] Юзер не найден в базе!')
			return res.status(401).json({ error: 'Пользователь не найден' })
		}

		if (userResult.rows[0].role_id !== 1) {
			console.log('❌ [AdminCheck] Юзер не админ!')
			return res.status(403).json({ error: 'Доступ запрещен' })
		}

		console.log('✅ [AdminCheck] Права подтверждены, пускаем дальше.')
		next()
	} catch (error) {
		console.error('❌ ОШИБКА В MIDDLEWARE adminOnly:', error.message)
		res
			.status(500)
			.json({ error: 'Ошибка проверки прав', details: error.message })
	}
}

router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
	console.log('-> Запрос пришел на /stats')
	try {
		const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role_id = 2) as "totalUsers",
                (SELECT COUNT(DISTINCT id) FROM users WHERE is_active = true AND role_id = 2) as "activeUsers",
                (SELECT COUNT(*) FROM locations) as "locations",
                (SELECT COUNT(*) FROM tasks) as "totalTasks"
        `)

		const statusDistribution = await pool.query(`
            SELECT status as name, COUNT(*)::int as value 
            FROM tasks 
            GROUP BY status
        `)

		const locationLoad = await pool.query(`
            SELECT l.name, COUNT(t.id)::int as value
            FROM locations l
            LEFT JOIN tasks t ON l.id = t.location_id
            GROUP BY l.id, l.name
            LIMIT 5
        `)

		console.log('<- Успешно отдаем данные /stats')
		res.json({
			...stats.rows[0],
			charts: {
				status: statusDistribution.rows,
				locations: locationLoad.rows,
			},
		})
	} catch (error) {
		console.error('❌ Ошибка SQL в /stats:', error.message)
		res
			.status(500)
			.json({ error: 'Ошибка базы данных', details: error.message })
	}
})

router.get('/activity', authMiddleware, adminOnly, async (req, res) => {
	console.log('-> Запрос пришел на /activity')
	try {
		res.json([
			{
				id: 1,
				name: 'Тестовая задача',
				action: 'Проверка связи',
				time: '12:00',
				status: 'in_progress',
			},
		])
		console.log('<- Успешно отдаем /activity (заглушка)')
	} catch (error) {
		console.error('❌ Ошибка в /activity:', error.message)
		res.status(500).json({ error: 'Ошибка', details: error.message })
	}
})

module.exports = router
