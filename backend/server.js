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
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminDashboardRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/locations', locationsRoutes)
app.use('/api/departments', departmentsRoutes)

app.get('/api/test', (req, res) => {
	res.json({ message: 'Server is running!' })
})

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`)
})
