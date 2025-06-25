import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useUserStore from '../store/useUserStore'

function OnboardingCheck({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { needsOnboarding } = useUserStore()

  useEffect(() => {
    // Don't redirect if already on preferences page or auth pages
    const excludedPaths = ['/preferences', '/login', '/signup', '/welcome']
    
    if (needsOnboarding() && !excludedPaths.includes(location.pathname)) {
      navigate('/preferences', { replace: true })
    }
  }, [needsOnboarding, navigate, location.pathname])

  return children
}

export default OnboardingCheck 