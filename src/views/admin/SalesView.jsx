import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { reportsAPI } from '../../services/api'
import { generateSalesReportPDF } from '../../utils/reportPDF'

const SalesView = () => {
    const [loading, setLoading] = useState(true)
    const [filtering, setFiltering] = useState(false)
    const [salesData, setSalesData] = useState({ chart: [], summary: {} })
    const [productData, setProductData] = useState({ topProducts: [] })
    const [customerData, setCustomerData] = useState({ customers: [] })
    const [expandedCustomer, setExpandedCustomer] = useState(null)
    const [analytics, setAnalytics] = useState(null)

    // Date range state
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [appliedRange, setAppliedRange] = useState({ start: '', end: '' })

    const fetchData = async (dateParams = {}) => {
        try {
            const salesParams = { groupBy: 'day', ...dateParams }
            const [salesRes, prodRes, custRes, analyticsRes] = await Promise.all([
                reportsAPI.getSales(salesParams),
                reportsAPI.getProducts(dateParams),
                reportsAPI.getCustomers(dateParams),
                reportsAPI.getAnalytics(dateParams)
            ])
            setSalesData(salesRes.data.data)
            setProductData(prodRes.data.data)
            setCustomerData(custRes.data.data)
            setAnalytics(analyticsRes.data.data)
        } catch (err) {
            console.error('Failed to load sales:', err)
            toast.error('Failed to load sales data')
        }
    }

    useEffect(() => {
        const loadSales = async () => {
            await fetchData()
            setLoading(false)
        }
        loadSales()
    }, [])

    const handleApplyDateRange = async () => {
        if (!startDate && !endDate) {
            toast.error('Please select at least one date')
            return
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            toast.error('From date must be before To date')
            return
        }
        setFiltering(true)
        const dateParams = {}
        if (startDate) dateParams.startDate = startDate
        if (endDate) dateParams.endDate = endDate
        await fetchData(dateParams)
        setAppliedRange({ start: startDate, end: endDate })
        setFiltering(false)
        toast.success('Report filtered successfully!')
    }

    const handleClearDateRange = async () => {
        setStartDate('')
        setEndDate('')
        setAppliedRange({ start: '', end: '' })
        setFiltering(true)
        await fetchData()
        setFiltering(false)
        toast.success('Filter cleared — showing all data')
    }

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amt || 0)

    const formatDate = (date) => {
        if (!date) return '—'
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getDateRangeLabel = () => {
        if (appliedRange.start && appliedRange.end) {
            return `${formatDate(appliedRange.start)} – ${formatDate(appliedRange.end)}`
        } else if (appliedRange.start) {
            return `From ${formatDate(appliedRange.start)}`
        } else if (appliedRange.end) {
            return `Until ${formatDate(appliedRange.end)}`
        }
        return 'All Time'
    }

    if (loading) {
        return (
            <div className="animate-fadeIn">
                <h1 className="text-2xl font-bold text-steel-900 mb-6">Sales Report</h1>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        )
    }

    const maxRevenue = Math.max(...salesData.chart.map(d => d.revenue), 1)

    const handleDownloadPDF = () => {
        try {
            generateSalesReportPDF(salesData, productData, customerData, getDateRangeLabel(), analytics)
            toast.success('PDF report downloaded successfully!')
        } catch (err) {
            console.error('PDF generation failed:', err)
            toast.error('Failed to generate PDF report')
        }
    }

    const toggleCustomer = (customerName) => {
        setExpandedCustomer(expandedCustomer === customerName ? null : customerName)
    }

    // Quick preset date ranges
    const applyPreset = (days) => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - days)
        setStartDate(start.toISOString().split('T')[0])
        setEndDate(end.toISOString().split('T')[0])
    }

    return (
        <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-steel-900">Sales Report</h1>
                <button
                    onClick={handleDownloadPDF}
                    className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                </button>
            </div>

            {/* Date Range Filter */}
            <div className="card mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="font-semibold text-steel-900">Filter by Date Range</h3>
                    {appliedRange.start || appliedRange.end ? (
                        <span className="ml-2 px-2.5 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                            {getDateRangeLabel()}
                        </span>
                    ) : null}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 mb-3">
                    <button onClick={() => applyPreset(7)} className="px-3 py-1.5 text-xs font-medium bg-steel-100 text-steel-600 rounded-lg hover:bg-steel-200 transition-colors">Last 7 Days</button>
                    <button onClick={() => applyPreset(30)} className="px-3 py-1.5 text-xs font-medium bg-steel-100 text-steel-600 rounded-lg hover:bg-steel-200 transition-colors">Last 30 Days</button>
                    <button onClick={() => applyPreset(90)} className="px-3 py-1.5 text-xs font-medium bg-steel-100 text-steel-600 rounded-lg hover:bg-steel-200 transition-colors">Last 90 Days</button>
                    <button onClick={() => applyPreset(365)} className="px-3 py-1.5 text-xs font-medium bg-steel-100 text-steel-600 rounded-lg hover:bg-steel-200 transition-colors">Last 1 Year</button>
                </div>

                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-sm font-medium text-steel-600 mb-1">From Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-steel-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                        />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-sm font-medium text-steel-600 mb-1">To Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-steel-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleApplyDateRange}
                            disabled={filtering}
                            className="btn-primary flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-50"
                        >
                            {filtering ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            )}
                            Apply
                        </button>
                        {(appliedRange.start || appliedRange.end) && (
                            <button
                                onClick={handleClearDateRange}
                                disabled={filtering}
                                className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <p className="text-green-100 text-sm">Total Revenue</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(salesData.summary.totalRevenue)}</p>
                        <p className="text-green-200 text-xs mt-1">{getDateRangeLabel()}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <p className="text-blue-100 text-sm">Amount Collected</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(salesData.summary.totalPaid)}</p>
                        <p className="text-blue-200 text-xs mt-1">{getDateRangeLabel()}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                        <p className="text-amber-100 text-sm">Total Orders</p>
                        <p className="text-3xl font-bold mt-1">{salesData.summary.totalOrders || 0}</p>
                        <p className="text-amber-200 text-xs mt-1">{getDateRangeLabel()}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <p className="text-purple-100 text-sm">Total Customers</p>
                        <p className="text-3xl font-bold mt-1">{customerData.customers?.length || 0}</p>
                        <p className="text-purple-200 text-xs mt-1">{getDateRangeLabel()}</p>
                    </div>
                </div>

                {/* Chart */}
                <div className="card">
                    <h3 className="font-semibold text-steel-900 mb-4">
                        Daily Revenue
                        {(appliedRange.start || appliedRange.end) && (
                            <span className="ml-2 text-sm font-normal text-steel-500">({getDateRangeLabel()})</span>
                        )}
                    </h3>
                    <div className="h-64 flex items-end gap-1">
                        {salesData.chart.map((day) => (
                            <div
                                key={day._id}
                                className="flex-1 bg-primary-500 hover:bg-primary-600 transition-colors rounded-t cursor-pointer"
                                style={{ height: `${Math.max(10, (day.revenue / maxRevenue) * 100)}%` }}
                                title={`${day._id}: ${formatCurrency(day.revenue)}`}
                            ></div>
                        ))}
                        {!salesData.chart.length && (
                            <p className="w-full text-center text-steel-500 py-8">No data available for the selected range</p>
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="card">
                    <h3 className="font-semibold text-steel-900 mb-4">
                        Top Selling Products
                        {(appliedRange.start || appliedRange.end) && (
                            <span className="ml-2 text-sm font-normal text-steel-500">({getDateRangeLabel()})</span>
                        )}
                    </h3>
                    <div className="space-y-3">
                        {productData.topProducts?.slice(0, 10).map((prod, i) => (
                            <div key={prod._id} className="flex items-center justify-between p-3 bg-steel-50 rounded-lg hover:bg-steel-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                                        {i + 1}
                                    </span>
                                    <span className="font-medium text-steel-900">{prod._id}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-steel-900">{prod.totalSold} sold</p>
                                    <p className="text-sm text-steel-500">{formatCurrency(prod.revenue)}</p>
                                </div>
                            </div>
                        ))}
                        {!productData.topProducts?.length && (
                            <p className="text-center text-steel-500 py-4">No sales data for the selected range</p>
                        )}
                    </div>
                </div>

                {/* Customer Purchase Details */}
                <div className="card">
                    <h3 className="font-semibold text-steel-900 mb-4">
                        Customer Purchase Details
                        {(appliedRange.start || appliedRange.end) && (
                            <span className="ml-2 text-sm font-normal text-steel-500">({getDateRangeLabel()})</span>
                        )}
                    </h3>
                    <div className="space-y-3">
                        {customerData.customers?.map((customer) => (
                            <div key={customer._id} className="border border-steel-200 rounded-lg overflow-hidden">
                                {/* Customer Header - Clickable */}
                                <div
                                    className="flex items-center justify-between p-4 bg-steel-50 hover:bg-steel-100 transition-colors cursor-pointer"
                                    onClick={() => toggleCustomer(customer._id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                            {customer._id?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-steel-900">{customer._id || 'Unknown Customer'}</p>
                                            <div className="flex items-center gap-3 text-sm text-steel-500 mt-0.5">
                                                {customer.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        {customer.phone}
                                                    </span>
                                                )}
                                                {customer.email && (
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        {customer.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-semibold text-steel-900">{formatCurrency(customer.totalSpent)}</p>
                                            <p className="text-xs text-steel-500">{customer.totalOrders} order{customer.totalOrders !== 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-steel-400">Last Order</p>
                                            <p className="text-sm text-steel-600">{formatDate(customer.lastOrderDate)}</p>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-steel-400 transition-transform ${expandedCustomer === customer._id ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Expanded: Customer's Product Purchases */}
                                {expandedCustomer === customer._id && (
                                    <div className="p-4 bg-white border-t border-steel-200">
                                        {/* Customer Details */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-primary-50 rounded-lg text-sm">
                                            {customer.address && (
                                                <div>
                                                    <span className="text-steel-500 font-medium">Address: </span>
                                                    <span className="text-steel-700">{customer.address}</span>
                                                </div>
                                            )}
                                            {customer.gstin && (
                                                <div>
                                                    <span className="text-steel-500 font-medium">GSTIN: </span>
                                                    <span className="text-steel-700">{customer.gstin}</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-steel-500 font-medium">Total Spent: </span>
                                                <span className="text-steel-700 font-semibold">{formatCurrency(customer.totalSpent)}</span>
                                            </div>
                                        </div>

                                        {/* Products Table */}
                                        <h4 className="text-sm font-semibold text-steel-700 mb-2">Products Purchased</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-steel-100 text-steel-600">
                                                        <th className="text-left p-2.5 rounded-tl-lg font-semibold">Product</th>
                                                        <th className="text-center p-2.5 font-semibold">Qty</th>
                                                        <th className="text-right p-2.5 font-semibold">Unit Price</th>
                                                        <th className="text-right p-2.5 rounded-tr-lg font-semibold">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {customer.products?.map((prod, idx) => (
                                                        <tr key={idx} className={`border-b border-steel-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-steel-50'}`}>
                                                            <td className="p-2.5 text-steel-800">{prod.productName}</td>
                                                            <td className="p-2.5 text-center text-steel-700">{prod.quantity}</td>
                                                            <td className="p-2.5 text-right text-steel-700">{formatCurrency(prod.unitPrice)}</td>
                                                            <td className="p-2.5 text-right font-semibold text-steel-900">{formatCurrency(prod.totalAmount)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {!customerData.customers?.length && (
                            <p className="text-center text-steel-500 py-4">No customer data available for the selected range</p>
                        )}
                    </div>
                </div>

                {/* Stock Movements */}
                {analytics && (
                    <div className="card">
                        <h3 className="font-semibold text-steel-900 mb-4">
                            Stock Movement Summary
                            {(appliedRange.start || appliedRange.end) ? (
                                <span className="ml-2 text-sm font-normal text-steel-500">({getDateRangeLabel()})</span>
                            ) : (
                                <span className="ml-2 text-sm font-normal text-steel-500">(Last 30 Days)</span>
                            )}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {analytics.stockMovements?.map((mov) => (
                                <div key={mov._id} className="p-4 bg-steel-50 rounded-lg text-center">
                                    <p className="text-steel-500 text-sm capitalize">{mov._id?.replace('_', ' ')}</p>
                                    <p className="text-2xl font-bold text-steel-900">{mov.count}</p>
                                    <p className="text-sm text-steel-600">{mov.totalQty} units</p>
                                </div>
                            ))}
                            {!analytics.stockMovements?.length && (
                                <p className="col-span-4 text-center text-steel-500 py-4">No stock movements in this period</p>
                            )}
                        </div>

                        {/* Detailed Stock Movements Table */}
                        {analytics.stockMovementDetails?.length > 0 && (
                            <>
                                <h4 className="font-semibold text-steel-800 mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Detailed Stock Movements
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-steel-100 text-steel-600">
                                                <th className="text-left p-3 font-semibold rounded-tl-lg">Product</th>
                                                <th className="text-center p-3 font-semibold">Type</th>
                                                <th className="text-center p-3 font-semibold">Qty</th>
                                                <th className="text-center p-3 font-semibold">Stock Change</th>
                                                <th className="text-left p-3 font-semibold">Supplier / Notes</th>
                                                <th className="text-left p-3 font-semibold">Done By</th>
                                                <th className="text-right p-3 font-semibold rounded-tr-lg">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.stockMovementDetails.map((mov, idx) => {
                                                const typeColors = {
                                                    stock_in: 'bg-green-100 text-green-700',
                                                    stock_out: 'bg-red-100 text-red-700',
                                                    adjustment: 'bg-amber-100 text-amber-700',
                                                    return: 'bg-blue-100 text-blue-700',
                                                    damage: 'bg-rose-100 text-rose-700'
                                                }
                                                return (
                                                    <tr key={mov._id} className={`border-b border-steel-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-steel-50'}`}>
                                                        <td className="p-3 text-steel-900 font-medium">
                                                            {mov.product?.name || 'Unknown Product'}
                                                            {mov.product?.sku && (
                                                                <span className="block text-xs text-steel-400">{mov.product.sku}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeColors[mov.type] || 'bg-steel-100 text-steel-600'}`}>
                                                                {mov.type?.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center font-semibold text-steel-900">{mov.quantity}</td>
                                                        <td className="p-3 text-center text-steel-600">
                                                            <span className="text-steel-400">{mov.previousStock}</span>
                                                            <span className="mx-1">→</span>
                                                            <span className="font-medium text-steel-900">{mov.newStock}</span>
                                                        </td>
                                                        <td className="p-3 text-steel-600 max-w-[200px]">
                                                            {mov.supplier?.name && (
                                                                <span className="block text-steel-800 text-xs font-medium">{mov.supplier.name}</span>
                                                            )}
                                                            {mov.supplier?.invoiceNo && (
                                                                <span className="block text-xs text-steel-400">Inv: {mov.supplier.invoiceNo}</span>
                                                            )}
                                                            {mov.notes && (
                                                                <span className="block text-xs text-steel-500 truncate">{mov.notes}</span>
                                                            )}
                                                            {!mov.supplier?.name && !mov.notes && '—'}
                                                        </td>
                                                        <td className="p-3 text-steel-600 text-xs">
                                                            {mov.createdBy?.name || '—'}
                                                        </td>
                                                        <td className="p-3 text-right text-steel-600 text-xs whitespace-nowrap">
                                                            {new Date(mov.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            <span className="block text-steel-400">
                                                                {new Date(mov.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SalesView
