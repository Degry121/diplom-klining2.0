import React, { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../../src/context/ThemeContext'
import './AddTaskModal.scss'

export default function AddTaskModal({ isOpen, onClose, onTaskAdded }) {
	const { isDarkMode } = useContext(ThemeContext)
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		locationId: '',
		assignedTo: '',
		priority: 'medium',
		dueDate: '',
	})
	const [locations, setLocations] = useState([])
	const [users, setUsers] = useState([])
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (isOpen) {
			loadLocations()
			loadUsers()
		}
	}, [isOpen])

	const loadLocations = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('http://localhost:5000/api/locations/list', {
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await response.json()
			setLocations(data)
		} catch (error) {
			console.error('Error loading locations:', error)
		}
	}

	const loadUsers = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('http://localhost:5000/api/users/list', {
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await response.json()
			setUsers(data.filter(u => u.role_name === 'worker'))
		} catch (error) {
			console.error('Error loading users:', error)
		}
	}

	const handleSubmit = async e => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			const token = localStorage.getItem('token')
			const response = await fetch('http://localhost:5000/api/tasks/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Ошибка создания задачи')
			}

			onTaskAdded()
			onClose()
			setFormData({
				title: '',
				description: '',
				locationId: '',
				assignedTo: '',
				priority: 'medium',
				dueDate: '',
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
					<h2>Создать задачу</h2>
					<button className='modal-close' onClick={onClose}>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className='modal-form'>
					{error && <div className='modal-error'>{error}</div>}

					<div className='form-group'>
						<label>Название задачи</label>
						<input
							type='text'
							value={formData.title}
							onChange={e =>
								setFormData({ ...formData, title: e.target.value })
							}
							required
						/>
					</div>

					<div className='form-group'>
						<label>Описание</label>
						<textarea
							value={formData.description}
							onChange={e =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows='4'
						/>
					</div>

					<div className='form-group'>
						<label>Объект</label>
						<select
							value={formData.locationId}
							onChange={e =>
								setFormData({ ...formData, locationId: e.target.value })
							}
							required
						>
							<option value=''>Выберите объект</option>
							{locations.map(loc => (
								<option key={loc.id} value={loc.id}>
									{loc.name}
								</option>
							))}
						</select>
					</div>

					<div className='form-group'>
						<label>Назначить на</label>
						<select
							value={formData.assignedTo}
							onChange={e =>
								setFormData({ ...formData, assignedTo: e.target.value })
							}
						>
							<option value=''>Не назначено</option>
							{users.map(user => (
								<option key={user.id} value={user.id}>
									{user.first_name} {user.last_name}
								</option>
							))}
						</select>
					</div>

					<div className='form-row'>
						<div className='form-group'>
							<label>Приоритет</label>
							<select
								value={formData.priority}
								onChange={e =>
									setFormData({ ...formData, priority: e.target.value })
								}
							>
								<option value='low'>Низкий</option>
								<option value='medium'>Средний</option>
								<option value='high'>Высокий</option>
							</select>
						</div>

						<div className='form-group'>
							<label>Срок выполнения</label>
							<input
								type='datetime-local'
								value={formData.dueDate}
								onChange={e =>
									setFormData({ ...formData, dueDate: e.target.value })
								}
							/>
						</div>
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
