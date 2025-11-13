import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  Heart,
  HelpCircle,
  LogOut,
  ChevronRight,
  Package,
} from "lucide-react";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    setProfile(data);
    setLoading(false);
  };

  const menuItems = [
    { icon: Package, label: "My Orders", to: "/orders" },
    { icon: User, label: "Edit Profile", to: "/profile/edit" },
    { icon: MapPin, label: "Saved Addresses", to: "/profile/addresses" },
    { icon: CreditCard, label: "Payment Methods", to: "/profile/payment" },
    { icon: Bell, label: "Notifications", to: "/profile/notifications" },
    { icon: Heart, label: "Wishlist", to: "/profile/wishlist" },
    { icon: HelpCircle, label: "Help & Support", to: "/profile/support" },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "No email";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-20 pt-safe">
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        {/* User Info Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-bold text-lg">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{displayEmail}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="font-bold text-lg">12</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">8</p>
              <p className="text-xs text-muted-foreground">Wishlist</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">5</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </div>
        </Card>

        {/* Menu Items */}
        <Card className="divide-y">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className="w-full flex items-center gap-4 p-4 hover:bg-accent transition-colors"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </Card>

        <Button variant="destructive" className="w-full mt-6 gap-2" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
