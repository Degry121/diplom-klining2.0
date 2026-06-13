import React from 'react'
import { Link } from 'react-router-dom'
import './Firstlist.scss'

import Users from './img/Users.svg'
import Clipboard from './img/Clipboard.svg'

export default function Firstlist() {
	return (
		<main className='landing'>
			<div className='landing__container'>
				<div className='landing__logo'>KT</div>

				<h1 className='landing__title'>Клининг Трекер</h1>
				<p className='landing__subtitle'>
					Система учета работы и управления задачами для профессиональных
					клининговых услуг
				</p>

				<section className='landing__grid'>
					<article className='card'>
						<div className='card__icon'>
							<img className='card__iconImg' src={Users} alt='Пользователи' />
						</div>
						<h2 className='card__title'>Админ-панель</h2>
						<p className='card__text'>
							Управление сотрудниками, назначение задач, контроль эффективности
							и формирование отчетов.
						</p>
						<Link to='/admin' className='card__btn'>
							Войти
						</Link>
					</article>

					<article className='card'>
						<div className='card__icon'>
							<img className='card__iconImg' src={Clipboard} alt='Задачи' />
						</div>
						<h2 className='card__title'>Для работников</h2>
						<p className='card__text'>
							Просмотр назначенных задач, отправка фотоотчетов и отслеживание
							истории выполненных работ.
						</p>
						<Link to='/worker' className='card__btn'>
							Войти
						</Link>
					</article>
				</section>
			</div>
		</main>
	)
}
