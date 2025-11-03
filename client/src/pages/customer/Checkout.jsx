import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { useCartStore } from '../../stores/cartStore'
import { orderService } from '../../services/orderService'
import { paymentService } from '../../services/paymentService'
import { paymentInfoService } from '../../services/paymentInfoService'
import { 
  ArrowLeft, MapPin, Clock, CreditCard, Phone, User,
  Truck, Shield, CheckCircle, Loader2, ChevronDown, ChevronUp
} from 'lucide-react'
import { formatCurrency, formatWeight } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'

function Checkout() {
  const navigate = useNavigate()
  const { 
    items, 
    restaurant, 
    getSubtotal, 
    getDeliveryFee, 
    getTotal, 
    getTotalWeight,
    clearCart 
  } = useCartStore()

  const [formData, setFormData] = useState({
    deliveryAddress: {
      street: '',
      city: '',
      district: '',
      ward: '',
      notes: ''
    },
    contactInfo: {
      phone: '',
      name: ''
    },
    paymentMethod: 'cod'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [paymentUrl, setPaymentUrl] = useState(null)
  const [savedPaymentInfo, setSavedPaymentInfo] = useState([])
  const [showSavedAddresses, setShowSavedAddresses] = useState(false)

  // Auto-fill contact info if available
  useEffect(() => {
    const savedContact = localStorage.getItem('checkout-contact')
    if (savedContact) {
      try {
        const contact = JSON.parse(savedContact)
        setFormData(prev => ({
          ...prev,
          contactInfo: { ...prev.contactInfo, ...contact }
        }))
      } catch (error) {
        console.error('Error parsing saved contact:', error)
      }
    }
  }, [])

  // Load saved payment info
  useEffect(() => {
    const loadSavedPaymentInfo = async () => {
      try {
        const response = await paymentInfoService.getPaymentInfo()
        setSavedPaymentInfo(response.data.paymentInfo || [])
        
        // Auto-fill default payment info if available
        const defaultInfo = response.data.paymentInfo?.find(info => info.isDefault)
        if (defaultInfo) {
          setFormData(prev => ({
            ...prev,
            deliveryAddress: {
              ...prev.deliveryAddress,
              street: defaultInfo.deliveryAddress.street,
              city: defaultInfo.deliveryAddress.city,
              district: defaultInfo.deliveryAddress.district,
              ward: defaultInfo.deliveryAddress.ward
            },
            contactInfo: {
              ...prev.contactInfo,
              name: defaultInfo.contactInfo.name,
              phone: defaultInfo.contactInfo.phone
            }
          }))
        }
      } catch (error) {
        console.error('Error loading saved payment info:', error)
      }
    }

    loadSavedPaymentInfo()
  }, [])

  // Create order mutation
  const createOrderMutation = useMutation(
    (orderData) => orderService.createOrder(orderData),
    {
      onSuccess: (response) => {
        const order = response.data.order
        
        // Clear cart
        clearCart()
        
        // Show appropriate message and navigate
        if (order.payment.method === 'COD') {
          toast.success('Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.')
          navigate(`/customer/orders/${order._id}`)
        } else {
          toast.success('Tạo đơn hàng thành công!')
          handlePayment(order._id)
        }
      },
      onError: (error) => {
        console.error('Order creation error:', error)
        toast.error('Không thể tạo đơn hàng. Vui lòng thử lại.')
      }
    }
  )

  // Create MoMo payment mutation
  const createPaymentMutation = useMutation(
    (paymentData) => paymentService.createMoMoPayment(paymentData),
    {
      onSuccess: (response) => {
        const { paymentUrl } = response.data
        setPaymentUrl(paymentUrl)
        // Open payment URL in new tab
        window.open(paymentUrl, '_blank')
      },
      onError: (error) => {
        console.error('Payment creation error:', error)
        toast.error('Không thể tạo thanh toán. Vui lòng thử lại.')
      }
    }
  )

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSelectSavedAddress = (paymentInfo) => {
    setFormData(prev => ({
      ...prev,
      deliveryAddress: {
        ...prev.deliveryAddress,
        street: paymentInfo.deliveryAddress.street,
        city: paymentInfo.deliveryAddress.city,
        district: paymentInfo.deliveryAddress.district,
        ward: paymentInfo.deliveryAddress.ward
      },
      contactInfo: {
        ...prev.contactInfo,
        name: paymentInfo.contactInfo.name,
        phone: paymentInfo.contactInfo.phone
      }
    }))
    setShowSavedAddresses(false)
    toast.success('Đã chọn thông tin giao hàng')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (currentStep === 1) {
      // Validate delivery info
      if (!formData.deliveryAddress.street || !formData.deliveryAddress.city || !formData.deliveryAddress.district || !formData.deliveryAddress.ward || !formData.contactInfo.phone || !formData.contactInfo.name) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
        return
      }
      
      // Check if address text will be at least 10 characters
      const addressText = `${formData.deliveryAddress.street}, ${formData.deliveryAddress.ward || ''}, ${formData.deliveryAddress.district}, ${formData.deliveryAddress.city}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '')
      if (addressText.length < 10) {
        toast.error('Địa chỉ giao hàng phải có ít nhất 10 ký tự')
        return
      }
      
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      // Validate all required fields before submitting
      if (!isFormValid()) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
        return
      }
      
      setIsSubmitting(true)
      
      // Save contact info for future use
      localStorage.setItem('checkout-contact', JSON.stringify(formData.contactInfo))
      
      // Create order
      const orderData = {
        restaurantId: restaurant._id,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity
        })),
        amount: {
          subtotal: getSubtotal(),
          deliveryFee: getDeliveryFee(),
          total: getTotal(),
          currency: 'VND'
        },
        payment: {
          method: formData.paymentMethod.toUpperCase()
        },
        deliveryAddress: {
          text: `${formData.deliveryAddress.street}, ${formData.deliveryAddress.ward || ''}, ${formData.deliveryAddress.district}, ${formData.deliveryAddress.city}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, ''),
          location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231] // Default to Ho Chi Minh City coordinates
          },
          contactPhone: formData.contactInfo.phone.replace(/[^0-9+\-\s()]/g, ''),
          contactName: formData.contactInfo.name,
          notes: formData.deliveryAddress.notes || ''
        }
      }

      try {
        console.log('Order data being sent:', JSON.stringify(orderData, null, 2))
        await createOrderMutation.mutateAsync(orderData)
      } catch (error) {
        console.error('Order creation error details:', error.response?.data)
        setIsSubmitting(false)
      }
    }
  }

  const handlePayment = async (orderId) => {
    try {
      const paymentData = {
        orderId,
        amount: getTotal(),
        paymentMethod: formData.paymentMethod,
        returnUrl: `${window.location.origin}/customer/orders/${orderId}`,
        notifyUrl: `${window.location.origin}/api/payments/momo/ipn`
      }

      await createPaymentMutation.mutateAsync(paymentData)
    } catch (error) {
      toast.error('Không thể khởi tạo thanh toán')
    }
  }

  const isFormValid = () => {
    if (currentStep === 1) {
      return formData.deliveryAddress.street && 
             formData.deliveryAddress.city &&
             formData.deliveryAddress.district &&
             formData.deliveryAddress.ward &&
             formData.contactInfo.phone && 
             formData.contactInfo.name
    }
    
    if (currentStep === 2) {
      // Check all required fields for step 2
      const hasDeliveryInfo = formData.deliveryAddress.street && 
                             formData.deliveryAddress.city &&
                             formData.deliveryAddress.district &&
                             formData.deliveryAddress.ward &&
                             formData.contactInfo.phone && 
                             formData.contactInfo.name
      
      const hasPaymentMethod = formData.paymentMethod
      
      return hasDeliveryInfo && hasPaymentMethod
    }
    
    return true
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Giỏ hàng trống
        </h2>
        <p className="text-gray-600 mb-6">
          Thêm món vào giỏ hàng trước khi thanh toán.
        </p>
        <button
          onClick={() => navigate('/customer/restaurants')}
          className="btn btn-primary"
        >
          Xem Nhà Hàng
        </button>
      </div>
    )
  }

  const deliveryFee = getDeliveryFee()
  const subtotal = getSubtotal()
  const total = getTotal()
  const totalWeight = getTotalWeight()

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thanh Toán</h1>
          <p className="text-gray-600">Hoàn tất đơn hàng của bạn</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className="font-medium">Thông Tin Giao Hàng</span>
          </div>
          
          <div className={`flex-1 h-1 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '2'}
            </div>
            <span className="font-medium">Thanh Toán</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {currentStep === 1 && (
            <DeliveryInfoStep 
              formData={formData} 
              onChange={handleChange}
              savedPaymentInfo={savedPaymentInfo}
              showSavedAddresses={showSavedAddresses}
              setShowSavedAddresses={setShowSavedAddresses}
              onSelectSavedAddress={handleSelectSavedAddress}
            />
          )}
          
          {currentStep === 2 && (
            <PaymentStep 
              formData={formData} 
              onChange={handleChange}
              isSubmitting={isSubmitting}
              paymentUrl={paymentUrl}
            />
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Tóm Tắt Đơn Hàng</h3>
            
            {/* Restaurant Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{restaurant?.name}</h4>
              <p className="text-sm text-gray-600">Giao hàng bằng drone</p>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.menuItemId} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-3 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Tạm tính</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Phí giao hàng</span>
                <span className="font-medium">{formatCurrency(deliveryFee)}</span>
              </div>
              
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Phí dịch vụ</span>
                <span className="font-medium">Miễn phí</span>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-3 mb-6">
              <div className="flex justify-between">
                <span className="font-semibold text-lg">Tổng</span>
                <span className="font-bold text-lg text-primary-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            {currentStep === 1 && (
              <button
                type="submit"
                disabled={!isFormValid()}
                className="btn btn-primary w-full btn-lg"
              >
                Tiếp Tục Thanh Toán
              </button>
            )}

            {currentStep === 2 && !paymentUrl && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full btn-lg flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang Tạo Đơn...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Đặt Hàng</span>
                  </>
                )}
              </button>
            )}

            {paymentUrl && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Cửa sổ thanh toán đã mở. Hoàn tất thanh toán để xác nhận đơn hàng.
                </p>
                <button
                  onClick={() => window.open(paymentUrl, '_blank')}
                  className="btn btn-primary w-full"
                >
                  Mở Cửa Sổ Thanh Toán
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

// Delivery Info Step Component
function DeliveryInfoStep({ formData, onChange, savedPaymentInfo, showSavedAddresses, setShowSavedAddresses, onSelectSavedAddress }) {
  return (
    <div className="space-y-6">
      {/* Saved Addresses */}
      {savedPaymentInfo.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Địa chỉ đã lưu</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowSavedAddresses(!showSavedAddresses)}
              className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
            >
              <span className="text-sm">
                {showSavedAddresses ? 'Ẩn' : 'Hiện'} ({savedPaymentInfo.length})
              </span>
              {showSavedAddresses ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showSavedAddresses && (
            <div className="space-y-3">
              {savedPaymentInfo.map((paymentInfo) => (
                <div
                  key={paymentInfo._id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors"
                  onClick={() => onSelectSavedAddress(paymentInfo)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {paymentInfo.contactInfo.name}
                        </span>
                        {paymentInfo.isDefault && (
                          <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {paymentInfo.contactInfo.phone}
                      </p>
                      <p className="text-sm text-gray-600">
                        {paymentInfo.deliveryAddress.street}, {paymentInfo.deliveryAddress.ward}, {paymentInfo.deliveryAddress.district}, {paymentInfo.deliveryAddress.city}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Chọn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delivery Address */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>{t('Địa chỉ')} Giao Hàng</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa Chỉ Đường *
            </label>
            <input
              type="text"
              value={formData.deliveryAddress.street}
              onChange={(e) => onChange('deliveryAddress.street', e.target.value)}
              className="input w-full"
              placeholder="Nhập địa chỉ đường của bạn"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phường/Xã *
            </label>
            <input
              type="text"
              value={formData.deliveryAddress.ward}
              onChange={(e) => onChange('deliveryAddress.ward', e.target.value)}
              className="input w-full"
              placeholder="Tên phường"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quận/Huyện *
            </label>
            <input
              type="text"
              value={formData.deliveryAddress.district}
              onChange={(e) => onChange('deliveryAddress.district', e.target.value)}
              className="input w-full"
              placeholder="Quận 1"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thành Phố *
            </label>
            <input
              type="text"
              value={formData.deliveryAddress.city}
              onChange={(e) => onChange('deliveryAddress.city', e.target.value)}
              className="input w-full"
              placeholder="Thành phố Hồ Chí Minh"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi Chú Giao Hàng
            </label>
            <textarea
              value={formData.deliveryAddress.notes}
              onChange={(e) => onChange('deliveryAddress.notes', e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="Tên tòa nhà, tầng, số căn hộ, v.v..."
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Thông Tin Liên Hệ</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Họ Tên *
            </label>
            <input
              type="text"
              value={formData.contactInfo.name}
              onChange={(e) => onChange('contactInfo.name', e.target.value)}
              className="input w-full"
              placeholder="Nhập họ tên của bạn"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Số điện thoại')} *
            </label>
            <input
              type="tel"
              value={formData.contactInfo.phone}
              onChange={(e) => onChange('contactInfo.phone', e.target.value)}
              className="input w-full"
              placeholder="Nhập số điện thoại"
              required
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Payment Step Component
function PaymentStep({ formData, onChange, isSubmitting, paymentUrl }) {
  const paymentMethods = [
    {
      id: 'cod',
      name: 'Thanh toán khi nhận hàng (COD)',
      description: 'Thanh toán bằng tiền mặt khi nhận hàng',
      icon: '💰',
      recommended: true
    },
    {
      id: 'momo',
      name: 'Ví MoMo',
      description: 'Thanh toán qua ví điện tử MoMo',
      icon: '💳',
      recommended: false
    }
  ]

  return (
    <div className="space-y-6">
      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Phương thức thanh toán</span>
        </h3>
        
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.paymentMethod === method.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onChange('paymentMethod', method.id)}
            >
              <span className="text-2xl mr-3">{method.icon}</span>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{method.name}</span>
                  {method.recommended && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                      Khuyến nghị
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                formData.paymentMethod === method.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {formData.paymentMethod === method.id && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {paymentUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Cửa Sổ Thanh Toán Đã Mở</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Hoàn tất thanh toán trong cửa sổ đã mở để xác nhận đơn hàng.
          </p>
        </div>
      )}
    </div>
  )
}

export default Checkout


