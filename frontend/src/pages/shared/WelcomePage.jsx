import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useUserStore from '../../store/useUserStore';
import marbleBg from '../../assets/marble-bg.jpg';
import logo from '../../assets/logo-black.svg';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { guestLogin } = useUserStore();

  const handleGuestLogin = () => {
    // Set guest user state
    guestLogin();
    // Navigate to home page where guests can see products
    navigate('/home');
  };

  return (
    <div 
      className="h-screen w-full relative flex flex-col"
      style={{ backgroundImage: `url(${marbleBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Centered Container */}
      <div className="absolute inset-0 flex flex-col items-center">
        {/* Logo */}
        <div className="mt-[10vh] text-center">
          <img 
            src={logo} 
            alt="Just Clothing Store" 
            className="w-72 sm:w-96 h-auto mx-auto"
          />
        </div>
        
        {/* Middle space - intentionally empty */}
        <div className="flex-grow"></div>
        
        {/* Login Options - centered vertically */}
        <div className="mt-10 flex flex-col w-80 mb-[20vh]">
          <button 
            onClick={() => navigate('/login')}
            className="bg-black text-white py-3 rounded-full text-center font-bold mb-6 hover-effect hover:cursor-pointer"
          >
            ALREADY A MEMBER
          </button>
          
          <button 
            onClick={() => navigate('/signup')}
            className="bg-black text-white py-3 rounded-full text-center font-bold mb-6 hover-effect hover:cursor-pointer"
          >
            NEW HERE!
          </button>
          
          <p 
            onClick={handleGuestLogin}
            className="mt-10 text-black text-center hover-effect hover:cursor-pointer"
          >
            USE AS GUEST (ok, NPC)
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage; 