import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NovaAssistant from "@/components/NovaAssistant";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showNova, setShowNova] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProducts();
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const handleAddToCart = (productId: string) => {
    toast.success("Added to cart!");
    console.log("Added product:", productId);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card border-b border-border z-40 pt-safe">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-primary">NV Store</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowNova(true)}
                className="relative"
              >
                <Sparkles className="w-5 h-5" />
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate("/admin")}
                >
                  <Settings className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === selectedCategory ? "default" : "outline"}
              className="rounded-full whitespace-nowrap"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold mb-4">Featured Products</h2>
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} {...product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </div>

      {showNova && <NovaAssistant onClose={() => setShowNova(false)} />}

      <BottomNav />
    </div>
  );
};

export default Home;
