import { useState } from "react";

function CheckoutForm({ onFormChange }) {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    district: "",
    area: "",
    address: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    setFormData(updatedFormData);
    
    if (onFormChange) {
      onFormChange(updatedFormData);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
          required
        />
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
          required
        />
      </div>

      <div>
        <label htmlFor="district" className="block text-sm font-medium mb-1">
          District
        </label>
        <select
          id="district"
          name="district"
          value={formData.district}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black appearance-none bg-white"
          required
        >
          <option value="" disabled>Select District</option>
          <option value="dhaka">Dhaka</option>
          <option value="chittagong">Chittagong</option>
          <option value="rajshahi">Rajshahi</option>
          <option value="khulna">Khulna</option>
          <option value="barisal">Barisal</option>
          <option value="sylhet">Sylhet</option>
          <option value="rangpur">Rangpur</option>
          <option value="mymensingh">Mymensingh</option>
        </select>
      </div>

      <div>
        <label htmlFor="area" className="block text-sm font-medium mb-1">
          Area
        </label>
        <select
          id="area"
          name="area"
          value={formData.area}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black appearance-none bg-white"
          required
        >
          <option value="" disabled>Select Area</option>
          <option value="mirpur">Mirpur</option>
          <option value="dhanmondi">Dhanmondi</option>
          <option value="uttara">Uttara</option>
          <option value="gulshan">Gulshan</option>
          <option value="banani">Banani</option>
          <option value="mohammadpur">Mohammadpur</option>
        </select>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium mb-1">
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
          required
        />
      </div>
    </div>
  );
}

export default CheckoutForm; 