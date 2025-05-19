import React from 'react';
import { Check } from 'lucide-react';
import marbleBg from '../../assets/marble-bg.jpg';
import Header from '../../components/layout/Header';

const SellerSignupConfirmationPage = () => {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: `url(${marbleBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-2 py-8">
        <div className="w-full max-w-4xl bg-white/90 rounded-xl shadow-lg p-6 md:p-12 flex flex-col items-center text-center gap-6 relative">
          <h1 className="text-2xl md:text-3xl font-bold mt-4 mb-2">THANK YOU FOR REGISTERING</h1>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">YOUR REQUEST HAS BEEN RECEIVED!</h2>
          <div className="bg-black rounded-full p-4 w-20 h-20 flex items-center justify-center mb-4">
            <Check className="text-white w-12 h-12" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-2">YOUR REQUEST WILL BE PROCESSED WITHIN THE NEXT 48 HOURS!</h3>
          <p className="text-lg font-medium mb-2">YOU WILL RECEIVE YOUR CONFIRMATION VIA EMAIL</p>
          <div className="text-xs text-gray-700 mt-4 flex flex-col items-center">
            <span>In the meantime, you can learn about the functionality of your store through our Tutorials</span>
            <a href="#" className="inline-flex items-center gap-1 mt-1 text-black font-bold hover:underline">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M10 15.5V8.5C10 8.10218 10.158 7.72064 10.4393 7.43934C10.7206 7.15804 11.1022 7 11.5 7C11.8978 7 12.2794 7.15804 12.5607 7.43934C12.842 7.72064 13 8.10218 13 8.5V15.5C13 15.8978 12.842 16.2794 12.5607 16.5607C12.2794 16.842 11.8978 17 11.5 17C11.1022 17 10.7206 16.842 10.4393 16.5607C10.158 16.2794 10 15.8978 10 15.5ZM12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z"/></svg>
              Tutorials
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSignupConfirmationPage; 