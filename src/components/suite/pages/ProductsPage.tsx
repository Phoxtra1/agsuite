import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ensureProfile, getCurrentUser } from "../../../lib/profile";

import {
  IconAGApp,
  IconAGOps,
  IconAGStock,
  IconPlaceholder,
} from "@/components/icons/ProductIcons";
import { Globe, Lock, Clock } from "lucide-react";

type Status = "live" | "restricted" | "coming_soon" | "offline";

type ProductId = "hub" | "agis" | "agstock" | "amniva" | "ops";

type ProductData = {
  id: ProductId;
  name: string;
  url: string;
  status: Status;
  order: number;
  description: string;
};

// ✅ Locked products list (exactly what you approved)
const BASE_PRODUCTS: ProductData[] = [
  {
    id: "hub",
    name: "AG Hub",
    url: "https://hub.amineva.com",
    status: "live",
    order: 1,
    description:
      "Publications of insights, reports, previous works, careers/recruitments, resources, and previous work done.",
  },
  {
    id: "agis",
    name: "AGIS",
    url: "https://app.amineva.com",
    status: "live",
    order: 2,
    description:
      "Services to clients needing data & insights, field project inspection, strategic assessment, and professional documentation.",
  },
  {
    id: "ops",
    name: "AminevaOps",
    url: "",
    status: "coming_soon",
    order: 3,
    description:
      "Service operations platform",
  },
  {
    id: "agstock",
    name: "AGStock",
    url: "https://stock.amineva.com",
    status: "live",
    order: 4,
    description: "Track and Secure inventory, sales, and loss-prevention",
  },
  {
    id: "amniva",
    name: "Amniva",
    url: "https://www.amniva.io",
    status: "offline",
    order: 5,
    description: "Verify & predictions (Offline).",
  },
];

function getProductIcon(id: ProductId) {
  const icons: Record<ProductId, React.ReactNode> = {
    hub: <Globe className="w-10 h-10 text-accent" />,
    agis: <IconAGApp className="w-10 h-10" />,
    ops: <IconAGOps className="w-10 h-10" />,
    agstock: <IconAGStock className="w-10 h-10" />,
    amniva: <IconPlaceholder className="w-10 h-10" />,
  };
  return icons[id];
}

function getBadgeVariant(status: Status): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "live":
      return "default";
    case "restricted":
      return "destructive";
    case "coming_soon":
      return "secondary";
    default:
      return "outline";
  }
}

function label(status: Status) {
  if (status === "live") return "Live";
  if (status === "restricted") return "Restricted";
  if (status === "coming_soon") return "Coming Soon";
  return "Off";
}

function ProductModal({
  open,
  onClose,
  type,
  productName,
}: {
  open: boolean;
  onClose: (open: boolean) => void;
  type: "restricted" | "coming_soon" | "offline";
  productName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "restricted" ? (
              <>
                <Lock className="h-5 w-5 text-destructive" />
                Restricted Access
              </>
            ) : type === "coming_soon" ? (
              <>
                <Clock className="h-5 w-5 text-muted-foreground" />
                Coming Soon
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-muted-foreground" />
                Currently Off
              </>
            )}
          </DialogTitle>

          <DialogDescription>
            {type === "restricted"
              ? "This product requires access permissions. Contact the administrator or request access."
              : type === "coming_soon"
              ? "This product is currently under development and will be available soon."
              : "This product is currently turned off."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onClose(false)}>
            Close
          </Button>
          {type === "restricted" && <Button onClick={() => onClose(false)}>Request Access</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProductsPages() {
  const [enabledSet, setEnabledSet] = useState<Set<ProductId>>(new Set());
  const [modal, setModal] = useState<{
    open: boolean;
    type: "restricted" | "coming_soon" | "offline";
    productName: string;
  }>({ open: false, type: "restricted", productName: "" });

  // Load Suite profile + enabledProducts
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        const prof = await ensureProfile(user.$id);
        setEnabledSet(new Set((prof.enabledProducts ?? []) as ProductId[]));
      } catch {
        setEnabledSet(new Set());
      }
    })();
  }, []);

  // Gate products (prevents wandering)
  const products = useMemo(() => {
    return BASE_PRODUCTS.map((p) => {
      if (p.status === "live" && !enabledSet.has(p.id)) {
        return { ...p, status: "restricted" as const };
      }
      return p;
    }).sort((a, b) => a.order - b.order);
  }, [enabledSet]);

  const onClickProduct = (p: ProductData) => {
    if (p.status === "live") {
      window.location.href = p.url;
      return;
    }
    if (p.status === "restricted") {
      setModal({ open: true, type: "restricted", productName: p.name });
      return;
    }
    if (p.status === "coming_soon") {
      setModal({ open: true, type: "coming_soon", productName: p.name });
      return;
    }
    setModal({ open: true, type: "offline", productName: p.name });
  };

  return (
    <div className="space-y-8">
      {/* Products Grid */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6">Products</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((p) => (
            <Card
              key={p.id}
              className={`group transition-all duration-200 hover:shadow-lg cursor-pointer ${
                p.status === "live" ? "hover:border-accent/50" : "opacity-85"
              }`}
              onClick={() => onClickProduct(p)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="mb-3 transition-transform group-hover:scale-110">
                  {getProductIcon(p.id)}
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-2">{p.name}</h3>
                <Badge variant={getBadgeVariant(p.status)} className="text-xs">
                  {label(p.status)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Descriptions */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6">Descriptions</h2>

        <div className="space-y-4">
          {products.map((p) => (
            <Card key={`desc-${p.id}`} className="hover:border-accent/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <Badge variant={getBadgeVariant(p.status)} className="text-xs">
                    {label(p.status)}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">{p.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
        <CardContent className="py-8 text-center">
          <p className="text-lg text-foreground font-medium">
            All products are geared toward one vital problem: protection of investments through verified information and operational control.
          </p>
        </CardContent>
      </Card>

      <ProductModal
        open={modal.open}
        onClose={(open) => setModal((prev) => ({ ...prev, open }))}
        type={modal.type}
        productName={modal.productName}
      />
    </div>
  );
}
