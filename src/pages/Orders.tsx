import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Package } from "lucide-react";

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "text-yellow-600",
      processing: "text-blue-600",
      shipped: "text-purple-600",
      delivered: "text-green-600",
      cancelled: "text-red-600",
    };
    return colors[status] || "text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-safe">
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No orders yet</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const orderDate = new Date(order.created_at);
              const estimatedDelivery = new Date(orderDate);
              estimatedDelivery.setDate(estimatedDelivery.getDate() + 
                (order.status === "delivered" ? 0 : 
                 order.status === "shipped" ? 2 : 
                 order.status === "processing" ? 4 : 5));

              const steps = [
                { status: "pending", label: "Order Placed", icon: "📦" },
                { status: "processing", label: "Processing", icon: "⚙️" },
                { status: "shipped", label: "Shipped", icon: "🚚" },
                { status: "delivered", label: "Delivered", icon: "✅" },
              ];

              const currentStepIndex = steps.findIndex(s => s.status === order.status);
              const isCancelled = order.status === "cancelled";

              return (
                <Card key={order.id} className="p-4 bg-gradient-to-br from-card to-muted/20">
                  <div className="flex justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {orderDate.toLocaleDateString("en-IN", { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${getStatusColor(order.status)}`}>
                        {isCancelled ? "❌ Cancelled" : order.status.toUpperCase()}
                      </p>
                      <p className="text-sm font-bold text-primary">₹{order.total_amount}</p>
                    </div>
                  </div>

                  {/* Visual Timeline */}
                  {!isCancelled && (
                    <div className="mb-4 bg-background/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        {steps.map((step, index) => {
                          const isCompleted = index <= currentStepIndex;
                          const isCurrent = index === currentStepIndex;
                          
                          return (
                            <div key={step.status} className="flex flex-col items-center flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-1 transition-all ${
                                isCompleted 
                                  ? "bg-primary text-primary-foreground scale-110 shadow-lg" 
                                  : "bg-muted text-muted-foreground"
                              } ${isCurrent ? "ring-4 ring-primary/30 animate-pulse" : ""}`}>
                                {step.icon}
                              </div>
                              <p className={`text-xs font-semibold text-center ${
                                isCompleted ? "text-primary" : "text-muted-foreground"
                              }`}>
                                {step.label}
                              </p>
                              {index < steps.length - 1 && (
                                <div className="absolute w-full h-1 top-5 left-1/2" style={{ width: '100%', marginLeft: '50%' }}>
                                  <div className={`h-0.5 ${isCompleted ? "bg-primary" : "bg-muted"}`} 
                                       style={{ width: index < currentStepIndex ? '100%' : '0%' }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="text-center mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Estimated Delivery: <span className="font-semibold text-foreground">
                            {estimatedDelivery.toLocaleDateString("en-IN", { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {order.tracking_number && (
                    <div className="bg-secondary/20 border border-secondary p-3 rounded-lg mb-3">
                      <p className="text-sm">
                        <span className="font-bold text-secondary-foreground">Tracking ID:</span> 
                        <span className="ml-2 font-mono text-xs">{order.tracking_number}</span>
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-3 mb-3">
                    <p className="text-sm font-bold mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Order Items:
                    </p>
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm mb-1 py-1">
                        <span className="text-muted-foreground">
                          {item.product_name} <span className="text-primary font-semibold">x{item.quantity}</span>
                        </span>
                        <span className="font-semibold">₹{item.product_price}</span>
                      </div>
                    ))}
                  </div>

                  {order.shipping_address && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-bold mb-1">📍 Delivery Address:</p>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                        {order.shipping_address}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Orders;
