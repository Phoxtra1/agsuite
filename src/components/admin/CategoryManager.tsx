import React, { useState } from "react";
import { useCategoryProducts, useCategoryProductMutations } from "@/hooks/useProducts";
import { ProductData, STATUS_COLORS, STATUS_LABELS, ProductStatus } from "@/types/product";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";

interface FormData {
  name: string;
  shortName: string;
  description: string;
  url: string;
  status: ProductStatus;
}

const initialFormData: FormData = {
  name: "", shortName: "", description: "", url: "", status: "coming_soon",
};

export function CategoryManager() {
  const { products, refresh } = useCategoryProducts();
  const { save, remove } = useCategoryProductMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAdd = () => { setFormData(initialFormData); setEditingId(null); setIsDialogOpen(true); };

  const handleEdit = (id: string) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    setFormData({ name: p.name, shortName: p.shortName || "", description: p.description || "", url: p.url || "", status: p.status });
    setEditingId(id);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const name = formData.name.trim();
    if (!name) { toast.error("Name is required"); return; }

    setSaving(true);

    const product: ProductData = editingId
      ? { ...products.find(p => p.id === editingId)!, name, shortName: formData.shortName, description: formData.description, url: formData.url, status: formData.status }
      : {
          id: `cat-${Date.now()}`,
          name,
          shortName: formData.shortName,
          description: formData.description,
          url: formData.url,
          status: formData.status,
          order: products.length + 1,
        };

    const ok = await save(product);
    setSaving(false);

    if (ok) {
      toast.success(editingId ? "Product updated — saved permanently" : "Product added to homepage permanently");
      await refresh();
      setIsDialogOpen(false);
      setEditingId(null);
    } else {
      toast.error("Failed to save — please try again");
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await remove(id);
    if (ok) {
      toast.success("Product removed permanently");
      await refresh();
    } else {
      toast.error("Failed to delete");
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Category Products</h2>
          <p className="text-muted-foreground">Manage products displayed on the homepage. Changes are saved permanently.</p>
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
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{p.description || "No description"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", STATUS_COLORS[p.status])}>{STATUS_LABELS[p.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{p.url || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-accent" onClick={() => handleEdit(p.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => setDeleteConfirm(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>{editingId ? "Update product details" : "Add a new product to the homepage"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground">Name</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Product Name" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">Short Name</Label>
                <Input value={formData.shortName} onChange={e => setFormData(p => ({ ...p, shortName: e.target.value }))} placeholder="Short" className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Description</Label>
              <Input value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">URL</Label>
              <Input value={formData.url} onChange={e => setFormData(p => ({ ...p, url: e.target.value }))} placeholder="https://product.amineva.com" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as ProductStatus }))}>
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
            <DialogTitle>Remove from homepage?</DialogTitle>
            <DialogDescription>This product will no longer appear on the homepage.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
