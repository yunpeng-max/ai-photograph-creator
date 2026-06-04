import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Shield, CheckCircle2, XCircle, Key, RefreshCw } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";

const API_BASE = "/api/v1";

interface PendingOrder {
  order_id: string;
  plan: string;
  amount_cents: number;
  points: number;
  created_at: string;
}

export default function AdminPage() {
  const { t } = useTranslation();

  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "");
  const [loggedIn, setLoggedIn] = useState(false);
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const headers = useCallback(
    () => ({ "X-Admin-Token": token, "Content-Type": "application/json" }),
    [token]
  );

  // Login
  const handleLogin = () => {
    if (!token.trim()) return;
    localStorage.setItem("admin_token", token);
    setLoggedIn(true);
    fetchOrders();
  };

  // Fetch pending orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/payment/admin/pending`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        setError("认证失败，请检查密码");
        setLoggedIn(false);
        localStorage.removeItem("admin_token");
      }
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  }, [headers]);

  // Auto-fetch on login
  useEffect(() => {
    if (loggedIn) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [loggedIn, fetchOrders]);

  // Approve
  const handleApprove = async (orderId: string) => {
    try {
      const res = await fetch(`${API_BASE}/payment/admin/approve/${orderId}`, {
        method: "POST",
        headers: headers(),
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
      }
    } catch {
      // ignore
    }
  };

  // Reject
  const handleReject = async (orderId: string) => {
    try {
      const res = await fetch(`${API_BASE}/payment/admin/reject/${orderId}`, {
        method: "POST",
        headers: headers(),
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
      }
    } catch {
      // ignore
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setLoggedIn(false);
    setToken("");
    setOrders([]);
  };

  // Login screen
  if (!loggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card variant="glass" padding="lg" className="max-w-sm w-full text-center space-y-4">
          <Shield className="w-12 h-12 text-accent-400 mx-auto" />
          <h2 className="text-xl font-semibold text-text-primary">管理员登录</h2>
          <Input
            label="管理密码"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="输入 ADMIN_TOKEN"
            leftIcon={<Key className="w-4 h-4" />}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button variant="primary" className="w-full" onClick={handleLogin}>
            进入管理面板
          </Button>
        </Card>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-accent-400" />
          <h1 className="text-2xl font-display font-bold text-text-primary">审批管理</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchOrders} loading={loading}>
            刷新
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            退出
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {orders.length === 0 && !loading ? (
        <Card variant="default" padding="lg" className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-success-400 mx-auto mb-3" />
          <p className="text-text-secondary">没有待审批的订单</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.order_id} variant="default" padding="md" className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="primary" size="sm">{order.plan}</Badge>
                  <span className="text-sm text-text-secondary">
                    ¥{(order.amount_cents / 100).toFixed(2)}
                  </span>
                  <span className="text-sm text-text-tertiary">→ {order.points} 积分</span>
                </div>
                <p className="text-xs text-text-tertiary">
                  订单: {order.order_id.slice(0, 8)}... · {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => handleApprove(order.order_id)}
                >
                  批准
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<XCircle className="w-4 h-4" />}
                  onClick={() => handleReject(order.order_id)}
                >
                  拒绝
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {loading && orders.length === 0 && (
        <div className="text-center py-8 text-text-tertiary">加载中...</div>
      )}
    </div>
  );
}
