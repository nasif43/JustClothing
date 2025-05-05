import { X } from "lucide-react"

function Notification({ message, isVisible, onClose }) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-3 rounded shadow-lg max-w-sm w-full mx-4 z-50 flex items-center justify-between">
      <p>{message}</p>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-gray-800 rounded-full"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default Notification 