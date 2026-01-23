import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

const UnauthorizedView = () => {
    const navigate = useNavigate()
    const { userRole } = useAuthStore()

    const goBack = () => {
        navigate(-1)
    }

    const goHome = () => {
        const role = userRole()
        switch (role) {
            case 'super_admin': navigate('/super-admin/dashboard'); break
            case 'admin': navigate('/admin/dashboard'); break
            case 'staff': navigate('/staff/billing'); break
            default: navigate('/login')
        }
    }

    return (
        <div className="min-h-screen bg-steel-100 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-steel-900 mb-2">Access Denied</h1>
                <p className="text-steel-600 mb-8">
                    You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={goBack} className="btn-secondary flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Go Back
                    </button>
                    <button onClick={goHome} className="btn-primary flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    )
}

export default UnauthorizedView
