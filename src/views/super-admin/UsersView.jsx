import { useState, useEffect } from 'react'
import { usersAPI, authAPI } from '../../services/api'

const UsersView = () => {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState([])
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState('create')
    const [editingUser, setEditingUser] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        phone: ''
    })

    const loadUsers = async () => {
        setLoading(true)
        try {
            const res = await usersAPI.getAll({
                page: pagination.page,
                limit: pagination.limit,
                search,
                role: roleFilter
            })
            setUsers(res.data.data.users)
            setPagination(res.data.data.pagination)
        } catch (err) {
            console.error('Failed to load users:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [pagination.page, search, roleFilter])

    const openCreateModal = () => {
        setModalMode('create')
        setEditingUser(null)
        setForm({ name: '', email: '', password: '', role: 'staff', phone: '' })
        setError('')
        setShowPassword(false)
        setShowModal(true)
    }

    const openEditModal = (user) => {
        setModalMode('edit')
        setEditingUser(user)
        setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' })
        setError('')
        setShowPassword(false)
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            if (modalMode === 'create') {
                await authAPI.register(form)
            } else {
                const updateData = { name: form.name, email: form.email, role: form.role, phone: form.phone }
                await usersAPI.update(editingUser.id, updateData)
                if (form.password) {
                    await usersAPI.resetPassword(editingUser.id, { newPassword: form.password })
                }
            }
            setShowModal(false)
            loadUsers()
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed')
        } finally {
            setSaving(false)
        }
    }

    const toggleUserStatus = async (user) => {
        try {
            await usersAPI.update(user.id, { isActive: !user.isActive })
            loadUsers()
        } catch (err) {
            console.error('Failed to update user:', err)
        }
    }

    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'super_admin': return 'bg-purple-100 text-purple-800'
            case 'admin': return 'bg-blue-100 text-blue-800'
            case 'staff': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-steel-900">User Management</h1>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add User
                </button>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            type="text"
                            placeholder="Search users..."
                            className="input-field"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="input-field sm:w-48"
                    >
                        <option value="">All Roles</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-steel-50">
                            <tr>
                                <th className="table-header">Name</th>
                                <th className="table-header">Email</th>
                                <th className="table-header">Role</th>
                                <th className="table-header">Status</th>
                                <th className="table-header">Last Login</th>
                                <th className="table-header">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="table-cell text-center py-8">
                                        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </td>
                                </tr>
                            ) : !users.length ? (
                                <tr>
                                    <td colSpan="6" className="table-cell text-center text-steel-500 py-8">No users found</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-steel-100 hover:bg-steel-50">
                                        <td className="table-cell">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                                                    {user.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="table-cell text-steel-600">{user.email}</td>
                                        <td className="table-cell">
                                            <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                                                {user.role?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="table-cell text-steel-500">
                                            {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-1.5 text-steel-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => toggleUserStatus(user)}
                                                    className="p-1.5 text-steel-600 hover:text-amber-600 hover:bg-amber-50 rounded"
                                                    title={user.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-steel-200">
                        <span className="text-sm text-steel-600">
                            Showing {users.length} of {pagination.total} users
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                disabled={pagination.page === 1}
                                className={`btn-secondary text-sm ${pagination.page === 1 ? 'opacity-50' : ''}`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                disabled={pagination.page >= pagination.pages}
                                className={`btn-secondary text-sm ${pagination.page >= pagination.pages ? 'opacity-50' : ''}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fadeIn">
                        <div className="p-6 border-b border-steel-200">
                            <h3 className="text-lg font-semibold text-steel-900">
                                {modalMode === 'create' ? 'Create User' : 'Edit User'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-1">Name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    type="text"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-1">Email</label>
                                <input
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    type="email"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-1">
                                    {modalMode === 'create' ? 'Password' : 'Password (leave blank to keep unchanged)'}
                                </label>
                                <div className="relative">
                                    <input
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        type={showPassword ? "text" : "password"}
                                        className="input-field pr-10"
                                        required={modalMode === 'create'}
                                        minLength="6"
                                        placeholder={modalMode === 'edit' ? 'Enter new password to change' : 'Enter password'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-500 hover:text-steel-700 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-1">Role</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="super_admin">Super Admin</option>
                                    <option value="admin">Admin</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-1">Phone</label>
                                <input
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    type="tel"
                                    className="input-field"
                                    pattern="[6-9]\d{9}"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-primary flex-1">
                                    {saving ? 'Saving...' : (modalMode === 'create' ? 'Create' : 'Update')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UsersView
