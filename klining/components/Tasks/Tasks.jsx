import React, { useState, useEffect, useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../Header/Header'
import { ThemeContext } from '../../src/context/ThemeContext'
import AddTaskModal from '../AddTaskModal/AddTaskModal'
import './Tasks.scss'

export default function Tasks() {
	const { isDarkMode } = useContext(ThemeContext)
	const [tasks, setTasks] = useState([])
	const [loading, setLoading] = useState(true)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [searchParams] = useSearchParams()

	const [completeModalOpen, setCompleteModalOpen] = useState(false)
	const [taskToComplete, setTaskToComplete] = useState(null)
	const [selectedPhotos, setSelectedPhotos] = useState([])

	const filterLocationId = searchParams.get('locationId')

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

	const loadTasks = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('http://localhost:5000/api/tasks/list', {
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await response.json()

			if (Array.isArray(data)) {
				let filtered = filterLocationId
					? data.filter(t => String(t.location_id) === filterLocationId)
					: data
				setTasks(sortTasks(filtered))
			}
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadTasks()
	}, [filterLocationId])

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
				loadTasks()
			}
		} catch (err) {
			console.error(err)
		}
	}

	const updateStatus = async (taskId, newStatus) => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch(
				`http://localhost:5000/api/tasks/${taskId}/status`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ status: newStatus }),
				},
			)

			if (response.ok) {
				loadTasks()
			}
		} catch (error) {
			console.error(error)
		}
	}

	const getStatusBadge = status => {
		switch (status) {
			case 'completed':
				return { text: 'Выполнено', class: 'completed' }
			case 'in_review':
				return {
					text: 'На проверке',
					class: 'in-review',
					style: { backgroundColor: '#faad14', color: '#fff' },
				}
			case 'in_progress':
				return { text: 'В работе', class: 'in-progress' }
			default:
				return { text: 'Ожидает', class: 'pending' }
		}
	}

	if (loading) {
		return (
			<div className={`tasks-page ${isDarkMode ? 'dark-mode' : ''}`}>
				<Header />
				<div className='loader'>Загрузка задач...</div>
			</div>
		)
	}

	return (
		<div className={`tasks-page ${isDarkMode ? 'dark-mode' : ''}`}>
			<Header />
			<main className='tasks-container'>
				<div className='tasks-header'>
					<div>
						<h1>
							{filterLocationId ? 'Задачи объекта' : 'Управление задачами'}
						</h1>
						<p>Список актуальных задач и исполнителей.</p>
					</div>
					<button className='btn-add-task' onClick={() => setIsModalOpen(true)}>
						+ Новая задача
					</button>
				</div>

				<div className='tasks-list'>
					{tasks.length === 0 ? (
						<div className='empty-state'>
							{filterLocationId ? 'Задач не найдено' : 'Задач пока нет'}
						</div>
					) : (
						tasks.map(task => {
							const badge = getStatusBadge(task.status)
							return (
								<div
									key={task.id}
									className={`task-card ${task.status === 'completed' ? 'task-card--completed' : ''}`}
								>
									<div className='task-card__main'>
										<div className='task-card__header'>
											<div className='task-card__title-group'>
												<h3 className='task-card__title'>
													{task.location_name} — {task.title}
												</h3>
												<div className='task-card__team'>
													<strong>Исполнители:</strong>{' '}
													{task.assigned_to_name || 'Не назначены'}
												</div>
											</div>
											<span
												className={`task-card__status task-card__status--${badge.class}`}
												style={badge.style || {}}
											>
												{badge.text}
											</span>
										</div>

										<div className='task-card__info'>
											<div className='info-item'>
												<span>
													📍 {task.location_address || 'Адрес не указан'}
												</span>
											</div>
											<div className='info-item'>
												<span>
													🕒{' '}
													{task.due_date
														? new Date(task.due_date).toLocaleString('ru-RU')
														: 'Срок не задан'}
												</span>
											</div>
										</div>

										<div className='task-card__notes'>
											<strong>Примечания:</strong>{' '}
											{task.description || 'Нет примечаний'}
										</div>

										{task.images &&
											Array.isArray(task.images) &&
											task.images.length > 0 && (
												<div
													className='task-card__report'
													style={{ marginTop: '15px' }}
												>
													<strong>Фотоотчет работника:</strong>
													<div
														style={{
															display: 'flex',
															gap: '8px',
															overflowX: 'auto',
															paddingBottom: '5px',
															marginTop: '8px',
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
																	border: '2px solid #0b6a6a',
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
											className='task-card__actions'
											style={{ marginTop: '16px', display: 'flex', gap: '8px' }}
										>
											{task.status === 'in_review' && (
												<>
													<button
														className='btn-primary'
														style={{
															backgroundColor: '#52c41a',
															borderColor: '#52c41a',
														}}
														onClick={() => updateStatus(task.id, 'completed')}
													>
														Принять работу
													</button>
													<button
														className='btn-undo'
														style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
														onClick={() => updateStatus(task.id, 'in_progress')}
													>
														Отклонить
													</button>
												</>
											)}

											{(task.status === 'pending' ||
												task.status === 'in_progress') && (
												<button
													className='btn-primary'
													onClick={() => openCompleteModal(task.id)}
												>
													Завершить самому
												</button>
											)}

											{task.status === 'completed' && (
												<button
													className='btn-undo'
													onClick={() => updateStatus(task.id, 'pending')}
												>
													Вернуть в работу
												</button>
											)}

											<button
												className='btn-secondary'
												onClick={() =>
													alert(`Описание: ${task.description || 'Нет'}`)
												}
											>
												Инфо
											</button>
										</div>
									</div>
								</div>
							)
						})
					)}
				</div>
			</main>

			<AddTaskModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onTaskAdded={loadTasks}
			/>

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
							Завершение задачи
						</h2>
						<p
							style={{ marginBottom: '20px', color: '#888', fontSize: '14px' }}
						>
							Вы можете прикрепить фото (до 5 шт.)
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
								Подтвердить
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
