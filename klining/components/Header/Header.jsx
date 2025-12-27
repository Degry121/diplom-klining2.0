import React, { useContext, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ThemeContext } from '../../src/context/ThemeContext'
import './Header.scss'

import Moon from './img/Moon.svg'
import Sun from './img/Sun.svg'
import DashboardIcon from './img/dashboard.svg'
import UsersIcon from './img/Users.svg'
import LocationIcon from './img/location.svg'
import TaskIcon from './img/task.svg'
import User from './img/User.svg'

export default function Header() {
	const { isDarkMode, setIsDarkMode } = useContext(ThemeContext)
	const [showUserMenu, setShowUserMenu] = useState(false)
	const [userName, setUserName] = useState('')
	const navigate = useNavigate()

	useEffect(() => {
		const user = JSON.parse(localStorage.getItem('user') || '{}')
		setUserName(
			`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Пользователь'
		)
	}, [])

	const navItems = [
		{ label: 'Главная', href: '/dashboard', icon: DashboardIcon },
		{ label: 'Сотрудники', href: '/employees', icon: UsersIcon },
		{ label: 'Объекты', href: '#objects', icon: LocationIcon },
		{ label: 'Задачи', href: '#tasks', icon: TaskIcon },
	]

	const handleLogout = () => {
		localStorage.removeItem('token')
		localStorage.removeItem('user')
		navigate('/admin')
	}

	return (
		<header className={`header ${isDarkMode ? 'dark-mode' : ''}`}>
			<div className='header__left'>
				<Link to='/' className='header__logo-btn'>
					КТ
				</Link>
				<h1 className='header__title'>Клининг Трекер</h1>
			</div>

			<nav className='header__nav'>
				{navItems.map((item, idx) => (
					<Link key={idx} to={item.href} className='header__nav-item'>
						<img
							src={item.icon}
							alt={item.label}
							className='header__nav-icon'
						/>
						<span className='header__nav-text'>{item.label}</span>
					</Link>
				))}
			</nav>

			<div className='header__right'>
				<div className='header__theme-toggle'>
					<button
						className={`header__theme-btn ${isDarkMode ? 'dark' : 'light'}`}
						onClick={() => setIsDarkMode(!isDarkMode)}
						title={isDarkMode ? 'Светлая тема' : 'Тёмная тема'}
					>
						<img src={Sun} alt='Солнце' className='header__theme-sun' />
						<img src={Moon} alt='Луна' className='header__theme-moon' />
					</button>
				</div>

				<div className='header__user-menu'>
					<button
						className='header__profile-btn'
						title='Профиль'
						onClick={() => setShowUserMenu(!showUserMenu)}
					>
						<img src={User} alt='Профиль' />
					</button>

					{showUserMenu && (
						<div className='header__user-dropdown'>
							<div className='header__user-name'>{userName}</div>
							<button className='header__logout-btn' onClick={handleLogout}>
								Выход
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	)
}
