import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import IdleLogout from "@/components/system/IdleLogout";

import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ShopDataProvider } from "@/contexts/ShopDataContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Suite (homepage + suite admin area)
import SuitePage from "./pages/Suite"; // <-- adjust if your SuitePage path differs

// Public pages
import NotFound from "./pages/NotFound";
import InviteAccepted from "./pages/InviteAccepted";

// Employee onboarding / redirect handlers
import EmployeeInvite from "./pages/employee/EmployeeInvite";
import EmployeeEntry from "./pages/employee/EmployeeEntry";
import EmployeeSetupPin from "./pages/employee/EmployeeSetupPin";
import EmployeeSetupProfile from "./pages/employee/EmployeeSetupProfile";

// Employee workspace
import EmployeesDashboard from "./pages/employee/EmployeesDashboard";

// ✅ AG Stock Admin pages (software manager dashboard)
import AdminDashboard from "./pages/admin/AdminDashboard";
import ShopsManagement from "./pages/admin/ShopsManagement";
import SubscriptionsManagement from "./pages/admin/SubscriptionsManagement";
import PlatformNotifications from "./pages/admin/PlatformNotifications";
import ManualShopCreation from "./pages/admin/ManualShopCreation";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";

// Shop Owner pages
import ShopDashboard from "./pages/shop/ShopDashboard";
import Inventory from "./pages/shop/Inventory";
import Sales from "./pages/shop/Sales";
import StockIn from "./pages/shop/StockIn";
import StockOut from "./pages/shop/StockOut";
import Employees from "./pages/shop/Employees";
import Settings from "./pages/shop/Settings";
import Profile from "./pages/shop/Profile";

// Subscription pages
import Subscription from "./pages/shop/Subscription";
import Subscribe from "./pages/Subscribe";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <ShopDataProvider>
                <SubscriptionProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />

                    <BrowserRouter>
                      <IdleLogout />

                      <Routes>
                        {/* ✅ SUITE HOMEPAGE */}
                        <Route
                          path="/"
                          element={
                            <ErrorBoundary>
                              <SuitePage />
                            </ErrorBoundary>
                          }
                        />

                        {/* ✅ SUITE ADMIN AREA (tabs like /admin/products, /admin/coms, etc.) */}
                        <Route
                          path="/admin/*"
                          element={
                            <ErrorBoundary>
                              <SuitePage />
                            </ErrorBoundary>
                          }
                        />

                        {/* Invite accept */}
                        <Route path="/invite/:token" element={<InviteAccepted />} />

                        {/* Employee invite / redirect flow */}
                        <Route path="/employee/invite" element={<EmployeeInvite />} />
                        <Route path="/employee/entry" element={<EmployeeEntry />} />
                        <Route path="/employee/setup-pin" element={<EmployeeSetupPin />} />
                        <Route
                          path="/employee/setup-profile"
                          element={<EmployeeSetupProfile />}
                        />

                        {/* ✅ EMPLOYEE WORKSPACE */}
                        <Route
                          path="/employees/*"
                          element={
                            <ErrorBoundary>
                              <EmployeesDashboard />
                            </ErrorBoundary>
                          }
                        />

                        {/* ✅ SHOP OWNER */}
                        <Route
                          path="/shop"
                          element={
                            <ErrorBoundary>
                              <ShopDashboard />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/shop/inventory"
                          element={
                            <ErrorBoundary>
                              <Inventory />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/shop/sales"
                          element={
                            <ErrorBoundary>
                              <Sales />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/shop/stock-in"
                          element={
                            <ErrorBoundary>
                              <StockIn />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/shop/stock-out"
                          element={
                            <ErrorBoundary>
                              <StockOut />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/shop/employees"
                          element={
                            <ErrorBoundary>
                              <Employees />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/shop/subscription"
                          element={
                            <ErrorBoundary>
                              <Subscription />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/shop/settings"
                          element={
                            <ErrorBoundary>
                              <Settings />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/shop/profile"
                          element={
                            <ErrorBoundary>
                              <Profile />
                            </ErrorBoundary>
                          }
                        />

                        {/* Marketing / signup */}
                        <Route path="/shop/subscribe" element={<Subscribe />} />

                        {/* ✅ AG STOCK ADMIN (SOFTWARE MANAGER) — moved away from /admin to avoid conflict */}
                        <Route
                          path="/agstock/admin"
                          element={
                            <ErrorBoundary>
                              <AdminDashboard />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/agstock/admin/shops"
                          element={
                            <ErrorBoundary>
                              <ShopsManagement />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/agstock/admin/subscriptions"
                          element={
                            <ErrorBoundary>
                              <SubscriptionsManagement />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/agstock/admin/users"
                          element={
                            <ErrorBoundary>
                              <AdminUsers />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/agstock/admin/notifications"
                          element={
                            <ErrorBoundary>
                              <PlatformNotifications />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/agstock/admin/create-shop"
                          element={
                            <ErrorBoundary>
                              <ManualShopCreation />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/agstock/admin/settings"
                          element={
                            <ErrorBoundary>
                              <AdminSettings />
                            </ErrorBoundary>
                          }
                        />

                        {/* Old admin/support removed — keep it safe */}
                        <Route path="/admin/support" element={<Navigate to="/admin" replace />} />

                        {/* Not Found */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </TooltipProvider>
                </SubscriptionProvider>
              </ShopDataProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
