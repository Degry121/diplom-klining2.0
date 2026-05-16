import React from 'react'
import { Routes, Route } from 'react-router-dom'

import Firstlist from '../components/Firstlist/Firstlist.jsx'
import Adminsingup from '../components/Adminsingup/Adminsingup.jsx'
import Dashboard from '../components/Dashboard/Dashboard.jsx'
import Employees from '../components/Employees/Employees.jsx'
import Locations from '../components/Locations/Locations.jsx'
import Tasks from '../components/Tasks/Tasks.jsx'
import Worker from '../components/Worker/Worker.jsx'
import Workspace from '../components/Workspace/Workspace.jsx'
import History from '../components/History/History.jsx'
import ProtectedAdminRoute from '../components/ProtectedAdminRoute/ProtectedAdminRoute.jsx'

export default function App() {
	return (
		<Routes>
			<Route path='/' element={<Firstlist />} />
			<Route path='/admin' element={<Adminsingup />} />
			<Route path='/worker' element={<Worker />} />

			<Route
				path='/dashboard'
				element={
					<ProtectedAdminRoute>
						<Dashboard />
					</ProtectedAdminRoute>
				}
			/>

			<Route
				path='/employees'
				element={
					<ProtectedAdminRoute>
						<Employees />
					</ProtectedAdminRoute>
				}
			/>

			<Route
				path='/locations'
				element={
					<ProtectedAdminRoute>
						<Locations />
					</ProtectedAdminRoute>
				}
			/>

			<Route
				path='/tasks'
				element={
					<ProtectedAdminRoute>
						<Tasks />
					</ProtectedAdminRoute>
				}
			/>

			<Route path='/workspace' element={<Workspace />} />
			<Route path='/workspace/history' element={<History />} />
		</Routes>
	)
}
