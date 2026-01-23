import { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'

const SalesView = () => {
    const [loading, setLoading] = useState(true)
    const [salesData, setSalesData] = useState({ chart: [], summary: {} })
    const [productData, setProductData] = useState({ topProducts: [] })

    useEffect(() => {
        const loadSales = async () => {
            try {
                const [salesRes, prodRes] = await Promise.all([
                    reportsAPI.getSales({ groupBy: 'day' }),
                    reportsAPI.getProducts()
                ])
                setSalesData(salesRes.data.data)
                setProductData(prodRes.data.data)
            } catch (err) {
                console.error('Failed to load sales:', err)
            } finally {
                setLoading(false)
            }
        }
        loadSales()
    }, [])

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amt || 0)

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

    return (
        <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-steel-900 mb-6">Sales Report</h1>

            <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <p className="text-green-100 text-sm">Total Revenue</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(salesData.summary.totalRevenue)}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <p className="text-blue-100 text-sm">Amount Collected</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(salesData.summary.totalPaid)}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                        <p className="text-amber-100 text-sm">Total Orders</p>
                        <p className="text-3xl font-bold mt-1">{salesData.summary.totalOrders || 0}</p>
                    </div>
                </div>

                {/* Chart */}
                <div className="card">
                    <h3 className="font-semibold text-steel-900 mb-4">Daily Revenue</h3>
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
                            <p className="w-full text-center text-steel-500 py-8">No data available</p>
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="card">
                    <h3 className="font-semibold text-steel-900 mb-4">Top Selling Products</h3>
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
                            <p className="text-center text-steel-500 py-4">No sales data</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SalesView
