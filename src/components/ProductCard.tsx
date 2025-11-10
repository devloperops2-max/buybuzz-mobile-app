import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  onAddToCart: (id: string) => void;
}

const ProductCard = ({ id, name, price, image, rating, onAddToCart }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background"
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
            )}
          />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-yellow-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-xs">
                {i < Math.floor(rating) ? "★" : "☆"}
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({rating})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">${price.toFixed(2)}</span>
          <Button
            size="sm"
            onClick={() => onAddToCart(id)}
            className="gap-1"
          >
            <ShoppingCart className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
