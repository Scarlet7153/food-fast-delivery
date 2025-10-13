import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { 
  Minus, Plus, Trash2, ShoppingBag, ArrowLeft,
  MapPin, Clock, CreditCard, Truck
} from 'lucide-react'
import { formatCurrency, formatWeight } from '../../utils/formatters'
import toast from 'react-hot-toast'

function Cart() {
  const navigate = useNavigate()
  const {
    items,
    restaurant,
    getSubtotal,
    getDeliveryFee,
    getTotal,
    getTotalWeight,
    updateQuantity,
    removeItem,
    updateSpecialInstructions,
    clearCart,
    isEmpty
  } = useCartStore()

  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleQuantityChange = (menuItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(menuItemId)
    } else {
      updateQuantity(menuItemId, newQuantity)
    }
  }

  const handleRemoveItem = (menuItemId, itemName) => {
    if (window.confirm(`Xóa ${itemName} khỏi giỏ hàng?`)) {
      removeItem(menuItemId)
      toast.success('Đã xóa khỏi giỏ hàng')
    }
  }

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      clearCart()
      toast.success('Đã xóa giỏ hàng')
    }
  }

  const handleCheckout = () => {
    setIsCheckingOut(true)
    navigate('/customer/checkout')
  }

  if (isEmpty()) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ShoppingBag className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Giỏ hàng trống
          </h2>
          <p className="text-gray-600 mb-6">
            Thêm món ngon từ các nhà hàng để bắt đầu đặt hàng.
          </p>
          <button
            onClick={() => navigate('/customer/restaurants')}
            className="btn btn-primary"
          >
            Xem Nhà Hàng
          </button>
        </div>
      </div>
    )
  }

  const deliveryFee = getDeliveryFee()
  const subtotal = getSubtotal()
  const total = getTotal()
  const totalWeight = getTotalWeight()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('Giỏ Hàng')}</h1>
            <p className="text-gray-600">
              {restaurant?.name} • {items.length} món
            </p>
          </div>
        </div>
        <button
          onClick={handleClearCart}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Xóa Giỏ Hàng
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Đặt hàng từ {restaurant?.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Giao bằng Drone • Tổng trọng lượng {formatWeight(totalWeight)}
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <CartItem
                  key={item.menuItemId}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                  onUpdateInstructions={updateSpecialInstructions}
                />
              ))}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Thông Tin Giao Hàng</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">{t('Địa chỉ')} Giao Hàng</p>
                  <p className="text-sm text-gray-600">
                    Vị trí hiện tại (Phát hiện qua GPS)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">{t('Thời gian ước tính')}</p>
                  <p className="text-sm text-gray-600">
                    25-35 phút qua drone
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Phương Thức Giao Hàng</p>
                  <p className="text-sm text-gray-600">
                    Giao không tiếp xúc bằng drone
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Tóm Tắt Đơn Hàng</h3>
            
            {/* Items */}
            <div className="space-y-3 mb-4">
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

            {/* Subtotal */}
            <div className="border-t border-gray-200 pt-3 mb-3">
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

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="btn btn-primary w-full btn-lg flex items-center justify-center space-x-2"
            >
              <CreditCard className="h-5 w-5" />
              <span>Tiến Hành Thanh Toán</span>
            </button>

            {/* Payment Methods */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">{t('Phương thức thanh toán')}:</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>💳 Thẻ tín dụng</span>
                <span>📱 Ví MoMo</span>
                <span>🏦 Chuyển khoản</span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">
                🔒 Thông tin thanh toán được bảo mật và mã hóa
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Cart Item Component
function CartItem({ item, onQuantityChange, onRemove, onUpdateInstructions }) {
  const [showInstructions, setShowInstructions] = useState(false)

  return (
    <div className="p-6">
      <div className="flex items-start space-x-4">
        {/* Item Image */}
        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
          <img
            src={item.imageUrl || '/api/placeholder/64/64'}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(item.price)} / món
              </p>
            </div>
            <button
              onClick={() => onRemove(item.menuItemId, item.name)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onQuantityChange(item.menuItemId, item.quantity - 1)}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-medium w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => onQuantityChange(item.menuItemId, item.quantity + 1)}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="mt-3">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {showInstructions ? 'Ẩn' : 'Thêm'} yêu cầu đặc biệt
            </button>
            
            {showInstructions && (
              <div className="mt-2">
                <textarea
                  value={item.specialInstructions}
                  onChange={(e) => onUpdateInstructions(item.menuItemId, e.target.value)}
                  placeholder="VD: Không hành, thêm cay, v.v..."
                  className="input w-full text-sm"
                  rows={2}
                />
              </div>
            )}
            
            {item.specialInstructions && !showInstructions && (
              <p className="text-sm text-gray-600 mt-1 italic">
                "{item.specialInstructions}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart

