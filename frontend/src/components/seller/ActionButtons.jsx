import { Plus, MessageCircle } from "lucide-react"

const ActionButtons = () => {
  const actions = [
    {
      icon: <Plus className="h-6 w-6" />,
      text: "Add products to your Store",
      href: "/seller/products/add",
      bgColor: "bg-gray-500"
    },
    {
      icon: <Plus className="h-6 w-6" />,
      text: "Customise your Homepage",
      href: "/seller/customize",
      bgColor: "bg-gray-500"
    },
    {
      icon: <Plus className="h-6 w-6" />,
      text: "Add Offers",
      href: "/seller/offers",
      bgColor: "bg-gray-500"
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      text: "Respond to Reviews",
      href: "/seller/reviews",
      bgColor: "bg-gray-500",
      hasArrow: true
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <a
          key={index}
          href={action.href}
          className={`${action.bgColor} text-white rounded-lg p-6 flex items-center gap-4 hover:opacity-90 transition-opacity group`}
        >
          <div className="flex-shrink-0">
            {action.hasArrow ? (
              <div className="transform rotate-180">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
            ) : (
              action.icon
            )}
          </div>
          <span className="font-medium text-sm lg:text-base">{action.text}</span>
        </a>
      ))}
    </div>
  )
}

export default ActionButtons 