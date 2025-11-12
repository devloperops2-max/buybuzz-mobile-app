import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Edit, Plus, ArrowLeft, Package } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category: "",
    stock_quantity: "",
    rating: "0",
  });

  useEffect(() => {
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !data) {
      toast.error("Access denied. Admin only.");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadProducts(), loadOrders(), loadUsers()]);
    setLoading(false);
  };

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(full_name), order_items(*)")
      .order("created_at", { ascending: false })
      .limit(20);
    setOrders(data || []);
  };

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("*");
    setUsers(data || []);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      ...productForm,
      price: parseFloat(productForm.price),
      stock_quantity: parseInt(productForm.stock_quantity),
      rating: parseFloat(productForm.rating),
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);
      
      if (error) {
        toast.error("Failed to update product");
      } else {
        toast.success("Product updated successfully");
        setEditingProduct(null);
      }
    } else {
      const { error } = await supabase.from("products").insert(productData);
      
      if (error) {
        toast.error("Failed to add product");
      } else {
        toast.success("Product added successfully");
      }
    }

    setShowProductForm(false);
    setProductForm({
      name: "",
      description: "",
      price: "",
      image_url: "",
      category: "",
      stock_quantity: "",
      rating: "0",
    });
    loadProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    
    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted");
      loadProducts();
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      image_url: product.image_url || "",
      category: product.category || "",
      stock_quantity: product.stock_quantity.toString(),
      rating: product.rating.toString(),
    });
    setShowProductForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      toast.error("Failed to delete user");
    } else {
      toast.success("User deleted");
      loadUsers();
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as any })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
    } else {
      toast.success("Order status updated");
      loadOrders();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 pb-24 pt-safe">
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 mb-6 bg-card p-4 rounded-xl shadow-lg border-2 border-primary/20">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hover:bg-primary/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              NV Store Admin
            </h1>
            <p className="text-sm text-muted-foreground">Manage your store with ease</p>
          </div>
          <div className="flex gap-3 text-center">
            <div className="bg-primary/10 px-3 py-2 rounded-lg">
              <p className="text-xs text-muted-foreground">Products</p>
              <p className="text-xl font-bold text-primary">{products.length}</p>
            </div>
            <div className="bg-secondary/10 px-3 py-2 rounded-lg">
              <p className="text-xs text-muted-foreground">Orders</p>
              <p className="text-xl font-bold text-secondary-foreground">{orders.length}</p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-xl border border-primary/20">
            <div>
              <h2 className="text-2xl font-bold text-primary">📦 Product Catalog</h2>
              <p className="text-xs text-muted-foreground">Manage your inventory</p>
            </div>
            <Button 
              onClick={() => {
                setShowProductForm(true);
                setEditingProduct(null);
                setProductForm({
                  name: "",
                  description: "",
                  price: "",
                  image_url: "",
                  category: "",
                  stock_quantity: "",
                  rating: "0",
                });
              }}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          {showProductForm && (
            <Card className="p-6 mb-4 shadow-xl border-2 border-primary/30 bg-gradient-to-br from-card to-primary/5">
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingProduct ? "Update" : "Add"} Product</Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {products.map((product) => (
              <Card key={product.id} className="p-4 hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-card to-muted/10 border border-primary/10">
                <div className="flex gap-4">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg border-2 border-primary/20 shadow-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-lg font-bold text-primary">₹{product.price}</span>
                      <span className="text-xs px-2 py-1 bg-secondary/20 rounded-full">
                        Stock: {product.stock_quantity}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)} className="hover:bg-primary/10">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Orders Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-secondary/5 to-primary/5 p-4 rounded-xl border border-secondary/20 mb-4">
            <h2 className="text-2xl font-bold text-secondary-foreground">🚚 Orders Management</h2>
            <p className="text-xs text-muted-foreground">Track and update customer orders</p>
          </div>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-4 hover:shadow-xl transition-all bg-gradient-to-br from-card to-secondary/5 border border-secondary/20">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{order.profiles?.full_name || "User"}</p>
                      <p className="text-sm text-muted-foreground">
                        Order #{order.razorpay_order_id || order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm font-medium mt-1">₹{order.total_amount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {order.order_items && order.order_items.length > 0 && (
                    <div className="border-t pt-2">
                      <p className="text-xs font-semibold mb-1">Items:</p>
                      {order.order_items.map((item: any) => (
                        <p key={item.id} className="text-xs text-muted-foreground">
                          {item.product_name} x{item.quantity}
                        </p>
                      ))}
                    </div>
                  )}

                  {order.shipping_address && (
                    <div className="border-t pt-2">
                      <p className="text-xs font-semibold mb-1">Shipping Address:</p>
                      <p className="text-xs text-muted-foreground">{order.shipping_address}</p>
                    </div>
                  )}

                  <div className="border-t pt-2">
                    <Label className="text-xs mb-1 block">Update Status:</Label>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Users Section */}
        <div>
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-xl border border-primary/20 mb-4">
            <h2 className="text-2xl font-bold text-primary">👥 User Management</h2>
            <p className="text-xs text-muted-foreground">Total users: {users.length}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {users.map((user) => (
              <Card key={user.id} className="p-4 hover:shadow-lg transition-all bg-gradient-to-br from-card to-primary/5 border border-primary/10">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{user.full_name || "User"}</p>
                    <p className="text-sm text-muted-foreground">{user.phone || "No phone"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminDashboard;
