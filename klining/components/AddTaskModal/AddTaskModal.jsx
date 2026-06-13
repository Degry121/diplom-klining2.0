import React, { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../../src/context/ThemeContext'
import { apiUrl } from '../../src/api'
import './AddTaskModal.scss'

export default function AddTaskModal({ isOpen, onClose, onTaskAdded }) {
	const { isDarkMode } = useContext(ThemeContext)
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		locationId: '',
		assignedTo: [],
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
			const response = await fetch(apiUrl('/api/locations/list'), {
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await response.json()
			if (Array.isArray(data)) setLocations(data)
		} catch (error) {
			setLocations([])
		}
	}

	const loadUsers = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch(
				apiUrl('/api/users/workers-only'),
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			)
			const data = await response.json()
			if (Array.isArray(data)) setUsers(data)
		} catch (error) {
			setUsers([])
		}
	}

	const handleWorkerToggle = workerId => {
		setFormData(prev => {
			const isSelected = prev.assignedTo.includes(workerId)
			const updated = isSelected
				? prev.assignedTo.filter(id => id !== workerId)
				: [...prev.assignedTo, workerId]
			return { ...prev, assignedTo: updated }
		})
	}

	const handleSubmit = async e => {
		e.preventDefault()
		if (formData.assignedTo.length === 0) {
			setError('Выберите хотя бы одного сотрудника')
			return
		}
		setError('')
		setLoading(true)

		try {
			const token = localStorage.getItem('token')
			const response = await fetch(apiUrl('/api/tasks/create'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			})

			const data = await response.json()
			if (!response.ok) throw new Error(data.error || 'Ошибка создания')

			onTaskAdded()
			onClose()
			setFormData({
				title: '',
				description: '',
				locationId: '',
				assignedTo: [],
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
					<h2>Новая задача</h2>
					<button className='modal-close' onClick={onClose}>
						&times;
					</button>
				</div>

				<form onSubmit={handleSubmit} className='modal-form'>
					{error && <div className='modal-error'>{error}</div>}

					<div className='form-group'>
						<label>Заголовок задачи</label>
						<input
							type='text'
							placeholder='Например: Уборка конференц-зала'
							value={formData.title}
							onChange={e =>
								setFormData({ ...formData, title: e.target.value })
							}
							required
						/>
					</div>

					<div className='form-group'>
						<label>Инструкции и примечания</label>
						<textarea
							placeholder='Опишите детали задачи...'
							value={formData.description}
							onChange={e =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows='3'
						/>
					</div>

					<div className='form-row'>
						<div className='form-group'>
							<label>Объект</label>
							<select
								value={formData.locationId}
								onChange={e =>
									setFormData({ ...formData, locationId: e.target.value })
								}
								required
							>
								<option value=''>Выберите место</option>
								{locations.map(loc => (
									<option key={loc.id} value={loc.id}>
										{loc.name}
									</option>
								))}
							</select>
						</div>
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
					</div>

					<div className='form-group'>
						<label>Исполнители ({formData.assignedTo.length})</label>
						<div className='worker-selector'>
							{users.map(user => (
								<div
									key={user.id}
									className={`worker-chip ${formData.assignedTo.includes(user.id) ? 'active' : ''}`}
									onClick={() => handleWorkerToggle(user.id)}
								>
									<span className='worker-chip__name'>
										{user.first_name} {user.last_name}
									</span>
									<span className='worker-chip__user'>@{user.username}</span>
								</div>
							))}
						</div>
					</div>

					<div className='form-group'>
						<label>Крайний срок</label>
						<input
							type='datetime-local'
							value={formData.dueDate}
							onChange={e =>
								setFormData({ ...formData, dueDate: e.target.value })
							}
							required
						/>
					</div>

					<div className='modal-footer'>
						<button type='button' onClick={onClose} className='btn-cancel'>
							Отмена
						</button>
						<button type='submit' className='btn-submit' disabled={loading}>
							{loading ? 'Создание...' : 'Создать задачу'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
