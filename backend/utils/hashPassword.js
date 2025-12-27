const bcrypt = require('bcryptjs')

async function hashPassword(password) {
	try {
		const salt = await bcrypt.genSalt(10)
		const hash = await bcrypt.hash(password, salt)
		console.log('=================================')
		console.log('Password:', password)
		console.log('Hash:', hash)
		console.log('=================================')
		console.log('Скопируйте этот хеш и используйте в SQL запросе!')
		return hash
	} catch (error) {
		console.error('Error:', error)
	}
}

// Можете изменить пароль здесь
hashPassword('admin123')
