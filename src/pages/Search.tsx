import BottomNav from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, TrendingUp } from "lucide-react";
import { useState } from "react";

const TRENDING_SEARCHES = [
  "Wireless headphones",
  "Smart watch",
  "Gaming laptop",
  "Running shoes",
  "Camera lens",
  "Phone case",
];

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background pb-20 pt-safe">
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Search</h1>
        
        <div className="relative mb-8">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Trending Searches</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Search;
