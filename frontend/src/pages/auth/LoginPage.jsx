import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import useUserStore from '../../store/useUserStore'
import GoogleSignInButton from '../../components/GoogleSignInButton'
import marbleBg from '../../assets/marble-bg.jpg'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loading, error, setError } = useUserStore()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Check for success message from registration
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
    }
  }, [location])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(formData)
      // Check if user was trying to access a specific page
      const redirectTo = location.state?.from || '/home'
      navigate(redirectTo) // Redirect to intended page or home page after successful login
    } catch (error) {
      // Error is handled by the store
      console.error('Login failed:', error)
    }
  }

  const handleGoogleSuccess = (data) => {
    // Check if user was trying to access a specific page
    const redirectTo = location.state?.from || '/home'
    navigate(redirectTo)
  }

  const handleGoogleError = (error) => {
    setError(error)
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ 
        backgroundImage: `url(${marbleBg})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }}
    >
      <div className="max-w-md w-full space-y-8 bg-white/90 rounded-xl shadow-lg p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/signup" className="font-medium text-black hover:text-gray-700 underline">
              create a new account
            </Link>
          </p>
        </div>
        
        {/* Google Sign In */}
        <div className="mt-8">
          <GoogleSignInButton 
            text="Sign in with Google"
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

        {/* Divider */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>
        </div>
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {successMessage && (
                    <div className="rounded-md bg-gray-100 p-4 border border-gray-300">
          <div className="text-sm text-black">{successMessage}</div>
        </div>
          )}
          
          {error && (
                    <div className="rounded-md bg-gray-100 p-4 border border-gray-300">
          <div className="text-sm text-black">{error}</div>
        </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input mt-1"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input mt-1"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-black hover:text-gray-700 underline">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage 