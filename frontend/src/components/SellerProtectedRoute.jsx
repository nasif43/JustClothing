import { Navigate, useLocation } from 'react-router-dom'
import useUserStore from '../store/useUserStore'

function SellerProtectedRoute({ children }) {
  const { isAuthenticated, user } = useUserStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user is a seller and is verified
  if (user?.user_type !== 'seller' || !user?.is_verified) {
    // Redirect to seller onboarding if not a verified seller
    return <Navigate to="/seller" replace />
  }

  return children
}

export default SellerProtectedRoute 