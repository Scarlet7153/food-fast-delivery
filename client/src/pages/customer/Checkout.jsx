import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { useCartStore } from '../../stores/cartStore'
import { orderService } from '../../services/orderService'
import { paymentService } from '../../services/paymentService'
import { 
  ArrowLeft, MapPin, Clock, CreditCard, Phone, User,
  Truck, Shield, CheckCircle, Loader2
} from 'lucide-react'
import { formatCurrency, formatWeight } from '../../utils/formatters'
import toast from 'react-hot-toast'

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
    paymentMethod: 'momo',
    specialInstructions: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [paymentUrl, setPaymentUrl] = useState(null)

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

  // Create order mutation
  const createOrderMutation = useMutation(
    (orderData) => orderService.createOrder(orderData),
    {
      onSuccess: (response) => {
        const order = response.data.order
        toast.success('Order created successfully!')
        
        // Clear cart
        clearCart()
        
        // Navigate to payment or order detail
        if (order.paymentStatus === 'PAID') {
          navigate(`/customer/orders/${order._id}`)
        } else {
          handlePayment(order._id)
        }
      },
      onError: (error) => {
        console.error('Order creation error:', error)
        toast.error('Failed to create order. Please try again.')
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
        toast.error('Failed to create payment. Please try again.')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (currentStep === 1) {
      // Validate delivery info
      if (!formData.deliveryAddress.street || !formData.contactInfo.phone) {
        toast.error('Please fill in all required fields')
        return
      }
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      setIsSubmitting(true)
      
      // Save contact info for future use
      localStorage.setItem('checkout-contact', JSON.stringify(formData.contactInfo))
      
      // Create order
      const orderData = {
        restaurantId: restaurant._id,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions
        })),
        deliveryAddress: formData.deliveryAddress,
        contactInfo: formData.contactInfo,
        specialInstructions: formData.specialInstructions,
        paymentMethod: formData.paymentMethod
      }

      try {
        await createOrderMutation.mutateAsync(orderData)
      } catch (error) {
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
      toast.error('Failed to initiate payment')
    }
  }

  const isFormValid = () => {
    if (currentStep === 1) {
      return formData.deliveryAddress.street && 
             formData.contactInfo.phone && 
             formData.contactInfo.name
    }
    return true
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Your cart is empty
        </h2>
        <p className="text-gray-600 mb-6">
          Add some items to your cart before checkout.
        </p>
        <button
          onClick={() => navigate('/customer/restaurants')}
          className="btn btn-primary"
        >
          Browse Restaurants
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
          <p className="text-gray-600">Complete your order</p>
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
            <span className="font-medium">Delivery Info</span>
          </div>
          
          <div className={`flex-1 h-1 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '2'}
            </div>
            <span className="font-medium">Thanh toán</span>
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
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            
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
                <span className="text-gray-600">Service Fee</span>
                <span className="font-medium">Free</span>
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

            {/* Delivery Info */}
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4" />
                <span>{formatWeight(totalWeight)} total weight</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>25-35 min delivery</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Contactless delivery</span>
              </div>
            </div>

            {/* Submit Button */}
            {currentStep === 1 && (
              <button
                type="submit"
                disabled={!isFormValid()}
                className="btn btn-primary w-full btn-lg"
              >
                Continue to Payment
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
                    <span>Creating Order...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Place Order</span>
                  </>
                )}
              </button>
            )}

            {paymentUrl && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Payment window opened. Complete payment to confirm your order.
                </p>
                <button
                  onClick={() => window.open(paymentUrl, '_blank')}
                  className="btn btn-primary w-full"
                >
                  Open Payment Window
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
function DeliveryInfoStep({ formData, onChange }) {
  return (
    <div className="space-y-6">
      {/* Delivery Address */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Delivery Address</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.deliveryAddress.street}
              onChange={(e) => onChange('deliveryAddress.street', e.target.value)}
              className="input w-full"
              placeholder="Enter your street address"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.deliveryAddress.city}
              onChange={(e) => onChange('deliveryAddress.city', e.target.value)}
              className="input w-full"
              placeholder="Ho Chi Minh City"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              District
            </label>
            <input
              type="text"
              value={formData.deliveryAddress.district}
              onChange={(e) => onChange('deliveryAddress.district', e.target.value)}
              className="input w-full"
              placeholder="District 1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ward
            </label>
            <input
              type="text"
              value={formData.deliveryAddress.ward}
              onChange={(e) => onChange('deliveryAddress.ward', e.target.value)}
              className="input w-full"
              placeholder="Ward name"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Notes
            </label>
            <textarea
              value={formData.deliveryAddress.notes}
              onChange={(e) => onChange('deliveryAddress.notes', e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="Building name, floor, apartment number, etc."
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Contact Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.contactInfo.name}
              onChange={(e) => onChange('contactInfo.name', e.target.value)}
              className="input w-full"
              placeholder="Your full name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.contactInfo.phone}
              onChange={(e) => onChange('contactInfo.phone', e.target.value)}
              className="input w-full"
              placeholder="Your phone number"
              required
            />
          </div>
        </div>
      </div>

      {/* Special Instructions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Hướng dẫn đặc biệt</h3>
        <textarea
          value={formData.specialInstructions}
          onChange={(e) => onChange('specialInstructions', e.target.value)}
          className="input w-full"
          rows={3}
          placeholder="Any special instructions for your order..."
        />
      </div>
    </div>
  )
}

// Payment Step Component
function PaymentStep({ formData, onChange, isSubmitting, paymentUrl }) {
  const paymentMethods = [
    {
      id: 'momo',
      name: 'MoMo Wallet',
      description: 'Pay with your MoMo wallet',
      icon: '💳',
      recommended: true
    },
    {
      id: 'credit_card',
      name: 'Credit Card',
      description: 'Pay with Visa, Mastercard',
      icon: '💳'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Transfer from your bank account',
      icon: '🏦'
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
            <label
              key={method.id}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.paymentMethod === method.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={formData.paymentMethod === method.id}
                onChange={(e) => onChange('paymentMethod', e.target.value)}
                className="sr-only"
              />
              
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{method.name}</span>
                    {method.recommended && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Security */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-800">Secure Payment</span>
        </div>
        <p className="text-sm text-green-700 mt-1">
          Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.
        </p>
      </div>

      {paymentUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Payment Window Opened</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Complete your payment in the opened window to confirm your order.
          </p>
        </div>
      )}
    </div>
  )
}

export default Checkout

