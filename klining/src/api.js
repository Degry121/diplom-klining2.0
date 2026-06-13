const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const API_BASE_URL = (
	configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:3010' : '')
).replace(/\/$/, '')

export const apiUrl = path => {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	return `${API_BASE_URL}${normalizedPath}`
}

export const mediaUrl = path => {
	if (!path) return ''
	if (path.startsWith('http')) return path

	const normalizedPath = path.startsWith('/') ? path : `/${path}`

	if (!API_BASE_URL && normalizedPath.startsWith('/uploads/')) {
		return `/api${normalizedPath}`
	}

	return apiUrl(normalizedPath)
}
