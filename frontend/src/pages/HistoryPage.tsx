import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageOff, Eye } from "lucide-react";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";
import { useScrollReveal } from "../hooks/useScrollReveal";
import type { GenerationResponse } from "../lib/types";

function HistoryCard({ generation, onPreview }: { generation: GenerationResponse; onPreview: (g: GenerationResponse) => void }) {
  const { t } = useTranslation();
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <div ref={ref} className="reveal-on-scroll">
        <Card
          padding="none"
          variant="default"
          className="overflow-hidden group cursor-pointer"
          onClick={() => generation.image_url && onPreview(generation)}
        >
          <div className="aspect-square overflow-hidden bg-dark-600 relative">
            {generation.image_url ? (
              <>
                <img src={generation.image_url} alt={generation.subject} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div>
                    <p className="text-sm font-medium text-white truncate">{generation.subject}</p>
                    <p className="text-xs text-white/60">{new Date(generation.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-1.5 rounded-lg bg-black/50 text-white/80 backdrop-blur">
                    <Eye size={14} />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-text-tertiary text-sm">{t(`history.status.${generation.status}`)}</span>
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-sm text-text-primary truncate font-medium">{generation.subject || "—"}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant={generation.status === "completed" ? "success" : generation.status === "failed" ? "danger" : "default"} size="sm">
                {t(`history.status.${generation.status}`)}
              </Badge>
              {generation.image_type && <span className="text-xs text-text-tertiary">{t(`imageTypes.${generation.image_type}`)}</span>}
            </div>
          </div>
        </Card>
    </div>
  );
}

export default function HistoryPage() {
  const { t } = useTranslation();
  const [generations, setGenerations] = useState<GenerationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<GenerationResponse | null>(null);

  useEffect(() => {
    api.getGenerations(1, 50)
      .then((res) => {
        setGenerations((res as { items: GenerationResponse[] }).items);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-text-primary font-display mb-6">{t("history.title")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-3 w-1/2 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary font-display mb-6">{t("history.title")}</h2>

      {generations.length === 0 ? (
        <Card className="text-center py-16">
          <ImageOff size={48} className="mx-auto text-text-tertiary mb-4" />
          <p className="text-text-secondary">{t("history.empty")}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/"}>{t("nav.home")}</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {generations.map((g) => (
            <HistoryCard key={g.id} generation={g} onPreview={setPreview} />
          ))}
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} size="lg">
        {preview && (
          <div className="space-y-4">
            {preview.image_url && <img src={preview.image_url} alt={preview.subject} className="w-full rounded-xl" />}
            <div>
              <h3 className="font-semibold text-text-primary">{preview.subject || "—"}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {preview.image_type && <Badge variant="primary">{t(`imageTypes.${preview.image_type}`)}</Badge>}
                {preview.style && <Badge>{t(`styles.${preview.style}`)}</Badge>}
                {preview.scene && <Badge>{t(`scenes.${preview.scene}`)}</Badge>}
                <Badge variant="success">{t(`history.status.${preview.status}`)}</Badge>
              </div>
              <p className="text-xs text-text-tertiary mt-2">{new Date(preview.created_at).toLocaleString()}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
