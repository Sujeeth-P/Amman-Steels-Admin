import { useState, useEffect } from 'react'
import { ordersAPI } from '../../services/api'

const OrdersView = () => {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState([])
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [selectedOrder, setSelectedOrder] = useState(null)

    const loadOrders = async () => {
        setLoading(true)
        try {
            const res = await ordersAPI.getAll({
                page: pagination.page,
                limit: pagination.limit,
                search,
                status: statusFilter
            })
            setOrders(res.data.data.orders)
            setPagination(res.data.data.pagination)
        } catch (err) {
            console.error('Failed to load orders:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadOrders()
    }, [pagination.page, search, statusFilter])

    const viewOrder = async (order) => {
        try {
            const res = await ordersAPI.getById(order._id)
            setSelectedOrder(res.data.data)
        } catch (err) {
            console.error('Failed to load order:', err)
        }
    }

    const generateInvoice = async (order) => {
        try {
            await ordersAPI.generateInvoice(order._id)
            loadOrders()
            if (selectedOrder?._id === order._id) {
                viewOrder(order)
            }
        } catch (err) {
            console.error('Failed to generate invoice:', err)
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const getStatusClass = (status) => {
        switch (status) {
            case 'completed': return 'badge-success'
            case 'confirmed': case 'processing': return 'badge-info'
            case 'cancelled': return 'badge-danger'
            default: return 'badge-warning'
        }
    }

    const getPaymentClass = (status) => {
        switch (status) {
            case 'paid': return 'badge-success'
            case 'partial': return 'badge-warning'
            default: return 'badge-danger'
        }
    }

    return (
        <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-steel-900 mb-6">Orders</h1>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        type="text"
                        placeholder="Search by order #, customer..."
                        className="input-field flex-1"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input-field sm:w-48"
                    >
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-steel-50">
                                <tr>
                                    <th className="table-header">Order #</th>
                                    <th className="table-header">Customer</th>
                                    <th className="table-header">Items</th>
                                    <th className="table-header">Total</th>
                                    <th className="table-header">Payment</th>
                                    <th className="table-header">Status</th>
                                    <th className="table-header">Date</th>
                                    <th className="table-header">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order._id} className="border-b border-steel-100 hover:bg-steel-50">
                                        <td className="table-cell font-medium">{order.orderNumber}</td>
                                        <td className="table-cell">
                                            <div>
                                                <p className="font-medium">{order.customer?.name}</p>
                                                <p className="text-xs text-steel-500">{order.customer?.phone}</p>
                                            </div>
                                        </td>
                                        <td className="table-cell">{order.items?.length || 0} items</td>
                                        <td className="table-cell font-semibold">{formatCurrency(order.grandTotal)}</td>
                                        <td className="table-cell">
                                            <span className={`badge ${getPaymentClass(order.paymentStatus)}`}>
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <span className={`badge ${getStatusClass(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="table-cell text-steel-500 text-sm">{formatDate(order.createdAt)}</td>
                                        <td className="table-cell">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => viewOrder(order)}
                                                    className="p-1.5 text-steel-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                                                    title="View"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                {!order.invoiceNumber && order.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => generateInvoice(order)}
                                                        className="p-1.5 text-steel-600 hover:text-green-600 hover:bg-green-50 rounded"
                                                        title="Generate Invoice"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!orders.length && (
                                    <tr>
                                        <td colSpan="8" className="table-cell text-center text-steel-500">No orders found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-steel-200">
                        <span className="text-sm text-steel-600">Page {pagination.page} of {pagination.pages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                disabled={pagination.page === 1}
                                className="btn-secondary text-sm"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                disabled={pagination.page >= pagination.pages}
                                className="btn-secondary text-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
                        <div className="p-6 border-b border-steel-200 flex items-center justify-between sticky top-0 bg-white">
                            <div>
                                <h3 className="text-lg font-semibold">Order {selectedOrder.orderNumber}</h3>
                                {selectedOrder.invoiceNumber && (
                                    <p className="text-sm text-green-600">Invoice: {selectedOrder.invoiceNumber}</p>
                                )}
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-steel-100 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Customer */}
                            <div>
                                <h4 className="font-medium text-steel-700 mb-2">Customer</h4>
                                <div className="bg-steel-50 p-4 rounded-lg">
                                    <p className="font-semibold">{selectedOrder.customer?.name}</p>
                                    {selectedOrder.customer?.phone && (
                                        <p className="text-sm text-steel-600">{selectedOrder.customer.phone}</p>
                                    )}
                                    {selectedOrder.customer?.address && (
                                        <p className="text-sm text-steel-600">{selectedOrder.customer.address}</p>
                                    )}
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h4 className="font-medium text-steel-700 mb-2">Items</h4>
                                <div className="bg-steel-50 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-steel-200">
                                                <th className="px-4 py-2 text-left text-xs font-medium text-steel-500">Product</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-steel-500">Qty</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-steel-500">Price</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-steel-500">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items?.map((item) => (
                                                <tr key={item._id} className="border-b border-steel-200">
                                                    <td className="px-4 py-2 text-sm">{item.productName}</td>
                                                    <td className="px-4 py-2 text-sm text-center">{item.quantity} {item.unit}</td>
                                                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.totalAmount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-steel-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>GST</span>
                                    <span>{formatCurrency(selectedOrder.totalGst)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t border-steel-200 pt-2">
                                    <span>Grand Total</span>
                                    <span className="text-primary-600">{formatCurrency(selectedOrder.grandTotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Paid</span>
                                    <span className="text-green-600">{formatCurrency(selectedOrder.amountPaid)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Due</span>
                                    <span className="text-red-600">{formatCurrency(selectedOrder.amountDue)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OrdersView
