import React, { useMemo, useState } from "react";
import { useAdminProducts, useAdminProductMutations } from "@/hooks/useProducts";
import {
  ProductData,
  STATUS_COLORS,
  STATUS_LABELS,
  ProductStatus,
} from "@/types/product";

import { getProductIcon } from "@/lib/products";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Pencil, Plus, Save, Trash2, ExternalLink } from "lucide-react";

interface ProductFormData {
  name: string;
  shortName: string;
  description: string;
  url: string;
  status: ProductStatus;
}

const initialFormData: ProductFormData = {
  name: "",
  shortName: "",
  description: "",
  url: "",
  status: "coming_soon",
};

function normalizeUrl(url: string) {
  const v = url.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export function AdminPanel() {
  const { products, refresh } = useAdminProducts();
  const { save, remove } = useAdminProductMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = !!editingId;

  const dialogTitle = useMemo(
    () => (isEditing ? "Edit Product" : "Add Product"),
    [isEditing]
  );

  const dialogDesc = useMemo(
    () => (isEditing ? "Update product details" : "Add a new product to the suite"),
    [isEditing]
  );

  const handleAdd = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setFormData({
      name: product.name || "",
      shortName: product.shortName || "",
      description: product.description || "",
      url: product.url || "",
      status: product.status,
    });

    setEditingId(productId);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const name = formData.name.trim();
    const shortName = formData.shortName.trim();
    const description = formData.description.trim();
    const url = normalizeUrl(formData.url);

    if (!name) {
      toast.error("Product name is required");
      return;
    }

    if (!isEditing && !shortName) {
      toast.error("Short name is required for new products");
      return;
    }

    setSaving(true);

    const product: ProductData = isEditing
      ? { ...products.find((p) => p.id === editingId)!, name, shortName, description, url, status: formData.status }
      : {
          id: `admin-${shortName.toLowerCase().replace(/\s/g, "")}-${Date.now()}`,
          name,
          shortName,
          description,
          url,
          status: formData.status,
          order: products.length + 1,
        };

    const ok = await save(product);
    setSaving(false);

    if (ok) {
      toast.success(isEditing ? "Product updated permanently" : "Product added permanently");
      await refresh();
      setIsDialogOpen(false);
      setEditingId(null);
    } else {
      toast.error("Failed to save — please try again");
    }
  };

  const handleDelete = async (productId: string) => {
    const ok = await remove(productId);
    if (ok) {
      toast.success("Product deleted permanently");
      await refresh();
    } else {
      toast.error("Failed to delete");
    }
    setDeleteConfirm(null);
  };

  const openHomepageUrl = (url?: string) => {
    const u = normalizeUrl(url || "");
    if (!u) return;
    window.open(u, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Product Registry</h2>
          <p className="text-muted-foreground">Manage products in the Amineva Suite</p>
        </div>
        <Button onClick={handleAdd} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Homepage</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const IconComponent = getProductIcon(product.id);
                return (
                  <TableRow key={product.id}>
                    <TableCell><IconComponent className="w-8 h-8" /></TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{product.description || "No description"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", STATUS_COLORS[product.status])}>{STATUS_LABELS[product.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      {product.url ? (
                        <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80 h-8 px-2" onClick={() => openHomepageUrl(product.url)}>
                          <ExternalLink className="h-4 w-4 mr-1" /> Open
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-accent" onClick={() => handleEdit(product.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => setDeleteConfirm(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground">Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="Product Name" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">Short Name</Label>
                <Input value={formData.shortName} onChange={(e) => setFormData((p) => ({ ...p, shortName: e.target.value }))} placeholder="Short" className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="Brief product description" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Homepage URL</Label>
              <Input value={formData.url} onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))} placeholder="https://app.amineva.com" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v as ProductStatus }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
