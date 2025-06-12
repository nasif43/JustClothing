//Sign up page for customers
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { register as registerAPI } from '../../services/api'
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

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(signupSchema)
    })

    const onSubmit = async (data) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await registerAPI({
                email: data.email,
                password: data.password,
                first_name: data.firstName,
                last_name: data.lastName,
                username: data.email, // Using email as username
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
            setError(error.message || 'An error occurred during registration')
        } finally {
            setIsLoading(false)
        }
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
                
                {error && (
                    <div className="rounded-md bg-red-50 p-4 border border-red-200">
                        <div className="text-sm text-red-700">{error}</div>
                    </div>
                )}
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                    <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
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
                                    <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
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
                                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
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
                                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
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
                                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
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
