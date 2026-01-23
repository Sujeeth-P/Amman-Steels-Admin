import { create } from 'zustand'
import { authAPI } from '../services/api'

const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('admin_user')) || null,
    token: localStorage.getItem('admin_token') || null,
    loading: false,
    error: null,

    // Getters
    isAuthenticated: () => !!get().token && !!get().user,
    userRole: () => get().user?.role || null,
    userName: () => get().user?.name || 'User',

    // Role checks
    isSuperAdmin: () => get().user?.role === 'super_admin',
    isAdmin: () => get().user?.role === 'admin',
    isStaff: () => get().user?.role === 'staff',

    // Permission checks
    canManageUsers: () => get().user?.role === 'super_admin',
    canManageProducts: () => ['super_admin', 'admin'].includes(get().user?.role),
    canManageStock: () => ['super_admin', 'admin'].includes(get().user?.role),
    canViewReports: () => ['super_admin', 'admin'].includes(get().user?.role),
    canViewAllReports: () => get().user?.role === 'super_admin',
    canCreateOrders: () => ['super_admin', 'admin', 'staff'].includes(get().user?.role),

    // Check if user has required role
    hasRole: (roles) => {
        const user = get().user
        if (!user) return false
        if (typeof roles === 'string') return user.role === roles
        return roles.includes(user.role)
    },

    // Actions
    login: async (credentials) => {
        set({ loading: true, error: null })
        try {
            const response = await authAPI.login(credentials)
            const { token, user } = response.data.data

            localStorage.setItem('admin_token', token)
            localStorage.setItem('admin_user', JSON.stringify(user))

            set({ token, user, loading: false })
            return { success: true, user }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Login failed'
            set({ error: errorMsg, loading: false })
            return { success: false, error: errorMsg }
        }
    },

    fetchProfile: async () => {
        try {
            const response = await authAPI.getProfile()
            const user = response.data.data
            localStorage.setItem('admin_user', JSON.stringify(user))
            set({ user })
            return user
        } catch (error) {
            console.error('Failed to fetch profile:', error)
            return null
        }
    },

    changePassword: async (data) => {
        try {
            await authAPI.changePassword(data)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.response?.data?.message }
        }
    },

    logout: () => {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        set({ user: null, token: null })
    }
}))

export default useAuthStore
