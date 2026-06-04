import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ShieldCheck, Camera, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import TiltCard from "../components/TiltCard";
import LocaleSwitcher from "../components/LocaleSwitcher";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await register(email, password, nickname);
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : undefined;
      setError(msg || t("errors.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dark-600">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(49,130,252,0.04),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(49,130,252,0.03),transparent_60%)]" />

      <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-accent-500/3 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-accent-600/3 rounded-full blur-3xl animate-float" style={{ animationDelay: "4.5s" }} />

      <div className="absolute top-4 right-4 z-10">
        <LocaleSwitcher />
      </div>

      <Card variant="glass" padding="lg" className="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-glow mb-4">
            <Camera size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-display">{t("auth.registerTitle")}</h1>
          <p className="text-sm text-text-tertiary mt-1">AI Photo Creator</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-400/10 text-red-400 p-3 rounded-xl text-sm border border-red-400/20 animate-slide-down">
              {error}
            </div>
          )}

          <Input label={t("auth.nickname")} type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={t("auth.nicknamePlaceholder")} leftIcon={<User size={16} />} required />
          <Input label={t("auth.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.emailPlaceholder")} leftIcon={<Mail size={16} />} required />
          <Input label={t("auth.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.passwordPlaceholder")} leftIcon={<Lock size={16} />} required />
          <Input label={t("auth.passwordConfirm")} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("auth.passwordConfirmPlaceholder")} leftIcon={<ShieldCheck size={16} />} required />

          <TiltCard maxTilt={6}>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full" rightIcon={<UserPlus size={16} />}>
              {t("auth.register")}
            </Button>
          </TiltCard>
        </form>

        <div className="mt-6 text-center text-sm text-text-tertiary">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
            {t("auth.loginNow")}
          </Link>
        </div>
      </Card>
    </div>
  );
}
