# Sri Amman Steels Admin Panel - React

This is the React version of the Admin Panel, converted from Vue.js.

## Tech Stack

- **React 18** - UI Framework
- **React Router v6** - Client-side routing
- **Zustand** - State management (replacing Pinia)
- **Axios** - HTTP client
- **TailwindCSS 3** - Styling
- **Vite** - Build tool

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app runs on `http://localhost:5174` by default.

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── layouts/
│   └── AdminLayout.jsx      # Main layout with sidebar navigation
├── services/
│   └── api.js               # API service with all endpoints
├── stores/
│   └── authStore.js         # Zustand store for authentication
├── views/
│   ├── LoginView.jsx        # Login page
│   ├── UnauthorizedView.jsx # Access denied page
│   ├── admin/
│   │   ├── DashboardView.jsx
│   │   ├── ProductsView.jsx
│   │   ├── SalesView.jsx
│   │   └── StockView.jsx
│   ├── staff/
│   │   ├── BillingView.jsx
│   │   └── OrdersView.jsx
│   └── super-admin/
│       ├── DashboardView.jsx
│       ├── ReportsView.jsx
│       └── UsersView.jsx
├── App.jsx                  # Main app with routing
├── main.jsx                 # Entry point
└── index.css                # Global styles
```

## Features

### Authentication
- Role-based access control (Super Admin, Admin, Staff)
- Protected routes with automatic redirects
- Persistent login with localStorage

### Super Admin Features
- Dashboard with comprehensive statistics
- User management (CRUD)
- Reports and analytics

### Admin Features
- Dashboard with order statistics
- Product management with image upload
- Stock management (stock in/out)
- Sales reports

### Staff Features
- Billing/POS system
- Order viewing and invoice generation

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@sriamman.com | Admin@123 |
| Admin | admin@sriamman.com | Admin@123 |
| Staff | staff@sriamman.com | Staff@123 |

## API Configuration

The app is configured to proxy API requests to `http://localhost:5000`. Make sure the backend server is running.

## Migration Notes (Vue → React)

1. **State Management**: Pinia stores → Zustand stores
2. **Routing**: Vue Router → React Router v6
3. **Components**: Vue SFC → React functional components with hooks
4. **Reactivity**: Vue refs/reactive → useState/useEffect hooks
5. **Computed Properties**: Vue computed → useMemo hooks
6. **Template Directives**: v-if/v-for/v-model → JSX conditionals/map/controlled inputs
