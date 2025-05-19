import React from 'react';
import { Handshake } from 'lucide-react';
import marbleBg from '../../assets/marble-bg.jpg';
import Header from '../../components/layout/Header';
import { useNavigate } from 'react-router-dom';

const SellerOnboardingPage = () => {
  const navigate = useNavigate();
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
            ARE YOU READY TO<br />
            TAKE YOUR<br />
            BUSINESS TO THE<br />
            NEXT LEVEL?
          </h1>
          <div className="flex justify-center mb-6">
            <Handshake className="w-24 h-24 md:w-32 md:h-32 text-black" />
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-xs md:text-sm font-medium mb-8 text-black">
            <span>Takes less than 5 minutes to register</span>
            <span className="hidden md:inline">•</span>
            <span>Access to over 2,000 active users</span>
            <span className="hidden md:inline">•</span>
            <span>Customize your store</span>
          </div>
          <div className="text-xl font-bold mb-10">REGISTER, LIST AND SIT BACK!</div>
          <div className="flex justify-end">
            <button className="bg-black text-white px-8 py-3 rounded-full text-lg font-semibold shadow hover:bg-gray-900 transition-all" onClick={() => navigate('/seller/signup')}>
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOnboardingPage; 