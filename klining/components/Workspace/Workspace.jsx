import React, { useState, useEffect, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import './Workspace.scss'
import WorkspaceHeader from '../WorkspaceHeader/WorkspaceHeader'
import { ThemeContext } from '../../src/context/ThemeContext'
import taskIcon from './img/task.svg'
import progressIcon from './img/progress.svg'
import completeIcon from './img/complete.svg'
import timeIcon from './img/time.svg'
import locationIcon from './img/location.svg'
import calendarIcon from './img/calendar.svg'

const Workspace = () => {
	const [tasks, setTasks] = useState([])
	const [stats, setStats] = useState({
		total_tasks: 0,
		completed_tasks: 0,
		avg_progress: 0,
		today_tasks: 0,
	})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [userName, setUserName] = useState('Иван')

	const [completeModalOpen, setCompleteModalOpen] = useState(false)
	const [taskToComplete, setTaskToComplete] = useState(null)
	const [selectedPhotos, setSelectedPhotos] = useState([])

	const { isDarkMode } = useContext(ThemeContext)
	const workspaceClass = `workspace ${isDarkMode ? 'dark-mode' : ''}`

	const location = useLocation()
	const isHistory =
		location.pathname.includes('history') || location.search.includes('history')

	const sortTasks = data => {
		const statusWeight = {
			in_review: 1,
			in_progress: 2,
			pending: 3,
			completed: 4,
		}
		return [...data].sort((a, b) => {
			return (statusWeight[a.status] || 5) - (statusWeight[b.status] || 5)
		})
	}

	useEffect(() => {
		fetchTasks()
		fetchStats()
		fetchUserInfo()
	}, [])

	const fetchUserInfo = () => {
		const user = JSON.parse(localStorage.getItem('user') || '{}')
		if (user.first_name) {
			setUserName(user.first_name)
		}
	}

	const fetchTasks = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('http://localhost:5000/api/tasks/my-tasks', {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			})

			if (!response.ok) {
				throw new Error('Ошибка загрузки задач')
			}

			const data = await response.json()
			setTasks(sortTasks(data))
		} catch (err) {
			console.error(err)
			setError(err.message)
		} finally {
			setLoading(false)
		}
	}

	const fetchStats = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('http://localhost:5000/api/tasks/my-stats', {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			})

			if (!response.ok) {
				throw new Error('Ошибка загрузки статистики')
			}

			const data = await response.json()
			setStats(data)
		} catch (err) {
			console.error(err)
		}
	}

	const openCompleteModal = taskId => {
		setTaskToComplete(taskId)
		setSelectedPhotos([])
		setCompleteModalOpen(true)
	}

	const handlePhotoSelect = e => {
		const files = Array.from(e.target.files)
		if (selectedPhotos.length + files.length > 5) {
			alert('Максимум 5 фотографий')
			return
		}
		setSelectedPhotos(prev => [...prev, ...files])
	}

	const removePhoto = index => {
		setSelectedPhotos(prev => prev.filter((_, i) => i !== index))
	}

	const submitCompleteTask = async () => {
		if (!taskToComplete) return

		const formData = new FormData()
		selectedPhotos.forEach(file => {
			formData.append('photos', file)
		})

		try {
			const token = localStorage.getItem('token')
			const response = await fetch(
				`http://localhost:5000/api/tasks/${taskToComplete}/complete`,
				{
					method: 'PATCH',
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				},
			)

			if (response.ok) {
				setCompleteModalOpen(false)
				fetchTasks()
				fetchStats()
			}
		} catch (err) {
			console.error(err)
		}
	}

	const formatDate = dateString => {
		if (!dateString) return ''
		const date = new Date(dateString)
		const options = {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}
		return date.toLocaleDateString('ru-RU', options)
	}

	const filteredTasks = tasks.filter(task => {
		if (isHistory) {
			return task.status === 'completed' || task.status === 'in_review'
		}
		return task.status === 'pending' || task.status === 'in_progress'
	})

	if (loading) {
		return (
			<>
				<WorkspaceHeader />
				<div className={workspaceClass}>
					<div className='workspace-loading'>Загрузка...</div>
				</div>
			</>
		)
	}

	if (error) {
		return (
			<>
				<WorkspaceHeader />
				<div className={workspaceClass}>
					<div className='workspace-error'>Ошибка: {error}</div>
				</div>
			</>
		)
	}

	return (
		<>
			<WorkspaceHeader />
			<div className={workspaceClass}>
				<div className='workspace-header'>
					<div>
						<h1>{isHistory ? 'История задач' : 'Мои задачи'}</h1>
						{!isHistory && (
							<p className='workspace-subtitle'>
								Добро пожаловать, {userName}! У вас {stats.today_tasks}{' '}
								{stats.today_tasks === 1
									? 'задача'
									: stats.today_tasks > 1 && stats.today_tasks < 5
										? 'задачи'
										: 'задач'}{' '}
								на сегодня
							</p>
						)}
					</div>
				</div>

				{!isHistory && (
					<div className='workspace-stats'>
						<div className='stat-card'>
							<div className='stat-icon'>
								<img src={taskIcon} alt='Задачи' />
							</div>
							<div className='stat-content'>
								<div className='stat-value'>{stats.total_tasks || 0}</div>
								<div className='stat-label'>Задач назначено</div>
							</div>
						</div>

						<div className='stat-card'>
							<div className='stat-icon progress-icon'>
								<img src={progressIcon} alt='Прогресс' />
							</div>
							<div className='stat-content'>
								<div className='stat-value'>
									{Math.round(stats.avg_progress || 0)}%
								</div>
								<div className='stat-label'>Эффективность</div>
								<div className='progress-bar'>
									<div
										className='progress-fill'
										style={{ width: `${stats.avg_progress || 0}%` }}
									></div>
								</div>
							</div>
						</div>

						<div className='stat-card'>
							<div className='stat-icon complete-icon'>
								<img src={completeIcon} alt='Выполнено' />
							</div>
							<div className='stat-content'>
								<div className='stat-value'>
									{stats.completed_tasks || 0}/{stats.total_tasks || 0}
								</div>
								<div className='stat-label'>Выполнено</div>
							</div>
						</div>
					</div>
				)}

				<div className='tasks-list'>
					{filteredTasks.length === 0 ? (
						<div className='no-tasks'>
							<p>{isHistory ? 'История пуста' : 'Нет активных задач'}</p>
						</div>
					) : (
						filteredTasks.map(task => (
							<div key={task.id} className={`task-card ${task.status}`}>
								<div className='task-header'>
									<div className='task-title-section'>
										<h3 className='task-title'>{task.title}</h3>
										{task.department_name && (
											<span className='task-badge'>{task.department_name}</span>
										)}
									</div>
									<div className='task-priority'>
										{task.priority === 'high' && (
											<span className='priority-badge high'>Высокий</span>
										)}
										{task.priority === 'medium' && (
											<span className='priority-badge medium'>Средний</span>
										)}
										{task.priority === 'low' && (
											<span className='priority-badge low'>Низкий</span>
										)}
									</div>
								</div>

								<div className='task-details'>
									{task.due_date && (
										<div className='task-info-item'>
											<img
												src={calendarIcon}
												alt='Дата'
												className='task-info-icon'
											/>
											<span>{formatDate(task.due_date)}</span>
										</div>
									)}
									{task.description && (
										<div className='task-description'>
											<img
												src={timeIcon}
												alt='Время'
												className='task-info-icon'
											/>
											<span>{task.description}</span>
										</div>
									)}
									{task.location_name && (
										<div className='task-info-item'>
											<img
												src={locationIcon}
												alt='Локация'
												className='task-info-icon'
											/>
											<span>
												{task.location_name}
												{task.location_address && ` - ${task.location_address}`}
											</span>
										</div>
									)}
								</div>

								{task.images &&
									Array.isArray(task.images) &&
									task.images.length > 0 && (
										<div
											className='task-card__report'
											style={{ marginTop: '15px' }}
										>
											<div
												style={{
													display: 'flex',
													gap: '8px',
													overflowX: 'auto',
													paddingBottom: '5px',
												}}
											>
												{task.images.map((img, idx) => (
													<img
														key={idx}
														src={`http://localhost:5000${img}`}
														alt={`Отчет ${idx + 1}`}
														style={{
															width: '80px',
															height: '80px',
															objectFit: 'cover',
															borderRadius: '8px',
															cursor: 'pointer',
															flexShrink: 0,
														}}
														onClick={() =>
															window.open(
																`http://localhost:5000${img}`,
																'_blank',
															)
														}
													/>
												))}
											</div>
										</div>
									)}

								<div
									className='task-footer'
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										marginTop: '15px',
									}}
								>
									{(task.status === 'pending' ||
										task.status === 'in_progress') && (
										<>
											<button
												className='btn-complete'
												onClick={() => openCompleteModal(task.id)}
											>
												Отправить на проверку
											</button>
											<button className='btn-details'>Подробнее</button>
										</>
									)}

									{task.status === 'in_review' && (
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												padding: '8px 16px',
												background: 'rgba(250, 173, 20, 0.1)',
												color: '#faad14',
												borderRadius: '8px',
												fontWeight: '500',
											}}
										>
											⏳ Ожидает проверки администратором
										</div>
									)}

									{task.status === 'completed' && (
										<div className='task-completed-badge'>
											<img src={completeIcon} alt='Выполнено' />
											<span>Выполнено</span>
										</div>
									)}
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{completeModalOpen && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0,0,0,0.6)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000,
					}}
				>
					<div
						style={{
							background: isDarkMode ? '#1e1e1e' : '#fff',
							padding: '24px',
							borderRadius: '12px',
							width: '90%',
							maxWidth: '400px',
							boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
						}}
					>
						<h2
							style={{
								marginTop: 0,
								marginBottom: '8px',
								color: isDarkMode ? '#fff' : '#333',
							}}
						>
							Отчет о выполнении
						</h2>
						<p
							style={{ marginBottom: '20px', color: '#888', fontSize: '14px' }}
						>
							Прикрепите фото проделанной работы (до 5 шт.)
						</p>

						<div
							style={{
								display: 'flex',
								flexWrap: 'wrap',
								gap: '12px',
								marginBottom: '24px',
							}}
						>
							{selectedPhotos.map((photo, i) => (
								<div
									key={i}
									style={{
										position: 'relative',
										width: '70px',
										height: '70px',
									}}
								>
									<img
										src={URL.createObjectURL(photo)}
										alt=''
										style={{
											width: '100%',
											height: '100%',
											objectFit: 'cover',
											borderRadius: '8px',
											border: '1px solid #eee',
										}}
									/>
									<button
										onClick={() => removePhoto(i)}
										style={{
											position: 'absolute',
											top: '-6px',
											right: '-6px',
											background: '#ff4d4f',
											color: 'white',
											border: 'none',
											borderRadius: '50%',
											width: '22px',
											height: '22px',
											cursor: 'pointer',
											fontSize: '14px',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
										}}
									>
										×
									</button>
								</div>
							))}
							{selectedPhotos.length < 5 && (
								<label
									style={{
										width: '70px',
										height: '70px',
										border: '2px dashed #0b6a6a',
										borderRadius: '8px',
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: 'pointer',
										color: '#0b6a6a',
										background: isDarkMode ? '#2c2c2c' : '#f0f9f9',
										transition: 'all 0.2s',
									}}
								>
									<span style={{ fontSize: '24px', lineHeight: '24px' }}>
										+
									</span>
									<span style={{ fontSize: '10px', marginTop: '2px' }}>
										Фото
									</span>
									<input
										type='file'
										multiple
										accept='image/*'
										onChange={handlePhotoSelect}
										style={{ display: 'none' }}
									/>
								</label>
							)}
						</div>

						<div
							style={{
								display: 'flex',
								gap: '12px',
								justifyContent: 'flex-end',
							}}
						>
							<button
								onClick={() => setCompleteModalOpen(false)}
								style={{
									padding: '10px 16px',
									borderRadius: '8px',
									border: '1px solid #ddd',
									background: 'transparent',
									cursor: 'pointer',
									fontWeight: '500',
									color: isDarkMode ? '#ccc' : '#555',
								}}
							>
								Отмена
							</button>
							<button
								onClick={submitCompleteTask}
								style={{
									padding: '10px 20px',
									borderRadius: '8px',
									border: 'none',
									background: '#0b6a6a',
									color: 'white',
									cursor: 'pointer',
									fontWeight: '500',
									display: 'flex',
									alignItems: 'center',
									gap: '6px',
								}}
							>
								Отправить на проверку
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default Workspace
