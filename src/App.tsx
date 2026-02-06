import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import DashboardHome from "./pages/dashboard/DashboardHome";
import ClientsPage from "./pages/dashboard/ClientsPage";
import AgentsPage from "./pages/dashboard/AgentsPage";
import TaxReturnsPage from "./pages/dashboard/TaxReturnsPage";
import DocumentsPage from "./pages/dashboard/DocumentsPage";
import PaymentsPage from "./pages/dashboard/PaymentsPage";
import AppointmentsPage from "./pages/dashboard/AppointmentsPage";
import ServicesPage from "./pages/dashboard/ServicesPage";
import StaffPage from "./pages/dashboard/StaffPage";
import ActivityLogPage from "./pages/dashboard/ActivityLogPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Bypass authentication - allow direct access to dashboard
  return <DashboardLayout>{children}</DashboardLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  // Bypass authentication - allow direct access to login page
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
            <Route path="/dashboard/agents" element={<ProtectedRoute><AgentsPage /></ProtectedRoute>} />
            <Route path="/dashboard/tax-returns" element={<ProtectedRoute><TaxReturnsPage /></ProtectedRoute>} />
            <Route path="/dashboard/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
            <Route path="/dashboard/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
            <Route path="/dashboard/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
            <Route path="/dashboard/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
            <Route path="/dashboard/staff" element={<ProtectedRoute><StaffPage /></ProtectedRoute>} />
            <Route path="/dashboard/activity" element={<ProtectedRoute><ActivityLogPage /></ProtectedRoute>} />
            <Route path="/dashboard/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;