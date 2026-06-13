import React, { useEffect, useState } from 'react'
import './LegalConsent.scss'

export function LegalAgreementModal({ isOpen, onClose }) {
	if (!isOpen) return null

	return (
		<div className='legal-modal' role='dialog' aria-modal='true'>
			<div className='legal-modal__panel'>
				<div className='legal-modal__header'>
					<h2>Пользовательское соглашение</h2>
					<button
						type='button'
						className='legal-modal__close'
						onClick={onClose}
						aria-label='Закрыть'
					>
						x
					</button>
				</div>

				<div className='legal-modal__content'>
					<h3>Обработка персональных данных</h3>
					<p>
						Продолжая работу с системой, пользователь подтверждает согласие на
						обработку персональных данных, необходимых для учета сотрудников,
						назначения задач, контроля выполнения работ и формирования
						внутренней отчетности.
					</p>
					<p>
						К таким данным могут относиться имя, фамилия, логин, номер
						телефона, роль пользователя, отдел, назначенные задачи, статусы
						работ и загруженные фотоотчеты.
					</p>

					<h3>Цели обработки</h3>
					<p>
						Данные используются только для работы приложения: авторизации,
						управления сотрудниками, распределения задач, просмотра истории и
						аналитики выполнения работ.
					</p>

					<h3>Cookies и локальное хранение</h3>
					<p>
						Приложение использует технические cookies и localStorage для
						сохранения сессии, настроек интерфейса и подтверждения согласия.
						Эти данные нужны для корректной работы сайта и не используются для
						рекламного отслеживания.
					</p>

					<h3>Срок действия согласия</h3>
					<p>
						Согласие действует до его отзыва пользователем или до прекращения
						использования учетной записи. Для отзыва согласия необходимо
						обратиться к администратору системы.
					</p>
				</div>

				<div className='legal-modal__footer'>
					<button type='button' className='legal-button' onClick={onClose}>
						Понятно
					</button>
				</div>
			</div>
		</div>
	)
}

export function CookieConsent() {
	const [isVisible, setIsVisible] = useState(false)
	const [isAgreementOpen, setIsAgreementOpen] = useState(false)

	useEffect(() => {
		setIsVisible(localStorage.getItem('cookieConsentAccepted') !== 'true')
	}, [])

	const acceptCookies = () => {
		localStorage.setItem('cookieConsentAccepted', 'true')
		setIsVisible(false)
	}

	return (
		<>
			{isVisible && (
				<div className='cookie-consent'>
					<div className='cookie-consent__text'>
						<strong>Cookies</strong>
						<span>
							Мы используем технические cookies и localStorage для входа,
							настроек интерфейса и стабильной работы системы.
						</span>
					</div>
					<div className='cookie-consent__actions'>
						<button
							type='button'
							className='legal-link-button'
							onClick={() => setIsAgreementOpen(true)}
						>
							Подробнее
						</button>
						<button type='button' className='legal-button' onClick={acceptCookies}>
							Принять
						</button>
					</div>
				</div>
			)}

			<LegalAgreementModal
				isOpen={isAgreementOpen}
				onClose={() => setIsAgreementOpen(false)}
			/>
		</>
	)
}
