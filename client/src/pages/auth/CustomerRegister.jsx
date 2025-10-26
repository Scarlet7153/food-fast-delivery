import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Eye, EyeOff, Loader2, User, Mail, Phone, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'

function CustomerRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'customer'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  
  const { register } = useAuthStore()
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
  }

  // Debounce phone check
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (emailError) {
      toast.error('Vui lòng kiểm tra lại email')
      return
    }

    if (phoneError) {
      toast.error('Vui lòng kiểm tra lại số điện thoại')
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
      const result = await register(registerData)
      
      if (result.success) {
        toast.success('Đăng ký thành công!')
        navigate('/customer')
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Đăng Ký Khách Hàng</h2>
          <p className="mt-2 text-sm text-gray-600">
            Tạo tài khoản để đặt đồ ăn giao bằng drone
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Họ và Tên
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

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
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
                placeholder="email@example.com"
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

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Số Điện Thoại
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

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mật Khẩu
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
              Xác Nhận Mật Khẩu
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3 text-base font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Đang xử lý...
              </>
            ) : (
              'Đăng Ký'
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="space-y-3 text-center text-sm">
          <p className="text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Đăng nhập ngay
            </Link>
          </p>
          <p className="text-gray-600">
            Bạn là chủ nhà hàng?{' '}
            <Link to="/register/restaurant" className="font-medium text-primary-600 hover:text-primary-500">
              Đăng ký nhà hàng
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default CustomerRegister

