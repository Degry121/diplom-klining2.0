const express = require('express')
const cors = require('cors')
require('dotenv').config()

const pool = require('./config/db')
const path = require('path')

const authRoutes = require('./routes/auth')
const adminDashboardRoutes = require('./routes/dashboard')
const usersRoutes = require('./routes/users')
const tasksRoutes = require('./routes/tasks')
const locationsRoutes = require('./routes/locations')
const departmentsRoutes = require('./routes/departments')

const app = express()
const PORT = process.env.PORT || 3010
const defaultCorsOrigins = [
	'http://localhost:3000',
	'http://127.0.0.1:3000',
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'http://degry-121.ru',
	'https://degry-121.ru',
	'http://www.degry-121.ru',
	'https://www.degry-121.ru',
]
const allowedOrigins = (
	process.env.CORS_ORIGINS
		? process.env.CORS_ORIGINS.split(',')
		: defaultCorsOrigins
)
	.map(origin => origin.trim())
	.filter(Boolean)

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error)
})

process.on('uncaughtException', error => {
	console.error('Uncaught exception:', error)
})

app.use(
	cors({
		origin(origin, callback) {
			if (!origin || allowedOrigins.includes(origin)) {
				return callback(null, true)
			}

			return callback(new Error(`CORS blocked origin: ${origin}`))
		},
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	}),
)
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminDashboardRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/locations', locationsRoutes)
app.use('/api/departments', departmentsRoutes)

app.use('/auth', authRoutes)
app.use('/admin', adminDashboardRoutes)
app.use('/users', usersRoutes)
app.use('/tasks', tasksRoutes)
app.use('/locations', locationsRoutes)
app.use('/departments', departmentsRoutes)

app.get('/', (req, res) => {
	res.json({
		message: 'Backend API is running',
		health: '/api/health',
		frontend: 'http://localhost:3000',
	})
})

app.get(['/api/test', '/test'], (req, res) => {
	res.json({ message: 'Server is running!' })
})

app.get(['/api/health', '/health'], async (req, res) => {
	try {
		const result = await pool.query(
			'SELECT current_database() as database_name, current_schema() as schema_name',
		)
		res.status(200).json({
			status: 'ok',
			service: 'klining-api',
			database: 'connected',
			databaseName: result.rows[0].database_name,
			schemaName: result.rows[0].schema_name,
			uptime: process.uptime(),
		})
	} catch (error) {
		res.status(500).json({
			status: 'error',
			service: 'klining-api',
			database: 'failed',
			message: error.message,
		})
	}
})

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
