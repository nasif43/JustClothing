import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, TrendingUp, TrendingDown, Package, ShoppingCart, Users, MessageCircle, Target, ExternalLink } from 'lucide-react'
import { fetchSellerDashboardStats } from '../../services/api'

const StatisticsCards = () => {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true)
        const stats = await fetchSellerDashboardStats()
        setDashboardStats(stats)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardStats()
  }, [])

  const handleCardClick = (linkTo, filterParams = {}) => {
    if (linkTo) {
      // Navigate with state for filtering if needed
      navigate(linkTo, { state: filterParams })
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-600 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-600 rounded w-full"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!dashboardStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 text-center">
          <div className="text-gray-800">Unable to load statistics</div>
        </div>
      </div>
    )
  }

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-gray-300" />
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-gray-500" />
    return null
  }

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-gray-300'
    if (growth < 0) return 'text-gray-500'
    return 'text-gray-400'
  }

  const statsConfig = [
    {
      title: "Monthly Revenue",
      value: `৳${dashboardStats.current_month.revenue.toLocaleString()}`,
      icon: Target,
      bgColor: "bg-gradient-to-br from-gray-800 to-gray-900",
      growth: dashboardStats.growth_metrics.revenue_growth,
      subtitle: "This month's earnings",
      linkTo: "/seller/orders",
      filterParams: { period: "monthly", type: "revenue" },
      description: "View monthly revenue breakdown"
    },
    {
      title: "Monthly Orders",
      value: dashboardStats.current_month.orders.toString(),
      icon: ShoppingCart,
      bgColor: "bg-gradient-to-br from-gray-700 to-gray-800",
      growth: dashboardStats.growth_metrics.orders_growth,
      subtitle: "Orders this month",
      linkTo: "/seller/orders",
      filterParams: { period: "monthly" },
      description: "View this month's orders"
    },
    {
      title: "Store Rating",
      value: dashboardStats.seller_info.rating.toFixed(1),
      icon: Star,
      bgColor: "bg-gradient-to-br from-gray-600 to-gray-700",
      subtitle: `${dashboardStats.reviews.total} total reviews`,
      hideGrowth: true,
      linkTo: "/seller/reviews",
      description: "View all customer reviews"
    },
    {
      title: "Total Products",
      value: dashboardStats.products.total.toString(),
      icon: Package,
      bgColor: "bg-gradient-to-br from-gray-900 to-black",
      subtitle: `${dashboardStats.products.active} active products`,
      hideGrowth: true,
      linkTo: "/seller/products",
      description: "Manage all your products"
    },
    {
      title: "Average Order Value",
      value: `৳${dashboardStats.current_month.average_order_value.toFixed(0)}`,
      icon: TrendingUp,
      bgColor: "bg-gradient-to-br from-gray-800 to-gray-900",
      subtitle: "Per order average",
      hideGrowth: true,
      linkTo: "/seller/orders",
      filterParams: { type: "analytics" },
      description: "View order analytics"
    },
    {
      title: "Items Sold",
      value: dashboardStats.current_month.items_sold.toString(),
      icon: Package,
      bgColor: "bg-gradient-to-br from-gray-700 to-gray-800",
      growth: dashboardStats.growth_metrics.items_growth,
      subtitle: "Items this month",
      linkTo: "/seller/orders",
      filterParams: { period: "monthly", type: "items" },
      description: "View sales details"
    },
    {
      title: "Monthly Reviews",
      value: dashboardStats.reviews.this_month.toString(),
      icon: MessageCircle,
      bgColor: "bg-gradient-to-br from-gray-600 to-gray-700",
      subtitle: "New reviews this month",
      hideGrowth: true,
      linkTo: "/seller/reviews",
      filterParams: { period: "monthly" },
      description: "View recent reviews"
    },
    {
      title: "Low Stock Items",
      value: dashboardStats.products.low_stock.toString(),
      icon: Package,
      bgColor: "bg-gradient-to-br from-black to-gray-900",
      subtitle: "Need restocking",
      hideGrowth: true,
      isAlert: dashboardStats.products.low_stock > 0,
      linkTo: "/seller/products",
      filterParams: { stockStatus: "low_stock" },
      description: "View low stock products"
    }
  ]

  // Show only the most important stats by default, with option to show more
  const displayedStats = showAll ? statsConfig : statsConfig.slice(0, 4)

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {displayedStats.map((stat, index) => {
          const IconComponent = stat.icon
          const hasGrowth = !stat.hideGrowth && stat.growth !== undefined
          const isPositiveGrowth = hasGrowth && stat.growth > 0
          const isNegativeGrowth = hasGrowth && stat.growth < 0

          return (
            <div
              key={index}
              onClick={() => handleCardClick(stat.linkTo, stat.filterParams)}
              className={`${stat.bgColor} text-white rounded-lg p-6 relative overflow-hidden transition-all duration-200 border border-gray-600 ${
                stat.linkTo 
                  ? 'cursor-pointer hover:scale-105 hover:shadow-lg' 
                  : 'cursor-default'
              }`}
              title={stat.description}
            >
              {/* Navigation indicator */}
              {stat.linkTo && (
                <div className="absolute top-2 left-2">
                  <ExternalLink className="h-4 w-4 opacity-60" />
                </div>
              )}

              {/* Alert indicator */}
              {stat.isAlert && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              )}

              {/* Icon */}
              <div className="flex items-center justify-between mb-3">
                <IconComponent className="h-8 w-8 opacity-80" />
                {hasGrowth && (
                  <div className={`flex items-center gap-1 text-sm ${getGrowthColor(stat.growth)}`}>
                    {getGrowthIcon(stat.growth)}
                    <span className="font-medium">
                      {isPositiveGrowth && '+'}{stat.growth.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Value */}
              <div className="text-3xl font-bold mb-1 leading-tight">
                {stat.value}
              </div>

              {/* Title and Subtitle */}
              <div className="space-y-1">
                <h3 className="text-lg font-semibold opacity-90">
                  {stat.title}
                </h3>
                <p className="text-sm opacity-70">
                  {stat.subtitle}
                </p>
              </div>

              {/* Growth text */}
              {hasGrowth && (
                <div className="mt-2 text-xs opacity-70">
                  vs last month
                </div>
              )}

              {/* Click indicator */}
              {stat.linkTo && (
                <div className="mt-2 text-xs opacity-60 flex items-center gap-1">
                  <span>Click to view details</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              )}

              {/* Background decoration */}
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <IconComponent className="h-24 w-24" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Toggle to show more stats */}
      {statsConfig.length > 4 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors text-sm font-medium border border-gray-400"
          >
            {showAll ? 'Show Less' : `Show ${statsConfig.length - 4} More Stats`}
          </button>
        </div>
      )}

      {/* Navigation note */}
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Click on cards with <ExternalLink className="inline h-4 w-4" /> to view detailed information</p>
      </div>

      {/* Quick insights */}
      {dashboardStats && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Revenue Insight */}
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
            <h4 className="font-medium text-gray-900 mb-2">Revenue Insight</h4>
            <p className="text-sm text-gray-700">
              {dashboardStats.growth_metrics.revenue_growth > 0 ? (
                <>Your revenue increased by <span className="font-medium text-gray-900">{dashboardStats.growth_metrics.revenue_growth.toFixed(1)}%</span> this month. Keep it up!</>
              ) : dashboardStats.growth_metrics.revenue_growth < 0 ? (
                <>Revenue decreased by <span className="font-medium text-gray-900">{Math.abs(dashboardStats.growth_metrics.revenue_growth).toFixed(1)}%</span>. Consider promoting your products.</>
              ) : (
                <>Revenue is stable this month. Try new marketing strategies to boost sales.</>
              )}
            </p>
          </div>

          {/* Product Insight */}
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
            <h4 className="font-medium text-gray-900 mb-2">Product Status</h4>
            <p className="text-sm text-gray-700">
              {dashboardStats.products.out_of_stock > 0 ? (
                <>You have <span className="font-medium text-gray-900">{dashboardStats.products.out_of_stock} out of stock</span> products. Restock to avoid lost sales.</>
              ) : dashboardStats.products.low_stock > 0 ? (
                <>You have <span className="font-medium text-gray-900">{dashboardStats.products.low_stock} low stock</span> items. Consider restocking soon.</>
              ) : (
                <>All products are well-stocked. Great inventory management!</>
              )}
            </p>
          </div>

          {/* Rating Insight */}
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
            <h4 className="font-medium text-gray-900 mb-2">Customer Feedback</h4>
            <p className="text-sm text-gray-700">
              {dashboardStats.seller_info.rating >= 4.5 ? (
                <>Excellent rating of <span className="font-medium text-gray-900">{dashboardStats.seller_info.rating.toFixed(1)}/5</span>! Customers love your service.</>
              ) : dashboardStats.seller_info.rating >= 4 ? (
                <>Good rating of <span className="font-medium text-gray-900">{dashboardStats.seller_info.rating.toFixed(1)}/5</span>. Small improvements can make it excellent.</>
              ) : dashboardStats.seller_info.rating >= 3 ? (
                <>Average rating of <span className="font-medium text-gray-900">{dashboardStats.seller_info.rating.toFixed(1)}/5</span>. Focus on customer satisfaction.</>
              ) : (
                <>Work on improving your <span className="font-medium text-gray-900">{dashboardStats.seller_info.rating.toFixed(1)}/5</span> rating by enhancing service quality.</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatisticsCards 