import React, { useContext, useEffect, useState } from 'react'
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
} from 'recharts'
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
	const [chartData, setChartData] = useState({ status: [], locations: [] })
	const [stats, setStats] = useState([
		{
			title: 'Всего пользователей',
			value: 0,
			subtitle: 'Все сотрудники',
			icon: UsersGreen,
		},
		{
			title: 'Активных пользователей',
			value: 0,
			subtitle: 'В строю',
			icon: UserCheck,
		},
		{
			title: 'Объекты',
			value: 0,
			subtitle: 'Места уборки',
			icon: LocationGreen,
		},
		{ title: 'Всего задач', value: 0, subtitle: 'В системе', icon: TaskGreen },
	])
	const [loading, setLoading] = useState(true)
	const [showUserModal, setShowUserModal] = useState(false)
	const [showTaskModal, setShowTaskModal] = useState(false)

	const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042']

	const getStatusBadge = status => {
		const badges = {
			completed: { text: 'Завершено', color: 'green' },
			in_progress: { text: 'В работе', color: 'blue' },
			pending: { text: 'Ожидает', color: 'orange' },
		}
		return badges[status] || badges.pending
	}

	useEffect(() => {
		// Имитируем задержку сети
		setTimeout(() => {
			loadMockData()
		}, 500)
	}, [])

	const loadMockData = () => {
		// Устанавливаем фиктивные данные статистики
		setStats([
			{
				title: 'Всего пользователей',
				value: 6,
				subtitle: 'Все сотрудники',
				icon: UsersGreen,
			},
			{
				title: 'Активных пользователей',
				value: 4,
				subtitle: 'В строю',
				icon: UserCheck,
			},
			{
				title: 'Объекты',
				value: 4,
				subtitle: 'Места уборки',
				icon: LocationGreen,
			},
			{
				title: 'Всего задач',
				value: 8,
				subtitle: 'В системе',
				icon: TaskGreen,
			},
		])

		// Устанавливаем фиктивные данные для графиков
		setChartData({
			status: [
				{ name: 'В работе', value: 3 },
				{ name: 'Завершено', value: 5 },
			],
			locations: [
				{ name: 'Офис 1', value: 4 },
				{ name: 'Офис 2', value: 2 },
				{ name: 'Склад', value: 2 },
			],
		})

		// Устанавливаем фиктивную активность
		setTasks([
			{
				id: 1,
				name: 'Уборка',
				action: 'Статус изменен',
				time: '14:30',
				status: 'in_progress',
			},
			{
				id: 2,
				name: 'Ремонт',
				action: 'Задача завершена',
				time: '12:00',
				status: 'completed',
			},
		])

		setLoading(false)
	}

	if (loading) return <div className='loader-screen'>Загрузка аналитики...</div>

	return (
		<div className={`dashboard-wrapper ${isDarkMode ? 'dark-mode' : ''}`}>
			<Header />
			<main className='dashboard-content'>
				<div className='dashboard-grid'>
					<div className='dashboard-left'>
						<div className='dashboard-header'>
							<h1 className='dashboard-title'>Панель управления</h1>
							<p className='dashboard-subtitle'>
								Оперативная сводка по объектам и сотрудникам.
							</p>
						</div>

						<div className='stats-grid'>
							{stats.map((stat, idx) => (
								<div key={idx} className='stat-card'>
									<div className='stat-card__header'>
										<span className='stat-card__title'>{stat.title}</span>
										<img src={stat.icon} alt='' className='stat-card__icon' />
									</div>
									<div className='stat-card__value'>{stat.value}</div>
									<div className='stat-card__subtitle'>{stat.subtitle}</div>
								</div>
							))}
						</div>

						<div className='analytics-section'>
							<div className='chart-container'>
								<h3>Статусы задач</h3>
								<ResponsiveContainer width='100%' height={250}>
									<PieChart>
										<Pie
											data={chartData.status}
											innerRadius={60}
											outerRadius={80}
											dataKey='value'
											nameKey='name'
											paddingAngle={3}
										>
											{chartData.status.map((e, i) => (
												<Cell key={i} fill={COLORS[i % COLORS.length]} />
											))}
										</Pie>
										<Tooltip cursor={{ fill: 'transparent' }} />
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</div>
							<div className='chart-container'>
								<h3>Нагрузка на объекты</h3>
								<ResponsiveContainer width='100%' height={250}>
									<BarChart data={chartData.locations}>
										<XAxis
											dataKey='name'
											tick={{
												fontSize: 12,
												fill: isDarkMode ? '#a0a0a0' : '#8a8f98',
											}}
										/>
										<YAxis stroke={isDarkMode ? '#a0a0a0' : '#8a8f98'} />
										<Tooltip cursor={{ fill: 'rgba(11, 106, 106, 0.05)' }} />
										<Bar dataKey='value' fill='#0b6a6a' radius={[6, 6, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className='activity-section'>
							<div className='activity-section__header'>
								<h3>Последняя активность</h3>
								<button className='activity-section__show-all'>
									Показать все →
								</button>
							</div>
							<div className='activity-list'>
								{tasks.length === 0 ? (
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
												className={`status-badge status-badge--${getStatusBadge(task.status).color}`}
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
								<img src={Adduser} alt='' className='quick-action-item__icon' />
								<div className='quick-action-item__content'>
									<h4>Новый сотрудник</h4>
									<p>Добавить в систему</p>
								</div>
							</button>
							<button
								className='quick-action-item'
								onClick={() => setShowTaskModal(true)}
							>
								<img src={Addtask} alt='' className='quick-action-item__icon' />
								<div className='quick-action-item__content'>
									<h4>Новая задача</h4>
									<p>Назначить на объект</p>
								</div>
							</button>
						</div>
					</aside>
				</div>
			</main>

			<AddUserModal
				isOpen={showUserModal}
				onClose={() => setShowUserModal(false)}
				onUserAdded={loadMockData}
			/>
			<AddTaskModal
				isOpen={showTaskModal}
				onClose={() => setShowTaskModal(false)}
				onTaskAdded={loadMockData}
			/>
		</div>
	)
}
