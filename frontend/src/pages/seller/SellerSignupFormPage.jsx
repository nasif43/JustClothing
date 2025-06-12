import React, { useRef, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import marbleBg from '../../assets/marble-bg.jpg';
import Header from '../../components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { sellerSignup } from '../../services/api';
import useUserStore from '../../store/useUserStore';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  idNumber: '',
  businessName: '',
  businessType: '',
  founded: '',
  bio: '',
  pickupLocation: '',
  instagram: '',
  facebook: '',
  paymentMethod: '',
  accountNumber: '',
  bankName: '',
  branchName: '',
  agree: false,
  logo: null,
};

const paymentLabels = {
  Bank: 'Bank Account Number',
  bKash: 'bKash Number',
  Nagad: 'Nagad Number',
};

const SellerSignupFormPage = () => {
  const [form, setForm] = useState(initialState);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUserStore();

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      navigate('/login', { 
        state: { 
          from: '/seller/signup',
          message: 'Please log in to continue with seller registration.' 
        } 
      });
    }
  }, [isAuthenticated, navigate]);

  // Auto-populate form with user data when component mounts
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sellerSignup(form);
      
      if (response) {
        // Navigate to confirmation page on success
        navigate('/seller/signup-confirmation');
      }
    } catch (error) {
      setError(error.message || 'An error occurred during seller registration');
      console.error('Seller signup failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const accountLabel = paymentLabels[form.paymentMethod] || 'Account Number';

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
      <form
        className="flex-1 flex flex-col items-center justify-center px-2 py-8"
        onSubmit={handleSubmit}
      >
        <div className="w-full max-w-4xl bg-white/90 rounded-xl shadow-lg p-6 md:p-12 flex flex-col md:flex-row gap-8 relative">
          {error && (
            <div className="w-full mb-4 rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="flex-1 space-y-10">
            {/* Owner's Information */}
            <div>
              <h2 className="text-2xl font-bold mb-4 border-b pb-2">Owner's Information</h2>
              {user && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm text-green-800">
                    ✓ Your account information has been pre-filled. You can edit these fields if needed.
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name 
                    {user?.first_name && <span className="text-green-600 text-xs ml-1">(pre-filled)</span>}
                  </label>
                  <input 
                    name="firstName" 
                    value={form.firstName} 
                    onChange={handleChange} 
                    required 
                    className={`input ${user?.first_name ? 'bg-green-50 border-green-200' : ''}`} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last Name
                    {user?.last_name && <span className="text-green-600 text-xs ml-1">(pre-filled)</span>}
                  </label>
                  <input 
                    name="lastName" 
                    value={form.lastName} 
                    onChange={handleChange} 
                    required 
                    className={`input ${user?.last_name ? 'bg-green-50 border-green-200' : ''}`} 
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  E-mail address
                  {user?.email && <span className="text-green-600 text-xs ml-1">(pre-filled)</span>}
                </label>
                <input 
                  name="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                  type="email" 
                  className={`input ${user?.email ? 'bg-green-50 border-green-200' : ''}`} 
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Phone number
                  {user?.phone && <span className="text-green-600 text-xs ml-1">(pre-filled)</span>}
                </label>
                <input 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange} 
                  required 
                  className={`input ${user?.phone ? 'bg-green-50 border-green-200' : ''}`} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">NID/ PASSPORT/ BIRTH CERTIFICATE No.</label>
                <input name="idNumber" value={form.idNumber} onChange={handleChange} required className="input" />
              </div>
            </div>
            {/* Business Information */}
            <div>
              <h2 className="text-2xl font-bold mb-4 border-b pb-2">Business Information</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Business name</label>
                <input name="businessName" value={form.businessName} onChange={handleChange} required className="input" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Business type</label>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="businessType" value="General Clothing" checked={form.businessType === 'General Clothing'} onChange={handleChange} required /> General Clothing
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="businessType" value="Thrifted Clothing" checked={form.businessType === 'Thrifted Clothing'} onChange={handleChange} /> Thrifted Clothing
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="businessType" value="Loose Fabric" checked={form.businessType === 'Loose Fabric'} onChange={handleChange} /> Loose Fabric
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date founded</label>
                <input name="founded" value={form.founded} onChange={handleChange} required placeholder="DD/MM/YYYY" className="input" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Bio</label>
                <input name="bio" value={form.bio} onChange={handleChange} required className="input" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Pick-up Location</label>
                <input name="pickupLocation" value={form.pickupLocation} onChange={handleChange} required className="input" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Instagram handle <span className="text-gray-400">(Optional)</span></label>
                <input name="instagram" value={form.instagram} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Facebook page <span className="text-gray-400">(Optional)</span></label>
                <input name="facebook" value={form.facebook} onChange={handleChange} className="input" />
              </div>
            </div>
            {/* Banking Information */}
            <div>
              <h2 className="text-2xl font-bold mb-4 border-b pb-2">Banking Information</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Preferred Payment Method</label>
                <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} required className="input">
                  <option value="">Select a method</option>
                  <option value="Bank">Bank</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">{accountLabel}</label>
                <input name="accountNumber" value={form.accountNumber} onChange={handleChange} required className="input" />
              </div>
              {form.paymentMethod === 'Bank' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Bank Name</label>
                    <input name="bankName" value={form.bankName} onChange={handleChange} required={form.paymentMethod === 'Bank'} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Branch Name</label>
                    <input name="branchName" value={form.branchName} onChange={handleChange} required={form.paymentMethod === 'Bank'} className="input" />
                  </div>
                </>
              )}
            </div>
            {/* Terms */}
            <div className="flex items-center mt-6">
              <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} required className="mr-2" />
              <span className="text-xs">I agree to the terms and conditions and bear full responsibility of my actions</span>
            </div>
          </div>
          {/* Logo upload */}
          <div className="flex flex-col items-center justify-start pt-12 md:pt-24 w-full md:w-72">
            <div className="flex flex-col items-center">
              <button type="button" onClick={handleLogoClick} className="w-40 h-40 rounded-full border-2 border-gray-400 flex items-center justify-center bg-white/80 hover:bg-gray-100 transition mb-2">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <Plus className="w-16 h-16 text-gray-400" />
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </button>
              <div className="text-center text-sm font-medium text-gray-700">Upload Logo<br /><span className="text-xs">(PNG, JPEG)</span></div>
            </div>
          </div>
        </div>
        <div className="w-full max-w-4xl flex justify-end mt-8">
          <button
            type="submit"
            className="bg-black text-white px-8 py-3 rounded-full text-lg font-semibold shadow hover:bg-gray-900 transition-all disabled:opacity-50"
            disabled={!form.agree || isLoading}
          >
            {isLoading ? 'SUBMITTING...' : 'CONTINUE & SIGN UP'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerSignupFormPage; 