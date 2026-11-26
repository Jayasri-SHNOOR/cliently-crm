import { useState, useEffect } from 'react'
import api from '../services/api'
import './Products.css'

function Products() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Active')
  const [showModal, setShowModal] = useState(false)
  const [offeringType, setOfferingType] = useState('Product')
  const [viewItem, setViewItem] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [offerings, setOfferings] = useState([])
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products')
        const data = response.data

        setOfferings(
          Array.isArray(data) ? data : data.products || []
        )
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }

    fetchProducts()
  }, [])
  const filteredOfferings = offerings.filter((item) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'products' && item.type === 'Product') ||
      (activeTab === 'services' && item.type === 'Service')

    const search = searchTerm.toLowerCase()

    const matchesSearch =
      (item.name || '').toLowerCase().includes(search) ||
      (item.code || '').toLowerCase().includes(search) ||
      (item.category || '').toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === 'All' || item.status === statusFilter

    return matchesTab && matchesSearch && matchesStatus
  })


  const handleAddOffering = async (event) => {  //add
    event.preventDefault()

    const formData = new FormData(event.target)

    const newOffering = {
      type: offeringType,
      name: formData.get('name'),
      ...(formData.get('code')?.trim()
        ? { code: formData.get('code').trim() }
        : {}),
      category: formData.get('category'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      status: formData.get('status'),
      ...(offeringType === 'Product'
        ? { billing: formData.get('billing') }
        : { duration: `${formData.get('duration')} Days` })
    }

    try {
      const response = await api.post('/products', newOffering)
      const data = response.data

      setOfferings((previous) => [data.product || data, ...previous])
      setShowModal(false)
      event.target.reset()

      alert('Product/Service saved successfully!')
    } catch (error) {
      console.error('Error saving product:', error)
      alert(
        error.response?.data?.message ||
        'Failed to save product. Check the backend.'
      )
    }
  }


  const handleEditOffering = async (event) => {  //update
    event.preventDefault()

    if (!editItem?._id) {
      alert('Product ID is missing. Cannot update this item.')
      return
    }

    const formData = new FormData(event.target)

    const updatedOffering = {
      type: editItem.type,
      name: formData.get('name'),
      ...(formData.get('code')?.trim()
        ? { code: formData.get('code').trim() }
        : {}),
      category: formData.get('category'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      status: formData.get('status'),
      ...(editItem.type === 'Product'
        ? { billing: formData.get('billing') }
        : { duration: `${formData.get('duration')} Days` })
    }

    try {
      const response = await api.put(
        `/products/${editItem._id}`,
        updatedOffering
      )
      const data = response.data

      const savedItem = data.product || data

      setOfferings((previous) =>
        previous.map((item) =>
          item._id === editItem._id
            ? { ...item, ...savedItem }
            : item
        )
      )

      setEditItem(null)
      setViewItem(null)

      alert('Product/Service updated successfully!')
    } catch (error) {
      console.error('Error updating product:', error)
      alert(
        error.response?.data?.message ||
        'Failed to update product.'
      )
    }
  }


  const handleDelete = async (item) => {  // delete 
    if (!item?._id) {
      alert('Product ID is missing. Cannot delete this item.')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"?`
    )

    if (!confirmed) return

    try {
      await api.delete(`/products/${item._id}`)

      setOfferings((previous) =>
        previous.filter((offering) => offering._id !== item._id)
      )

      setViewItem(null)
      setEditItem(null)

      alert('Product/Service deleted successfully!')
    } catch (error) {
      console.error('Error deleting product:', error)
      alert(
        error.response?.data?.message ||
        'Failed to delete product.'
      )
    }
  }

  return (
    <main className="products-page">
      <section className="products-header">
        <div>
          <h1>Products & Services</h1>
          <p>Manage the products and services your company offers.</p>
        </div>

        <button
          className="add-offering-button"
          onClick={() => {
            setOfferingType('Product')
            setShowModal(true)
          }}
        >
          + Add Product / Service
        </button>
      </section>

      <section className="products-toolbar">
        <div className="products-tabs">
          <button
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>

          <button
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>

          <button
            className={activeTab === 'services' ? 'active' : ''}
            onClick={() => setActiveTab('services')}
          >
            Services
          </button>
        </div>

        <div className="products-filters">
          <div className="products-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search products or services..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </section>

      <section className="products-grid">
        {filteredOfferings.map((item) => (
          <div className="offering-card" key={item._id || item.id}>
            <div className="offering-card-top">
              <div className="offering-icon">
                {item.type === 'Product' ? '▣' : '◇'}
              </div>

              <span
                className={`offering-status ${(item.status || 'Active').toLowerCase()}`}
              >
                {item.status}
              </span>
            </div>

            <div className="offering-type">{item.type}</div>

            <h2>{item.name}</h2>

            <p className="offering-category">{item.category}</p>

            <p className="offering-description">{item.description}</p>

            <div className="offering-price">
              <strong>
                ₹{Number(item.price || 0).toLocaleString('en-IN')}
              </strong>

              {item.type === 'Product' ? (
                <span>/ {item.billing?.toLowerCase()}</span>
              ) : (
                <span>starting price</span>
              )}
            </div>

            <div className="offering-card-footer">
              <button onClick={() => setViewItem(item)}>View</button>

              <button onClick={() => setEditItem(item)}>Edit</button>

              <button onClick={() => handleDelete(item)}>•••</button>
            </div>
          </div>
        ))}
      </section>

      {filteredOfferings.length === 0 && (
        <div className="empty-products">
          <h3>No products or services found</h3>
          <p>Try changing your search or filter.</p>
        </div>
      )}
      {} 
      {showModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="offering-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Add New Offering</h2>
                <p>Add a product or service to your company.</p>
              </div>

              <button onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="offering-type-selector">
              <button
                type="button"
                className={offeringType === 'Product' ? 'active' : ''}
                onClick={() => setOfferingType('Product')}
              >
                Product
              </button>

              <button
                type="button"
                className={offeringType === 'Service' ? 'active' : ''}
                onClick={() => setOfferingType('Service')}
              >
                Service
              </button>
            </div>

            <form onSubmit={handleAddOffering}>
              <div className="form-group">
                <label>{offeringType} Name *</label>
                <input
                  name="name"
                  type="text"
                  placeholder={`Enter ${offeringType.toLowerCase()} name`}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{offeringType} Code</label>
                  <input
                    name="code"
                    type="text"
                    placeholder="DH-SER/PR-001"
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <input
                    name="category"
                    type="text"
                    placeholder="Enter category"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Enter description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    {offeringType === 'Product'
                      ? 'Pricing'
                      : 'Starting Price'}
                  </label>

                  <input
                    name="price"
                    type="number"
                    min="0"
                    placeholder="₹ 0"
                    required
                  />
                </div>

                {offeringType === 'Product' ? (
                  <div className="form-group">
                    <label>Billing Type</label>
                    <select name="billing" defaultValue="Monthly">
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                      <option value="One-time">One-time</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Estimated Delivery</label>
                    <input
                      name="duration"
                      type="number"
                      min="1"
                      placeholder="30"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="status" defaultValue="Active">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit">
                  Save {offeringType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {viewItem && (
        <div
          className="modal-overlay"
          onClick={() => setViewItem(null)}
        >
          <div
            className="offering-modal detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>{viewItem.name}</h2>
                <p>{viewItem.type} details</p>
              </div>

              <button onClick={() => setViewItem(null)}>×</button>
            </div>

            <div className="detail-list">
              <div>
                <span>Name</span>
                <strong>{viewItem.name}</strong>
              </div>

              <div>
                <span>Code</span>
                <strong>{viewItem.code || 'Not added'}</strong>
              </div>

              <div>
                <span>Category</span>
                <strong>{viewItem.category || 'Not added'}</strong>
              </div>

              <div>
                <span>Description</span>
                <strong>{viewItem.description || 'Not added'}</strong>
              </div>

              <div>
                <span>
                  {viewItem.type === 'Product'
                    ? 'Pricing'
                    : 'Starting Price'}
                </span>

                <strong>
                  ₹{Number(viewItem.price || 0).toLocaleString('en-IN')}
                </strong>
              </div>

              <div>
                <span>
                  {viewItem.type === 'Product'
                    ? 'Billing Cycle'
                    : 'Estimated Duration'}
                </span>

                <strong>
                  {viewItem.type === 'Product'
                    ? viewItem.billing
                    : viewItem.duration}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{viewItem.status}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setViewItem(null)}>
                Close
              </button>

              <button
                onClick={() => {
                  setEditItem(viewItem)
                  setViewItem(null)
                }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {editItem && (
        <div
          className="modal-overlay"
          onClick={() => setEditItem(null)}
        >
          <div
            className="offering-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Edit {editItem.type}</h2>
                <p>Update offering information.</p>
              </div>

              <button onClick={() => setEditItem(null)}>×</button>
            </div>

            <form onSubmit={handleEditOffering}>
              <div className="form-group">
                <label>{editItem.type} Name *</label>
                <input
                  name="name"
                  defaultValue={editItem.name}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{editItem.type} Code</label>
                  <input
                    name="code"
                    defaultValue={editItem.code || ''}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <input
                    name="category"
                    defaultValue={editItem.category || ''}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  defaultValue={editItem.description || ''}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    {editItem.type === 'Product'
                      ? 'Pricing'
                      : 'Starting Price'}
                  </label>

                  <input
                    name="price"
                    type="number"
                    min="0"
                    defaultValue={editItem.price ?? 0}
                    required
                  />
                </div>

                {editItem.type === 'Product' ? (
                  <div className="form-group">
                    <label>Billing Type</label>
                    <select
                      name="billing"
                      defaultValue={editItem.billing || 'Monthly'}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                      <option value="One-time">One-time</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Estimated Delivery (Days)</label>
                    <input
                      name="duration"
                      type="number"
                      min="1"
                      defaultValue={parseInt(editItem.duration, 10) || ''}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  defaultValue={editItem.status || 'Active'}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                >
                  Cancel
                </button>

                <button type="submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Products