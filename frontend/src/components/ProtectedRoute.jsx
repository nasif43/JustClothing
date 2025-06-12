import { Navigate, useLocation } from 'react-router-dom'
import useUserStore from '../store/useUserStore'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useUserStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute 