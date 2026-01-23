import { useState, useEffect } from 'react'
import { stockAPI, productsAPI } from '../../services/api'

const StockView = () => {
    const [loading, setLoading] = useState(true)
    const [movements, setMovements] = useState([])
    const [products, setProducts] = useState([])
    const [summary, setSummary] = useState({})
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState('in')
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        productId: '',
        quantity: 1,
        unitPrice: '',
        supplierName: '',
        invoiceNo: '',
        notes: '',
        type: 'adjustment'
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const [movRes, prodRes, sumRes] = await Promise.all([
                stockAPI.getMovements({ limit: 50 }),
                productsAPI.getAll({ limit: 100 }),
                stockAPI.getSummary()
            ])
            setMovements(movRes.data.data.movements)
            setProducts(prodRes.data.data.products)
            setSummary(sumRes.data.data)
        } catch (err) {
            console.error('Failed to load:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const openModal = (type) => {
        setModalType(type)
        setForm({ productId: '', quantity: 1, unitPrice: '', supplierName: '', invoiceNo: '', notes: '', type: 'adjustment' })
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            if (modalType === 'in') {
                await stockAPI.stockIn(form)
            } else if (modalType === 'out') {
                await stockAPI.stockOut(form)
            } else {
                await stockAPI.adjustment(form)
            }
            setShowModal(false)
            loadData()
        } catch (err) {
            console.error('Operation failed:', err)
        } finally {
            setSaving(false)
        }
    }

    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    })

    const getTypeClass = (type) => {
        switch (type) {
            case 'stock_in': return 'badge-success'
            case 'stock_out': return 'badge-danger'
            case 'return': return 'badge-info'
            default: return 'badge-warning'
        }
    }

    return (
        <div className="animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-steel-900">Stock Management</h1>
                <div className="flex gap-2">
                    <button onClick={() => openModal('in')} className="btn-primary flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Stock In
                    </button>
                    <button onClick={() => openModal('out')} className="btn-secondary flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                        Stock Out
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card">
                    <p className="text-steel-500 text-sm">Total Products</p>
                    <p className="text-2xl font-bold text-steel-900">{summary.totalProducts || 0}</p>
                </div>
                <div className="card">
                    <p className="text-steel-500 text-sm">In Stock</p>
                    <p className="text-2xl font-bold text-green-600">{summary.inStock || 0}</p>
                </div>
                <div className="card">
                    <p className="text-steel-500 text-sm">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">{summary.outOfStock || 0}</p>
                </div>
                <div className="card">
                    <p className="text-steel-500 text-sm">Low Stock</p>
                    <p className="text-2xl font-bold text-amber-600">{summary.lowStock || 0}</p>
                </div>
            </div>

            {/* Movements Table */}
            <div className="card">
                <h3 className="font-semibold text-steel-900 mb-4">Recent Stock Movements</h3>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-steel-50">
                                <tr>
                                    <th className="table-header">Product</th>
                                    <th className="table-header">Type</th>
                                    <th className="table-header">Qty</th>
                                    <th className="table-header">By</th>
                                    <th className="table-header">Date</th>
                                    <th className="table-header">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map((mov) => (
                                    <tr key={mov._id} className="border-b border-steel-100">
                                        <td className="table-cell font-medium">{mov.product?.name || 'N/A'}</td>
                                        <td className="table-cell">
                                            <span className={`badge ${getTypeClass(mov.type)}`}>
                                                {mov.type?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="table-cell">{mov.quantity}</td>
                                        <td className="table-cell text-steel-500">{mov.createdBy?.name || 'System'}</td>
                                        <td className="table-cell text-steel-500">{formatDate(mov.createdAt)}</td>
                                        <td className="table-cell text-steel-500 max-w-xs truncate">{mov.notes || '-'}</td>
                                    </tr>
                                ))}
                                {!movements.length && (
                                    <tr>
                                        <td colSpan="6" className="table-cell text-center text-steel-500">No movements recorded</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fadeIn">
                        <div className="p-6 border-b border-steel-200">
                            <h3 className="text-lg font-semibold">
                                {modalType === 'in' ? 'Stock In' : modalType === 'out' ? 'Stock Out' : 'Adjustment'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-1">Product</label>
                                <select
                                    value={form.productId}
                                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Select product...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-1">Quantity</label>
                                <input
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
                                    type="number"
                                    min="1"
                                    className="input-field"
                                    required
                                />
                            </div>
                            {modalType === 'in' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-steel-700 mb-1">Unit Price (₹)</label>
                                        <input
                                            value={form.unitPrice}
                                            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                                            type="number"
                                            min="0"
                                            className="input-field"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-steel-700 mb-1">Supplier</label>
                                            <input
                                                value={form.supplierName}
                                                onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                                                type="text"
                                                className="input-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-steel-700 mb-1">Invoice No</label>
                                            <input
                                                value={form.invoiceNo}
                                                onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                                                type="text"
                                                className="input-field"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            {modalType === 'adjustment' && (
                                <div>
                                    <label className="block text-sm font-medium text-steel-700 mb-1">Type</label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="adjustment">Adjustment</option>
                                        <option value="return">Return</option>
                                        <option value="damage">Damage</option>
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-1">Notes</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    rows="2"
                                    className="input-field"
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary flex-1">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StockView
