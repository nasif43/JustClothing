import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const TimeRemaining = ({ end_date, className = "" }) => {
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const endTime = new Date(end_date)
      const timeDiff = endTime - now
      
      if (timeDiff <= 0) {
        setTimeLeft('Expired')
        setIsExpired(true)
        return
      }
      
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (days > 0) {
        setTimeLeft(`${days} days left`)
      } else if (hours > 0) {
        setTimeLeft(`${hours} hours left`)
      } else if (minutes > 0) {
        setTimeLeft(`${minutes} minutes left`)
      } else {
        setTimeLeft('Ending soon')
      }
      
      setIsExpired(false)
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [end_date])

  return (
    <div className={`flex items-center text-sm ${isExpired ? 'text-red-500' : 'text-gray-500'} ${className}`}>
      <Clock className="w-4 h-4 mr-1" />
      <span>{timeLeft}</span>
    </div>
  )
}

export default TimeRemaining