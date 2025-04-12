import { Search } from "lucide-react"

function SearchBar() {
  return (
    <div className="relative w-full max-w-2xl">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Search className="w-5 h-5 text-black"/>
      </div>
      <input
        type="search"
        className="block w-full p-3 pl-12 text-sm text-black border border-black-300 rounded-full bg-white/100 backdrop-blur-sm focus:ring-black focus:border-black placeholder-gray-400"
        placeholder="find your fit..."
      />
    </div>
  )
}

export default SearchBar
