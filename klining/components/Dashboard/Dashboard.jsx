import React, { useContext, useEffect, useState } from 'react'
import { ThemeContext } from '../../src/context/ThemeContext'
import './Dashboard.scss'
import Header from '../../components/Header/Header'
import AddUserModal from '../AddUserModal/AddUserModal'
import AddTaskModal from '../AddTaskModal/AddTaskModal'

import Addtask from './img/Addtask.svg'
import Adduser from './img/Adduser.svg'
import TaskGreen from './img/taskgreen.svg'
import UserCheck from './img/User check.svg'
import UsersGreen from './img/Usersgreen.svg'
import LocationGreen from './img/locationgreen.svg'

export default function Dashboard() {
	const { isDarkMode } = useContext(ThemeContext)
	const [tasks, setTasks] = useState([])
	const [stats, setStats] = useState([
		{
			title: 'Всего пользователей',
			value: 0,
			subtitle: 'Все пользователи системы',
			icon: UsersGreen,
		},
		{
			title: 'Активных пользователей',
			value: 0,
			subtitle: 'Назначены цели',
			icon: UserCheck,
		},
		{
			title: 'Объекты',
			value: 0,
			subtitle: 'Места уборки',
			icon: LocationGreen,
		},
		{
			title: 'Всего задач',
			value: 0,
			subtitle: 'Все задачи системы',
			icon: TaskGreen,
		},
	])
	const [loading, setLoading] = useState(true)
	const [showUserModal, setShowUserModal] = useState(false)
	const [showTaskModal, setShowTaskModal] = useState(false)

	useEffect(() => {
		loadDashboardData()
	}, [])

	const loadDashboardData = async () => {
		try {
			const token = localStorage.getItem('token')

			// ИСПРАВЛЕННЫЕ URL: /api/admin/*
			const statsResponse = await fetch(
				'http://localhost:5000/api/admin/stats',
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			)

			if (!statsResponse.ok) {
				throw new Error('Ошибка загрузки статистики')
			}

			const statsData = await statsResponse.json()

			setStats([
				{
					title: 'Всего пользователей',
					value: statsData.totalUsers ?? 0,
					subtitle: 'Все пользователи системы',
					icon: UsersGreen,
				},
				{
					title: 'Активных пользователей',
					value: statsData.activeUsers ?? 0,
					subtitle: 'Назначены цели',
					icon: UserCheck,
				},
				{
					title: 'Объекты',
					value: statsData.locations ?? 0,
					subtitle: 'Места уборки',
					icon: LocationGreen,
				},
				{
					title: 'Всего задач',
					value: statsData.totalTasks ?? 0,
					subtitle: 'Все задачи системы',
					icon: TaskGreen,
				},
			])

			const activityResponse = await fetch(
				'http://localhost:5000/api/admin/activity',
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			)

			if (!activityResponse.ok) {
				throw new Error('Ошибка загрузки активности')
			}

			const activityData = await activityResponse.json()
			// защита от не-массива
			setTasks(Array.isArray(activityData) ? activityData : [])

			setLoading(false)
		} catch (error) {
			console.error('Error loading dashboard:', error)
			setTasks([]) // чтобы не падать на map
			setLoading(false)
		}
	}

	const getStatusBadge = status => {
		const badges = {
			completed: { text: 'Завершено', color: 'green' },
			in_progress: { text: 'В работе', color: 'blue' },
			pending: { text: 'Отложено', color: 'orange' },
		}
		return badges[status] || badges.pending
	}

	if (loading) {
		return (
			<div className='dashboard-wrapper'>
				<Header />
				<div style={{ padding: '40px', textAlign: 'center' }}>Загрузка...</div>
			</div>
		)
	}

	return (
		<div className={`dashboard-wrapper ${isDarkMode ? 'dark-mode' : ''}`}>
			<Header />

			<main className='dashboard-content'>
				<div className='dashboard-grid'>
					<div className='dashboard-left'>
						<div className='dashboard-header'>
							<h1 className='dashboard-title'>Панель управления</h1>
							<p className='dashboard-subtitle'>
								Добро пожаловать! Вот что происходит сегодня.
							</p>
						</div>

						<div className='stats-grid'>
							{stats.map((stat, idx) => (
								<div key={idx} className='stat-card'>
									<div className='stat-card__header'>
										<span className='stat-card__title'>{stat.title}</span>
										<img
											src={stat.icon}
											alt={stat.title}
											className='stat-card__icon'
										/>
									</div>
									<div className='stat-card__value'>{stat.value}</div>
									<div className='stat-card__subtitle'>{stat.subtitle}</div>
								</div>
							))}
						</div>

						<div className='activity-section'>
							<div className='activity-section__header'>
								<h3>Последняя активность</h3>
								<button className='activity-section__show-all'>
									Показать все →
								</button>
							</div>

							<div className='activity-list'>
								{!tasks || tasks.length === 0 ? (
									<p
										style={{
											textAlign: 'center',
											color: '#999',
											padding: '20px',
										}}
									>
										Нет активности
									</p>
								) : (
									tasks.map(task => (
										<div key={task.id} className='activity-item'>
											<div className='activity-item__info'>
												<h4 className='activity-item__name'>{task.name}</h4>
												<p className='activity-item__description'>
													{task.action}
												</p>
												<p className='activity-item__time'>{task.time}</p>
											</div>
											<span
												className={`status-badge status-badge--${
													getStatusBadge(task.status).color
												}`}
											>
												{getStatusBadge(task.status).text}
											</span>
										</div>
									))
								)}
							</div>
						</div>
					</div>

					<aside className='quick-actions'>
						<h3 className='quick-actions__title'>Быстрые действия</h3>
						<div className='quick-actions__grid'>
							<button
								className='quick-action-item'
								onClick={() => setShowUserModal(true)}
							>
								<img
									src={Adduser}
									alt='Добавить пользователя'
									className='quick-action-item__icon'
								/>
								<div className='quick-action-item__content'>
									<h4>Добавить пользователя</h4>
									<p>Создать нового сотрудника</p>
								</div>
							</button>

							<button
								className='quick-action-item'
								onClick={() => setShowTaskModal(true)}
							>
								<img
									src={Addtask}
									alt='Создать задачу'
									className='quick-action-item__icon'
								/>
								<div className='quick-action-item__content'>
									<h4>Создать задачу</h4>
									<p>Назначить новую задачу на объект</p>
								</div>
							</button>
						</div>
					</aside>
				</div>
			</main>

			<AddUserModal
				isOpen={showUserModal}
				onClose={() => setShowUserModal(false)}
				onUserAdded={loadDashboardData}
			/>

			<AddTaskModal
				isOpen={showTaskModal}
				onClose={() => setShowTaskModal(false)}
				onTaskAdded={loadDashboardData}
			/>
		</div>
	)
}
