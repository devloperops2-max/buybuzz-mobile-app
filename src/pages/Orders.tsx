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
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex justify-between mb-3">
                  <div>
                    <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </p>
                    <p className="text-sm font-bold">₹{order.total_amount}</p>
                  </div>
                </div>

                {order.tracking_number && (
                  <div className="bg-muted p-2 rounded mb-3">
                    <p className="text-sm">
                      <span className="font-semibold">Tracking:</span> {order.tracking_number}
                    </p>
                  </div>
                )}

                <div className="border-t pt-3">
                  <p className="text-sm font-semibold mb-2">Items:</p>
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm mb-1">
                      <span>
                        {item.product_name} x{item.quantity}
                      </span>
                      <span>₹{item.product_price}</span>
                    </div>
                  ))}
                </div>

                {order.shipping_address && (
                  <div className="border-t mt-3 pt-3">
                    <p className="text-sm">
                      <span className="font-semibold">Shipping to:</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Orders;
