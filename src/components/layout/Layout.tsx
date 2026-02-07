// Main layout wrapper component
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { TopNavbar } from "./TopNavbar";
import { SidebarNew } from "./SidebarNew";
import { useInitializationStatus } from "@/hooks/useInitialization";
import { Loading } from "@/components/common/Loading";

// Function to determine active section based on current route
const getActiveSectionFromPath = (pathname: string): string => {
  if (pathname.startsWith("/settings")) {
    return "settings";
  }
  if (pathname.startsWith("/report-generation")) {
    return "report-generation";
  }
  if (pathname.startsWith("/tables-charts")) {
    return "tables-charts";
  }
  if (pathname.startsWith("/data-configuration")) {
    return "data-configuration";
  }
  if (pathname.startsWith("/data-acquisition")) {
    return "data-acquisition";
  }
  if (pathname.startsWith("/automation")) {
    return "data-acquisition";
  }
  // Default to data-acquisition for root path and any unmatched paths
  return "data-acquisition";
};

// Function to get page title based on current route
const getPageTitleFromPath = (pathname: string): string => {
  const baseTitle = "SolEnergy Energy Management Plan Data Portal";

  if (pathname.startsWith("/report-generation/templates/")) {
    return `Template Details - ${baseTitle}`;
  }

  const titleMap: Record<string, string> = {
    "/data-acquisition/dashboard": "Dashboard",
    "/data-acquisition/execution-history": "Execution History",
    "/data-acquisition/nmi-refresh-strategy": "NMI Refresh Strategy",
    "/data-acquisition/aemo-refresh-strategy": "AEMO Refresh Strategy",
    "/data-acquisition/public-holiday-refresh-strategy":
      "Public Holiday Refresh Strategy",
    "/settings/mysql-config": "MySQL Config",
    "/settings/file-upload-config": "File Upload Config",
    "/settings/sapn-config": "SAPN Config",
    "/settings/solaredge-config": "SolarEdge Config",
    "/data-configuration/pricing-scheme": "Pricing Scheme",
    "/data-configuration/nmi-list": "NMI List",
    "/tables-charts/nmi-data-viewer": "NMI Data Viewer",
    "/tables-charts/spot-price-graphs": "Spot Price Graphs",
    "/tables-charts/public-holiday-calendar": "Public Holiday Calendar",
    "/tables-charts/energy-consumption": "Energy Consumption",
    "/tables-charts/energy-export": "Energy Export",
    "/tables-charts/billing-calculation": "Billing Calculation",
    "/tables-charts/demand-analysis": "Demand Analysis",
    "/tables-charts/dynamic-price-detail": "Dynamic Price Detail",
    "/tables-charts/solaredge-monitoring": "SolarEdge Monitoring",
    "/report-generation/templates": "Report Templates",
    "/report-generation/batch-generation": "Batch Generation",
  };

  const pageTitle = titleMap[pathname];
  return pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle;
};

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: initStatus, isLoading } = useInitializationStatus();

  // State for active section and sidebar collapse
  const [activeSection, setActiveSection] =
    useState<string>("data-acquisition");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Check if we're in print mode (URL hash contains #pdf)
  const isPrintMode = location.hash.includes("pdf");

  // Check if we're in chart mode (URL hash contains #chart)
  const isChartMode = location.hash.includes("chart");

  // Determine active section based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const section = getActiveSectionFromPath(currentPath);
    setActiveSection(section);
  }, [location.pathname]);

  // Update page title based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const title = getPageTitleFromPath(currentPath);
    document.title = title;
  }, [location.pathname]);

  useEffect(() => {
    // Wait for initialization status to load
    if (isLoading) return;

    // If not initialized and not on initialization page, redirect
    if (initStatus && !initStatus.is_initialized) {
      if (location.pathname !== "/initialization") {
        navigate("/initialization", { replace: true });
      }
    }
  }, [initStatus, isLoading, location.pathname, navigate]);

  // Show loading state while checking initialization status
  if (isLoading) {
    return <Loading />;
  }

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    // Auto-expand sidebar when changing sections
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const isReportMode = isPrintMode || isChartMode;

  return (
    <div className={`min-h-screen ${isReportMode ? 'bg-white report-mode' : 'bg-gray-50'}`}>
      {!isPrintMode && !isChartMode && (
        <TopNavbar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      )}
      <div className="flex">
        {!isPrintMode && !isChartMode && (
          <SidebarNew
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        )}
        <main
          className={`${isPrintMode || isChartMode ? "w-full" : "flex-1"} p-6 min-w-0`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
