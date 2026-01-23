import { useState, useEffect } from 'react'
import { reportsAPI, usersAPI } from '../../services/api'

const DashboardView = () => {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        todayOrders: 0,
        monthRevenue: 0,
        recentOrders: []
    })
    const [userStats, setUserStats] = useState({ total: 0, active: 0, byRole: {} })
    const [analytics, setAnalytics] = useState(null)

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [dashRes, userRes, analyticsRes] = await Promise.all([
                    reportsAPI.getDashboard(),
                    usersAPI.getStats(),
                    reportsAPI.getAnalytics()
                ])
                setStats(dashRes.data.data)
                setUserStats(userRes.data.data)
                setAnalytics(analyticsRes.data.data)
            } catch (error) {
                console.error('Failed to load dashboard:', error)
            } finally {
                setLoading(false)
            }
        }
        loadDashboard()
    }, [])

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0)
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="animate-fadeIn">
                <h1 className="text-2xl font-bold text-steel-900 mb-6">Super Admin Dashboard</h1>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-steel-900 mb-6">Super Admin Dashboard</h1>

            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Products */}
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total Products</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalProducts}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Orders */}
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Total Orders</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalOrders}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Today's Orders */}
                    <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">Today's Orders</p>
                                <p className="text-3xl font-bold mt-1">{stats.todayOrders}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Month Revenue */}
                    <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-100 text-sm">This Month Revenue</p>
                                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.monthRevenue)}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Stats & Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Statistics */}
                    <div className="card">
                        <h3 className="font-semibold text-steel-900 mb-4">User Statistics</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-steel-600">Total Users</span>
                                <span className="font-semibold text-steel-900">{userStats.total}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-steel-600">Active Users</span>
                                <span className="font-semibold text-green-600">{userStats.active}</span>
                            </div>
                            <div className="border-t border-steel-200 pt-4 space-y-2">
                                {Object.entries(userStats.byRole || {}).map(([role, count]) => (
                                    <div key={role} className="flex items-center justify-between">
                                        <span className={`badge ${role === 'super_admin' ? 'badge-info' :
                                                role === 'admin' ? 'badge-success' : 'badge-warning'
                                            }`}>
                                            {role.replace('_', ' ')}
                                        </span>
                                        <span className="text-steel-700">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="card lg:col-span-2">
                        <h3 className="font-semibold text-steel-900 mb-4">Recent Orders</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-steel-200">
                                        <th className="table-header">Order #</th>
                                        <th className="table-header">Customer</th>
                                        <th className="table-header">Amount</th>
                                        <th className="table-header">Status</th>
                                        <th className="table-header">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentOrders?.map((order) => (
                                        <tr key={order._id} className="border-b border-steel-100 hover:bg-steel-50">
                                            <td className="table-cell font-medium">{order.orderNumber}</td>
                                            <td className="table-cell">{order.customer?.name}</td>
                                            <td className="table-cell">{formatCurrency(order.grandTotal)}</td>
                                            <td className="table-cell">
                                                <span className={`badge ${order.status === 'completed' ? 'badge-success' :
                                                        order.status === 'processing' ? 'badge-warning' :
                                                            order.status === 'confirmed' ? 'badge-info' : 'badge-danger'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="table-cell text-steel-500">{formatDate(order.createdAt)}</td>
                                        </tr>
                                    ))}
                                    {!stats.recentOrders?.length && (
                                        <tr>
                                            <td colSpan="5" className="table-cell text-center text-steel-500">No recent orders</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardView
