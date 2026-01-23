import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/authStore'

// Layouts
import AdminLayout from './layouts/AdminLayout'

// Views
import LoginView from './views/LoginView'
import UnauthorizedView from './views/UnauthorizedView'

// Super Admin Views
import SuperAdminDashboard from './views/super-admin/DashboardView'
import UsersView from './views/super-admin/UsersView'
import ReportsView from './views/super-admin/ReportsView'

// Admin Views
import AdminDashboard from './views/admin/DashboardView'
import ProductsView from './views/admin/ProductsView'
import StockView from './views/admin/StockView'
import SalesView from './views/admin/SalesView'

// Staff Views
import BillingView from './views/staff/BillingView'
import OrdersView from './views/staff/OrdersView'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasRole } = useAuthStore()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

// Redirect based on role
const RoleBasedRedirect = () => {
  const { isAuthenticated, userRole } = useAuthStore()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  const role = userRole()
  switch (role) {
    case 'super_admin':
      return <Navigate to="/super-admin/dashboard" replace />
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />
    case 'staff':
      return <Navigate to="/staff/billing" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

// Guest Route (redirects authenticated users)
const GuestRoute = ({ children }) => {
  const { isAuthenticated, userRole } = useAuthStore()

  if (isAuthenticated()) {
    const role = userRole()
    switch (role) {
      case 'super_admin':
        return <Navigate to="/super-admin/dashboard" replace />
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />
      case 'staff':
        return <Navigate to="/staff/billing" replace />
      default:
        return children
    }
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Guest Routes */}
      <Route path="/login" element={
        <GuestRoute>
          <LoginView />
        </GuestRoute>
      } />

      <Route path="/unauthorized" element={<UnauthorizedView />} />

      {/* Super Admin Routes */}
      <Route path="/super-admin" element={
        <ProtectedRoute allowedRoles={['super_admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="users" element={<UsersView />} />
        <Route path="reports" element={<ReportsView />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<ProductsView />} />
        <Route path="stock" element={<StockView />} />
        <Route path="sales" element={<SalesView />} />
      </Route>

      {/* Staff Routes */}
      <Route path="/staff" element={
        <ProtectedRoute allowedRoles={['super_admin', 'admin', 'staff']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="billing" element={<BillingView />} />
        <Route path="orders" element={<OrdersView />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<RoleBasedRedirect />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
