import React from 'react'
import SellerLayout from '../../components/layout/SellerLayout'
import StoreProfile from '../../components/seller/StoreProfile'
import StatisticsCards from '../../components/seller/StatisticsCards'
import RevenueProgress from '../../components/seller/RevenueProgress'
import ActionButtons from '../../components/seller/ActionButtons'

const SellerDashboardPage = () => {
  return (
    <SellerLayout>
      {/* Store Profile Section */}
      <StoreProfile />
      
      {/* Statistics Cards */}
      <StatisticsCards />
      
      {/* Revenue Progress */}
      <RevenueProgress />
      
      {/* Action Buttons */}
      <ActionButtons />
    </SellerLayout>
  )
}

export default SellerDashboardPage 