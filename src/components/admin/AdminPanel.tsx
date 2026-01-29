import React, { useEffect, useState } from "react";

import { loadProducts, saveProducts } from "@/data/products";
import {
  ProductData,
  STATUS_COLORS,
  STATUS_LABELS,
  ProductStatus,
} from "@/types/product";
import { ROLE_LABELS, UserRole } from "@/types/auth";

import { getProductIcon } from '@/lib/products.ts';

import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

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

import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

interface ProductFormData {
  name: string;
  shortName: string;
  description: string;
  url: string;
  status: ProductStatus;
  isPublic: boolean;
  allowedRoles: UserRole[];
}

const initialFormData: ProductFormData = {
  name: "",
  shortName: "",
  description: "",
  url: "",
  status: "coming_soon",
  isPublic: false,
  allowedRoles: ["super_admin"],
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
      shortName: product.shortName,
      description: product.description,
      url: product.url,
      status: product.status,
      isPublic: product.isPublic,
      allowedRoles: [...product.allowedRoles],
    });

    setEditingId(productId);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...formData } : p))
      );
      toast.success("Product updated successfully");
    } else {
      const newId = `custom-${Date.now()}`;
      const newProduct: ProductData = {
        id: newId,
        ...formData,
        isExternal: true,
        order: products.length + 1,
      };

      setProducts((prev) => [...prev, newProduct]);
      toast.success("Product added successfully");
    }

    setIsDialogOpen(false);
    setEditingId(null);
  };

  const handleDelete = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setDeleteConfirm(null);
    toast.success("Product deleted successfully");
  };

  const toggleRole = (role: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter((r) => r !== role)
        : [...prev.allowedRoles, role],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Product Registry</h2>
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
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Access</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.map((product) => {
                const iconNode = getProductIcon(product.id);

                return (
                  <TableRow key={product.id}>
                    <TableCell>{iconNode}</TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {product.url}
                      </code>
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={cn("text-xs", STATUS_COLORS[product.status])}
                      >
                        {STATUS_LABELS[product.status]}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {product.isPublic ? (
                        <Badge variant="outline">Public</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {product.allowedRoles.slice(0, 2).map((role) => (
                            <Badge
                              key={role}
                              variant="secondary"
                              className="text-xs"
                            >
                              {ROLE_LABELS[role]}
                            </Badge>
                          ))}

                          {product.allowedRoles.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{product.allowedRoles.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(product.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              Configure the product details and access permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="AG New Product"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortName">Short Name</Label>
                <Input
                  id="shortName"
                  value={formData.shortName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortName: e.target.value,
                    }))
                  }
                  placeholder="New"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="A brief description of the product..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://product.amineva.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, status: v as ProductStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isPublic">Public Access</Label>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(v) =>
                  setFormData((prev) => ({ ...prev, isPublic: v }))
                }
              />
            </div>

            {!formData.isPublic && (
              <div className="space-y-2">
                <Label>Allowed Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {(["super_admin", "staff", "customer", "visitor"] as UserRole[]).map(
                    (role) => (
                      <Badge
                        key={role}
                        variant={formData.allowedRoles.includes(role) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleRole(role)}
                      >
                        {ROLE_LABELS[role]}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>

            <Button
              variant="destructive"
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
