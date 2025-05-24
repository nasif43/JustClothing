import { Edit3, Upload, CheckCircle } from "lucide-react"

const StoreProfile = () => {
  return (
    <div className="bg-white/90 rounded-lg overflow-hidden mb-6">
      {/* Cover photo area */}
      <div className="relative w-full h-48 bg-gray-200">
        {/* Upload cover photo button */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm">
            <Upload className="h-4 w-4" />
            Upload New Cover Photo
          </button>
        </div>
      </div>

      {/* Profile info section */}
      <div className="relative px-6 pb-6">
        {/* Profile picture - positioned to overlap the cover photo */}
        <div className="absolute -top-16 left-8">
          <div className="w-32 h-32 bg-yellow-200 rounded-full border-4 border-white flex items-center justify-center">
            <div className="text-gray-600 text-xl font-medium">
              ad<span className="border border-gray-500 px-1">Lead</span>
            </div>
          </div>
        </div>

        {/* Content section with proper spacing for the overlapping profile picture */}
        <div className="pt-20 flex justify-between items-start">
          {/* Store name and bio */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-700">ADLEAD STORE</h1>
              <CheckCircle className="h-5 w-5 text-gray-500 fill-gray-200" />
            </div>
            <p className="text-gray-500 text-sm max-w-md uppercase">
              SIMPLE, MINIMALISTIC, AND FASHIONABLE STREETWEAR ITEMS- CREATED USING THE BEST FABRIC IN THE MARKET.
            </p>
          </div>

          {/* Edit statistics button */}
          <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm">
            <Edit3 className="h-4 w-4" />
            Edit statistics
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoreProfile 