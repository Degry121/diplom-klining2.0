import React, { useState, useEffect, useContext } from 'react'
import WorkspaceHeader from '../WorkspaceHeader/WorkspaceHeader'
import { ThemeContext } from '../../src/context/ThemeContext'
import '../Workspace/Workspace.scss'
import completeIcon from '../Workspace/img/complete.svg'
import timeIcon from '../Workspace/img/time.svg'
import locationIcon from '../Workspace/img/location.svg'
import calendarIcon from '../Workspace/img/calendar.svg'

export default function History() {
	const [tasks, setTasks] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	const { isDarkMode } = useContext(ThemeContext)
	const workspaceClass = `workspace ${isDarkMode ? 'dark-mode' : ''}`

	useEffect(() => {
		fetchHistoryTasks()
	}, [])

	const sortTasks = data => {
		return [...data].sort((a, b) => {
			if (a.status === 'in_review' && b.status === 'completed') return -1
			if (a.status === 'completed' && b.status === 'in_review') return 1
			return (
				new Date(b.updated_at || b.created_at) -
				new Date(a.updated_at || a.created_at)
			)
		})
	}

	const fetchHistoryTasks = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('http://localhost:5000/api/tasks/my-tasks', {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			})

			if (!response.ok) {
				throw new Error('Ошибка загрузки истории')
			}

			const data = await response.json()
			const historyData = data.filter(
				task => task.status === 'completed' || task.status === 'in_review',
			)

			setTasks(sortTasks(historyData))
		} catch (err) {
			console.error(err)
			setError(err.message)
		} finally {
			setLoading(false)
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
				fetchHistoryTasks()
			}
		} catch (error) {
			console.error(error)
		}
	}

	const formatDate = dateString => {
		if (!dateString) return ''
		const date = new Date(dateString)
		return date.toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

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
						<h1>История задач</h1>
						<p className='workspace-subtitle'>
							Ваши завершенные задачи и задачи на проверке
						</p>
					</div>
				</div>

				<div className='tasks-list'>
					{tasks.length === 0 ? (
						<div className='no-tasks'>
							<p>История пуста</p>
						</div>
					) : (
						tasks.map(task => (
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
															border: '2px solid #faad14',
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
									{task.status === 'in_review' && (
										<>
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
											<button
												className='btn-undo'
												onClick={() => updateStatus(task.id, 'in_progress')}
												style={{
													padding: '8px 16px',
													borderRadius: '6px',
													border: '1px solid #ccc',
													cursor: 'pointer',
													background: 'transparent',
													color: isDarkMode ? '#fff' : '#000',
												}}
											>
												Отменить и вернуть
											</button>
										</>
									)}

									{task.status === 'completed' && (
										<div className='task-completed-badge'>
											<img src={completeIcon} alt='Выполнено' />
											<span>Выполнено (Подтверждено)</span>
										</div>
									)}
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</>
	)
}
