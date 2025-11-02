import { LayoutDashboard, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AnalyticsSidebarProps {
  currentView: "dashboard" | "management";
  onViewChange: (view: "dashboard" | "management") => void;
}

export function AnalyticsSidebar({ currentView, onViewChange }: AnalyticsSidebarProps) {
  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onViewChange("dashboard")}
                  isActive={currentView === "dashboard"}
                  className="cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Analytics Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onViewChange("management")}
                  isActive={currentView === "management"}
                  className="cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span>Manage Organization</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
