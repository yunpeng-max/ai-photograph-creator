import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Image, Crop, Palette, MapPin, Layout, Sparkles, CheckCircle, X, ZoomIn } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { ChipSelector } from "../components/ui/ChipSelector";
import TypewriterText from "../components/TypewriterText";
import TiltCard from "../components/TiltCard";
import type { FormOptions, GenerationResponse } from "../lib/types";

interface FormData {
  image_type: string;
  aspect_ratio: string;
  style: string;
  scene: string;
  whitespace: string;
  subject: string;
  additional_requirements: string;
}

const defaultForm: FormData = {
  image_type: "product_photo",
  aspect_ratio: "1:1",
  style: "realistic",
  scene: "studio",
  whitespace: "some",
  subject: "",
  additional_requirements: "",
};

export default function HomePage() {
  const { t } = useTranslation();
  const { updateBalance } = useAuth();
  const [form, setForm] = useState<FormData>(defaultForm);
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    api.getOptions().then(setOptions).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = (await api.generate({
        image_type: form.image_type,
        aspect_ratio: form.aspect_ratio,
        style: form.style,
        scene: form.scene,
        whitespace: form.whitespace,
        subject: form.subject,
        additional_requirements: form.additional_requirements || undefined,
      })) as GenerationResponse;
      setResult(response);
      if (response.points_balance_after !== undefined) {
        updateBalance(response.points_balance_after);
      }
    } catch (err: unknown) {
      const e = err as { code?: string; status?: number; message?: string };
      if (e.code === "INSUFFICIENT_POINTS" || e.status === 402) {
        setShowUpgrade(true);
      } else {
        setError(e.message || t("errors.networkError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (!options) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const sectionIcon = "text-accent-400";

  return (
    <div>
      {/* Hero section */}
      <div className="text-center mb-10 animate-slide-up">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-text-primary">
          <TypewriterText
            text={t("home.title")}
            speed={60}
            delay={200}
            tag="span"
          />
        </h2>
        <p className="mt-3 text-text-tertiary text-lg animate-fade-in">{t("home.subtitle")}</p>
      </div>

      <Card variant="glass" padding="lg" className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
                <Image size={16} className={sectionIcon} />
                {t("home.imageType")}
              </label>
              <ChipSelector
                options={options.image_types.map((o) => ({ key: o.key, label: t(`imageTypes.${o.key}`) }))}
                value={form.image_type}
                onChange={(v) => handleChange("image_type", v)}
                columns={5}
              />
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
                <Crop size={16} className={sectionIcon} />
                {t("home.aspectRatio")}
              </label>
              <ChipSelector
                options={options.aspect_ratios.map((o) => ({ key: o.key, label: t(`aspectRatios.${o.key}`) }))}
                value={form.aspect_ratio}
                onChange={(v) => handleChange("aspect_ratio", v)}
                columns={7}
              />
            </div>

            {/* Style */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
                <Palette size={16} className={sectionIcon} />
                {t("home.style")}
              </label>
              <ChipSelector
                options={options.styles.map((o) => ({ key: o.key, label: t(`styles.${o.key}`) }))}
                value={form.style}
                onChange={(v) => handleChange("style", v)}
                columns={4}
              />
            </div>

            {/* Scene */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
                <MapPin size={16} className={sectionIcon} />
                {t("home.scene")}
              </label>
              <ChipSelector
                options={options.scenes.map((o) => ({ key: o.key, label: t(`scenes.${o.key}`) }))}
                value={form.scene}
                onChange={(v) => handleChange("scene", v)}
                columns={5}
              />
            </div>

            {/* Whitespace */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
                <Layout size={16} className={sectionIcon} />
                {t("home.whitespace")}
              </label>
              <ChipSelector
                options={options.whitespaces.map((o) => ({ key: o.key, label: t(`whitespaces.${o.key}`) }))}
                value={form.whitespace}
                onChange={(v) => handleChange("whitespace", v)}
                columns={4}
              />
            </div>

            {/* Subject */}
            <Input
              label={t("home.subject")}
              value={form.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder={t("home.subjectPlaceholder")}
              required
            />

            {/* Additional Requirements */}
            <Input
              label={t("home.additionalRequirements")}
              value={form.additional_requirements}
              onChange={(e) => handleChange("additional_requirements", e.target.value)}
              placeholder={t("home.additionalRequirementsPlaceholder")}
            />

            {/* Error */}
            {error && (
              <div className="bg-red-400/10 text-red-400 p-3 rounded-xl text-sm border border-red-400/20 animate-slide-down flex items-center gap-2">
                <X size={14} />{error}
              </div>
            )}

            {/* Submit — breathing light effect + 3D tilt */}
            <TiltCard maxTilt={6}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full bg-accent-500 hover:bg-accent-600 shadow-glow animate-breath"
                rightIcon={<Sparkles size={18} />}
              >
                {loading ? t("home.generating") : `${t("home.generate")} - ${t("home.cost")}`}
              </Button>
            </TiltCard>
          </form>
        </Card>

      {/* Result */}
      {result && (
        <Card variant="glass" className="max-w-3xl mx-auto mt-8 border-accent-400/20">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-success-400" />
            <h3 className="text-lg font-semibold text-text-primary">{t("home.result")}</h3>
          </div>
          {result.image_url && (
            <div
              className="relative group cursor-zoom-in overflow-hidden rounded-xl"
              onClick={() => setLightboxOpen(true)}
            >
              <img src={result.image_url} alt="Generated" className="w-full max-h-[400px] object-contain bg-dark-600 rounded-xl animate-scale-in" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}
          {result.assembled_prompt && (
            <details className="mt-4">
              <summary className="text-sm text-text-tertiary cursor-pointer hover:text-text-secondary">
                {t("home.additionalRequirements")}
              </summary>
              <p className="mt-2 text-xs text-text-tertiary bg-dark-600 p-3 rounded-lg whitespace-pre-wrap font-mono">{result.assembled_prompt}</p>
            </details>
          )}
        </Card>
      )}

      {/* Lightbox */}
      <Modal open={lightboxOpen} onClose={() => setLightboxOpen(false)} size="lg">
        {result?.image_url && <img src={result.image_url} alt="Full size" className="w-full rounded-lg" />}
      </Modal>

      {/* Upgrade Modal */}
      <Modal open={showUpgrade} onClose={() => setShowUpgrade(false)} title={t("upgrade.title")}>
        <p className="text-text-secondary mb-6">{t("upgrade.message")}</p>
        <div className="space-y-3 mb-6">
          {["basic", "pro", "premium"].map((plan) => (
            <div key={plan} className="glass rounded-xl p-4 animate-scale-in">
              <div className="flex justify-between items-center">
                <span className="font-medium text-text-primary">{t(`upgrade.plans.${plan}.points`)}</span>
                <span className="text-accent-400 font-bold">{t(`upgrade.plans.${plan}.price`)}</span>
              </div>
              <Button variant="ghost" size="sm" disabled className="w-full mt-2">{t("upgrade.comingSoon")}</Button>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full" onClick={() => setShowUpgrade(false)}>{t("upgrade.dismiss")}</Button>
      </Modal>
    </div>
  );
}
