import React, { useState, useEffect, useContext } from 'react'
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

	// тема из контекста
	const { isDarkMode } = useContext(ThemeContext)
	const workspaceClass = `workspace ${isDarkMode ? 'dark-mode' : ''}`

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
			setTasks(data)
		} catch (err) {
			console.error('Error fetching tasks:', err)
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
			console.error('Error fetching stats:', err)
		}
	}

	const markAsCompleted = async taskId => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch(
				`http://localhost:5000/api/tasks/${taskId}/complete`,
				{
					method: 'PATCH',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				}
			)

			if (!response.ok) {
				throw new Error('Ошибка обновления задачи')
			}

			fetchTasks()
			fetchStats()
		} catch (err) {
			console.error('Error updating task:', err)
			alert('Ошибка при обновлении задачи')
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
						<h1>Мои задачи</h1>
						<p className='workspace-subtitle'>
							Добро пожаловать, {userName}! У вас {stats.today_tasks}{' '}
							{stats.today_tasks === 1
								? 'задача'
								: stats.today_tasks > 1 && stats.today_tasks < 5
								? 'задачи'
								: 'задач'}{' '}
							на сегодня
						</p>
					</div>
				</div>

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

				<div className='tasks-list'>
					{tasks.length === 0 ? (
						<div className='no-tasks'>
							<p>Нет задач</p>
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

								{task.progress > 0 && task.status !== 'completed' && (
									<div className='task-progress'>
										<div className='progress-info'>
											<span>Прогресс</span>
											<span>{task.progress}%</span>
										</div>
										<div className='progress-bar-task'>
											<div
												className='progress-fill-task'
												style={{ width: `${task.progress}%` }}
											></div>
										</div>
									</div>
								)}

								<div className='task-footer'>
									{task.status !== 'completed' ? (
										<>
											<button
												className='btn-complete'
												onClick={() => markAsCompleted(task.id)}
											>
												Отметить выполненной
											</button>
											<button className='btn-details'>Подробнее</button>
										</>
									) : (
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
		</>
	)
}

export default Workspace
