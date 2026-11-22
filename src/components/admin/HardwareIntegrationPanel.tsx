import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INTEGRATION_PRODUCTS, HARDWARE_INTEGRATION_CATALOG } from "@/core/devices/integrationCatalog";
import { Cable, Cpu, Monitor, RadioTower, ShieldCheck } from "lucide-react";

const modeLabel: Record<string, string> = {
  "browser-peripheral": "Local peripheral adapter",
  "native-device": "Managed native device",
  "managed-gateway": "Managed device gateway",
  "external-service": "External service connector",
};
const readinessLabel: Record<string, string> = {
  "shared-framework": "Shared framework",
  "product-adapter-required": "Product adapter required",
  "dedicated-gateway-required": "Dedicated gateway required",
  "external-connector-required": "External connector required",
};
const modeIcon = (mode: string) => mode === "managed-gateway" ? RadioTower : mode === "native-device" ? Monitor : mode === "browser-peripheral" ? Cable : Cpu;

export function HardwareIntegrationPanel() {
  const [activeProduct, setActiveProduct] = useState(INTEGRATION_PRODUCTS[0].id);
  const entries = useMemo(() => HARDWARE_INTEGRATION_CATALOG.filter(item => item.productId === activeProduct), [activeProduct]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h3 className="font-semibold">Shared Amineva integration framework</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              One centrally managed framework supplies device identity, secure routing, permissions, monitoring and audit.
              Each product keeps its own hardware adapters, workflows, data model and backend connection.
              Hardware provisioning is handled by authorised administrators or deployment partners; end users only receive
              the permissions required by an assigned feature.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeProduct} onValueChange={value => setActiveProduct(value as typeof activeProduct)}>
        <TabsList className="h-auto flex-wrap">
          {INTEGRATION_PRODUCTS.map(item => <TabsTrigger key={item.id} value={item.id}>{item.name}</TabsTrigger>)}
        </TabsList>
        {INTEGRATION_PRODUCTS.map(item => (
          <TabsContent key={item.id} value={item.id} className="mt-4 space-y-4">
            <div>
              <h4 className="font-semibold">{item.name}</h4>
              <p className="text-sm text-muted-foreground">{item.scope}</p>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {HARDWARE_INTEGRATION_CATALOG.filter(entry => entry.productId === item.id).map(entry => {
                const Icon = modeIcon(entry.integrationMode);
                return (
                  <Card key={entry.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-primary/10 p-2"><Icon className="h-4 w-4 text-primary" /></div>
                          <div>
                            <CardTitle className="text-base">{entry.serviceArea}</CardTitle>
                            <CardDescription>{modeLabel[entry.integrationMode]}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline">{readinessLabel[entry.readiness]}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p>{entry.purpose}</p>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Compatible hardware classes</p>
                        <ul className="mt-1 list-disc pl-5 text-muted-foreground">{entry.hardware.map(device => <li key={device}>{device}</li>)}</ul>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {entry.capabilities.map(capability => <Badge key={capability} variant="secondary">{capability}</Badge>)}
                      </div>
                      {entry.safetyBoundary && <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">{entry.safetyBoundary}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <p className="text-xs text-muted-foreground">
        These are integration classes and adapter requirements, not a certified list of specific device models.
        Exact compatibility is confirmed against the manufacturer protocol, model, firmware and deployment environment.
      </p>
    </div>
  );
}
