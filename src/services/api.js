import axios from 'axios'

const api = axios.create({
    baseURL: '/api/admin',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    getProfile: () => api.get('/auth/me'),
    changePassword: (data) => api.put('/auth/password', data),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout')
}

// Users API
export const usersAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/auth/register', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
    getStats: () => api.get('/users/stats')
}

// Products API
export const productsAPI = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    getStats: () => api.get('/products/stats')
}

// Stock API
export const stockAPI = {
    getMovements: (params) => api.get('/stock/movements', { params }),
    getSummary: () => api.get('/stock/summary'),
    stockIn: (data) => api.post('/stock/in', data),
    stockOut: (data) => api.post('/stock/out', data),
    adjustment: (data) => api.post('/stock/adjustment', data)
}

// Orders API
export const ordersAPI = {
    getAll: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    update: (id, data) => api.put(`/orders/${id}`, data),
    generateInvoice: (id) => api.post(`/orders/${id}/invoice`),
    getStats: () => api.get('/orders/stats')
}

// Reports API
export const reportsAPI = {
    getDashboard: () => api.get('/reports/dashboard'),
    getSales: (params) => api.get('/reports/sales', { params }),
    getProducts: () => api.get('/reports/products'),
    getAnalytics: () => api.get('/reports/analytics')
}

// Create a separate axios instance for file uploads (multipart/form-data)
const uploadApi = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'multipart/form-data'
    }
})

// Add auth token to upload requests
uploadApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Images API - for Cloudinary uploads
export const imagesAPI = {
    upload: (file, folder = 'products') => {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('folder', folder)
        return uploadApi.post('/images/upload', formData)
    },
    uploadMultiple: (files, folder = 'products') => {
        const formData = new FormData()
        for (const file of files) {
            formData.append('images', file)
        }
        formData.append('folder', folder)
        return uploadApi.post('/images/upload-multiple', formData)
    },
    delete: (publicId) => api.delete(`/api/images/${publicId}`)
}
