import { useState, useEffect } from 'react'
import { TrendingUp, Target, Star, Crown, Zap } from 'lucide-react'
import { fetchSellerDashboardStats } from '../../services/api'

const RevenueProgress = () => {
  const [revenueData, setRevenueData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Premium tier threshold
  const PREMIUM_TIER_THRESHOLD = 50000 // 50,000 BDT

  useEffect(() => {
    const loadRevenueData = async () => {
      try {
        setLoading(true)
        const dashboardStats = await fetchSellerDashboardStats()
        setRevenueData(dashboardStats)
      } catch (error) {
        console.error('Failed to fetch revenue data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRevenueData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white/90 rounded-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded-full mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!revenueData) {
    return (
      <div className="bg-white/90 rounded-lg p-6 mb-6">
        <div className="text-center text-gray-500">
          Unable to load revenue data
        </div>
      </div>
    )
  }

  // Calculate progress towards premium tier
  const totalRevenue = revenueData.total_revenue || 0
  const progress = Math.min((totalRevenue / PREMIUM_TIER_THRESHOLD) * 100, 100)
  const remaining = Math.max(PREMIUM_TIER_THRESHOLD - totalRevenue, 0)
  const isPremiumTier = totalRevenue >= PREMIUM_TIER_THRESHOLD

  return (
    <div className="bg-white/90 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {isPremiumTier ? (
            <>
              <Crown className="h-5 w-5 text-black" />
              Premium Seller Status
            </>
          ) : (
            <>
              <Target className="h-5 w-5" />
              Path to Premium Tier
            </>
          )}
        </h2>
        
        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
          isPremiumTier 
            ? 'bg-black text-white border border-black' 
            : 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}>
          {isPremiumTier ? (
            <>
              <Star className="h-3 w-3" />
              Premium Seller
            </>
          ) : (
            'Standard Seller'
          )}
        </div>
      </div>
      
      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-black">
            ৳{totalRevenue.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">
            ৳{PREMIUM_TIER_THRESHOLD.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Premium Unlock</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${isPremiumTier ? 'text-black' : 'text-gray-600'}`}>
            {progress.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Progress</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
              isPremiumTier 
                ? 'bg-gradient-to-r from-black to-gray-700' 
                : 'bg-gradient-to-r from-gray-400 to-gray-600'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            {progress > 10 && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                {progress.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
        
        {progress <= 10 && (
          <div className="absolute top-1 left-2 text-gray-700 text-sm font-medium">
            {progress.toFixed(1)}%
          </div>
        )}
      </div>
      
      {/* Progress Details */}
      <div className="flex justify-between items-center text-sm">
        <div className="text-gray-600">
          {!isPremiumTier ? (
            <>
              <span className="font-medium">৳{remaining.toLocaleString()}</span> to unlock Premium Seller status
            </>
          ) : (
            <span className="text-black font-medium flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Premium benefits unlocked!
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-gray-500">
          {revenueData.growth_metrics && (
            <div className={`flex items-center gap-1 ${
              revenueData.growth_metrics.revenue_growth >= 0 ? 'text-gray-600' : 'text-gray-600'
            }`}>
              <TrendingUp className="h-4 w-4" />
              <span>{revenueData.growth_metrics.revenue_growth >= 0 ? '+' : ''}{revenueData.growth_metrics.revenue_growth}% vs last month</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Premium Tier Achievement */}
      {isPremiumTier && (
        <div className="mt-4 p-3 bg-black text-white rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Crown className="h-4 w-4" />
            Congratulations! You've unlocked Premium Seller status with exclusive benefits and priority support.
          </div>
        </div>
      )}
      
      {/* Almost There Motivation */}
      {!isPremiumTier && progress >= 80 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded-lg">
          <div className="flex items-center gap-2 text-gray-800 text-sm font-medium">
            <Star className="h-4 w-4" />
            You're so close to Premium status! Just ৳{remaining.toLocaleString()} more to unlock exclusive benefits.
          </div>
        </div>
      )}
      
      {/* Halfway Motivation */}
      {!isPremiumTier && progress >= 50 && progress < 80 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
            <Target className="h-4 w-4" />
            Great progress! You're halfway to Premium Seller status. Keep growing your business!
          </div>
        </div>
      )}
      
      {/* Benefits Preview */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-700 text-sm">
          <strong>Premium Seller Benefits:</strong> Unlock priority support, advanced analytics, featured listings, 
          and exclusive seller tools when you reach ৳50,000 in total revenue.
        </div>
      </div>
    </div>
  )
}

export default RevenueProgress 