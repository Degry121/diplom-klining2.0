const { Pool } = require('pg')
require('dotenv').config()

const dbSchema = process.env.DB_SCHEMA || 'public'

if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbSchema)) {
	throw new Error(`Invalid DB_SCHEMA value: ${dbSchema}`)
}

const pool = new Pool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	options: `-c search_path=${dbSchema},public`,
})

pool.on('connect', () => {
	console.log(`Connected to PostgreSQL database (schema: ${dbSchema})`)
})

pool.on('error', err => {
	console.error('Unexpected error on idle client', err)
})

module.exports = pool
