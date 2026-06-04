import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Coins, ArrowUpRight, ArrowDownLeft, ReceiptText } from "lucide-react";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { cn } from "../lib/utils";
import type { PointTransaction } from "../lib/types";

function AnimatedBalance({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return <span className="text-5xl font-bold tabular-nums font-display">{display}</span>;
}

export default function PointsPage() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPoints()
      .then((res) => {
        const data = res as { balance: number; transactions: PointTransaction[] };
        setBalance(data.balance);
        setTransactions(data.transactions);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-text-primary font-display mb-6">{t("points.title")}</h2>
        <Skeleton className="h-40 w-full rounded-2xl mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary font-display mb-6">{t("points.title")}</h2>

      {/* Balance Card */}
        <Card className="relative overflow-hidden !bg-gradient-to-br from-accent-600 to-accent-800 !border-0 !shadow-glow mb-6">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Coins size={18} className="text-accent-200" />
              <span className="text-accent-200 text-sm">{t("points.currentBalance")}</span>
            </div>
            <div className="text-white"><AnimatedBalance target={balance} /></div>
            <p className="text-accent-200 text-sm mt-1">points</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        </Card>

      {/* Transactions */}
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <ReceiptText size={18} className="text-text-tertiary" />
          {t("points.transactions")}
        </h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <ReceiptText size={32} className="mx-auto text-text-tertiary mb-3" />
            <p className="text-text-secondary text-sm">{t("points.noTransactions")}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((txn) => {
              const isPositive = txn.change_amount > 0;
              return (
                <div key={txn.id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", isPositive ? "bg-success-400/10 text-success-400" : "bg-red-400/10 text-red-400")}>
                      {isPositive ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{t(`points.reasons.${txn.reason}`)}</p>
                      <p className="text-xs text-text-tertiary">{new Date(txn.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-semibold tabular-nums", isPositive ? "text-success-400" : "text-red-400")}>
                    {isPositive ? "+" : ""}{txn.change_amount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
