import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AnalyticsSidebar } from "@/components/admin/AnalyticsSidebar";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { OrganizationManagement } from "@/components/admin/OrganizationManagement";

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "management">("dashboard");

  return (
    <DashboardLayout userRole="admin">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AnalyticsSidebar currentView={currentView} onViewChange={setCurrentView} />
          
          <main className="flex-1">
            {currentView === "dashboard" ? (
              <AnalyticsDashboard />
            ) : (
              <OrganizationManagement />
            )}
          </main>
        </div>
      </SidebarProvider>
    </DashboardLayout>
  );
};

export default AdminDashboard;
