import React from 'react';
import SellerHeader from './SellerHeader';
import Footer from './Footer';
import marbleBg from '../../assets/marble-bg.jpg';

const SellerLayout = ({ children }) => {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: `url(${marbleBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <SellerHeader />
      
      <div className="flex-1 flex">
        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default SellerLayout; 