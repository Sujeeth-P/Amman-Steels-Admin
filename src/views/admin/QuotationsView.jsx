import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { quotationsAPI, usersAPI } from '../../services/api'
import useAuthStore from '../../stores/authStore'

const QuotationsView = () => {
    const navigate = useNavigate()
    const { userRole } = useAuthStore()
    const role = userRole()

    const [loading, setLoading] = useState(true)
    const [enquiries, setEnquiries] = useState([])
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
    const [stats, setStats] = useState({ total: 0, pending: 0, contacted: 0, converted: 0, today: 0, highPriority: 0 })
    const [filters, setFilters] = useState({ status: 'all', priority: 'all', search: '' })
    const [selectedEnquiry, setSelectedEnquiry] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [staffList, setStaffList] = useState([])
    const [originalStatus, setOriginalStatus] = useState(null)

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        contacted: 'bg-blue-100 text-blue-800',
        converted: 'bg-green-100 text-green-800',
        closed: 'bg-gray-100 text-gray-800'
    }

    const priorityColors = {
        low: 'bg-gray-100 text-gray-600',
        medium: 'bg-orange-100 text-orange-700',
        high: 'bg-red-100 text-red-700'
    }

    const sourceLabels = {
        cart: 'Quote Request',
        contact_form: 'Contact Form',
        product_page: 'Product Page'
    }

    useEffect(() => {
        loadEnquiries()
        loadStats()
        loadStaff()
    }, [filters, pagination.page])

    const loadEnquiries = async () => {
        try {
            setLoading(true)
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            }
            if (filters.status === 'all') delete params.status
            if (filters.priority === 'all') delete params.priority

            const res = await quotationsAPI.getAll(params)
            setEnquiries(res.data.data.enquiries)
            setPagination(res.data.data.pagination)
        } catch (err) {
            console.error('Failed to load quotation requests:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            const res = await quotationsAPI.getStats()
            setStats(res.data.data)
        } catch (err) {
            console.error('Failed to load stats:', err)
        }
    }

    const loadStaff = async () => {
        try {
            const res = await usersAPI.getStaffList()
            setStaffList(res.data.data.users || [])
        } catch (err) {
            console.error('Failed to load staff:', err)
        }
    }

    const handleViewEnquiry = async (enquiry) => {
        try {
            const res = await quotationsAPI.getById(enquiry._id)
            setSelectedEnquiry(res.data.data)
            setOriginalStatus(res.data.data.status)
            setShowModal(true)
        } catch (err) {
            console.error('Failed to load quotation details:', err)
        }
    }

    const handleUpdateEnquiry = async (updates) => {
        if (!selectedEnquiry) return
        try {
            setUpdating(true)
            await quotationsAPI.update(selectedEnquiry._id, updates)
            setShowModal(false)
            loadEnquiries()
            loadStats()
        } catch (err) {
            console.error('Failed to update quotation:', err)
            alert('Failed to update quotation request')
        } finally {
            setUpdating(false)
        }
    }

    const handleQuickStatusChange = async (enquiryId, newStatus) => {
        try {
            await quotationsAPI.update(enquiryId, { status: newStatus })
            loadEnquiries()
            loadStats()
        } catch (err) {
            console.error('Failed to update status:', err)
        }
    }

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amt || 0)

    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })

    const formatTime = (date) => new Date(date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    })

    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-steel-900">Quotation Requests</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="card p-4">
                    <p className="text-steel-500 text-xs">Total</p>
                    <p className="text-xl font-bold text-steel-900">{stats.total}</p>
                </div>
                <div className="card p-4 border-l-4 border-yellow-400">
                    <p className="text-steel-500 text-xs">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="card p-4 border-l-4 border-blue-400">
                    <p className="text-steel-500 text-xs">Contacted</p>
                    <p className="text-xl font-bold text-blue-600">{stats.contacted}</p>
                </div>
                <div className="card p-4 border-l-4 border-green-400">
                    <p className="text-steel-500 text-xs">Ordered</p>
                    <p className="text-xl font-bold text-green-600">{stats.converted}</p>
                </div>
                <div className="card p-4 border-l-4 border-red-400">
                    <p className="text-steel-500 text-xs">High Priority</p>
                    <p className="text-xl font-bold text-red-600">{stats.highPriority}</p>
                </div>
                <div className="card p-4 border-l-4 border-gray-400">
                    <p className="text-steel-500 text-xs">Closed</p>
                    <p className="text-xl font-bold text-gray-600">{stats.closed || 0}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Search by name, phone, email..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="input flex-1 min-w-[200px]"
                    />
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="input w-auto"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Ordered</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="input w-auto"
                    >
                        <option value="all">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <button
                        onClick={() => { setFilters({ status: 'all', priority: 'all', search: '' }); setPagination({ ...pagination, page: 1 }) }}
                        className="btn btn-outline"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Enquiries Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-steel-50">
                                    <tr>
                                        <th className="table-header">Quote #</th>
                                        <th className="table-header">Customer</th>
                                        <th className="table-header">Items</th>
                                        <th className="table-header">Est. Total</th>
                                        <th className="table-header">Source</th>
                                        <th className="table-header">Priority</th>
                                        <th className="table-header">Status</th>
                                        <th className="table-header">Date</th>
                                        <th className="table-header">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enquiries.map((enquiry) => (
                                        <tr key={enquiry._id} className="border-b border-steel-100 hover:bg-steel-50">
                                            <td className="table-cell font-medium text-primary-600">
                                                {enquiry.enquiryNumber}
                                            </td>
                                            <td className="table-cell">
                                                <div>
                                                    <p className="font-medium">{enquiry.customer?.name}</p>
                                                    <p className="text-xs text-steel-500">{enquiry.customer?.phone || enquiry.customer?.email}</p>
                                                </div>
                                            </td>
                                            <td className="table-cell">{enquiry.items?.length || 0} items</td>
                                            <td className="table-cell font-medium">{formatCurrency(enquiry.estimatedTotal)}</td>
                                            <td className="table-cell">
                                                <span className="text-xs text-steel-600">{sourceLabels[enquiry.source] || enquiry.source}</span>
                                            </td>
                                            <td className="table-cell">
                                                <span className={`badge ${priorityColors[enquiry.priority]}`}>
                                                    {enquiry.priority}
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <span className={`badge ${statusColors[enquiry.status]}`}>
                                                    {enquiry.status === 'converted' ? 'ordered' : enquiry.status}
                                                </span>
                                            </td>
                                            <td className="table-cell text-steel-500 text-sm">
                                                {formatDate(enquiry.createdAt)}
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex flex-col gap-2 items-stretch min-w-[140px]">
                                                    <button
                                                        onClick={() => handleViewEnquiry(enquiry)}
                                                        className="btn btn-outline py-2 px-4 text-sm font-semibold rounded-lg whitespace-nowrap text-center"
                                                    >
                                                        View
                                                    </button>
                                                    {(enquiry.status === 'pending' || enquiry.status === 'contacted') && (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const res = await quotationsAPI.getById(enquiry._id)
                                                                    navigate('/staff/billing', {
                                                                        state: {
                                                                            fromQuotation: true,
                                                                            quotationData: res.data.data,
                                                                            enquiryId: enquiry._id
                                                                        }
                                                                    })
                                                                } catch (err) {
                                                                    navigate('/staff/billing', {
                                                                        state: {
                                                                            fromQuotation: true,
                                                                            quotationData: enquiry,
                                                                            enquiryId: enquiry._id
                                                                        }
                                                                    })
                                                                }
                                                            }}
                                                            className="btn bg-green-600 hover:bg-green-700 text-white py-2 px-2 text-sm font-semibold rounded-lg whitespace-nowrap text-center"
                                                        >
                                                            Confirm Order
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {enquiries.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="table-cell text-center text-steel-500 py-8">
                                                No quotation requests found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-between items-center p-4 border-t border-steel-100">
                                <p className="text-sm text-steel-500">
                                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                        disabled={pagination.page === 1}
                                        className="btn btn-sm btn-outline"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                        disabled={pagination.page === pagination.pages}
                                        className="btn btn-sm btn-outline"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Detail Modal */}
            {showModal && selectedEnquiry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-steel-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-steel-900">{selectedEnquiry.enquiryNumber}</h2>
                                    <p className="text-steel-500 text-sm">
                                        {formatDate(selectedEnquiry.createdAt)} at {formatTime(selectedEnquiry.createdAt)}
                                    </p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-steel-400 hover:text-steel-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div>
                                <h3 className="font-semibold text-steel-900 mb-3">Customer Details</h3>
                                <div className="grid grid-cols-2 gap-4 bg-steel-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs text-steel-500">Name</p>
                                        <p className="font-medium">{selectedEnquiry.customer?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-steel-500">Phone</p>
                                        <p className="font-medium">{selectedEnquiry.customer?.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-steel-500">Email</p>
                                        <p className="font-medium">{selectedEnquiry.customer?.email || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-steel-500">Source</p>
                                        <p className="font-medium">{sourceLabels[selectedEnquiry.source]}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Products */}
                            {selectedEnquiry.items?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-steel-900 mb-3">Products ({selectedEnquiry.items.length})</h3>
                                    <div className="space-y-2">
                                        {selectedEnquiry.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-steel-50 p-3 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {item.image && (
                                                        <img src={item.image} alt={item.productName} className="w-10 h-10 object-cover rounded" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{item.productName}</p>
                                                        <p className="text-xs text-steel-500">Qty: {item.quantity} {item.unit}</p>
                                                    </div>
                                                </div>
                                                <p className="font-medium">{formatCurrency(item.unitPrice * item.quantity)}</p>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-2 border-t border-steel-200">
                                            <p className="font-semibold">Estimated Total</p>
                                            <p className="font-bold text-lg">{formatCurrency(selectedEnquiry.estimatedTotal)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Message */}
                            {selectedEnquiry.message && (
                                <div>
                                    <h3 className="font-semibold text-steel-900 mb-3">Customer Message</h3>
                                    <p className="bg-steel-50 p-4 rounded-lg text-steel-700">{selectedEnquiry.message}</p>
                                </div>
                            )}

                            {/* Status & Actions */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-steel-700 mb-2">Status</label>
                                    <select
                                        value={selectedEnquiry.status}
                                        onChange={(e) => setSelectedEnquiry({ ...selectedEnquiry, status: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="converted">Ordered</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-steel-700 mb-2">Priority</label>
                                    <select
                                        value={selectedEnquiry.priority}
                                        onChange={(e) => setSelectedEnquiry({ ...selectedEnquiry, priority: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-2">Quoted Amount</label>
                                <input
                                    type="number"
                                    value={selectedEnquiry.quotedAmount || ''}
                                    onChange={(e) => setSelectedEnquiry({ ...selectedEnquiry, quotedAmount: e.target.value })}
                                    className="input w-full"
                                    placeholder="Enter quoted amount"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-2">Admin Notes</label>
                                <textarea
                                    value={selectedEnquiry.adminNotes || ''}
                                    onChange={(e) => setSelectedEnquiry({ ...selectedEnquiry, adminNotes: e.target.value })}
                                    className="input w-full"
                                    rows="3"
                                    placeholder="Internal notes about this enquiry..."
                                ></textarea>
                            </div>

                            {/* Closing Remarks - visible when status is closed */}
                            {selectedEnquiry.status === 'closed' && (
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-2">
                                        Closing Remarks <span className="text-xs text-steel-500">(visible to customer)</span>
                                    </label>
                                    <textarea
                                        value={selectedEnquiry.closingRemarks || ''}
                                        onChange={(e) => setSelectedEnquiry({ ...selectedEnquiry, closingRemarks: e.target.value })}
                                        className="input w-full border-red-200 focus:border-red-400"
                                        rows="3"
                                        placeholder="Provide a reason for closing this enquiry (e.g., Out of stock, Customer cancelled, etc.)"
                                    ></textarea>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-steel-100">
                                {/* Already ordered — show confirmed badge */}
                                {originalStatus === 'converted' ? (
                                    <button
                                        disabled
                                        className="btn py-2 px-3 flex-1 text-center text-base font-semibold rounded-xl bg-gray-100 text-green-700 border-2 border-green-200 cursor-not-allowed"
                                    >
                                        ✅ Order Confirmed
                                    </button>
                                ) : selectedEnquiry.status === 'converted' ? (
                                    /* User just changed dropdown to Ordered — redirect to billing */
                                    <button
                                        onClick={() => {
                                            setShowModal(false)
                                            navigate('/staff/billing', {
                                                state: {
                                                    fromQuotation: true,
                                                    quotationData: selectedEnquiry,
                                                    enquiryId: selectedEnquiry._id
                                                }
                                            })
                                        }}
                                        className="btn py-2 px-3 flex-1 text-center text-base font-semibold rounded-xl bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        📋 Go to Billing
                                    </button>
                                ) : (
                                    /* Normal save changes */
                                    <button
                                        onClick={async () => {
                                            const updates = {
                                                status: selectedEnquiry.status,
                                                priority: selectedEnquiry.priority,
                                                quotedAmount: selectedEnquiry.quotedAmount,
                                                adminNotes: selectedEnquiry.adminNotes,
                                                closingRemarks: selectedEnquiry.closingRemarks
                                            }
                                            await handleUpdateEnquiry(updates)
                                        }}
                                        disabled={updating}
                                        className="btn py-2 px-3 flex-1 text-center text-base font-semibold rounded-xl btn-primary"
                                    >
                                        {updating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                )}

                                <button onClick={() => setShowModal(false)} className="btn btn-outline py-3 px-6 text-base font-semibold rounded-xl border-2">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default QuotationsView
