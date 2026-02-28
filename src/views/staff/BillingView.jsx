import { useState, useEffect, useMemo } from 'react'
import { productsAPI, ordersAPI } from '../../services/api'

const BillingView = () => {
    const [products, setProducts] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const [cart, setCart] = useState([])
    const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '', gstin: '' })
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [amountPaid, setAmountPaid] = useState('')

    // Field-level validation errors
    const [fieldErrors, setFieldErrors] = useState({})
    const [touched, setTouched] = useState({})

    const loadProducts = async () => {
        try {
            const res = await productsAPI.getAll({ limit: 100 })
            setProducts(res.data.data.products)
        } catch (err) {
            console.error('Failed to load products:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProducts()
    }, [])

    // Validation rules
    const validateField = (field, value) => {
        switch (field) {
            case 'name':
                if (!value || !value.trim()) return 'Customer name is required'
                if (value.trim().length < 2) return 'Name must be at least 2 characters'
                if (value.trim().length > 100) return 'Name must be under 100 characters'
                return ''
            case 'phone':
                if (!value || !value.trim()) return 'Phone number is required'
                if (!/^[6-9]\d{9}$/.test(value.trim())) return 'Enter a valid 10-digit phone number'
                return ''
            case 'address':
                if (value && value.trim().length > 300) return 'Address must be under 300 characters'
                return ''
            default:
                return ''
        }
    }

    const handleCustomerChange = (field, value) => {
        setCustomer({ ...customer, [field]: value })
        // Clear error when user starts typing (if field was touched)
        if (touched[field]) {
            const err = validateField(field, value)
            setFieldErrors(prev => ({ ...prev, [field]: err }))
        }
    }

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }))
        const err = validateField(field, customer[field])
        setFieldErrors(prev => ({ ...prev, [field]: err }))
    }

    const validateAllFields = () => {
        const errors = {}
        const fieldsToValidate = ['name', 'phone']
        fieldsToValidate.forEach(field => {
            const err = validateField(field, customer[field])
            if (err) errors[field] = err
        })
        // Also validate address if provided
        const addrErr = validateField('address', customer.address)
        if (addrErr) errors.address = addrErr

        setFieldErrors(errors)
        setTouched({ name: true, phone: true, address: true })
        return Object.keys(errors).length === 0
    }

    const filteredProducts = useMemo(() => {
        if (!search) return products.slice(0, 20)
        return products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.id.toLowerCase().includes(search.toLowerCase())
        )
    }, [products, search])

    const addToCart = (product) => {
        const existing = cart.find(item => item.productId === product.id)
        if (existing) {
            setCart(cart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ))
        } else {
            setCart([...cart, {
                productId: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                quantity: 1
            }])
        }
    }

    const removeFromCart = (index) => {
        setCart(cart.filter((_, i) => i !== index))
    }

    const updateQty = (index, delta) => {
        setCart(cart.map((item, i) =>
            i === index
                ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                : item
        ))
    }

    const setQty = (index, value) => {
        setCart(cart.map((item, i) =>
            i === index
                ? { ...item, quantity: value === '' ? '' : (parseInt(value) || '') }
                : item
        ))
    }

    const finalizeQty = (index) => {
        setCart(cart.map((item, i) =>
            i === index
                ? { ...item, quantity: Math.max(1, parseInt(item.quantity) || 1) }
                : item
        ))
    }

    const subtotal = useMemo(() =>
        cart.reduce((sum, item) => sum + item.price * (parseInt(item.quantity) || 0), 0),
        [cart]
    )
    const gst = useMemo(() => subtotal * 0.18, [subtotal])
    const grandTotal = useMemo(() => subtotal + gst, [subtotal, gst])
    const paidNum = useMemo(() => parseFloat(amountPaid) || 0, [amountPaid])
    const amountDue = useMemo(() => Math.max(0, grandTotal - paidNum), [grandTotal, paidNum])

    const handleSubmit = async () => {
        // Validate all customer fields first
        const isValid = validateAllFields()

        if (!isValid) {
            setError('Please fix the errors in customer details')
            return
        }

        if (cart.length === 0) {
            setError('Please add at least one item to the cart')
            return
        }

        setSubmitting(true)
        setError('')
        try {
            await ordersAPI.create({
                customer,
                items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
                paymentMethod,
                amountPaid: paidNum
            })
            setSuccess(true)
            // Reset form
            setCart([])
            setCustomer({ name: '', phone: '', email: '', address: '', gstin: '' })
            setAmountPaid('')
            setFieldErrors({})
            setTouched({})
            // Reload products to get updated stock quantities
            loadProducts()
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create order')
        } finally {
            setSubmitting(false)
        }
    }

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amt || 0)

    // Helper for input field class with error state
    const inputClass = (field) =>
        `input-field ${touched[field] && fieldErrors[field] ? 'border-red-400 focus:border-red-500 ring-1 ring-red-200' : ''}`

    return (
        <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-steel-900 mb-6">Billing</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Products */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="card">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            type="text"
                            placeholder="Search products by name or code..."
                            className="input-field"
                        />
                    </div>

                    {loading ? (
                        <div className="card flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => (product.stockQuantity || 0) > 0 && addToCart(product)}
                                    className={`card cursor-pointer transition-all group ${(product.stockQuantity || 0) > 0
                                        ? 'hover:shadow-lg hover:border-primary-300'
                                        : 'opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="aspect-square bg-steel-100 rounded-lg mb-2 overflow-hidden relative">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/100'}
                                        />
                                        {/* Stock Badge */}
                                        <span className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${(product.stockQuantity || 0) > (product.lowStockThreshold || 100)
                                            ? 'bg-green-100 text-green-700'
                                            : (product.stockQuantity || 0) > 0
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {(product.stockQuantity || 0) > 0
                                                ? `${product.stockQuantity} ${product.unit}`
                                                : 'No Stock'
                                            }
                                        </span>
                                    </div>
                                    <h4 className="font-medium text-steel-900 text-sm line-clamp-1">{product.name}</h4>
                                    <p className="text-primary-600 font-semibold">{formatCurrency(product.price)}</p>
                                    <p className="text-xs text-steel-500">per {product.unit}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart & Customer */}
                <div className="space-y-4">
                    {/* Customer Info */}
                    <div className="card">
                        <h3 className="font-semibold text-steel-900 mb-3">Customer Details</h3>
                        <div className="space-y-3">
                            <div>
                                <input
                                    value={customer.name}
                                    onChange={(e) => handleCustomerChange('name', e.target.value)}
                                    onBlur={() => handleBlur('name')}
                                    type="text"
                                    placeholder="Customer Name *"
                                    className={inputClass('name')}
                                    required
                                />
                                {touched.name && fieldErrors.name && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {fieldErrors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <input
                                    value={customer.phone}
                                    onChange={(e) => {
                                        // Only allow digits, max 10
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                                        handleCustomerChange('phone', val)
                                    }}
                                    onBlur={() => handleBlur('phone')}
                                    type="tel"
                                    placeholder="Phone Number *"
                                    className={inputClass('phone')}
                                    maxLength={10}
                                />
                                {touched.phone && fieldErrors.phone && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {fieldErrors.phone}
                                    </p>
                                )}
                            </div>
                            <div>
                                <input
                                    value={customer.address}
                                    onChange={(e) => handleCustomerChange('address', e.target.value)}
                                    onBlur={() => handleBlur('address')}
                                    type="text"
                                    placeholder="Address"
                                    className={inputClass('address')}
                                />
                                {touched.address && fieldErrors.address && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {fieldErrors.address}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cart */}
                    <div className="card">
                        <h3 className="font-semibold text-steel-900 mb-3">Cart ({cart.length} items)</h3>
                        {!cart.length ? (
                            <div className="text-center text-steel-500 py-4">No items in cart</div>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {cart.map((item, i) => (
                                    <div key={item.productId} className="p-3 bg-steel-50 rounded-lg border border-steel-100">
                                        <div className="flex items-start justify-between mb-2">
                                            <p className="font-medium text-steel-900 text-sm truncate flex-1">{item.name}</p>
                                            <button onClick={() => removeFromCart(i)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-2 flex-shrink-0">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs text-steel-500">{formatCurrency(item.price)}/{item.unit}</span>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => updateQty(i, -1)} className="w-7 h-7 flex items-center justify-center bg-steel-200 hover:bg-steel-300 rounded text-sm font-bold">-</button>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={item.quantity}
                                                    onChange={(e) => setQty(i, e.target.value)}
                                                    onBlur={() => finalizeQty(i)}
                                                    className="w-14 h-7 text-center text-sm font-semibold border border-steel-200 rounded focus:outline-none focus:border-primary-400"
                                                />
                                                <button onClick={() => updateQty(i, 1)} className="w-7 h-7 flex items-center justify-center bg-steel-200 hover:bg-steel-300 rounded text-sm font-bold">+</button>
                                            </div>
                                            <span className="text-sm font-bold text-primary-600 min-w-[70px] text-right">{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="card">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-steel-600">Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-steel-600">GST (18%)</span>
                                <span>{formatCurrency(gst)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-steel-200">
                                <span>Grand Total</span>
                                <span className="text-primary-600">{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="input-field"
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="upi">UPI</option>
                                <option value="credit">Credit</option>
                            </select>
                            <div>
                                <label className="block text-sm text-steel-600 mb-1">Amount Paid</label>
                                <input
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    className="input-field"
                                />
                            </div>
                            <div className="flex justify-between font-medium">
                                <span>Due</span>
                                <span className={amountDue > 0 ? 'text-red-600' : 'text-green-600'}>
                                    {formatCurrency(amountDue)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">Order created successfully!</div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !cart.length}
                        className={`btn-primary w-full py-3 text-lg ${!cart.length ? 'opacity-50' : ''}`}
                    >
                        {submitting ? 'Creating Order...' : 'Create Order'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default BillingView
