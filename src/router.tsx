import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
// Using direct imports for simplicity in this demo, or we could use lazy()
import PricingSchemeDetail from "@/pages/DataConfiguration/PricingSchemeDetail";
import BillingCalculation from "@/pages/TablesCharts/BillingCalculation";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/tables-charts/billing-calculation" replace />,
      },
      {
        path: "tables-charts/billing-calculation",
        element: <BillingCalculation />,
      },
      // Pricing Scheme Routes
      {
        path: "data-configuration/pricing-scheme/:id/edit",
        element: <PricingSchemeDetail />,
      },
      {
        path: "data-configuration/pricing-scheme/new",
        element: <PricingSchemeDetail />,
      },
      // Redirects for convenience during demo
      {
        path: "pricing-scheme",
        element: <Navigate to="/data-configuration/pricing-scheme/new" replace />,
      },
    ],
  },
]);
