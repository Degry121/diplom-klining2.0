import React from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedAdminRoute({ children }) {
	const token = localStorage.getItem('token')
	const user = JSON.parse(localStorage.getItem('user') || '{}')

	// не залогинен
	if (!token) {
		return <Navigate to='/admin' replace />
	}

	// не админ (например role_id !== 1)
	if (user.role_id !== 1) {
		return <Navigate to='/workspace' replace />
	}

	return children
}
