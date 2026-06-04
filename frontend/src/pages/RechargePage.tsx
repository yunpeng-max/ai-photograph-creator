import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, Clock, CheckCircle2, XCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { PlanInfo, CreatePaymentResponse, PaymentStatusResponse } from "../lib/types";

type Step = "select" | "qrcode" | "confirming" | "success" | "failed";

interface PlanCardProps {
  plan: PlanInfo;
  onSelect: (plan: PlanInfo) => void;
  loading: boolean;
}

function PlanCard({ plan, onSelect, loading }: PlanCardProps) {
  const { t, i18n } = useTranslation();
  const name = i18n.language === "zh" ? plan.name_zh : plan.name_en;
  const bestValue = plan.key === "premium";

  return (
    <Card
      variant={bestValue ? "elevated" : "default"}
      padding="lg"
      className={`relative flex flex-col items-center text-center gap-4 transition-all ${
        bestValue ? "ring-2 ring-accent-400 shadow-glow" : ""
      }`}
    >
      {bestValue && (
        <Badge variant="primary" className="absolute -top-3">
          Best Value
        </Badge>
      )}
      <Package className="w-8 h-8 text-accent-400" />
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{name}</h3>
        <p className="text-3xl font-bold text-text-primary mt-2">
          {plan.points}{" "}
          <span className="text-sm font-normal text-text-secondary">points</span>
        </p>
      </div>
      <p className="text-2xl font-bold text-accent-400">{plan.price_label}</p>
      <Button
        variant={bestValue ? "primary" : "outline"}
        className="w-full"
        onClick={() => onSelect(plan)}
        loading={loading}
      >
        {t("recharge.purchase")}
      </Button>
    </Card>
  );
}

export default function RechargePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateBalance } = useAuth();

  const [step, setStep] = useState<Step>("select");
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [qrUrl, setQrUrl] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);
  const [payment, setPayment] = useState<CreatePaymentResponse | null>(null);
  const [orderStatus, setOrderStatus] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState("");

  // Load plans and QR code URL
  useEffect(() => {
    setLoadingPlans(true);
    Promise.all([
      api.getPlans(),
      api.getQrCode ? api.getQrCode() : Promise.resolve({ qr_url: "" }),
    ])
      .then(([plansData, qrData]) => {
        setPlans(plansData.plans);
        setQrUrl(qrData.qr_url || "");
        setLoadingPlans(false);
      })
      .catch(() => {
        setError("Failed to load data");
        setLoadingPlans(false);
      });
  }, []);

  // Select plan → show QR code
  const handleSelectPlan = useCallback((plan: PlanInfo) => {
    setSelectedPlan(plan);
    setError("");
    setStep("qrcode");
  }, []);

  // User clicks "I've Paid" → submit order
  const handleConfirmPayment = useCallback(async () => {
    if (!selectedPlan) return;
    setError("");
    setSubmitting(true);
    try {
      const result = await api.purchasePoints(selectedPlan.key);
      setPayment(result);
      setStep("confirming");
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  }, [selectedPlan]);

  // Poll payment status while waiting for admin approval
  useEffect(() => {
    if (step !== "confirming" || !payment) return;

    const poll = async () => {
      try {
        const status = await api.getPaymentStatus(payment.order_id);
        setOrderStatus(status);
        if (status.status === "paid") {
          setStep("success");
          updateBalance(0);
        } else if (status.status === "failed") {
          setStep("failed");
        }
      } catch {
        // keep polling
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [step, payment, updateBalance]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(-1)}
        >
          {t("common.back")}
        </Button>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          {t("recharge.title")}
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step: Select Plan */}
      {step === "select" && (
        <div className="space-y-6">
          <p className="text-text-secondary">{t("recharge.selectPlan")}</p>
          {loadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.key}
                  plan={plan}
                  onSelect={handleSelectPlan}
                  loading={submitting}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Show QR Code */}
      {step === "qrcode" && selectedPlan && (
        <div className="flex flex-col items-center gap-6">
          <Card variant="glass" padding="lg" className="flex flex-col items-center gap-4 max-w-sm w-full text-center">
            <h2 className="text-lg font-semibold text-text-primary">
              {t("recharge.scanToPay")}
            </h2>
            <p className="text-sm text-text-secondary">
              {t("recharge.planInfo", {
                plan: selectedPlan.name_zh,
                amount: selectedPlan.price_label,
              })}
            </p>

            {qrUrl ? (
              <img
                src={qrUrl}
                alt="WeChat Payment QR Code"
                className="w-64 h-64 object-contain rounded-xl border border-white/10"
              />
            ) : (
              <div className="w-64 h-64 bg-surface-300 rounded-xl flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-8 h-8 text-text-tertiary" />
                <span className="text-text-tertiary text-sm text-center px-4">
                  {t("recharge.noQrCode")}
                </span>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleConfirmPayment}
              loading={submitting}
            >
              {t("recharge.iHavePaid")}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("select");
                setSelectedPlan(null);
              }}
            >
              {t("recharge.cancel")}
            </Button>
          </Card>
        </div>
      )}

      {/* Step: Waiting for Admin Approval */}
      {step === "confirming" && (
        <div className="flex flex-col items-center gap-6">
          <Card variant="glass" padding="lg" className="flex flex-col items-center gap-4 max-w-sm w-full text-center">
            <Clock className="w-16 h-16 text-accent-400 animate-pulse" />
            <h2 className="text-xl font-semibold text-text-primary">
              {t("recharge.waitingTitle")}
            </h2>
            <p className="text-text-secondary">
              {t("recharge.waitingMessage")}
            </p>
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <div className="w-4 h-4 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
              {t("recharge.polling")}
            </div>
          </Card>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className="flex flex-col items-center gap-6">
          <Card variant="glass" padding="lg" className="flex flex-col items-center gap-4 max-w-sm w-full text-center">
            <CheckCircle2 className="w-16 h-16 text-success-400" />
            <h2 className="text-xl font-semibold text-text-primary">
              {t("recharge.success")}
            </h2>
            {orderStatus && (
              <Badge variant="success" size="md">
                +{orderStatus.points} {t("recharge.pointsAwarded")}
              </Badge>
            )}
            <Button variant="primary" onClick={() => navigate("/points")}>
              {t("nav.points")}
            </Button>
          </Card>
        </div>
      )}

      {/* Step: Failed */}
      {step === "failed" && (
        <div className="flex flex-col items-center gap-6">
          <Card variant="glass" padding="lg" className="flex flex-col items-center gap-4 max-w-sm w-full text-center">
            <XCircle className="w-16 h-16 text-red-400" />
            <h2 className="text-xl font-semibold text-text-primary">
              {t("recharge.rejected")}
            </h2>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep("select"); setSelectedPlan(null); }}>
                {t("recharge.backToPlans")}
              </Button>
              <Button variant="primary" onClick={() => setStep("select")}>
                {t("recharge.retry")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
