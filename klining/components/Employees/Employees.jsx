import React, { useContext, useEffect, useState } from 'react'
import './Employees.scss'
import Header from '../Header/Header'
import { ThemeContext } from '../../src/context/ThemeContext'
import { apiUrl } from '../../src/api'
import AddUserModal from '../AddUserModal/AddUserModal'
import ConfirmModal from '../ConfirmModal/ConfirmModal'

const Employees = () => {
	const { isDarkMode } = useContext(ThemeContext)
	const [employees, setEmployees] = useState([])
	const [loading, setLoading] = useState(true)
	const [showUserModal, setShowUserModal] = useState(false)
	const [openMenuId, setOpenMenuId] = useState(null)
	const [showConfirmModal, setShowConfirmModal] = useState(false)
	const [userToDelete, setUserToDelete] = useState(null)

	useEffect(() => {
		loadEmployees()
	}, [])

	const loadEmployees = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch(apiUrl('/api/users/list'), {
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await response.json()

			if (Array.isArray(data)) {
				const employeesData = data.map(user => ({
					id: user.id,
					name:
						`${user.first_name || ''} ${user.last_name || ''}`.trim() ||
						user.username,
					login: user.username,
					department: user.department_name || 'Не назначен',
					tasks: parseInt(user.total_tasks) || 0,
					efficiency: `${user.efficiency || 0}%`,
					status: user.is_active ? 'Активен' : 'Неактивен',
				}))
				setEmployees(employeesData)
			} else {
				setEmployees([])
			}
		} catch (error) {
			setEmployees([])
		} finally {
			setLoading(false)
		}
	}

	const confirmDelete = (userId, userName) => {
		setUserToDelete({ id: userId, name: userName })
		setShowConfirmModal(true)
		setOpenMenuId(null)
	}

	const handleDeleteUser = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch(
				apiUrl(`/api/users/${userToDelete.id}`),
				{
					method: 'DELETE',
					headers: { Authorization: `Bearer ${token}` },
				},
			)

			if (response.ok) {
				loadEmployees()
				setShowConfirmModal(false)
			}
		} catch (error) {
			console.error(error)
		}
	}

	const handleToggleStatus = async (userId, currentStatus) => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch(
				apiUrl(`/api/users/${userId}/toggle-status`),
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ isActive: currentStatus !== 'Активен' }),
				},
			)

			if (response.ok) {
				loadEmployees()
			}
		} catch (error) {
			console.error(error)
		}
	}

	if (loading) {
		return (
			<div className={`employees ${isDarkMode ? 'dark-mode' : ''}`}>
				<Header />
				<div style={{ padding: '40px', textAlign: 'center' }}>Загрузка...</div>
			</div>
		)
	}

	return (
		<div className={`employees ${isDarkMode ? 'dark-mode' : ''}`}>
			<Header />

			<main className='employees__main'>
				<div className='employees__title-section'>
					<div>
						<h1 className='employees__title'>Управление сотрудниками</h1>
						<p className='employees__subtitle'>
							Добро пожаловать! Вот что происходит сегодня.
						</p>
					</div>
					<button
						className='employees__add-button'
						onClick={() => setShowUserModal(true)}
					>
						+ Добавить работника
					</button>
				</div>

				<div className='employees__table-wrapper'>
					<table className='employees__table'>
						<thead>
							<tr>
								<th>Имя</th>
								<th>Логин</th>
								<th>Отдел</th>
								<th>Задач</th>
								<th>Эффективность</th>
								<th>Статус</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{employees.length === 0 ? (
								<tr>
									<td
										colSpan='7'
										style={{
											textAlign: 'center',
											padding: '30px',
											color: '#888',
										}}
									>
										Список сотрудников пуст. Нажмите кнопку «+ Добавить
										работника».
									</td>
								</tr>
							) : (
								employees.map(employee => (
									<tr key={employee.id}>
										<td className='employees__name'>{employee.name}</td>
										<td className='employees__login'>{employee.login}</td>
										<td className='employees__department'>
											{employee.department}
										</td>
										<td className='employees__tasks'>{employee.tasks}</td>
										<td className='employees__efficiency'>
											{employee.efficiency}
										</td>
										<td>
											<span
												className={`employees__status ${
													employee.status === 'Активен'
														? 'employees__status--active'
														: 'employees__status--inactive'
												}`}
											>
												{employee.status}
											</span>
										</td>
										<td>
											<div
												className={`employees__menu ${
													openMenuId === employee.id ? 'active' : ''
												}`}
											>
												<button
													className='employees__menu-button'
													onClick={() =>
														setOpenMenuId(
															openMenuId === employee.id ? null : employee.id,
														)
													}
												>
													<span className='employees__menu-dot'></span>
													<span className='employees__menu-dot'></span>
													<span className='employees__menu-dot'></span>
												</button>
												<div className='employees__dropdown'>
													<button
														onClick={() => {
															handleToggleStatus(employee.id, employee.status)
															setOpenMenuId(null)
														}}
													>
														{employee.status === 'Активен'
															? 'Деактивировать'
															: 'Активировать'}
													</button>
													<button
														onClick={() =>
															confirmDelete(employee.id, employee.name)
														}
													>
														Удалить
													</button>
												</div>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</main>

			<AddUserModal
				isOpen={showUserModal}
				onClose={() => setShowUserModal(false)}
				onUserAdded={loadEmployees}
			/>

			<ConfirmModal
				isOpen={showConfirmModal}
				onClose={() => setShowConfirmModal(false)}
				onConfirm={handleDeleteUser}
				title='Удалить пользователя'
				message={`Вы уверены, что хотите удалить пользователя "${userToDelete?.name}"? Это действие нельзя отменить.`}
			/>
		</div>
	)
}

export default Employees
