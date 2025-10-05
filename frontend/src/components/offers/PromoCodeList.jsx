import React, { useState } from 'react'
import { Tag, Copy, Check } from 'lucide-react'

const PromoCodeList = ({ promo_codes, maxVisible = 2, className = "" }) => {
  const [copiedCode, setCopiedCode] = useState(null)

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  if (!promo_codes || promo_codes.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {promo_codes.slice(0, maxVisible).map((promoCode, index) => (
          <div 
            key={index}
            className="group relative"
          >
            <button
              onClick={() => copyToClipboard(promoCode.code)}
              className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-mono rounded border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
            >
              <Tag className="w-3 h-3 mr-1" />
              {promoCode.code}
              {copiedCode === promoCode.code ? (
                <Check className="w-3 h-3 ml-1 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {copiedCode === promoCode.code ? 'Copied!' : 'Click to copy'}
            </div>
          </div>
        ))}
        
        {promo_codes.length > maxVisible && (
          <span className="text-xs text-gray-500 self-center">
            +{promo_codes.length - maxVisible} more
          </span>
        )}
      </div>
    </div>
  )
}

export default PromoCodeList