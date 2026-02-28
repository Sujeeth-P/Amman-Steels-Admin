import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { reportsAPI } from '../../services/api'
import { generateFullReportPDF, generateSalesReportPDF } from '../../utils/reportPDF'

const ReportsView = () => {
    const [loading, setLoading] = useState(true)
    const [filtering, setFiltering] = useState(false)
    const [salesData, setSalesData] = useState({ chart: [], summary: {} })
    const [productData, setProductData] = useState({ topProducts: [], categoryStats: [] })
    const [analytics, setAnalytics] = useState(null)

    // Date range state
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [appliedRange, setAppliedRange] = useState({ start: '', end: '' })

    const fetchData = async (dateParams = {}) => {
        try {
            const salesParams = { groupBy: 'day', ...dateParams }
            const [salesRes, prodRes, analyticsRes] = await Promise.all([
                reportsAPI.getSales(salesParams),
                reportsAPI.getProducts(dateParams),
                reportsAPI.getAnalytics(dateParams)
            ])
            setSalesData(salesRes.data.data)
            setProductData(prodRes.data.data)
            setAnalytics(analyticsRes.data.data)
        } catch (err) {
            console.error('Failed to load reports:', err)
            toast.error('Failed to load report data')
        }
    }

    useEffect(() => {
        const loadReports = async () => {
            await fetchData()
            setLoading(false)
        }
        loadReports()
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

    // Quick preset date ranges
    const applyPreset = (days) => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - days)
        setStartDate(start.toISOString().split('T')[0])
        setEndDate(end.toISOString().split('T')[0])
    }

    if (loading) {
        return (
            <div className="animate-fadeIn">
                <h1 className="text-2xl font-bold text-steel-900 mb-6">Reports & Analytics</h1>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        )
    }

    const maxRevenue = Math.max(...salesData.chart.map(d => d.revenue), 1)

    const handleDownloadFullPDF = () => {
        try {
            generateFullReportPDF(salesData, productData, analytics)
            toast.success('Full report downloaded successfully!')
        } catch (err) {
            console.error('PDF generation failed:', err)
            toast.error('Failed to generate PDF report')
        }
    }

    const handleDownloadSalesPDF = () => {
        try {
            generateSalesReportPDF(salesData, productData, {}, getDateRangeLabel(), analytics)
            toast.success('Sales report downloaded successfully!')
        } catch (err) {
            console.error('PDF generation failed:', err)
            toast.error('Failed to generate PDF report')
        }
    }

    return (
        <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-steel-900">Reports & Analytics</h1>
                <div className="flex gap-3">
                    {/* <button
                        onClick={handleDownloadSalesPDF}
                        className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Sales Report
                    </button> */}
                    <button
                        onClick={handleDownloadFullPDF}
                        className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Full Report
                    </button>
                </div>
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
                {/* Revenue Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card">
                        <p className="text-steel-500 text-sm">Total Orders</p>
                        <p className="text-3xl font-bold text-steel-900 mt-1">{salesData.summary.totalOrders || 0}</p>
                        <p className="text-steel-400 text-xs mt-1">{getDateRangeLabel()}</p>
                    </div>
                    <div className="card">
                        <p className="text-steel-500 text-sm">Total Revenue</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(salesData.summary.totalRevenue)}</p>
                        <p className="text-steel-400 text-xs mt-1">{getDateRangeLabel()}</p>
                    </div>
                    <div className="card">
                        <p className="text-steel-500 text-sm">Amount Collected</p>
                        <p className="text-3xl font-bold text-primary-600 mt-1">{formatCurrency(salesData.summary.totalPaid)}</p>
                        <p className="text-steel-400 text-xs mt-1">{getDateRangeLabel()}</p>
                    </div>
                </div>

                {/* Sales Chart */}
                <div className="card">
                    <h3 className="font-semibold text-steel-900 mb-4">
                        Daily Sales
                        {(appliedRange.start || appliedRange.end) ? (
                            <span className="ml-2 text-sm font-normal text-steel-500">({getDateRangeLabel()})</span>
                        ) : (
                            <span className="ml-2 text-sm font-normal text-steel-500">(Last 30 Days)</span>
                        )}
                    </h3>
                    <div className="h-64 flex items-end gap-1">
                        {salesData.chart.map((day) => (
                            <div
                                key={day._id}
                                className="flex-1 bg-primary-100 hover:bg-primary-200 transition-colors rounded-t"
                                style={{ height: `${Math.max(10, (day.revenue / maxRevenue) * 100)}%` }}
                                title={`${day._id}: ${formatCurrency(day.revenue)}`}
                            ></div>
                        ))}
                        {!salesData.chart.length && (
                            <div className="w-full text-center text-steel-500 py-8">No sales data available for the selected range</div>
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card">
                        <h3 className="font-semibold text-steel-900 mb-4">
                            Top Selling Products
                            {(appliedRange.start || appliedRange.end) && (
                                <span className="ml-2 text-sm font-normal text-steel-500">({getDateRangeLabel()})</span>
                            )}
                        </h3>
                        <div className="space-y-3">
                            {productData.topProducts?.map((prod, i) => (
                                <div key={prod._id} className="flex items-center justify-between p-3 bg-steel-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
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
                                <p className="text-center text-steel-500 py-4">No data available</p>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="font-semibold text-steel-900 mb-4">Products by Category</h3>
                        <div className="space-y-3">
                            {productData.categoryStats?.map((cat) => (
                                <div key={cat._id} className="flex items-center justify-between p-3 bg-steel-50 rounded-lg">
                                    <span className="font-medium text-steel-900 capitalize">{cat._id}</span>
                                    <span className="badge badge-info">{cat.count} products</span>
                                </div>
                            ))}
                            {!productData.categoryStats?.length && (
                                <p className="text-center text-steel-500 py-4">No categories</p>
                            )}
                        </div>
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

export default ReportsView
