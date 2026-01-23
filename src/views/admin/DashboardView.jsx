import { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'

const DashboardView = () => {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        todayOrders: 0,
        monthRevenue: 0,
        recentOrders: []
    })

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const res = await reportsAPI.getDashboard()
                setStats(res.data.data)
            } catch (err) {
                console.error('Failed to load dashboard:', err)
            } finally {
                setLoading(false)
            }
        }
        loadDashboard()
    }, [])

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amt || 0)

    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
    })

    if (loading) {
        return (
            <div className="animate-fadeIn">
                <h1 className="text-2xl font-bold text-steel-900 mb-6">Admin Dashboard</h1>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-steel-900 mb-6">Admin Dashboard</h1>

            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-steel-500 text-sm">Products</p>
                                <p className="text-2xl font-bold text-steel-900">{stats.totalProducts}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-steel-500 text-sm">Total Orders</p>
                                <p className="text-2xl font-bold text-steel-900">{stats.totalOrders}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-steel-500 text-sm">Today</p>
                                <p className="text-2xl font-bold text-steel-900">{stats.todayOrders}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-steel-500 text-sm">Revenue</p>
                                <p className="text-xl font-bold text-steel-900">{formatCurrency(stats.monthRevenue)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="card">
                    <h3 className="font-semibold text-steel-900 mb-4">Recent Orders</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-steel-50">
                                <tr>
                                    <th className="table-header">Order #</th>
                                    <th className="table-header">Customer</th>
                                    <th className="table-header">Amount</th>
                                    <th className="table-header">Status</th>
                                    <th className="table-header">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentOrders?.map((order) => (
                                    <tr key={order._id} className="border-b border-steel-100">
                                        <td className="table-cell font-medium">{order.orderNumber}</td>
                                        <td className="table-cell">{order.customer?.name}</td>
                                        <td className="table-cell">{formatCurrency(order.grandTotal)}</td>
                                        <td className="table-cell">
                                            <span className={`badge ${order.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="table-cell text-steel-500">{formatDate(order.createdAt)}</td>
                                    </tr>
                                ))}
                                {!stats.recentOrders?.length && (
                                    <tr>
                                        <td colSpan="5" className="table-cell text-center text-steel-500">No orders yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardView
