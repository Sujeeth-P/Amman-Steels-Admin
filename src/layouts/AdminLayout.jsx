import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

// Icons
const DashboardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
)

const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
)

const ChartIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
)

const BoxIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
)

const WarehouseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
)

const TrendingIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
)

const ReceiptIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
)

const OrdersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
)

const EnquiryIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const iconMap = {
    dashboard: DashboardIcon,
    users: UsersIcon,
    chart: ChartIcon,
    box: BoxIcon,
    warehouse: WarehouseIcon,
    trending: TrendingIcon,
    receipt: ReceiptIcon,
    orders: OrdersIcon,
    enquiry: EnquiryIcon
}

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const navigate = useNavigate()
    const location = useLocation()
    const { userRole, userName, logout } = useAuthStore()

    const role = userRole()

    // Build navigation items based on role
    const getNavItems = () => {
        const items = []

        if (role === 'super_admin') {
            items.push(
                { name: 'Dashboard', path: '/super-admin/dashboard', icon: 'dashboard' },
                { name: 'Users', path: '/super-admin/users', icon: 'users' },
                { name: 'Reports', path: '/super-admin/reports', icon: 'chart' }
            )
        }

        if (['super_admin', 'admin'].includes(role)) {
            if (role === 'admin') {
                items.push({ name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' })
            }
            items.push(
                { name: 'Products', path: '/admin/products', icon: 'box' },
                { name: 'Stock', path: '/admin/stock', icon: 'warehouse' },
                { name: 'Sales', path: '/admin/sales', icon: 'trending' }
            )
        }

        // All roles can access these - Staff handles quotations, Admin/SuperAdmin view results
        items.push(
            { name: 'Quotations', path: '/staff/quotations', icon: 'enquiry' },
            { name: 'Billing', path: '/staff/billing', icon: 'receipt' },
            { name: 'Orders', path: '/staff/orders', icon: 'orders' }
        )

        return items
    }

    const navItems = getNavItems()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'super_admin': return 'bg-purple-100 text-purple-800'
            case 'admin': return 'bg-blue-100 text-blue-800'
            case 'staff': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const formatRole = (role) => {
        return role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User'
    }

    return (
        <div className="min-h-screen bg-steel-100 flex">
            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full bg-white border-r border-steel-200 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-steel-200 px-4">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">SA</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-steel-900 text-sm">Sri Amman Steels</h1>
                                <p className="text-xs text-steel-500">Admin Panel</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">SA</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = iconMap[item.icon]
                        const isActive = location.pathname === item.path
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                            >
                                <Icon />
                                {sidebarOpen && <span>{item.name}</span>}
                            </NavLink>
                        )
                    })}
                </nav>

                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white border border-steel-200 rounded-full flex items-center justify-center hover:bg-steel-50 transition-colors"
                >
                    <svg className={`w-4 h-4 text-steel-600 ${!sidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-steel-200 flex items-center justify-between px-6 sticky top-0 z-30">
                    <div>
                        <h2 className="text-lg font-semibold text-steel-900">Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User Info */}
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-medium text-steel-900">{userName()}</p>
                                <span className={`badge text-xs ${getRoleBadgeClass(role)}`}>
                                    {formatRole(role)}
                                </span>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">{userName()?.charAt(0)?.toUpperCase()}</span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="p-2 text-steel-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AdminLayout
