import React, { useContext } from 'react'
import { ThemeContext } from '../../src/context/ThemeContext'
import './ConfirmModal.scss'

export default function ConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
}) {
	const { isDarkMode } = useContext(ThemeContext)

	if (!isOpen) return null

	return (
		<div
			className={`confirm-overlay ${isDarkMode ? 'dark-mode' : ''}`}
			onClick={onClose}
		>
			<div className='confirm-content' onClick={e => e.stopPropagation()}>
				<div className='confirm-header'>
					<h2>{title || 'Подтверждение'}</h2>
				</div>

				<div className='confirm-body'>
					<p>{message || 'Вы уверены?'}</p>
				</div>

				<div className='confirm-footer'>
					<button className='btn-cancel' onClick={onClose}>
						Отмена
					</button>
					<button
						className='btn-danger'
						onClick={() => {
							onConfirm()
							onClose()
						}}
					>
						Удалить
					</button>
				</div>
			</div>
		</div>
	)
}
