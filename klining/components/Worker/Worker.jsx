import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Worker.scss'

export default function Worker() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()

	const handleLogin = async e => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			// Отправляем запрос на сервер
			const response = await fetch('http://localhost:5000/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username,
					password,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Ошибка входа')
			}

			// Проверяем, что это работник (role_id = 2)
			if (data.user.role_id !== 2) {
				throw new Error('Доступ только для работников')
			}

			// Сохраняем токен и данные пользователя
			localStorage.setItem('token', data.token)
			localStorage.setItem('user', JSON.stringify(data.user))

			// Перенаправляем в Workspace
			navigate('/workspace')
		} catch (err) {
			console.error('Login error:', err)
			setError(err.message || 'Ошибка входа')
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className='worker-login'>
			<div className='worker-login__container'>
				<h1 className='worker-login__title'>Вход для работников</h1>
				<p className='worker-login__subtitle'>Доступ к вашей рабочей панели</p>

				<div className='worker-login__card'>
					<form className='worker-login__form' onSubmit={handleLogin}>
						{error && <div className='error-message'>{error}</div>}

						<div className='form-group'>
							<label htmlFor='username' className='form-group__label'>
								Имя пользователя
							</label>
							<input
								type='text'
								id='username'
								className='form-group__input'
								placeholder='Введите имя пользователя'
								value={username}
								onChange={e => setUsername(e.target.value)}
								required
								disabled={loading}
							/>
						</div>

						<div className='form-group'>
							<label htmlFor='password' className='form-group__label'>
								Пароль
							</label>
							<input
								type='password'
								id='password'
								className='form-group__input'
								placeholder='Введите пароль'
								value={password}
								onChange={e => setPassword(e.target.value)}
								required
								disabled={loading}
							/>
						</div>

						<button
							type='submit'
							className='worker-login__button'
							disabled={loading}
						>
							{loading ? 'Вход...' : 'Войти'}
						</button>
					</form>
				</div>
			</div>
		</main>
	)
}
