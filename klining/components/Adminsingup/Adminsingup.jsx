import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Adminsingup.scss'

export default function Adminsingup() {
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
			const response = await fetch('http://localhost:5000/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username, password }),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Ошибка входа')
			}

			// Сохранение токена в localStorage
			localStorage.setItem('token', data.token)
			localStorage.setItem('user', JSON.stringify(data.user))

			// Перенаправление на dashboard
			navigate('/dashboard')
		} catch (err) {
			setError(err.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className='admin-login'>
			<div className='admin-login__container'>
				<h1 className='admin-login__title'>Вход для админа</h1>
				<p className='admin-login__subtitle'>Доступ к панели управления</p>

				<div className='admin-login__card'>
					<form className='admin-login__form' onSubmit={handleLogin}>
						{error && <div className='admin-login__error'>{error}</div>}

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
								disabled={loading}
								required
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
								disabled={loading}
								required
							/>
						</div>

						<button
							type='submit'
							className='admin-login__button'
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
