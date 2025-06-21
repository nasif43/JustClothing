import { Navigate, useLocation } from 'react-router-dom'
import useUserStore from '../store/useUserStore'

function SellerProtectedRoute({ children }) {
  const { isAuthenticated, user } = useUserStore()
  const location = useLocation()

  // Debug logging
  console.log('SellerProtectedRoute Debug:', {
    isAuthenticated,
    user,
    userType: user?.user_type,
    permissions: user?.permissions,
    sellerApproved: user?.permissions?.seller_approved,
    sellerProfile: user?.seller_profile
  })

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has a seller profile (has applied)
  if (!user?.seller_profile) {
    console.log('No seller profile found - redirecting to seller onboarding')
    return <Navigate to="/seller" replace />
  }

  // Check if seller is approved
  if (!user?.permissions?.seller_approved) {
    console.log('Seller not approved - redirecting to seller onboarding')
    return <Navigate to="/seller" replace />
  }

  console.log('Access granted - rendering seller dashboard')
  return children
}

export default SellerProtectedRoute 