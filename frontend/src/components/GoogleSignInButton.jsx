import React, { useEffect, useRef } from 'react'
import useUserStore from '../store/useUserStore'

const GoogleSignInButton = ({ text = "Sign in with Google", onSuccess, onError }) => {
  const buttonRef = useRef(null)
  const { setUser, setToken, setIsAuthenticated } = useUserStore()

  useEffect(() => {
    // Load Google Identity Services script
    if (!window.google) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogleSignIn
      document.head.appendChild(script)
    } else {
      initializeGoogleSignIn()
    }

    return () => {
      // Cleanup if needed
    }
  }, [])

  const initializeGoogleSignIn = () => {
    if (window.google && buttonRef.current) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: text.includes('Sign up') ? 'signup_with' : 'signin_with',
        logo_alignment: 'left',
      })
    }
  }

  const handleCredentialResponse = async (response) => {
    try {
      // Send the credential to your backend
      const apiResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/auth/google-auth/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: response.credential,
        }),
      })

      const data = await apiResponse.json()

      if (apiResponse.ok) {
        // Store tokens and user data
        if (data.access) {
          localStorage.setItem('access_token', data.access)
          localStorage.setItem('refresh_token', data.refresh)
          setToken(data.access)
          setIsAuthenticated(true)
        }

        if (data.user) {
          setUser(data.user)
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(data)
        }
      } else {
        throw new Error(data.error || 'Google authentication failed')
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      if (onError) {
        onError(error.message)
      }
    }
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full"></div>
    </div>
  )
}

export default GoogleSignInButton 