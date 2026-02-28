import { useState, useEffect } from 'react'
import { stockAPI, productsAPI } from '../../services/api'
import { FiPackage, FiPlus, FiMinus, FiSearch, FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiXCircle, FiEdit2, FiLoader, FiSave, FiX, FiBarChart2, FiList, FiBell, FiArrowDownCircle, FiArrowUpCircle, FiRefreshCw, FiBox } from 'react-icons/fi'

const StockView = () => {
    const [loading, setLoading] = useState(true)
    const [movements, setMovements] = useState([])
    const [products, setProducts] = useState([])
    const [stockLevels, setStockLevels] = useState([])
    const [summary, setSummary] = useState({})
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState('in')
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('levels') // 'levels' or 'movements'
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [editingProduct, setEditingProduct] = useState(null)
    const [editQuantity, setEditQuantity] = useState('')
    const [editThreshold, setEditThreshold] = useState('')
    const [alertLoading, setAlertLoading] = useState(false)
    const [notification, setNotification] = useState(null)

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
            const [movRes, prodRes, sumRes, levelsRes] = await Promise.all([
                stockAPI.getMovements({ limit: 50 }),
                productsAPI.getAll({ limit: 100 }),
                stockAPI.getSummary(),
                stockAPI.getStockLevels()
            ])
            setMovements(movRes.data.data.movements)
            setProducts(prodRes.data.data.products)
            setSummary(sumRes.data.data)
            setStockLevels(levelsRes.data.data.products)
        } catch (err) {
            console.error('Failed to load:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 4000)
    }

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
            showNotification(`Stock ${modalType} recorded successfully`)
            loadData()
        } catch (err) {
            showNotification(err.response?.data?.message || 'Operation failed', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleEditQuantity = (product) => {
        setEditingProduct(product)
        setEditQuantity(product.stockQuantity?.toString() || '0')
        setEditThreshold(product.lowStockThreshold?.toString() || '10')
    }

    const handleSaveQuantity = async () => {
        if (!editingProduct) return
        setSaving(true)
        try {
            await stockAPI.updateQuantity(editingProduct.id, {
                stockQuantity: parseInt(editQuantity),
                lowStockThreshold: parseInt(editThreshold)
            })
            showNotification(`Stock updated for ${editingProduct.name}`)
            setEditingProduct(null)
            loadData()
        } catch (err) {
            showNotification(err.response?.data?.message || 'Update failed', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleCheckAlerts = async () => {
        setAlertLoading(true)
        try {
            const res = await stockAPI.checkAlerts()
            showNotification(res.data.message)
        } catch (err) {
            showNotification('Failed to check alerts', 'error')
        } finally {
            setAlertLoading(false)
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

    const getStockStatus = (product) => {
        const qty = product.stockQuantity || 0
        const threshold = product.lowStockThreshold || 10
        if (qty === 0) return { label: 'Out of Stock', color: '#dc2626', bg: '#fef2f2', border: '#e2e8f0', accent: '#dc2626', icon: <FiXCircle size={13} /> }
        if (qty <= threshold) return { label: 'Low Stock', color: '#d97706', bg: '#fffbeb', border: '#e2e8f0', accent: '#d97706', icon: <FiAlertTriangle size={13} /> }
        return { label: 'Healthy', color: '#16a34a', bg: '#f0fdf4', border: '#e2e8f0', accent: '#16a34a', icon: <FiCheckCircle size={13} /> }
    }

    const getStockBarPercent = (product) => {
        const qty = product.stockQuantity || 0
        const threshold = product.lowStockThreshold || 10
        const maxDisplay = Math.max(threshold * 3, qty, 100)
        return Math.min((qty / maxDisplay) * 100, 100)
    }

    const getStockBarColor = (product) => {
        const status = getStockStatus(product)
        if (status.label === 'Out of Stock') return '#dc2626'
        if (status.label === 'Low Stock') return '#d97706'
        return '#16a34a'
    }

    const filteredStockLevels = stockLevels.filter(p => {
        const matchesSearch = !searchTerm ||
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        if (statusFilter === 'all') return true
        const status = getStockStatus(p)
        if (statusFilter === 'low') return status.label === 'Low Stock'
        if (statusFilter === 'out') return status.label === 'Out of Stock'
        if (statusFilter === 'healthy') return status.label === 'Healthy'
        return true
    })

    return (
        <div className="animate-fadeIn">
            {/* Notification */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    zIndex: 100,
                    padding: '14px 24px',
                    borderRadius: 12,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    background: notification.type === 'error'
                        ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                        : 'linear-gradient(135deg, #16a34a, #15803d)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {notification.type === 'error' ? <FiXCircle size={18} /> : <FiCheckCircle size={18} />}
                        {notification.message}
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-steel-900">Stock Management</h1>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={handleCheckAlerts}
                        disabled={alertLoading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: '1px solid #fde68a',
                            background: '#fffbeb',
                            color: '#92400e',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: alertLoading ? 'not-allowed' : 'pointer',
                            opacity: alertLoading ? 0.7 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {alertLoading ? <FiLoader size={14} className="animate-spin" /> : <FiBell size={14} />} {alertLoading ? 'Checking...' : 'Check Low Stock Alerts'}
                    </button>
                    <button onClick={() => openModal('in')} className="btn-primary flex items-center gap-2">
                        <FiArrowDownCircle size={18} />
                        Stock In
                    </button>
                    <button onClick={() => openModal('out')} className="btn-secondary flex items-center gap-2">
                        <FiArrowUpCircle size={18} />
                        Stock Out
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '18px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{ background: '#eff6ff', borderRadius: 10, padding: 10, display: 'flex' }}>
                        <FiPackage size={22} color="#3b82f6" />
                    </div>
                    <div>
                        <p style={{ color: '#64748b', fontSize: 12, fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Products</p>
                        <p style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{summary.totalProducts || 0}</p>
                    </div>
                </div>
                <div style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '18px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 10, display: 'flex' }}>
                        <FiCheckCircle size={22} color="#16a34a" />
                    </div>
                    <div>
                        <p style={{ color: '#64748b', fontSize: 12, fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Stock</p>
                        <p style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{summary.inStock || 0}</p>
                    </div>
                </div>
                <div style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '18px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{ background: '#fef2f2', borderRadius: 10, padding: 10, display: 'flex' }}>
                        <FiXCircle size={22} color="#dc2626" />
                    </div>
                    <div>
                        <p style={{ color: '#64748b', fontSize: 12, fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Out of Stock</p>
                        <p style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{summary.outOfStock || 0}</p>
                    </div>
                </div>
                <div style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '18px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{ background: '#fffbeb', borderRadius: 10, padding: 10, display: 'flex' }}>
                        <FiAlertTriangle size={22} color="#d97706" />
                    </div>
                    <div>
                        <p style={{ color: '#64748b', fontSize: 12, fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Low Stock</p>
                        <p style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{summary.lowStock || 0}</p>
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div style={{
                display: 'flex',
                gap: 4,
                background: '#f1f5f9',
                borderRadius: 12,
                padding: 4,
                marginBottom: 20,
                width: 'fit-content'
            }}>
                <button
                    onClick={() => setActiveTab('levels')}
                    style={{
                        padding: '10px 24px',
                        borderRadius: 10,
                        border: 'none',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: activeTab === 'levels' ? '#fff' : 'transparent',
                        color: activeTab === 'levels' ? '#1e293b' : '#64748b',
                        boxShadow: activeTab === 'levels' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                    }}
                >
                    <FiBarChart2 size={16} style={{ marginRight: 6 }} /> Stock Levels
                </button>
                <button
                    onClick={() => setActiveTab('movements')}
                    style={{
                        padding: '10px 24px',
                        borderRadius: 10,
                        border: 'none',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: activeTab === 'movements' ? '#fff' : 'transparent',
                        color: activeTab === 'movements' ? '#1e293b' : '#64748b',
                        boxShadow: activeTab === 'movements' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                    }}
                >
                    <FiList size={16} style={{ marginRight: 6 }} /> Movement History
                </button>
            </div>

            {/* Stock Levels Tab */}
            {activeTab === 'levels' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Filters Bar */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        padding: '16px 20px',
                        borderBottom: '1px solid #e2e8f0',
                        alignItems: 'center',
                        background: '#f8fafc'
                    }}>
                        <div style={{ position: 'relative', flex: '1 1 250px' }}>
                            <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 36px',
                                    borderRadius: 8,
                                    border: '1px solid #e2e8f0',
                                    fontSize: 13,
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {[
                                { id: 'all', label: 'All', icon: <FiPackage size={13} /> },
                                { id: 'healthy', label: 'Healthy', icon: <FiCheckCircle size={13} /> },
                                { id: 'low', label: 'Low Stock', icon: <FiAlertTriangle size={13} /> },
                                { id: 'out', label: 'Out of Stock', icon: <FiXCircle size={13} /> }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setStatusFilter(f.id)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 20,
                                        border: statusFilter === f.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                        background: statusFilter === f.id ? '#eff6ff' : '#fff',
                                        color: statusFilter === f.id ? '#1d4ed8' : '#64748b',
                                        fontWeight: 600,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{f.icon} {f.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stock Levels Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <FiLoader className="w-6 h-6 text-primary-600 animate-spin" />
                        </div>
                    ) : (
                        <div style={{ padding: 20 }}>
                            {filteredStockLevels.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                    <FiBox size={48} style={{ marginBottom: 8, color: '#cbd5e1' }} />
                                    <p style={{ fontWeight: 600 }}>No products match your filter</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                                    {filteredStockLevels.map((product) => {
                                        const status = getStockStatus(product)
                                        const barPercent = getStockBarPercent(product)
                                        const barColor = getStockBarColor(product)
                                        const isEditing = editingProduct?.id === product.id

                                        return (
                                            <div key={product.id || product._id} style={{
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 12,
                                                background: '#fff',
                                                overflow: 'hidden',
                                                transition: 'all 0.3s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                            }}>
                                                {/* Card Header */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    padding: '14px 16px',
                                                    borderBottom: '1px solid #f1f5f9'
                                                }}>
                                                    <div style={{
                                                        width: 44,
                                                        height: 44,
                                                        borderRadius: 10,
                                                        overflow: 'hidden',
                                                        flexShrink: 0,
                                                        border: '1px solid #e2e8f0'
                                                    }}>
                                                        <img
                                                            src={product.image || 'https://via.placeholder.com/44'}
                                                            alt={product.name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/44' }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h4 style={{
                                                            margin: 0,
                                                            fontSize: 14,
                                                            fontWeight: 700,
                                                            color: '#1e293b',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {product.name}
                                                        </h4>
                                                        <span style={{
                                                            fontSize: 11,
                                                            color: '#94a3b8',
                                                            textTransform: 'capitalize'
                                                        }}>
                                                            {product.category} · {product.id}
                                                        </span>
                                                    </div>
                                                    <span style={{
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        padding: '4px 10px',
                                                        borderRadius: 6,
                                                        color: status.color,
                                                        background: status.bg,
                                                        whiteSpace: 'nowrap',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4
                                                    }}>
                                                        {status.icon} {status.label}
                                                    </span>
                                                </div>

                                                {/* Card Body */}
                                                <div style={{ padding: 16 }}>
                                                    {/* Stock Bar */}
                                                    <div style={{ marginBottom: 14 }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            marginBottom: 6,
                                                            fontSize: 12
                                                        }}>
                                                            <span style={{ color: '#64748b', fontWeight: 500 }}>Stock Level</span>
                                                            <span style={{ fontWeight: 700, color: status.color }}>
                                                                {product.stockQuantity || 0} {product.unit}
                                                            </span>
                                                        </div>
                                                        <div style={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            background: '#f1f5f9',
                                                            overflow: 'hidden',
                                                            position: 'relative'
                                                        }}>
                                                            <div style={{
                                                                height: '100%',
                                                                width: `${barPercent}%`,
                                                                borderRadius: 4,
                                                                background: barColor,
                                                                transition: 'width 0.5s ease'
                                                            }} />
                                                            {/* Threshold line */}
                                                            {product.lowStockThreshold > 0 && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    left: `${Math.min((product.lowStockThreshold / Math.max(product.lowStockThreshold * 3, product.stockQuantity || 0, 100)) * 100, 100)}%`,
                                                                    top: -2,
                                                                    bottom: -2,
                                                                    width: 2,
                                                                    background: '#f59e0b',
                                                                    borderRadius: 1
                                                                }} title={`Alert threshold: ${product.lowStockThreshold}`} />
                                                            )}
                                                        </div>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            marginTop: 4,
                                                            fontSize: 10,
                                                            color: '#94a3b8'
                                                        }}>
                                                            <span>0</span>
                                                            <span>Alert at {product.lowStockThreshold || 10}</span>
                                                        </div>
                                                    </div>

                                                    {/* Edit Section */}
                                                    {isEditing ? (
                                                        <div style={{
                                                            background: '#f8fafc',
                                                            borderRadius: 10,
                                                            padding: 12,
                                                            border: '1px solid #e2e8f0'
                                                        }}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                                                <div>
                                                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>
                                                                        Quantity
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={editQuantity}
                                                                        onChange={(e) => setEditQuantity(e.target.value)}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '7px 10px',
                                                                            borderRadius: 6,
                                                                            border: '1px solid #cbd5e1',
                                                                            fontSize: 13,
                                                                            fontWeight: 600,
                                                                            outline: 'none'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>
                                                                        Alert Threshold
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={editThreshold}
                                                                        onChange={(e) => setEditThreshold(e.target.value)}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '7px 10px',
                                                                            borderRadius: 6,
                                                                            border: '1px solid #cbd5e1',
                                                                            fontSize: 13,
                                                                            fontWeight: 600,
                                                                            outline: 'none'
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 6 }}>
                                                                <button
                                                                    onClick={handleSaveQuantity}
                                                                    disabled={saving}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '7px 0',
                                                                        borderRadius: 6,
                                                                        border: 'none',
                                                                        background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                                                        color: '#fff',
                                                                        fontWeight: 600,
                                                                        fontSize: 12,
                                                                        cursor: saving ? 'not-allowed' : 'pointer'
                                                                    }}
                                                                >
                                                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>{saving ? <><FiLoader size={13} className="animate-spin" /> Saving...</> : <><FiSave size={13} /> Save</>}</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingProduct(null)}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '7px 0',
                                                                        borderRadius: 6,
                                                                        border: '1px solid #e2e8f0',
                                                                        background: '#fff',
                                                                        color: '#64748b',
                                                                        fontWeight: 600,
                                                                        fontSize: 12,
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEditQuantity(product)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px 0',
                                                                borderRadius: 8,
                                                                border: '1px solid #e2e8f0',
                                                                background: '#fff',
                                                                color: '#475569',
                                                                fontWeight: 600,
                                                                fontSize: 12,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: 6,
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = '#f8fafc'
                                                                e.currentTarget.style.borderColor = '#3b82f6'
                                                                e.currentTarget.style.color = '#1d4ed8'
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = '#fff'
                                                                e.currentTarget.style.borderColor = '#e2e8f0'
                                                                e.currentTarget.style.color = '#475569'
                                                            }}
                                                        >
                                                            <FiEdit2 size={13} /> Edit Stock
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Movements Tab */}
            {activeTab === 'movements' && (
                <div className="card">
                    <h3 className="font-semibold text-steel-900 mb-4 flex items-center gap-2"><FiList className="text-primary-600" size={18} /> Recent Stock Movements</h3>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <FiLoader className="w-6 h-6 text-primary-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-steel-50">
                                    <tr>
                                        <th className="table-header">Product</th>
                                        <th className="table-header">Type</th>
                                        <th className="table-header">Qty</th>
                                        <th className="table-header">Previous</th>
                                        <th className="table-header">New</th>
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
                                            <td className="table-cell" style={{ fontWeight: 700 }}>{mov.quantity}</td>
                                            <td className="table-cell text-steel-500">{mov.previousStock}</td>
                                            <td className="table-cell" style={{
                                                fontWeight: 600,
                                                color: mov.newStock <= 0 ? '#dc2626' : mov.newStock <= 10 ? '#d97706' : '#16a34a'
                                            }}>
                                                {mov.newStock}
                                            </td>
                                            <td className="table-cell text-steel-500">{mov.createdBy?.name || 'System'}</td>
                                            <td className="table-cell text-steel-500">{formatDate(mov.createdAt)}</td>
                                            <td className="table-cell text-steel-500 max-w-xs truncate">{mov.notes || '-'}</td>
                                        </tr>
                                    ))}
                                    {!movements.length && (
                                        <tr>
                                            <td colSpan="8" className="table-cell text-center text-steel-500">No movements recorded</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Stock In/Out Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fadeIn">
                        <div className="p-6 border-b border-steel-200">
                            <h3 className="text-lg font-semibold">
                                <span className="flex items-center gap-2">{modalType === 'in' ? <><FiArrowDownCircle size={20} /> Stock In</> : modalType === 'out' ? <><FiArrowUpCircle size={20} /> Stock Out</> : <><FiRefreshCw size={20} /> Adjustment</>}</span>
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
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.id}) — Stock: {p.stockQuantity || 0}
                                        </option>
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
                                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    {saving ? <><FiLoader size={16} className="animate-spin" /> Saving...</> : <><FiSave size={16} /> Save</>}
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
