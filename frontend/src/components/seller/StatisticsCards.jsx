const StatisticsCards = () => {
  const stats = [
    {
      title: "Lifetime Orders",
      value: "42",
      bgColor: "bg-black"
    },
    {
      title: "Lifetime Revenue",
      value: "28,941.80",
      bgColor: "bg-black"
    },
    {
      title: "Lifetime Views", 
      value: "10,981",
      bgColor: "bg-black"
    }
  ]

  return (
    <div className="grid grid-cols-3 md:grid-cols-3 gap-6 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} text-white rounded-full p-6 flex flex-col items-center justify-center h-32 w-32 mx-auto`}>
          <div className="text-center">
            <div className="text-xs font-medium mb-1">{stat.title}</div>
            <div className="text-xl font-bold">{stat.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatisticsCards 