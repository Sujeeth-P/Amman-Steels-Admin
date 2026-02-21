import { useState, useEffect, useMemo } from 'react'
import { productsAPI, imagesAPI } from '../../services/api'

const ProductsView = () => {
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState('create')
    const [editingProduct, setEditingProduct] = useState(null)
    const [saving, setSaving] = useState(false)

    // Image upload states
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')
    const [uploadingImage, setUploadingImage] = useState(false)
    const [uploadProgress, setUploadProgress] = useState('')

    const categories = ['steel', 'cement', 'electronics', 'paints', 'pipes']

    const [form, setForm] = useState({
        name: '', category: 'steel', price: '', unit: 'kg', description: '', image: '', inStock: true
    })

    const loadProducts = async () => {
        setLoading(true)
        try {
            const res = await productsAPI.getAll({
                page: pagination.page,
                limit: pagination.limit,
                search,
                category: categoryFilter
            })
            setProducts(res.data.data.products)
            setPagination(res.data.data.pagination)
        } catch (err) {
            console.error('Failed to load products:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProducts()
    }, [pagination.page, search, categoryFilter])

    const handleImageSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB')
            return
        }

        setImageFile(file)

        const reader = new FileReader()
        reader.onload = (e) => setImagePreview(e.target.result)
        reader.readAsDataURL(file)
    }

    const clearImage = () => {
        setImageFile(null)
        setImagePreview('')
        setForm({ ...form, image: '' })
    }

    const uploadImageToCloudinary = async () => {
        if (!imageFile) return form.image || null

        try {
            setUploadingImage(true)
            setUploadProgress('Uploading image...')

            const response = await imagesAPI.upload(imageFile, 'products')

            if (response.data.success) {
                setUploadProgress('Image uploaded successfully!')
                return response.data.data.url
            } else {
                throw new Error(response.data.message || 'Failed to upload image')
            }
        } catch (error) {
            console.error('Image upload failed:', error)
            setUploadProgress('Upload failed!')
            throw error
        } finally {
            setUploadingImage(false)
        }
    }

    const hasImage = useMemo(() => imageFile || imagePreview || form.image, [imageFile, imagePreview, form.image])
    const currentImageSrc = useMemo(() => imagePreview || form.image || '', [imagePreview, form.image])

    const openCreateModal = () => {
        setModalMode('create')
        setForm({ name: '', category: 'steel', price: '', unit: 'kg', description: '', image: '', inStock: true })
        setImageFile(null)
        setImagePreview('')
        setUploadProgress('')
        setShowModal(true)
    }

    const openEditModal = (product) => {
        setModalMode('edit')
        setEditingProduct(product)
        setForm({
            name: product.name,
            category: product.category,
            price: product.price,
            unit: product.unit,
            description: product.description,
            image: product.image,
            inStock: product.inStock
        })
        setImageFile(null)
        setImagePreview('')
        setUploadProgress('')
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const imageUrl = await uploadImageToCloudinary()

            const productData = {
                ...form,
                price: Math.round(Number(form.price)),
                image: imageUrl || 'https://via.placeholder.com/300'
            }

            if (modalMode === 'create') {
                await productsAPI.create(productData)
            } else {
                await productsAPI.update(editingProduct.id, productData)
            }
            setShowModal(false)
            loadProducts()
        } catch (err) {
            console.error('Save failed:', err)
            alert('Failed to save product. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const deleteProduct = async (product) => {
        if (!confirm(`Delete ${product.name}?`)) return
        try {
            await productsAPI.delete(product.id)
            loadProducts()
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amt || 0)

    return (
        <div className="animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-steel-900">Products</h1>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Product
                </button>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        type="text"
                        placeholder="Search products..."
                        className="input-field flex-1"
                    />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="input-field sm:w-48"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : !products.length ? (
                <div className="card text-center py-12">
                    <p className="text-steel-500">No products found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="card hover:shadow-lg transition-shadow">
                            <div className="aspect-square bg-steel-100 rounded-lg mb-4 overflow-hidden">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/200'}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                    <h3 className="font-semibold text-steel-900 line-clamp-2">{product.name}</h3>
                                    <span className={`badge ${product.inStock ? 'badge-success' : 'badge-danger'}`}>
                                        {product.inStock ? 'In Stock' : 'Out'}
                                    </span>
                                </div>
                                <p className="text-sm text-steel-500 capitalize">{product.category}</p>
                                <p className="text-lg font-bold text-primary-600">
                                    {formatCurrency(product.price)}
                                    <span className="text-sm text-steel-500 font-normal">/{product.unit}</span>
                                </p>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => openEditModal(product)} className="btn-secondary text-sm flex-1">Edit</button>
                                    <button onClick={() => deleteProduct(product)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
                        <div className="p-6 border-b border-steel-200 sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold">
                                {modalMode === 'create' ? 'Add Product' : 'Edit Product'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-1">Name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    type="text"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-steel-700 mb-1">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className="input-field"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-steel-700 mb-1">Unit</label>
                                    <select
                                        value={form.unit}
                                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="kg">Kg</option>
                                        <option value="piece">Piece</option>
                                        <option value="bag">Bag</option>
                                        <option value="bundle">Bundle</option>
                                        <option value="litre">Litre</option>
                                        <option value="inch">Inch</option>
                                        <option value="meter">Meter</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-1">Price (₹)</label>
                                <input
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows="3"
                                    className="input-field"
                                    required
                                ></textarea>
                            </div>

                            {/* Image Upload Section */}
                            <div>
                                <label className="block text-sm font-medium text-steel-700 mb-2">Product Image</label>

                                {currentImageSrc && (
                                    <div className="mb-3 relative">
                                        <div className="w-full h-48 rounded-lg overflow-hidden bg-steel-100 border-2 border-steel-200">
                                            <img src={currentImageSrc} alt="Product preview" className="w-full h-full object-contain" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                                            title="Remove image"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                        id="productImage"
                                    />
                                    <label
                                        htmlFor="productImage"
                                        className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-steel-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                                    >
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <svg className="w-8 h-8 text-steel-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm text-steel-600">
                                                <span className="text-primary-600 font-medium">Click to upload</span> or drag and drop
                                            </span>
                                            <span className="text-xs text-steel-400">PNG, JPG, WEBP up to 5MB</span>
                                        </div>
                                    </label>
                                </div>

                                {uploadProgress && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2">
                                            {uploadingImage && (
                                                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                            <span className={`text-sm ${uploadProgress.includes('failed') ? 'text-red-600' : 'text-steel-600'}`}>
                                                {uploadProgress}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {imageFile && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-steel-600">
                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{imageFile.name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="inStock"
                                    checked={form.inStock}
                                    onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="inStock" className="text-sm text-steel-700">In Stock</label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1"
                                    disabled={saving || uploadingImage}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || uploadingImage}
                                    className="btn-primary flex-1"
                                >
                                    {uploadingImage ? 'Uploading...' : saving ? 'Saving...' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductsView
