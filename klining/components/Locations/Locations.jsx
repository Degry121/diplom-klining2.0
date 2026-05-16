import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../Header/Header'
import { ThemeContext } from '../../src/context/ThemeContext'
import './Locations.scss'

export default function Locations() {
	const { isDarkMode } = useContext(ThemeContext)
	const [locations, setLocations] = useState([])
	const [loading, setLoading] = useState(true)
	const navigate = useNavigate()

	useEffect(() => {
		loadLocations()
	}, [])

	const loadLocations = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('http://localhost:5000/api/locations/list', {
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await response.json()
			if (Array.isArray(data)) {
				setLocations(data)
			}
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div className={`locations-page ${isDarkMode ? 'dark-mode' : ''}`}>
				<Header />
				<div className='loader'>Загрузка данных...</div>
			</div>
		)
	}

	return (
		<div className={`locations-page ${isDarkMode ? 'dark-mode' : ''}`}>
			<Header />
			<main className='locations-container'>
				<div className='locations-header'>
					<h1>Объекты обслуживания</h1>
					<p>Список всех активных точек уборки и их адреса.</p>
				</div>

				<div className='locations-grid'>
					{locations.length === 0 ? (
						<div className='empty-state'>Список объектов пуст</div>
					) : (
						locations.map(loc => (
							<div key={loc.id} className='location-card'>
								<div className='location-card__icon-box'>🏢</div>
								<div className='location-card__content'>
									<div className='location-card__header'>
										<h3 className='location-card__name'>{loc.name}</h3>
										<span className='location-card__badge'>Активен</span>
									</div>
									<div className='location-card__info'>
										<span className='info-icon'>📍</span>
										<p className='location-card__address'>
											{loc.address || 'Адрес не указан'}
										</p>
									</div>
									<div className='location-card__footer'>
										<span className='location-card__id'>
											ID объекта: {loc.id}
										</span>
										<button
											className='location-card__btn'
											onClick={() => navigate(`/tasks?locationId=${loc.id}`)}
										>
											Просмотр задач
										</button>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</main>
		</div>
	)
}
