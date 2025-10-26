import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { Eye, EyeOff, Loader2, User, Mail, Phone, Lock, Building2, MapPin, Image, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

function RestaurantRegister() {
  const [formData, setFormData] = useState({
    // User info
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'restaurant',
    // Restaurant info
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: '',
    restaurantDescription: '',
    imageUrl: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [restaurantPhoneError, setRestaurantPhoneError] = useState('')
  const [isCheckingRestaurantPhone, setIsCheckingRestaurantPhone] = useState(false)
  
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear errors when user starts typing
    if (name === 'phone') {
      setPhoneError('')
    }
    if (name === 'email') {
      setEmailError('')
    }
    if (name === 'restaurantPhone') {
      setRestaurantPhoneError('')
    }
  }

  // Debounce phone check for owner phone
  useEffect(() => {
    const checkPhone = async () => {
      if (formData.phone && formData.phone.length >= 10) {
        setIsCheckingPhone(true)
        try {
          const response = await authService.checkPhoneAvailability(formData.phone)
          if (!response.data.available) {
            setPhoneError(response.data.message)
          } else {
            setPhoneError('')
          }
        } catch (error) {
          console.error('Error checking phone:', error)
        } finally {
          setIsCheckingPhone(false)
        }
      }
    }

    const timeoutId = setTimeout(checkPhone, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.phone])

  // Debounce email check
  useEffect(() => {
    const checkEmail = async () => {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (formData.email && emailRegex.test(formData.email)) {
        setIsCheckingEmail(true)
        try {
          const response = await authService.checkEmailAvailability(formData.email)
          if (!response.data.available) {
            setEmailError(response.data.message)
          } else {
            setEmailError('')
          }
        } catch (error) {
          console.error('Error checking email:', error)
        } finally {
          setIsCheckingEmail(false)
        }
      }
    }

    const timeoutId = setTimeout(checkEmail, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.email])

  // Debounce phone check for restaurant phone
  useEffect(() => {
    const checkPhone = async () => {
      if (formData.restaurantPhone && formData.restaurantPhone.length >= 10) {
        // Check if restaurant phone is different from owner phone
        if (formData.restaurantPhone !== formData.phone) {
          setIsCheckingRestaurantPhone(true)
          try {
            const response = await authService.checkPhoneAvailability(formData.restaurantPhone)
            if (!response.data.available) {
              setRestaurantPhoneError(response.data.message)
            } else {
              setRestaurantPhoneError('')
            }
          } catch (error) {
            console.error('Error checking restaurant phone:', error)
          } finally {
            setIsCheckingRestaurantPhone(false)
          }
        } else {
          // If restaurant phone is same as owner phone, clear error
          setRestaurantPhoneError('')
        }
      }
    }

    const timeoutId = setTimeout(checkPhone, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.restaurantPhone, formData.phone])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (emailError) {
      toast.error('Vui lòng kiểm tra lại email')
      return
    }

    if (phoneError) {
      toast.error('Vui lòng kiểm tra lại số điện thoại chủ sở hữu')
      return
    }

    if (restaurantPhoneError) {
      toast.error('Vui lòng kiểm tra lại số điện thoại nhà hàng')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu không khớp')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setIsLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      console.log('Registering with data:', registerData)
      const response = await authService.register(registerData)
      
      if (response.success) {
        // Redirect to login page with approval message
        navigate('/login', { 
          state: { message: 'Đăng ký thành công! Hồ sơ nhà hàng của bạn đang chờ xét duyệt. Bạn sẽ nhận email khi được duyệt.' }
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.error || 'Đăng ký thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Đăng Ký Nhà Hàng</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Account Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Tài Khoản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và Tên Chủ Sở Hữu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Số Điện Thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input w-full pl-10 ${phoneError ? 'pr-10 border-red-500' : ''}`}
                    placeholder="0901234567"
                  />
                  {isCheckingPhone && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                {phoneError && (
                  <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                )}
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`input w-full pl-10 ${emailError ? 'pr-10 border-red-500' : ''}`}
                    placeholder="restaurant@example.com"
                  />
                  {isCheckingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mật Khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input w-full pl-10 pr-10"
                    placeholder="Ít nhất 6 ký tự"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Xác Nhận Mật Khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input w-full pl-10 pr-10"
                    placeholder="Nhập lại mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Restaurant Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Nhà Hàng</h3>
            <div className="space-y-4">
              {/* Restaurant Name */}
              <div>
                <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Nhà Hàng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="restaurantName"
                    name="restaurantName"
                    type="text"
                    required
                    value={formData.restaurantName}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="VD: Nhà Hàng Pizza ABC"
                  />
                </div>
              </div>

              {/* Restaurant Address */}
              <div>
                <label htmlFor="restaurantAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Địa Chỉ Nhà Hàng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    id="restaurantAddress"
                    name="restaurantAddress"
                    required
                    rows={2}
                    value={formData.restaurantAddress}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
                  />
                </div>
              </div>

              {/* Restaurant Phone */}
              <div>
                <label htmlFor="restaurantPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Số Điện Thoại Nhà Hàng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="restaurantPhone"
                    name="restaurantPhone"
                    type="tel"
                    required
                    value={formData.restaurantPhone}
                    onChange={handleChange}
                    className={`input w-full pl-10 ${restaurantPhoneError ? 'pr-10 border-red-500' : ''}`}
                    placeholder="0281234567"
                  />
                  {isCheckingRestaurantPhone && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                {restaurantPhoneError && (
                  <p className="mt-1 text-sm text-red-600">{restaurantPhoneError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Có thể giống số điện thoại chủ sở hữu
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="restaurantDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô Tả Nhà Hàng
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    id="restaurantDescription"
                    name="restaurantDescription"
                    rows={3}
                    value={formData.restaurantDescription}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="Giới thiệu về nhà hàng của bạn..."
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Link Ảnh Nhà Hàng
                </label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="imageUrl"
                    name="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  URL hình ảnh nhà hàng (không bắt buộc)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3 text-base font-semibold bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Đang xử lý...
              </>
            ) : (
              'Đăng Ký Nhà Hàng'
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="space-y-3 text-center text-sm border-t border-gray-200 pt-6">
          <p className="text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
              Đăng nhập ngay
            </Link>
          </p>
          <p className="text-gray-600">
            Bạn là khách hàng?{' '}
            <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
              Đăng ký khách hàng
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RestaurantRegister

