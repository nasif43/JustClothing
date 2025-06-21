import React, { useEffect, useState } from 'react';
import { Handshake, Clock, CheckCircle, XCircle } from 'lucide-react';
import marbleBg from '../../assets/marble-bg.jpg';
import Header from '../../components/layout/Header';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../store/useUserStore';

const SellerOnboardingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, fetchUserProfile } = useUserStore();
  const [sellerStatus, setSellerStatus] = useState(null);
  
  useEffect(() => {
    if (isAuthenticated) {
      // Refresh user profile to get latest seller status
      fetchUserProfile();
    }
  }, [isAuthenticated, fetchUserProfile]);

  useEffect(() => {
    if (user?.seller_profile) {
      setSellerStatus(user.seller_profile.status);
    }
  }, [user]);

  const getStatusDisplay = () => {
    if (!user?.seller_profile) {
      return {
        icon: <Handshake className="w-24 h-24 md:w-32 md:h-32 text-black" />,
        title: "ARE YOU READY TO TAKE YOUR BUSINESS TO THE NEXT LEVEL?",
        buttonText: "CONTINUE",
        buttonAction: () => navigate('/seller/signup'),
        showStatus: false
      };
    }

    const status = user.seller_profile.status;
    
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-24 h-24 md:w-32 md:h-32 text-yellow-600" />,
          title: `HI ${user.first_name?.toUpperCase() || user.username?.toUpperCase()}, YOUR SELLER APPLICATION IS PENDING APPROVAL`,
          message: "Your application is being reviewed by our team. You'll be notified once it's approved.",
          buttonText: "VIEW APPLICATION",
          buttonAction: () => navigate('/seller/signup'),
          showStatus: true,
          statusColor: "bg-yellow-100 text-yellow-800 border-yellow-200"
        };
      
      case 'approved':
        return {
          icon: <CheckCircle className="w-24 h-24 md:w-32 md:h-32 text-green-600" />,
          title: `CONGRATULATIONS ${user.first_name?.toUpperCase() || user.username?.toUpperCase()}! YOU'RE NOW A VERIFIED SELLER`,
          message: "Your application has been approved. You can now access your seller dashboard.",
          buttonText: "GO TO DASHBOARD",
          buttonAction: () => navigate('/seller/dashboard'),
          showStatus: true,
          statusColor: "bg-green-100 text-green-800 border-green-200"
        };
      
      case 'rejected':
        return {
          icon: <XCircle className="w-24 h-24 md:w-32 md:h-32 text-red-600" />,
          title: `HI ${user.first_name?.toUpperCase() || user.username?.toUpperCase()}, YOUR SELLER APPLICATION WAS NOT APPROVED`,
          message: "Unfortunately, your application didn't meet our requirements. You can apply again with updated information.",
          buttonText: "APPLY AGAIN",
          buttonAction: () => navigate('/seller/signup'),
          showStatus: true,
          statusColor: "bg-red-100 text-red-800 border-red-200"
        };
      
      default:
        return {
          icon: <Handshake className="w-24 h-24 md:w-32 md:h-32 text-black" />,
          title: "ARE YOU READY TO TAKE YOUR BUSINESS TO THE NEXT LEVEL?",
          buttonText: "CONTINUE",
          buttonAction: () => navigate('/seller/signup'),
          showStatus: false
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: `url(${marbleBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Header />
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            {statusDisplay.title}
          </h1>
          
          <div className="flex justify-center mb-6">
            {statusDisplay.icon}
          </div>
          
          {statusDisplay.showStatus && (
            <div className={`inline-block px-4 py-2 rounded-lg border mb-4 ${statusDisplay.statusColor}`}>
              Status: {user?.seller_profile?.status?.toUpperCase()}
            </div>
          )}
          
          {statusDisplay.message && (
            <div className="text-lg font-medium mb-6 text-black bg-white/80 rounded-lg p-4 mx-auto max-w-md">
              {statusDisplay.message}
            </div>
          )}
          
          {!statusDisplay.showStatus && (
            <>
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-xs md:text-sm font-medium mb-8 text-black">
                <span>Takes less than 5 minutes to register</span>
                <span className="hidden md:inline">•</span>
                <span>Access to over 2,000 active users</span>
                <span className="hidden md:inline">•</span>
                <span>Customize your store</span>
              </div>
              
              {isAuthenticated && user && (
                <div className="text-lg font-medium mb-4 text-black bg-white/80 rounded-lg p-4 mx-auto max-w-md">
                  ✓ Welcome back! Your account information will be pre-filled in the registration form.
                </div>
              )}
              
              <div className="text-xl font-bold mb-10">REGISTER, LIST AND SIT BACK!</div>
            </>
          )}
          
          <div className="flex justify-end">
            <button 
              className="bg-black text-white px-8 py-3 rounded-full text-lg font-semibold shadow hover:bg-gray-900 transition-all" 
              onClick={statusDisplay.buttonAction}
            >
              {statusDisplay.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOnboardingPage; 