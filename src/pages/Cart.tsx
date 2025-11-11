import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadCart();
  }, [user]);

  const loadCart = async () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const cartData = JSON.parse(savedCart);
      
      // Fetch current prices from database
      const productIds = cartData.map((item: CartItem) => item.id);
      const { data: products } = await supabase
        .from("products")
        .select("id, price")
        .in("id", productIds);

      if (products) {
        // Update cart items with current prices
        const updatedCart = cartData.map((item: CartItem) => {
          const product = products.find((p) => p.id === item.id);
          return product ? { ...item, price: Number(product.price) } : item;
        });
        
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        setCartItems(updatedCart);
      } else {
        setCartItems(cartData);
      }
    }
  };

  const saveCart = (items: CartItem[]) => {
    localStorage.setItem("cart", JSON.stringify(items));
    setCartItems(items);
  };

  const updateQuantity = (id: string, delta: number) => {
    const newItems = cartItems.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    saveCart(newItems);
  };

  const removeItem = (id: string) => {
    const newItems = cartItems.filter((item) => item.id !== id);
    saveCart(newItems);
  };

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      toast.error("Please enter shipping address");
      return;
    }

    if (!user) {
      toast.error("Please login to continue");
      return;
    }

    setIsProcessing(true);

    try {
      // Create mock payment IDs
      const mockOrderId = `ORDER_${Date.now()}`;
      const mockPaymentId = `PAY_${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          status: "pending",
          payment_method: "mock_payment",
          payment_status: "paid",
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: mockPaymentId,
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      localStorage.removeItem("cart");
      setCartItems([]);
      setShippingAddress("");

      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to place order");
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 40 : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-background pb-32 pt-safe">
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => navigate("/")}>Start Shopping</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                      <p className="text-primary font-bold mb-2">₹{item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="ml-auto text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 mb-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold">₹{shipping.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary text-lg">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 mb-4">
              <Label htmlFor="address" className="text-sm font-semibold mb-2 block">
                Shipping Address
              </Label>
              <Textarea
                id="address"
                placeholder="Enter your complete shipping address..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="min-h-[100px]"
              />
            </Card>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleCheckout}
              disabled={isProcessing || !shippingAddress.trim()}
            >
              {isProcessing ? "Processing..." : "Place Order (Mock Payment)"}
            </Button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Cart;
