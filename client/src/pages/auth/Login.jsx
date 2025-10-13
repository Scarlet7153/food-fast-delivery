import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { t } from '../../utils/translations'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(formData)
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
      console.error('Login error:', error)
      // Error is handled by the store
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Chào mừng trở lại</h2>
        <p className="mt-2 text-sm text-gray-600">
          Đăng nhập vào tài khoản để tiếp tục
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('Email')}
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="input w-full"
              placeholder="Nhập email của bạn"
            />
          </div>
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
              autoComplete="current-password"
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

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
            Ghi nhớ đăng nhập
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
                Đang đăng nhập...
              </>
            ) : (
              t('Đăng Nhập')
            )}
          </button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            {t('Đăng Ký')} tại đây
          </Link>
        </p>
      </div>

      {/* Demo credentials */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Tài khoản Demo:</h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div>
            <strong>Quản trị viên:</strong> admin@ffdd.com / admin123
          </div>
          <div>
            <strong>Nhà hàng:</strong> restaurant1@ffdd.com / restaurant123
          </div>
          <div>
            <strong>Khách hàng:</strong> customer1@ffdd.com / customer123
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
