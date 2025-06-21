import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { fetchUserStatus, fetchSellerStats } from '../../services/api'

const StatisticsCards = () => {
  const [stats, setStats] = useState([
    {
      title: "Lifetime Orders",
      value: "0",
      bgColor: "bg-black"
    },
    {
      title: "Store Rating",
      value: "0.0",
      bgColor: "bg-black",
      icon: Star
    },
    {
      title: "Total Reviews", 
      value: "0",
      bgColor: "bg-black"
    }
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        
        // Get user status to get seller profile
        const userStatus = await fetchUserStatus()
        
        if (userStatus.seller_profile) {
          // Get seller statistics
          try {
            const sellerStats = await fetchSellerStats(userStatus.seller_profile.id)
            
            setStats([
              {
                title: "Total Products",
                value: sellerStats.total_products?.toString() || "0",
                bgColor: "bg-black"
              },
              {
                title: "Store Rating",
                value: sellerStats.rating?.toFixed(1) || "0.0",
                bgColor: "bg-black",
                icon: Star
              },
              {
                title: "Total Reviews", 
                value: sellerStats.total_reviews?.toString() || "0",
                bgColor: "bg-black"
              }
            ])
          } catch (error) {
            console.error('Failed to fetch seller stats:', error)
          }
        }
      } catch (error) {
        console.error('Failed to fetch user status:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 rounded-full p-6 flex flex-col items-center justify-center h-32 w-32 mx-auto animate-pulse">
            <div className="text-center">
              <div className="h-3 bg-gray-300 rounded mb-2 w-16"></div>
              <div className="h-5 bg-gray-300 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-3 gap-6 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} text-white rounded-full p-6 flex flex-col items-center justify-center h-32 w-32 mx-auto`}>
          <div className="text-center">
            <div className="text-xs font-medium mb-1">{stat.title}</div>
            <div className="text-xl font-bold flex items-center justify-center gap-1">
              {stat.icon && <stat.icon className="h-4 w-4" />}
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatisticsCards 