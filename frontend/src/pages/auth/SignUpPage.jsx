//Sign up page for customers
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { register as registerAPI } from '../../services/api'
import GoogleSignInButton from '../../components/GoogleSignInButton'
import marbleBg from '../../assets/marble-bg.jpg'

const signupSchema = yup.object().shape({
    email: yup.string().email('Invalid email address').required('Email is required'),
    password: yup.string().min(8, 'Password must be at least 8 characters long').required('Password is required'),
    confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match').required('Confirm password is required'),
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
})

const SignUpPage = () => {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        resolver: yupResolver(signupSchema)
    })

    // Watch form changes to clear API errors
    const watchedFields = watch()
    
    // Clear API error when user starts typing
    React.useEffect(() => {
        if (error) {
            setError(null)
        }
    }, [watchedFields])

    const onSubmit = async (data) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await registerAPI({
                email: data.email,
                password: data.password,
                first_name: data.firstName,
                last_name: data.lastName,
                username: data.email,
                password_confirm: data.confirmPassword,
            })
            
            if (response) {
                // Registration successful, redirect to login
                navigate('/login', { 
                    state: { 
                        message: 'Account created successfully! Please log in.' 
                    } 
                })
            }
        } catch (error) {
            // Display the actual API error message
            setError(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSuccess = (data) => {
        // For Google sign-up, redirect to home since account is created automatically
        navigate('/home')
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
                        Sign up
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link to="/login" className="font-medium text-black hover:text-gray-700 underline">
                            Sign in to your account
                        </Link>
                    </p>
                </div>
                
                {/* Google Sign Up */}
                <div className="mt-8">
                    <GoogleSignInButton 
                        text="Sign up with Google"
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
                
                {error && (
                            <div className="rounded-md bg-gray-100 p-4 border border-gray-300">
          <div className="text-sm text-black">{error}</div>
        </div>
                )}
                
                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-900">First Name</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    {...register('firstName')}
                                    className="input"
                                    placeholder="Enter your first name"
                                />
                                {errors.firstName && (
                                    <p className="mt-2 text-sm text-black">{errors.firstName.message}</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-900">Last Name</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    {...register('lastName')}
                                    className="input"
                                    placeholder="Enter your last name"
                                />
                                {errors.lastName && (
                                    <p className="mt-2 text-sm text-black">{errors.lastName.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-900">Email</label>
                        <div className="mt-1">
                            <input
                                type="email"
                                {...register('email')}
                                className="input"
                                placeholder="Enter your email"
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-black">{errors.email.message}</p>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-900">Password</label>
                        <div className="mt-1">
                            <input
                                type="password"     
                                {...register('password')}
                                className="input"
                                placeholder="Enter your password"
                            />
                            {errors.password && (
                                <p className="mt-2 text-sm text-black">{errors.password.message}</p>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900">Confirm Password</label>
                        <div className="mt-1">
                            <input
                                type="password"
                                {...register('confirmPassword')}
                                className="input"
                                placeholder="Confirm your password"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-2 text-sm text-black">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing up...' : 'Sign up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SignUpPage
