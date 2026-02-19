import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { reportsAPI } from '../../services/api'
import { generateFullReportPDF, generateSalesReportPDF } from '../../utils/reportPDF'

const ReportsView = () => {
    const [loading, setLoading] = useState(true)
    const [salesData, setSalesData] = useState({ chart: [], summary: {} })
    const [productData, setProductData] = useState({ topProducts: [], categoryStats: [] })
    const [analytics, setAnalytics] = useState(null)

    useEffect(() => {
        const loadReports = async () => {
            try {
                const [salesRes, prodRes, analyticsRes] = await Promise.all([
                    reportsAPI.getSales({ groupBy: 'day' }),
                    reportsAPI.getProducts(),
                    reportsAPI.getAnalytics()
                ])
                setSalesData(salesRes.data.data)
                setProductData(prodRes.data.data)
                setAnalytics(analyticsRes.data.data)
            } catch (err) {
                console.error('Failed to load reports:', err)
            } finally {
                setLoading(false)
            }
        }
        loadReports()
    }, [])

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amt || 0)

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
            generateSalesReportPDF(salesData, productData)
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

            <div className="space-y-6">
                {/* Revenue Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card">
                        <p className="text-steel-500 text-sm">Total Orders</p>
                        <p className="text-3xl font-bold text-steel-900 mt-1">{salesData.summary.totalOrders || 0}</p>
                    </div>
                    <div className="card">
                        <p className="text-steel-500 text-sm">Total Revenue</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(salesData.summary.totalRevenue)}</p>
                    </div>
                    <div className="card">
                        <p className="text-steel-500 text-sm">Amount Collected</p>
                        <p className="text-3xl font-bold text-primary-600 mt-1">{formatCurrency(salesData.summary.totalPaid)}</p>
                    </div>
                </div>

                {/* Sales Chart */}
                <div className="card">
                    <h3 className="font-semibold text-steel-900 mb-4">Daily Sales (Last 30 Days)</h3>
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
                            <div className="w-full text-center text-steel-500 py-8">No sales data available</div>
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card">
                        <h3 className="font-semibold text-steel-900 mb-4">Top Selling Products</h3>
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
                        <h3 className="font-semibold text-steel-900 mb-4">Stock Movement Summary (30 Days)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {analytics.stockMovements?.map((mov) => (
                                <div key={mov._id} className="p-4 bg-steel-50 rounded-lg text-center">
                                    <p className="text-steel-500 text-sm capitalize">{mov._id?.replace('_', ' ')}</p>
                                    <p className="text-2xl font-bold text-steel-900">{mov.count}</p>
                                    <p className="text-sm text-steel-600">{mov.totalQty} units</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ReportsView
