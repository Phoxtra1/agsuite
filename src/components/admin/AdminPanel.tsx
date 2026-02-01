import React, { useEffect, useState } from "react";

import { loadProducts, saveProducts } from "@/data/products";
import {
  ProductData,
  STATUS_COLORS,
  STATUS_LABELS,
  ProductStatus,
} from "@/types/product";

import { getProductIcon } from '@/lib/products.ts';

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

import { Pencil, Plus, Save, Trash2, X, ExternalLink, Power, PowerOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ProductFormData {
  name: string;
  shortName: string;
  description: string;
  adminUrl: string;
  status: ProductStatus;
}

const initialFormData: ProductFormData = {
  name: "",
  shortName: "",
  description: "",
  adminUrl: "",
  status: "coming_soon",
};

export function AdminPanel() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load products on mount
  useEffect(() => {
    setProducts(loadProducts());
  }, []);

  // Save products whenever they change
  useEffect(() => {
    if (products.length > 0) {
      saveProducts(products);
    }
  }, [products]);

  const handleAdd = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setFormData({
      name: product.name,
      shortName: product.shortName || "",
      description: product.description || "",
      adminUrl: product.adminUrl || "",
      status: product.status,
    });

    setEditingId(productId);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...formData } : p))
      );
      toast.success("Product updated");
    } else {
      const newId = `custom-${Date.now()}`;
      const newProduct: ProductData = {
        id: newId,
        name: formData.name,
        shortName: formData.shortName,
        description: formData.description,
        adminUrl: formData.adminUrl,
        status: formData.status,
        url: formData.adminUrl || `https://${formData.shortName.toLowerCase()}.amineva.com`,
        isExternal: true,
        isPublic: false,
        allowedRoles: ["super_admin", "staff"],
        order: products.length + 1,
      };

      setProducts((prev) => [...prev, newProduct]);
      toast.success("Product added");
    }

    setIsDialogOpen(false);
    setEditingId(null);
  };

  const handleDelete = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setDeleteConfirm(null);
    toast.success("Product deleted");
  };

  const handleQuickToggle = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: p.status === "live" ? "offline" : "live" as ProductStatus }
          : p
      )
    );
    toast.success("Product status updated");
  };

  const openAdminUrl = (url?: string) => {
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Product Registry</h2>
          <p className="text-muted-foreground">
            Manage products in the Amineva Suite
          </p>
        </div>

        <Button
          onClick={handleAdd}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Live</TableHead>
                <TableHead>Admin Portal</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.map((product) => {
                const IconComponent = getProductIcon(product.id);

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <IconComponent className="w-8 h-8" />
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description || 'No description'}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={cn("text-xs", STATUS_COLORS[product.status])}
                      >
                        {STATUS_LABELS[product.status]}
                      </Badge>
                    </TableCell>

                    {/* Quick Live/Offline Toggle */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.status === "live"}
                          onCheckedChange={() => handleQuickToggle(product.id)}
                          aria-label="Toggle live status"
                        />
                        {product.status === "live" ? (
                          <Power className="h-4 w-4 text-success" />
                        ) : (
                          <PowerOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {product.adminUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-accent hover:text-accent/80 h-8 px-2"
                          onClick={() => openAdminUrl(product.adminUrl)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-foreground hover:text-accent"
                          onClick={() => handleEdit(product.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive/80"
                          onClick={() => setDeleteConfirm(product.id)}
                        >
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

      {/* Compact Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update product details" : "Add a new product to the suite"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-foreground">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Product Name"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shortName" className="text-foreground">Short Name</Label>
                <Input
                  id="shortName"
                  value={formData.shortName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortName: e.target.value,
                    }))
                  }
                  placeholder="Short"
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief product description"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminUrl" className="text-foreground">Admin URL</Label>
              <Input
                id="adminUrl"
                value={formData.adminUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, adminUrl: e.target.value }))
                }
                placeholder="https://product.amineva.com/admin"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, status: v as ProductStatus }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Save className="mr-1.5 h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
