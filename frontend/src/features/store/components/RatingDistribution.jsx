function RatingDistribution({ distribution, totalReviews }) {
  // The distribution should be an array of objects with count for each star rating
  // e.g. [{ stars: 5, count: 245 }, { stars: 4, count: 100 }, ...]
  
  if (totalReviews === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-1">No ratings yet</div>
          <div className="text-sm">Be the first to rate this store!</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      {distribution.map((item) => {
        const percentage = totalReviews > 0 
          ? Math.round((item.count / totalReviews) * 100) 
          : 0;
          
        return (
          <div key={item.stars} className="flex items-center gap-2">
            <div className="flex items-center w-10">
              <span>{item.stars}</span>
              <span className="text-gray-400">★</span>
            </div>
            
            <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <div className="w-10 text-right text-gray-500">
              {item.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RatingDistribution 