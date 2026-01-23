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
    const [amountPaid, setAmountPaid] = useState(0)

    useEffect(() => {
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
        loadProducts()
    }, [])

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

    const subtotal = useMemo(() =>
        cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [cart]
    )
    const gst = useMemo(() => subtotal * 0.18, [subtotal])
    const grandTotal = useMemo(() => subtotal + gst, [subtotal, gst])
    const amountDue = useMemo(() => Math.max(0, grandTotal - amountPaid), [grandTotal, amountPaid])

    const handleSubmit = async () => {
        if (!customer.name || cart.length === 0) {
            setError('Please add customer name and items')
            return
        }
        setSubmitting(true)
        setError('')
        try {
            await ordersAPI.create({
                customer,
                items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
                paymentMethod,
                amountPaid
            })
            setSuccess(true)
            // Reset form
            setCart([])
            setCustomer({ name: '', phone: '', email: '', address: '', gstin: '' })
            setAmountPaid(0)
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
                                    onClick={() => addToCart(product)}
                                    className="card cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all group"
                                >
                                    <div className="aspect-square bg-steel-100 rounded-lg mb-2 overflow-hidden">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/100'}
                                        />
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
                            <input
                                value={customer.name}
                                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                                type="text"
                                placeholder="Customer Name *"
                                className="input-field"
                                required
                            />
                            <input
                                value={customer.phone}
                                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                                type="tel"
                                placeholder="Phone Number"
                                className="input-field"
                            />
                            <input
                                value={customer.address}
                                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                                type="text"
                                placeholder="Address"
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Cart */}
                    <div className="card">
                        <h3 className="font-semibold text-steel-900 mb-3">Cart</h3>
                        {!cart.length ? (
                            <div className="text-center text-steel-500 py-4">No items in cart</div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {cart.map((item, i) => (
                                    <div key={item.productId} className="flex items-center justify-between p-2 bg-steel-50 rounded-lg">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-steel-900 text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-steel-500">{formatCurrency(item.price)} × {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center border border-steel-200 rounded">
                                                <button onClick={() => updateQty(i, -1)} className="px-2 py-1 hover:bg-steel-100">-</button>
                                                <span className="px-2 text-sm">{item.quantity}</span>
                                                <button onClick={() => updateQty(i, 1)} className="px-2 py-1 hover:bg-steel-100">+</button>
                                            </div>
                                            <button onClick={() => removeFromCart(i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
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
                                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                                    type="number"
                                    min="0"
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
