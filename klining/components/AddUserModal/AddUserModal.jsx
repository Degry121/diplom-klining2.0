import React, { useState, useContext, useEffect } from 'react'
import { ThemeContext } from '../../src/context/ThemeContext'
import './AddUserModal.scss'

export default function AddUserModal({ isOpen, onClose, onUserAdded }) {
	const { isDarkMode } = useContext(ThemeContext)
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		firstName: '',
		lastName: '',
		roleId: '2',
		phone: '',
		departmentId: '',
	})
	const [departments, setDepartments] = useState([])
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (isOpen) {
			loadDepartments()
		}
	}, [isOpen])

	const loadDepartments = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch(
				'http://localhost:5000/api/departments/list',
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			)
			const data = await response.json()

			// ЗАЩИТА: проверяем, что сервер вернул именно массив
			if (Array.isArray(data)) {
				setDepartments(data)
			} else {
				setDepartments([]) // Если пришла ошибка, ставим пустой массив
			}
		} catch (error) {
			console.error('Error loading departments:', error)
			setDepartments([])
		}
	}

	const handleSubmit = async e => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			const token = localStorage.getItem('token')
			// ИСПРАВЛЕНО: отправляем запрос на правильный роут регистрации
			const response = await fetch('http://localhost:5000/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Ошибка создания пользователя')
			}

			onUserAdded()
			onClose()
			setFormData({
				username: '',
				password: '',
				firstName: '',
				lastName: '',
				roleId: '2',
				phone: '',
				departmentId: '',
			})
		} catch (err) {
			setError(err.message)
		} finally {
			setLoading(false)
		}
	}

	if (!isOpen) return null

	return (
		<div
			className={`modal-overlay ${isDarkMode ? 'dark-mode' : ''}`}
			onClick={onClose}
		>
			<div className='modal-content' onClick={e => e.stopPropagation()}>
				<div className='modal-header'>
					<h2>Добавить пользователя</h2>
					<button className='modal-close' onClick={onClose}>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className='modal-form'>
					{error && <div className='modal-error'>{error}</div>}

					<div className='form-row'>
						<div className='form-group'>
							<label>Имя</label>
							<input
								type='text'
								value={formData.firstName}
								onChange={e =>
									setFormData({ ...formData, firstName: e.target.value })
								}
								required
							/>
						</div>
						<div className='form-group'>
							<label>Фамилия</label>
							<input
								type='text'
								value={formData.lastName}
								onChange={e =>
									setFormData({ ...formData, lastName: e.target.value })
								}
								required
							/>
						</div>
					</div>

					<div className='form-group'>
						<label>Имя пользователя</label>
						<input
							type='text'
							value={formData.username}
							onChange={e =>
								setFormData({ ...formData, username: e.target.value })
							}
							required
						/>
					</div>

					<div className='form-group'>
						<label>Пароль</label>
						<input
							type='password'
							value={formData.password}
							onChange={e =>
								setFormData({ ...formData, password: e.target.value })
							}
							required
						/>
					</div>

					<div className='form-group'>
						<label>Телефон</label>
						<input
							type='tel'
							value={formData.phone}
							onChange={e =>
								setFormData({ ...formData, phone: e.target.value })
							}
						/>
					</div>

					<div className='form-group'>
						<label>Отдел</label>
						<select
							value={formData.departmentId}
							onChange={e =>
								setFormData({ ...formData, departmentId: e.target.value })
							}
						>
							<option value=''>Выберите отдел</option>
							{/* ЗАЩИТА: рендерим только если departments это массив */}
							{Array.isArray(departments) &&
								departments.map(dept => (
									<option key={dept.id} value={dept.id}>
										{dept.name}
									</option>
								))}
						</select>
					</div>

					<div className='form-group'>
						<label>Роль</label>
						<select
							value={formData.roleId}
							onChange={e =>
								setFormData({ ...formData, roleId: e.target.value })
							}
						>
							<option value='2'>Работник</option>
							<option value='1'>Администратор</option>
						</select>
					</div>

					<div className='modal-footer'>
						<button type='button' onClick={onClose} className='btn-cancel'>
							Отмена
						</button>
						<button type='submit' className='btn-submit' disabled={loading}>
							{loading ? 'Создание...' : 'Создать'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
