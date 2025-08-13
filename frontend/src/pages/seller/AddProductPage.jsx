import React, { useState, useEffect } from 'react'
import SellerLayout from '../../components/layout/SellerLayout'
import { Plus, Search, ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react'
import { createProduct, updateProduct, fetchProductById } from '../../services/api'
import { useNavigate, useParams } from 'react-router-dom'
import TagSelector from '../../components/TagSelector'

const AddProductPage = () => {
  const navigate = useNavigate()
  const { productId } = useParams() // Get productId from URL params for edit mode
  const isEditMode = Boolean(productId)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEditMode)
  const [error, setError] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    tags: [],
    customTags: [],
    features: []
  })
  
  const [selectedImages, setSelectedImages] = useState([])
  const [existingImages, setExistingImages] = useState([]) // For edit mode
  const [customSizes, setCustomSizes] = useState(false)
  const [customSizeFields, setCustomSizeFields] = useState([]) // Array of custom size field names
  const [customSizeInput, setCustomSizeInput] = useState('') // Input for adding new custom size fields
  const [days, setDays] = useState(3)
  const [selectedSizes, setSelectedSizes] = useState({
    '2XS': false,
    'XS': false,
    'S': false,
    'M': false,
    'L': false,
    'XL': false,
    '2XL': false,
    '3XL': false
  })
  const [selectedColors, setSelectedColors] = useState([])
  const [colorInput, setColorInput] = useState('')
  const [quantities, setQuantities] = useState({})
  const [skuCombinations, setSkuCombinations] = useState([])
  const [customSkus, setCustomSkus] = useState({}) // For manual SKU input
  const [requiresAdvancePayment, setRequiresAdvancePayment] = useState(false)

  // Load product data for edit
  useEffect(() => {
    if (isEditMode && productId) {
      loadProductForEdit()
    }
  }, [isEditMode, productId])

  const loadProductForEdit = async () => {
    try {
      setIsLoadingProduct(true)
      const product = await fetchProductById(productId)
      console.log('Loaded product for edit:', product)
      
      // Populate form with existing product data
      setFormData({
        name: product.name || '',
        description: product.description || product.short_description || '',
        price: product.base_price?.amount || product.price || '',
        category: product.category?.name || '',
        tags: product.tags_list || product.tags || [],
        customTags: [],
        features: product.features || []
      })
      
      // Handle existing images
      if (product.images && product.images.length > 0) {
        setExistingImages(product.images)
      }
      
      // Handle sizes - reconstruct from variants OR use availableSizes
      let existingSizes = {}
      if (product.variants && product.variants.length > 0) {
        // Get unique sizes from variants
        const sizesFromVariants = [...new Set(product.variants.map(v => v.size).filter(Boolean))]
        Object.keys(selectedSizes).forEach(size => {
          existingSizes[size] = sizesFromVariants.includes(size)
        })
      } else if (product.availableSizes && Array.isArray(product.availableSizes)) {
        Object.keys(selectedSizes).forEach(size => {
          existingSizes[size] = product.availableSizes.includes(size)
        })
      }
      setSelectedSizes(existingSizes)
      
      // Handle colors - reconstruct from variants OR use availableColors
      let existingColors = []
      if (product.variants && product.variants.length > 0) {
        // Get unique colors from variants
        const colorsFromVariants = [...new Set(product.variants.map(v => v.color).filter(Boolean))]
        existingColors = colorsFromVariants.map((color, index) => ({
          id: index + 1,
          name: color
        }))
      } else if (product.availableColors && Array.isArray(product.availableColors)) {
        existingColors = product.availableColors.map((color, index) => ({
          id: index + 1,
          name: color
        }))
      }
      setSelectedColors(existingColors)
      
      // Handle existing SKU combinations from variants
      let existingCombinations = []
      let existingQuantities = {}
      let existingSkus = {}
      
      if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        console.log('Loading variants:', product.variants)
        
        // Create combinations from existing variants
        product.variants.forEach((variant, index) => {
          const comboId = `variant-${variant.id || index}`
          const combo = {
            id: comboId,
            color: variant.color || '',
            size: variant.size || '',
            quantity: variant.stock_quantity || 0,
            sku: variant.sku || '',
            isExisting: true,
            variantId: variant.id // Store the variant ID for updates
          }
          
          existingCombinations.push(combo)
          existingQuantities[comboId] = variant.stock_quantity || 0
          existingSkus[comboId] = variant.sku || ''
        })
        
        console.log('Loaded existing combinations:', existingCombinations)
        console.log('Loaded existing quantities:', existingQuantities)
        console.log('Loaded existing SKUs:', existingSkus)
        
      } else if (product.stock_quantity || product.sku) {
        // Fallback for simple products without variants
        const comboId = 'simple-product'
        const combo = {
          id: comboId,
          color: 'Default',
          size: 'Default', 
          quantity: product.stock_quantity || 0,
          sku: product.sku || '',
          isExisting: true,
          isSimpleProduct: true
        }
        
        existingCombinations.push(combo)
        existingQuantities[comboId] = product.stock_quantity || 0
        existingSkus[comboId] = product.sku || ''
      }
      
      // Set the existing combinations directly
      if (existingCombinations.length > 0) {
        setSkuCombinations(existingCombinations)
        setQuantities(existingQuantities)
        setCustomSkus(existingSkus)
        console.log('Set SKU combinations:', existingCombinations)
      }
      
      // Handle other fields
      setDays(product.estimated_pickup_days || 3)
      setCustomSizes(product.offers_custom_sizes || false)
      setRequiresAdvancePayment(product.requires_advance_payment || false)
      
      // Handle custom size fields
      if (product.custom_size_fields && Array.isArray(product.custom_size_fields)) {
        setCustomSizeFields(product.custom_size_fields)
      } else if (product.custom_size_fields && typeof product.custom_size_fields === 'string') {
        try {
          setCustomSizeFields(JSON.parse(product.custom_size_fields))
        } catch (e) {
          console.error('Failed to parse custom_size_fields:', e)
          setCustomSizeFields([])
        }
      }
      
    } catch (error) {
      console.error('Failed to load product for edit:', error)
      setError('Failed to load product data: ' + error.message)
    } finally {
      setIsLoadingProduct(false)
    }
  }

  // Only auto-generate combinations when NOT in edit mode or when explicitly adding new combinations
  useEffect(() => {
    if (!isEditMode) {
      generateSkuCombinations()
    }
  }, [selectedColors, selectedSizes, customSizes, isEditMode])

  // In edit mode, add new combinations when colors/sizes are added
  useEffect(() => {
    if (isEditMode && (selectedColors.length > 0 || Object.values(selectedSizes).some(v => v))) {
      addNewCombinationsInEditMode()
    }
  }, [selectedColors, selectedSizes, customSizes])

  const addNewCombinationsInEditMode = () => {
    if (selectedColors.length === 0) {
      return
    }

    const newCombinations = []

    if (customSizes) {
      // For custom sizing, create one SKU per color (no size variants)
      selectedColors.forEach(color => {
        // Check if this combination already exists
        const existingCombo = skuCombinations.find(combo => 
          combo.color === color.name && combo.size === 'Custom'
        )
        
        if (!existingCombo) {
          const comboId = `new-custom-${color.id}`
          newCombinations.push({
            id: comboId,
            color: color.name,
            size: 'Custom',
            quantity: 0,
            sku: generateAutoSku({ color: color.name, size: 'Custom' }),
            isNew: true,
            isCustomSizing: true
          })
        }
      })
    } else {
      // Traditional size/color combinations
      const activeSizes = Object.entries(selectedSizes)
        .filter(([_, isSelected]) => isSelected)
        .map(([size]) => size)

      if (activeSizes.length === 0) {
        return
      }

      selectedColors.forEach(color => {
        activeSizes.forEach(size => {
          // Check if this combination already exists
          const existingCombo = skuCombinations.find(combo => 
            combo.color === color.name && combo.size === size
          )
          
          if (!existingCombo) {
            const comboId = `new-${color.id}-${size}`
            newCombinations.push({
              id: comboId,
              color: color.name,
              size: size,
              quantity: 0,
              sku: generateAutoSku({ color: color.name, size }),
              isNew: true
            })
          }
        })
      })
    }

    if (newCombinations.length > 0) {
      setSkuCombinations(prev => [...prev, ...newCombinations])
      console.log('Added new combinations:', newCombinations)
    }
  }

  const generateSkuCombinations = () => {
    if (selectedColors.length === 0) {
      setSkuCombinations([])
      return
    }

    const combinations = []

    if (customSizes) {
      // For custom sizing, create one SKU per color (no size variants)
      selectedColors.forEach(color => {
        const comboId = `custom-${color.id}`
        combinations.push({
          id: comboId,
          color: color.name,
          size: 'Custom',
          quantity: quantities[comboId] || 0,
          sku: customSkus[comboId] || generateAutoSku({ color: color.name, size: 'Custom' }),
          isCustomSizing: true
        })
      })
    } else {
      // Traditional size/color combinations
      const activeSizes = Object.entries(selectedSizes)
        .filter(([_, isSelected]) => isSelected)
        .map(([size]) => size)

      if (activeSizes.length === 0) {
        setSkuCombinations([])
        return
      }

      selectedColors.forEach(color => {
        activeSizes.forEach(size => {
          const comboId = `${color.id}-${size}`
          combinations.push({
            id: comboId,
            color: color.name,
            size: size,
            quantity: quantities[comboId] || 0,
            sku: customSkus[comboId] || generateAutoSku({ color: color.name, size })
          })
        })
      })
    }

    setSkuCombinations(combinations)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    console.log('Files selected:', files)
    const totalImages = selectedImages.length + existingImages.length
    if (files.length + totalImages > 6) {
      alert('Maximum 6 images allowed')
      return
    }
    console.log('Adding files to selectedImages:', files)
    setSelectedImages(prev => {
      const newImages = [...prev, ...files]
      console.log('New selectedImages:', newImages)
      return newImages
    })
  }

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Prepare form data
      const productFormData = new FormData()
      
      // Basic product info
      productFormData.append('name', formData.name)
      productFormData.append('description', formData.description)
      productFormData.append('price', formData.price)
      productFormData.append('estimated_pickup_days', days)
      productFormData.append('requires_advance_payment', requiresAdvancePayment)
      
      // Sizes and colors
      const activeSizes = Object.entries(selectedSizes)
        .filter(([_, isSelected]) => isSelected)
        .map(([size]) => size)
      
      productFormData.append('availableSizes', JSON.stringify(activeSizes))
      productFormData.append('availableColors', JSON.stringify(selectedColors.map(c => c.name)))
      
      // Tags
      if (formData.tags && formData.tags.length > 0) {
        productFormData.append('tags', JSON.stringify(formData.tags))
      }
      
      // Custom sizing
      productFormData.append('offers_custom_sizes', customSizes)
      if (customSizes && customSizeFields.length > 0) {
        productFormData.append('custom_size_fields', JSON.stringify(customSizeFields))
      }
      
      // Calculate total stock quantity from all SKU combinations
      const totalStock = Object.values(quantities).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0)
      productFormData.append('stock_quantity', totalStock || 0)
      
      // Add SKU/Variant data
      const variantData = skuCombinations.map(combo => ({
        id: combo.variantId || null, // Include variant ID for updates
        color: combo.color,
        size: combo.size,
        stock_quantity: quantities[combo.id] || combo.quantity || 0,
        sku: customSkus[combo.id] || combo.sku || generateAutoSku(combo),
        is_active: true
      }))
      productFormData.append('variants_data', JSON.stringify(variantData))
      
      // Add new images
      selectedImages.forEach((image, index) => {
        productFormData.append('uploaded_images', image)
      })

      // Handle existing images for edit mode
      if (isEditMode) {
        productFormData.append('existing_images', JSON.stringify(existingImages.map(img => img.id || img)))
      }

      let response
      if (isEditMode) {
        response = await updateProduct(productId, productFormData)
      } else {
        response = await createProduct(productFormData)
      }
      
      if (response) {
        // Redirect to seller products page on success
        navigate('/seller/products')
      }
    } catch (error) {
      setError(error.message || `Failed to ${isEditMode ? 'update' : 'create'} product`)
      console.error(`Product ${isEditMode ? 'update' : 'creation'} failed:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSizeChange = (size) => {
    setSelectedSizes({
      ...selectedSizes,
      [size]: !selectedSizes[size]
    })
  }

  const addColor = () => {
    if (colorInput.trim() !== '') {
      const newColor = {
        id: Date.now(),
        name: colorInput.trim()
      }
      setSelectedColors([...selectedColors, newColor])
      setColorInput('')
    }
  }

  const removeColor = (colorId) => {
    setSelectedColors(selectedColors.filter(color => color.id !== colorId))
  }

  const generateAutoSku = (combo) => {
    const productPrefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'PRD'
    const colorPrefix = combo.color ? combo.color.substring(0, 2).toUpperCase() : 'XX'
    const sizePrefix = combo.size || 'OS'
    return `${productPrefix}-${colorPrefix}-${sizePrefix}`
  }

  const handleQuantityChange = (combinationId, value) => {
    const newQuantities = {
      ...quantities,
      [combinationId]: parseInt(value) || 0
    }
    setQuantities(newQuantities)
  }

  const handleSkuChange = (combinationId, value) => {
    const newSkus = {
      ...customSkus,
      [combinationId]: value
    }
    setCustomSkus(newSkus)
  }

  const addManualSkuRow = () => {
    const newId = `manual-${Date.now()}`
    const newCombo = {
      id: newId,
      color: '',
      size: '',
      quantity: 0,
      sku: '',
      isManual: true
    }
    setSkuCombinations(prev => [...prev, newCombo])
  }

  const removeSkuRow = (combinationId) => {
    setSkuCombinations(prev => prev.filter(combo => combo.id !== combinationId))
    
    // Also remove from quantities and custom SKUs
    const newQuantities = { ...quantities }
    const newSkus = { ...customSkus }
    delete newQuantities[combinationId]
    delete newSkus[combinationId]
    setQuantities(newQuantities)
    setCustomSkus(newSkus)
  }

  const handleManualComboChange = (combinationId, field, value) => {
    setSkuCombinations(prev => prev.map(combo => 
      combo.id === combinationId ? { ...combo, [field]: value } : combo
    ))
  }

  const incrementDays = () => {
    setDays(prev => prev + 1)
  }

  const decrementDays = () => {
    if (days > 1) {
      setDays(prev => prev - 1)
    }
  }

  // Custom size field management
  const addCustomSizeField = () => {
    if (customSizeInput.trim() && !customSizeFields.includes(customSizeInput.trim())) {
      setCustomSizeFields(prev => [...prev, customSizeInput.trim()])
      setCustomSizeInput('')
    }
  }

  const removeCustomSizeField = (fieldName) => {
    setCustomSizeFields(prev => prev.filter(field => field !== fieldName))
  }

  const handleCustomSizingToggle = (enabled) => {
    setCustomSizes(enabled)
    
    // Clear existing SKU combinations when switching modes
    if (!isEditMode) {
      setSkuCombinations([])
      setQuantities({})
      setCustomSkus({})
    }
    
    // If disabling custom sizing, clear custom size fields
    if (!enabled) {
      setCustomSizeFields([])
    }
  }

  // Show loading state while fetching product data for edit
  if (isLoadingProduct) {
    return (
      <SellerLayout>
        <div className="bg-white/90 rounded-lg p-6 text-center">
          <p>Loading product data...</p>
        </div>
      </SellerLayout>
    )
  }

  return (
    <SellerLayout>
      <div className="bg-white/90 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-8 text-center uppercase">
          {isEditMode ? 'EDIT PRODUCT' : 'LIST YOUR PRODUCT'}
        </h1>
        
        {error && (
          <div className="bg-gray-100 border border-gray-400 text-black px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Product Title */}
          <div>
            <label htmlFor="name" className="block mb-2 font-medium text-gray-700">Product Title</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              placeholder="Enter product title"
              required
            />
          </div>

          {/* Product Description */}
          <div>
            <label htmlFor="description" className="block mb-2 font-medium text-gray-700">Product Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              placeholder="Describe your product"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block mb-2 font-medium text-gray-700">Price (BDT)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleFormChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              placeholder="0.00"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <TagSelector
              selectedTags={formData.tags}
              onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
            />
          </div>

          {/* Existing Images (Edit Mode) */}
          {isEditMode && existingImages.length > 0 && (
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Current Images <span className="text-xs text-gray-500">(Max 6)</span>
              </label>
              <div className="border border-gray-300 rounded-lg p-4 min-h-[150px] flex items-start gap-4 flex-wrap">
                {existingImages.map((image, index) => (
                  <div key={index} className="relative w-16 h-16">
                    <img 
                      src={image.image || image} 
                      alt={`Current ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute -top-1 -right-1 bg-gray-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-gray-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Images */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              {isEditMode ? 'Add New Images' : 'Add Photos'} <span className="text-xs text-gray-500">(Max 6)</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-4 min-h-[150px] flex items-start gap-4 flex-wrap">
              {console.log('Rendering selectedImages:', selectedImages)}
              {selectedImages.map((image, index) => (
                <div key={index} className="relative w-16 h-16">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                    onLoad={(e) => console.log('Image loaded:', e.target.src)}
                    onError={(e) => {
                      console.error('Image load error:', e)
                      e.target.style.display = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 bg-gray-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-gray-800"
                  >
                    ×
                  </button>
                </div>
              ))}
              {(selectedImages.length + (existingImages?.length || 0)) < 6 && (
                <label className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded cursor-pointer hover:bg-gray-300">
                  <Plus className="w-8 h-8 text-gray-500" />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Available Sizes */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Available Sizes</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(selectedSizes).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeChange(size)}
                  className={`px-4 py-2 rounded border transition-colors ${
                    selectedSizes[size] 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white text-black border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Sizes */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="customSizes"
              checked={customSizes}
              onChange={(e) => handleCustomSizingToggle(e.target.checked)}
              className="rounded border-gray-300 focus:ring-black"
            />
            <label htmlFor="customSizes" className="text-gray-700">Offer custom sizes</label>
          </div>

          {/* Custom Size Fields */}
          {customSizes && (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium text-gray-700 mb-3">Custom Size Measurements</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add the measurements you need from customers (e.g., "Chest Size", "Waist", "Calf Size", etc.)
              </p>
              
              {/* Add new custom size field */}
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  placeholder="Enter measurement name (e.g., Chest Size)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomSizeField()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomSizeField}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Add Field
                </button>
              </div>

              {/* Display added custom size fields */}
              {customSizeFields.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Required Measurements:</h4>
                  <div className="space-y-2">
                    {customSizeFields.map((field, index) => (
                      <div key={index} className="flex items-center justify-between bg-white border border-gray-300 rounded-md px-3 py-2">
                        <span className="text-gray-700">{field}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomSizeField(field)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Customers will be asked to provide these measurements when ordering this product.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Available Colors */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Available Colors</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                placeholder="Enter color name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addColor()
                  }
                }}
              />
              <button
                type="button"
                onClick={addColor}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedColors.map(color => (
                <span
                  key={color.id}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {color.name}
                  <button
                    type="button"
                    onClick={() => removeColor(color.id)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* SKU Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-medium text-gray-700">Stock & SKU Management</label>
              <button
                type="button"
                onClick={addManualSkuRow}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                Add Manual SKU
              </button>
            </div>
            
            {skuCombinations.length === 0 ? (
              <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-500">
                {selectedColors.length === 0 || Object.values(selectedSizes).every(v => !v) ? 
                  'Please select at least one size and one color to generate SKU combinations, or add manual SKUs' :
                  'No SKU combinations available'
                }
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 border-b border-gray-200 font-medium text-sm">
                  <div className="col-span-3">COLOR</div>
                  <div className="col-span-2">SIZE</div>
                  <div className="col-span-3">SKU</div>
                  <div className="col-span-2">QUANTITY</div>
                  <div className="col-span-2">ACTIONS</div>
                </div>
                
                {/* SKU Rows */}
                <div className="divide-y divide-gray-200">
                  {skuCombinations.map((combo) => (
                    <div key={combo.id} className={`grid grid-cols-12 gap-2 p-3 ${combo.isExisting ? 'bg-gray-50' : ''}`}>
                      {/* Color */}
                      <div className="col-span-3">
                        {combo.isManual ? (
                          <input
                            type="text"
                            value={combo.color}
                            onChange={(e) => handleManualComboChange(combo.id, 'color', e.target.value)}
                            placeholder="Color"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                          />
                        ) : (
                          <div className="flex items-center">
                            <span className="text-sm">{combo.color}</span>
                            {combo.isExisting && <span className="ml-2 text-xs text-gray-500">(existing)</span>}
                          </div>
                        )}
                      </div>
                      
                      {/* Size */}
                      <div className="col-span-2">
                        {combo.isManual ? (
                          <input
                            type="text"
                            value={combo.size}
                            onChange={(e) => handleManualComboChange(combo.id, 'size', e.target.value)}
                            placeholder="Size"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                          />
                        ) : (
                          <span className="text-sm">{combo.size}</span>
                        )}
                      </div>
                      
                      {/* SKU */}
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={customSkus[combo.id] || combo.sku || ''}
                          onChange={(e) => handleSkuChange(combo.id, e.target.value)}
                          placeholder="Enter SKU"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                        />
                      </div>
                      
                      {/* Quantity */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          value={quantities[combo.id] || combo.quantity || 0}
                          onChange={(e) => handleQuantityChange(combo.id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                        />
                      </div>
                      
                      {/* Actions */}
                      <div className="col-span-2">
                        {(combo.isManual || combo.isExisting) && (
                          <button
                            type="button"
                            onClick={() => removeSkuRow(combo.id)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                            title={combo.isExisting ? "Remove existing SKU" : "Remove manual SKU"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Estimated Pickup Days */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Estimated Pickup Days</label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={decrementDays}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 border border-gray-300 rounded bg-gray-50 min-w-[60px] text-center">
                {days}
              </span>
              <button
                type="button"
                onClick={incrementDays}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Advance Payment */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="advancePayment"
              checked={requiresAdvancePayment}
              onChange={(e) => setRequiresAdvancePayment(e.target.checked)}
              className="rounded border-gray-300 focus:ring-black"
            />
            <label htmlFor="advancePayment" className="text-gray-700">Requires advance payment</label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update Product' : 'List Product')
              }
            </button>
          </div>
        </form>

        {/* Smile icon at the bottom */}
        <div className="flex justify-center mt-8">
          <div className="text-3xl">☺</div>
        </div>
      </div>
    </SellerLayout>
  )
}

export default AddProductPage 