import { X } from "lucide-react"
import { useEffect } from "react"

function Alert({ message, isOpen, onClose, autoClose = true }) {
  useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose, autoClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
      <div className="bg-white border border-gray-200 shadow-lg p-6 rounded max-w-sm mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Alert</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-gray-800">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-white font-medium rounded-full"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default Alert 