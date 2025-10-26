import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'
import { authService } from '../../services/authService'

function Register() {
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
        // Redirect based on user role
        const user = result.user
        switch (user.role) {
          case 'customer':
            navigate('/customer')
            break
          case 'restaurant':
            navigate('/restaurant')
            break
          case 'admin':
            navigate('/admin')
            break
          default:
            navigate('/')
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      // Error is handled by the store
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Tạo tài khoản</h2>
        <p className="mt-2 text-sm text-gray-600">
          Tham gia FFDD và bắt đầu đặt đồ ăn giao bằng drone
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {t('Tên')} đầy đủ
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="input w-full"
              placeholder="Nhập tên đầy đủ của bạn"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('Email')}
          </label>
          <div className="mt-1 relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`input w-full ${emailError ? 'border-red-500' : ''}`}
              placeholder="Nhập email của bạn"
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

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            {t('Số điện thoại')}
          </label>
          <div className="mt-1 relative">
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              className={`input w-full ${phoneError ? 'border-red-500' : ''}`}
              placeholder="Nhập số điện thoại của bạn"
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

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Loại tài khoản
          </label>
          <div className="mt-1">
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input w-full"
            >
              <option value="customer">Khách hàng</option>
              <option value="restaurant">Chủ nhà hàng</option>
            </select>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {formData.role === 'restaurant' 
              ? 'Bạn sẽ quản lý nhà hàng và drone của mình'
              : 'Bạn sẽ đặt đồ ăn và theo dõi giao hàng'
            }
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t('Mật khẩu')}
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="input w-full pr-10"
              placeholder="Nhập mật khẩu của bạn"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            {t('Xác nhận mật khẩu')}
          </label>
          <div className="mt-1 relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input w-full pr-10"
              placeholder="Nhập lại mật khẩu"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            Tôi đồng ý với{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-500">
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
              Chính sách bảo mật
            </Link>
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full btn-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              'Tạo tài khoản'
            )}
          </button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            {t('Đăng Nhập')} tại đây
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
