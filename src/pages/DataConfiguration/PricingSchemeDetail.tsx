// Pricing Scheme Detail Page (View/Create/Edit)
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { PeriodConfigModal } from "@/components/PricingScheme/PeriodConfigModal";
import { NMIAssociationModal } from "@/components/PricingScheme/NMIAssociationModal";
import { TimeSlotSelector } from "@/components/PricingScheme/TimeSlotSelector/TimeSlotSelector";
import { assignColorsToPeriods } from "@/components/PricingScheme/TimeSlotSelector/colorUtils";
import { DemandTimeSlotSelector } from "@/components/PricingScheme/DemandTimeSlotSelector";
import { DemandConfigModal } from "@/components/PricingScheme/DemandConfigModal";
import { SchemeSummaryTimeline } from "@/components/PricingScheme/SchemeSummaryTimeline";
import { pricingSchemesApi } from "@/api/pricingSchemes";
import type {
  PricingSchemeDetail,
  CreatePricingSchemeRequest,
  UpdatePricingSchemeRequest,
  PricingPeriod,
  Demand,
  PricingAdditionalCost,
  LossFactor,
} from "@/api/pricingSchemes";
import { LossFactorModal } from "@/components/PricingScheme/LossFactorModal";
import type {
  NewPeriod,
  Period,
} from "@/components/PricingScheme/TimeSlotSelector/types";
import { Tooltip } from "@/components/common/Tooltip";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

const STATE_OPTIONS = [
  { value: "SA", label: "South Australia (SA)" },
  { value: "VIC", label: "Victoria (VIC)" },
  { value: "NSW", label: "New South Wales (NSW)" },
  { value: "QLD", label: "Queensland (QLD)" },
  { value: "TAS", label: "Tasmania (TAS)" },
  { value: "ACT", label: "Australian Capital Territory (ACT)" },
  { value: "WA", label: "Western Australia (WA)" },
  { value: "NT", label: "Northern Territory (NT)" },
];

type PageMode = "view" | "create" | "edit";

export default function PricingSchemeDetail() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine page mode and scheme ID
  const { pageMode, schemeId } = useMemo(() => {
    const pathname = location.pathname;
    let pageModeValue: PageMode = "view";
    let idValue: number | null = null;

    if (pathname.endsWith("/new")) {
      // For this demo, "/new" should render the detailed view of a pre-configured scheme (ID 1)
      // so the user sees a rich UI instead of an empty form.
      pageModeValue = "edit";
      idValue = 1;
    } else if (pathname.endsWith("/edit")) {
      pageModeValue = "edit";
      if (id) {
        idValue = parseInt(id);
      }
    } else if (id) {
      // Regular view mode
      idValue = parseInt(id);
    }

    return { pageMode: pageModeValue as PageMode, schemeId: idValue };
  }, [id, location.pathname]);

  const [scheme, setScheme] = useState<PricingSchemeDetail | null>(null);
  const [loading, setLoading] = useState(false); // Start with false, set to true when needed
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateSuccessMessage, setShowCreateSuccessMessage] =
    useState(false);
  const [dynamicSaving, setDynamicSaving] = useState(false);

  // Period configuration modal state
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [periodToEdit, setPeriodToEdit] = useState<PricingPeriod | null>(null);
  const [dragResult, setDragResult] = useState<{
    startTime: string;
    endTime: string;
    group: 0 | 1 | 2;
  } | null>(null);

  // NMI association modal state
  const [nmiModalOpen, setNmiModalOpen] = useState(false);

  // Demand configuration modal state
  const [demandModalOpen, setDemandModalOpen] = useState(false);
  const [demandToEdit, setDemandToEdit] = useState<Demand | null>(null);
  const [demandDragContext, setDemandDragContext] = useState<{
    startSlot: number;
    endSlot: number;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [demandDeletingId, setDemandDeletingId] = useState<number | null>(null);

  // Loss Factor modal state
  const [lossFactorModalOpen, setLossFactorModalOpen] = useState(false);
  const [lossFactorToEdit, setLossFactorToEdit] = useState<LossFactor | null>(null);
  const [deletingLossFactorYear, setDeletingLossFactorYear] = useState<number | null>(null);

  // Form data for editing
  const [formData, setFormData] = useState({
    name: "",
    enableWeekdayPricing: false,
    description: "",
    state: "SA",
    enableSpotMarketBuy: false,
    enableSpotMarketSell: false,
    gstRate: 0.1,
    additionalCosts: [] as PricingAdditionalCost[],
  });

  // Store initial form data to track changes
  const [initialFormData, setInitialFormData] = useState({
    name: "",
    enableWeekdayPricing: false,
    description: "",
    state: "SA",
    enableSpotMarketBuy: false,
    enableSpotMarketSell: false,
    gstRate: 0.1,
    additionalCosts: [] as PricingAdditionalCost[],
  });

  // Convert between camelCase (form) and snake_case (API)
  const apiToForm = (apiData: any) => ({
    name: apiData.name || "",
    enableWeekdayPricing: apiData.enable_weekday_pricing || false,
    description: apiData.description || "",
    state: apiData.state || "SA",
    enableSpotMarketBuy: apiData.enable_spot_market_buy || false,
    enableSpotMarketSell: apiData.enable_spot_market_sell || false,
    gstRate: apiData.gst_rate ?? 0.1,
    additionalCosts: apiData.additional_costs || [],
  });

  const formToApi = (formData: any) => ({
    name: formData.name,
    state: (formData.state || "SA").trim(),
    enable_weekday_pricing: formData.enableWeekdayPricing,
    description: formData.description || undefined,
    enable_spot_market_buy: Boolean(formData.enableSpotMarketBuy),
    enable_spot_market_sell: Boolean(formData.enableSpotMarketSell),
    gst_rate: Number(formData.gstRate),
    additional_costs: formData.additionalCosts,
  });

  // Check if form data has changed from initial state
  const hasFormDataChanged = useMemo(() => {
    return (
      formData.name !== initialFormData.name ||
      formData.enableWeekdayPricing !== initialFormData.enableWeekdayPricing ||
      formData.description !== initialFormData.description ||
      formData.state !== initialFormData.state ||
      formData.enableSpotMarketBuy !== initialFormData.enableSpotMarketBuy ||
      formData.enableSpotMarketSell !== initialFormData.enableSpotMarketSell ||
      formData.gstRate !== initialFormData.gstRate
    );
  }, [formData, initialFormData]);

  // Check if additional costs have changed
  const hasAdditionalCostsChanged = useMemo(() => {
    return JSON.stringify(formData.additionalCosts) !== JSON.stringify(initialFormData.additionalCosts);
  }, [formData.additionalCosts, initialFormData.additionalCosts]);


  // Check if spot pricing has changed
  const hasSpotPricingChanged = useMemo(() => {
    return (
      formData.enableSpotMarketBuy !== initialFormData.enableSpotMarketBuy ||
      formData.enableSpotMarketSell !== initialFormData.enableSpotMarketSell
    );
  }, [formData.enableSpotMarketBuy, formData.enableSpotMarketSell, initialFormData.enableSpotMarketBuy, initialFormData.enableSpotMarketSell]);

  // Assign colors to periods for table display
  const periodsWithColors = useMemo(() => {
    if (!scheme?.periods) return [];
    const periodsForColoring: Period[] = scheme.periods.map((p) => ({
      id: p.id,
      name: p.name,
      startTime: p.start_time,
      endTime: p.end_time,
      price: Number(p.price),
      group: p.period_group,
      color: "", // Will be assigned by assignColorsToPeriods
      description: p.description,
    }));

    // Sort periods: first by group (ascending), then by start time (ascending)
    periodsForColoring.sort((a, b) => {
      // First sort by group (ascending)
      if (a.group !== b.group) {
        return a.group - b.group;
      }
      // Then sort by start time (ascending)
      return a.startTime.localeCompare(b.startTime);
    });

    return assignColorsToPeriods(periodsForColoring);
  }, [scheme?.periods]);

  // Load scheme data
  const loadScheme = async () => {
    if (!schemeId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await pricingSchemesApi.getPricingSchemeDetail(schemeId);
      setScheme(response.data);
      const formDataFromApi = apiToForm(response.data);
      setFormData(formDataFromApi);
      setInitialFormData(formDataFromApi);
    } catch (err) {
      console.error("Failed to load pricing scheme:", err);
      setError("Failed to load pricing scheme. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const refreshSchemeData = async (options?: { syncForm?: boolean }) => {
    if (!schemeId) return;
    try {
      const response = await pricingSchemesApi.getPricingSchemeDetail(schemeId);
      setScheme(response.data);
      if (options?.syncForm) {
        const formDataFromApi = apiToForm(response.data);
        setFormData(formDataFromApi);
        setInitialFormData(formDataFromApi);
      }
    } catch (err) {
      console.error("Failed to refresh pricing scheme:", err);
      setError("Failed to refresh pricing scheme. Please try again.");
    }
  };

  useEffect(() => {
    // Set editing state based on page mode
    setIsEditing(pageMode === "create" || pageMode === "edit");

    // Load data if needed
    if (pageMode !== "create") {
      loadScheme();
    }
    // For create mode, loading is already false, no need to do anything
  }, [pageMode, schemeId]);

  // Show success message when scheme is loaded in edit mode and has no periods/NMIs (indicating it was just created)
  useEffect(() => {
    if (
      pageMode === "edit" &&
      scheme &&
      scheme.periods.length === 0 &&
      scheme.nmis.length === 0
    ) {
      setShowCreateSuccessMessage(true);
    }
  }, [pageMode, scheme]);

  // Handle form input changes
  const handleInputChange = async (field: string, value: any) => {
    // Update form data immediately for UI responsiveness
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Special handling for enableWeekdayPricing - auto-save when changed
    if (field === "enableWeekdayPricing" && schemeId) {
      // Check for periods that conflict with the new setting
      if (scheme) {
        if (value) {
          // Enabling weekday pricing - check if General periods exist
          const hasGeneralPeriods = scheme.periods.some(
            (period) => period.period_group === 0
          );

          if (hasGeneralPeriods) {
            // Revert the change and show error
            setFormData((prev) => ({ ...prev, [field]: !value }));
            setError(
              "Cannot enable weekday pricing because general periods exist. Please delete all general periods first."
            );
            return;
          }
        } else {
          // Disabling weekday pricing - check if weekday/weekend periods exist
          const hasWeekdayWeekendPeriods = scheme.periods.some(
            (period) => period.period_group === 1 || period.period_group === 2
          );

          if (hasWeekdayWeekendPeriods) {
            // Revert the change and show error
            setFormData((prev) => ({ ...prev, [field]: !value }));
            setError(
              "Cannot disable weekday pricing because weekday/weekend periods exist. Please delete all weekday and weekend periods first."
            );
            return;
          }
        }
      }

      try {
        const updateData: UpdatePricingSchemeRequest = {
          enable_weekday_pricing: value,
        };
        await pricingSchemesApi.updatePricingScheme(schemeId, updateData);
        // Reload scheme data to ensure consistency
        await loadScheme();
      } catch (err: any) {
        console.error("Failed to update weekday pricing setting:", err);
        // Revert the change on failure
        setFormData((prev) => ({ ...prev, [field]: !value }));
        setError(
          err.response?.data?.detail?.error?.message ||
            "Failed to update weekday pricing setting. Please try again."
        );
      }
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Scheme name is required.");
      return;
    }
      if (!formData.state.trim()) {
        setError("State is required.");
        return;
      }

    try {
      setSaving(true);
      setError(null);

      if (pageMode === "create") {
        const createData: CreatePricingSchemeRequest = formToApi({
          ...formData,
          name: formData.name.trim(),
          description: formData.description.trim(),
        });

        const response = await pricingSchemesApi.createPricingScheme(
          createData
        );

        // Navigate to edit page after successful creation
        navigate(
          `/data-configuration/pricing-scheme/${response.data.id}/edit`,
          {
            replace: true,
          }
        );
      } else if (pageMode === "edit" && schemeId) {
        const updateData: UpdatePricingSchemeRequest = formToApi({
          ...formData,
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
        await pricingSchemesApi.updatePricingScheme(schemeId, updateData);

        // Navigate back to list page after successful edit
        navigate("/data-configuration/pricing-scheme", {
          replace: true,
        });
      }
    } catch (err: any) {
      console.error("Failed to save pricing scheme:", err);
      setError(
        err.response?.data?.detail?.error?.message ||
          "Failed to save pricing scheme. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (
      !scheme ||
      !confirm(
        `Are you sure you want to delete "${scheme.name}"? This will also delete all associated periods and NMI relations.`
      )
    ) {
      return;
    }

    try {
      await pricingSchemesApi.deletePricingScheme(scheme.id);
      navigate("/data-configuration/pricing-scheme");
    } catch (err) {
      console.error("Failed to delete pricing scheme:", err);
      setError("Failed to delete pricing scheme. Please try again.");
    }
  };


  const handleSaveSpotPricing = async () => {
    if (!schemeId) {
      setError("Please create and save the pricing scheme first.");
      return;
    }
    try {
      setDynamicSaving(true);
      setError(null);
      await pricingSchemesApi.updatePricingScheme(schemeId, {
        enable_spot_market_buy: Boolean(formData.enableSpotMarketBuy),
        enable_spot_market_sell: Boolean(formData.enableSpotMarketSell),
      });
      await refreshSchemeData({ syncForm: true });
    } catch (err: any) {
      console.error("Failed to save spot pricing setting:", err);
      const detailMessage =
        err?.response?.data?.detail?.error?.message ||
        err?.response?.data?.detail?.message ||
        err?.response?.data?.detail ||
        "Failed to save spot pricing setting. Please try again.";
      setError(detailMessage);
    } finally {
      setDynamicSaving(false);
    }
  };

  const handleSaveAdditionalCosts = async () => {
    if (!schemeId) {
      setError("Please create and save the pricing scheme first.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await pricingSchemesApi.updatePricingScheme(schemeId, {
        additional_costs: formData.additionalCosts,
      });
      await refreshSchemeData({ syncForm: true });
    } catch (err: any) {
      console.error("Failed to save additional costs:", err);
      const detailMessage =
        err?.response?.data?.detail?.error?.message ||
        err?.response?.data?.detail?.message ||
        err?.response?.data?.detail ||
        "Failed to save additional costs. Please try again.";
      setError(detailMessage);
    } finally {
      setSaving(false);
    }
  };

  const addAdditionalCost = () => {
    const newCost: PricingAdditionalCost = {
      // Temporary ID for key
      id: -1 * (formData.additionalCosts.length + 1),
      name: "",
      cost_type: "per_kwh",
      amount: 0,
      is_gst_exempt: false,
      description: "",
    };
    setFormData((prev) => ({
      ...prev,
      additionalCosts: [...prev.additionalCosts, newCost],
    }));
  };

  const updateAdditionalCost = (index: number, field: keyof PricingAdditionalCost, value: any) => {
    const newCosts = [...formData.additionalCosts];
    newCosts[index] = { ...newCosts[index], [field]: value };
    setFormData((prev) => ({ ...prev, additionalCosts: newCosts }));
  };

  const removeAdditionalCost = (index: number) => {
    const newCosts = [...formData.additionalCosts];
    newCosts.splice(index, 1);
    setFormData((prev) => ({ ...prev, additionalCosts: newCosts }));
  };

  // Handle add period
  const handleAddPeriod = () => {
    setPeriodToEdit(null);
    setPeriodModalOpen(true);
  };

  // Handle edit period
  const handleEditPeriod = (period: PricingPeriod) => {
    setPeriodToEdit(period);
    setPeriodModalOpen(true);
  };

  // Handle delete period
  const handleDeletePeriod = async (period: PricingPeriod) => {
    if (
      !confirm(`Are you sure you want to delete the period "${period.name}"?`)
    ) {
      return;
    }

    try {
      await pricingSchemesApi.deletePricingPeriod(period.id);
      // Refresh scheme data
      if (schemeId) {
        const response = await pricingSchemesApi.getPricingSchemeDetail(
          schemeId
        );
        setScheme(response.data);
      }
    } catch (err) {
      console.error("Failed to delete period:", err);
      setError("Failed to delete period. Please try again.");
    }
  };

  // Handle add NMI
  const handleAddNMI = () => {
    setNmiModalOpen(true);
  };

  // Handle remove NMI
  const handleRemoveNMI = async (nmi: string) => {
    if (
      !confirm(`Are you sure you want to remove NMI "${nmi}" from this scheme?`)
    ) {
      return;
    }

    try {
      await pricingSchemesApi.removeNMIFromScheme(schemeId!, nmi);
      // Refresh scheme data
      if (schemeId) {
        const response = await pricingSchemesApi.getPricingSchemeDetail(
          schemeId
        );
        setScheme(response.data);
      }
    } catch (err) {
      console.error("Failed to remove NMI:", err);
      setError("Failed to remove NMI. Please try again.");
    }
  };

  // Handle demand delete from summary list
  const handleDemandDelete = async (demandId: number) => {
    if (!schemeId) return;
    if (
      !confirm(
        "Are you sure you want to delete this demand configuration? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDemandDeletingId(demandId);
      setError(null);
      await pricingSchemesApi.deleteDemand(demandId);
      await refreshSchemeData();
    } catch (err: any) {
      console.error("Failed to delete demand:", err);
      const detailMessage =
        err?.response?.data?.detail?.error?.message ||
        err?.response?.data?.detail?.message ||
        err?.response?.data?.detail ||
        "Failed to delete demand. Please try again.";
      setError(detailMessage);
    } finally {
      setDemandDeletingId(null);
    }
  };

  // Handle demand creation from timeline drag
  const handleDemandCreateFromTimeline = (params: {
    startSlot: number;
    endSlot: number;
    startTime: string;
    endTime: string;
  }) => {
    setDemandToEdit(null);
    setDemandDragContext(params);
    setDemandModalOpen(true);
  };

  // Handle demand edit from timeline or list
  const handleDemandEdit = (demand: Demand) => {
    setDemandToEdit(demand);
    setDemandDragContext(null);
    setDemandModalOpen(true);
  };

  // Loss Factor Handlers
  const handleAddLossFactor = () => {
    setLossFactorToEdit(null);
    setLossFactorModalOpen(true);
  };

  const handleEditLossFactor = (lf: LossFactor) => {
    setLossFactorToEdit(lf);
    setLossFactorModalOpen(true);
  };

  const handleDeleteLossFactor = async (year: number) => {
    if (!schemeId) return;
    if (
      !confirm(
        `Are you sure you want to delete loss factors for Financial Year ${year}?`
      )
    ) {
      return;
    }

    try {
      setDeletingLossFactorYear(year);
      await pricingSchemesApi.deleteLossFactor(schemeId, year);
      await refreshSchemeData();
    } catch (err: any) {
      console.error("Failed to delete loss factor:", err);
      const detailMessage =
        err?.response?.data?.detail?.error?.message ||
        err?.response?.data?.detail?.message ||
        err?.response?.data?.detail ||
        "Failed to delete loss factor. Please try again.";
      setError(detailMessage);
    } finally {
      setDeletingLossFactorYear(null);
    }
  };

  // Handle "Add Demand" button (opens modal without preselected time range)
  const handleAddDemandButtonClick = () => {
    setDemandToEdit(null);
    setDemandDragContext(null);
    setDemandModalOpen(true);
  };

  // Handle TimeSlotSelector period operations - open modal with pre-filled drag data
  const handleTimeSlotAddPeriod = async (period: NewPeriod) => {
    console.log("handleTimeSlotAddPeriod called with:", period);
    setDragResult({
      startTime: period.startTime,
      endTime: period.endTime,
      group: period.group,
    });
    setPeriodToEdit(null); // Clear any existing edit state
    setPeriodModalOpen(true);
  };

  const handleTimeSlotEditPeriod = async (
    periodId: number
  ) => {
    // Find the period and open edit modal
    const periodToEdit = scheme?.periods.find((p) => p.id === periodId);
    if (periodToEdit) {
      setPeriodToEdit(periodToEdit);
      setPeriodModalOpen(true);
    }
    // periodName is provided for potential future use (e.g., logging, validation)
  };

  // Handle edit toggle
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Format date
  const formatDate = (dateValue: string | number) => {
    try {
      if (!dateValue) return " - ";
      let date: Date;

      if (typeof dateValue === 'number') {
        // Backend returns UTC timestamp in seconds
        date = new Date(dateValue * 1000);
      } else {
        // Try parsing as ISO string first
        if (dateValue.includes && dateValue.includes("T")) {
          // Assume it's already in ISO format or similar
          date = new Date(dateValue);
        } else {
          // Try other formats
          date = new Date(dateValue);
        }
      }

      if (isNaN(date.getTime())) {
        console.warn("Invalid date value:", dateValue);
        return "Invalid Date";
      }

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Failed to format date:", dateValue, error);
      return "Invalid Date";
    }
  };

  // Get period group display name
  const getPeriodGroupDisplay = (group: number) => {
    switch (group) {
      case 0:
        return "General";
      case 1:
        return "Weekday";
      case 2:
        return "Weekend";
      default:
        return "Unknown";
    }
  };

  // Check if periods fully cover 0:00 to 23:59
  const checkPeriodCoverage = useMemo(() => {
    if (!scheme?.periods || scheme.periods.length === 0) {
      return { isComplete: false, gaps: [] };
    }

    // Convert time string (HH:MM) to minutes since midnight
    const timeToMinutes = (
      timeStr: string,
      isEndTime: boolean = false
    ): number => {
      const parts = timeStr.split(":");
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1] || "0", 10);
      // If it's an end time and is 23:59, treat it as end of day (1440 minutes)
      if (isEndTime && hours === 23 && minutes === 59) {
        return 24 * 60; // 1440 minutes (end of day)
      }
      return hours * 60 + minutes;
    };

    // Format gap for display
    const formatMinutes = (minutes: number): string => {
      if (minutes >= 24 * 60) {
        return "23:59";
      }
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}`;
    };

    // Helper function to check coverage for a group of periods
    const checkGroupCoverage = (
      periods: Array<{ start: number; end: number }>
    ): Array<{ start: number; end: number }> => {
      const totalMinutes = 24 * 60; // 1440 minutes in a day
      const gaps: Array<{ start: number; end: number }> = [];
      let currentEnd = 0;

      for (const period of periods) {
        if (period.start > currentEnd) {
          // Found a gap
          gaps.push({ start: currentEnd, end: period.start });
        }
        currentEnd = Math.max(currentEnd, period.end);
      }

      // Check if there's a gap at the end
      if (currentEnd < totalMinutes) {
        gaps.push({ start: currentEnd, end: totalMinutes });
      }

      return gaps;
    };

    // If weekday pricing is enabled, check each group separately
    if (scheme.enable_weekday_pricing) {
      // Separate periods by group: 1 = Weekday, 2 = Weekend
      const weekdayPeriods = scheme.periods
        .filter((p) => p.period_group === 1)
        .map((p) => ({
          start: timeToMinutes(p.start_time, false),
          end: timeToMinutes(p.end_time, true),
        }))
        .sort((a, b) => a.start - b.start);

      const weekendPeriods = scheme.periods
        .filter((p) => p.period_group === 2)
        .map((p) => ({
          start: timeToMinutes(p.start_time, false),
          end: timeToMinutes(p.end_time, true),
        }))
        .sort((a, b) => a.start - b.start);

      // Check coverage for both groups
      const weekdayGaps = checkGroupCoverage(weekdayPeriods);
      const weekendGaps = checkGroupCoverage(weekendPeriods);

      const allGaps = [
        ...weekdayGaps.map(
          (gap) =>
            `Weekday: ${formatMinutes(gap.start)} - ${formatMinutes(gap.end)}`
        ),
        ...weekendGaps.map(
          (gap) =>
            `Weekend: ${formatMinutes(gap.start)} - ${formatMinutes(gap.end)}`
        ),
      ];

      return {
        isComplete: weekdayGaps.length === 0 && weekendGaps.length === 0,
        gaps: allGaps,
      };
    } else {
      // For schemes without weekday pricing, check all periods together (period_group = 0)
      const periods = scheme.periods
        .filter((p) => p.period_group === 0)
        .map((p) => ({
          start: timeToMinutes(p.start_time, false),
          end: timeToMinutes(p.end_time, true),
        }))
        .sort((a, b) => a.start - b.start);

      const gaps = checkGroupCoverage(periods);
      const formattedGaps = gaps.map(
        (gap) => `${formatMinutes(gap.start)} - ${formatMinutes(gap.end)}`
      );

      return {
        isComplete: gaps.length === 0,
        gaps: formattedGaps,
      };
    }
  }, [scheme?.periods, scheme?.enable_weekday_pricing]);


  // Helper functions for Markup Display
  const getMarkupTypeLabel = (type?: string) => {
    switch (type) {
      case "percentage":
        return "Percentage";
      case "per_kwh":
        return "Fixed (per kWh)";
      case "none":
      default:
        return "-";
    }
  };

   const formatMarkupDisplay = (type?: string, value?: number) => {
    if (!type || type === "none") return "-";
    if (value === undefined || value === null) return "-";
    if (type === "percentage") return `${(value * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
    if (type === "per_kwh") return `$${value}/kWh`;
    return value.toString();
  };


  // Sort demands by created_at (if available) to match backend order, otherwise by ID
  const demandList: Demand[] = useMemo(() => {
    if (!scheme?.demands) return [];
    // Sort by created_at (ascending) to match backend order
    return [...scheme.demands].sort((a, b) => {
      if (a.created_at && b.created_at) {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      // Fallback to ID if created_at is not available
      return a.id - b.id;
    });
  }, [scheme?.demands]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {pageMode === "create"
                ? "Create Pricing Scheme"
                : pageMode === "edit"
                ? "Edit Pricing Scheme"
                : "View Pricing Scheme"}
            </h1>
          </div>
        </div>
        <Card>
          <div className="py-12">
            <Loading />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/data-configuration/pricing-scheme")}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {pageMode === "create"
                ? "Create Pricing Scheme"
                : pageMode === "edit"
                ? `Edit: ${scheme?.name}`
                : `View: ${scheme?.name}`}
            </h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {pageMode === "view" && (
            <>
              <Button variant="secondary" onClick={handleEdit}>
                Edit
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Success Message for Create */}
      {showCreateSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Pricing scheme created successfully!
              </p>
              <p className="mt-1 text-sm text-green-700">
                Please proceed to add specific pricing periods and associate
                NMIs to complete the scheme setup.
              </p>
            </div>
          </div>
        </div>
      )}

      {pageMode !== "create" && scheme && (
        <Card title="Scheme Summary">
          {/* Scheme Summary Timeline - Read-only preview */}
          <SchemeSummaryTimeline
            scheme={scheme}
            periodsWithColors={periodsWithColors}
            // No click handlers - this is read-only preview
          />
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scheme Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheme Name *
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter scheme name"
                required
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {scheme?.name}
              </div>
            )}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            {isEditing ? (
              <select
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select State</option>
                {STATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {scheme?.state || formData.state || "Not specified"}
              </div>
            )}
          </div>

          {/* Created/Updated timestamps (view mode only) */}
          {pageMode !== "create" && !isEditing && scheme && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {formatDate(scheme.created_at)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Updated
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {formatDate(scheme.updated_at)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Enable Weekday Pricing */}
        {pageMode !== "create" && !isEditing && scheme && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weekday Pricing
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {scheme.enable_weekday_pricing ? "Enabled" : "Disabled"}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          {isEditing ? (
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter scheme description (optional)"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 min-h-[80px]">
              {scheme?.description || "No description provided"}
            </div>
          )}
        </div>

        {/* GST Rate */}


        {/* Action Buttons for Basic Information */}
        {isEditing && (
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              disabled={saving || !hasFormDataChanged}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}

        {/* Note about CBD/non-CBD pricing schemes */}
        {pageMode === "create" && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> If the pricing scheme involves CBD /
              non-CBD distinction (typically found in the demand section),
              please create two separate pricing schemes in this system: one for
              associating meters located in CBD areas, and another for
              associating meters located in non-CBD areas.
            </p>
          </div>
        )}
      </Card>


      {/* Spot Market Pricing - only show in edit/view mode, not in create mode */}
      {pageMode !== "create" && (
        <Card title="Spot Market Pricing">
          <div className="flex flex-col gap-6">
            {/* Spot Market Buy */}
            <div className="flex items-center justify-between max-w-3xl">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Spot Market Buy
                </h3>
                <p className="text-xs text-gray-500">
                  AEMO wholesale price is added to the period price for imported
                  energy.
                </p>
              </div>
              <div>
                {isEditing ? (
                  <select
                    value={
                      formData.enableSpotMarketBuy ? "enabled" : "disabled"
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "enableSpotMarketBuy",
                        e.target.value === "enabled"
                      )
                    }
                    className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      scheme?.enable_spot_market_buy
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {scheme?.enable_spot_market_buy ? "Enabled" : "Disabled"}
                  </span>
                )}
              </div>
            </div>

            {/* Spot Market Sell */}
            <div className="flex items-center justify-between max-w-3xl">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Spot Market Sell (Feed-in Tariff)
                </h3>
                <p className="text-xs text-gray-500">
                  Exported energy is credited at the AEMO wholesale price.
                </p>
              </div>
              <div>
                {isEditing ? (
                  <select
                    value={
                      formData.enableSpotMarketSell ? "enabled" : "disabled"
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "enableSpotMarketSell",
                        e.target.value === "enabled"
                      )
                    }
                    className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      scheme?.enable_spot_market_sell
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {scheme?.enable_spot_market_sell ? "Enabled" : "Disabled"}
                  </span>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-start">
                <Button
                  onClick={handleSaveSpotPricing}
                  disabled={
                    saving ||
                    dynamicSaving ||
                    !schemeId ||
                    !hasSpotPricingChanged
                  }
                  size="sm"
                >
                  {dynamicSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            )}
          </div>

          <hr className="my-6 border-gray-200" />

          {/* Loss Factors Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium text-gray-900">
                Annual Loss Factors (DLF & TLF)
              </h3>
              {isEditing && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAddLossFactor}
                >
                  + Add Annual Loss Factor
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Financial Year
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DLF
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TLF
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Markup Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Markup Value
                    </th>
                    {isEditing && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!scheme?.loss_factors ||
                  scheme.loss_factors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isEditing ? 7 : 6}
                        className="px-4 py-4 text-center text-sm text-gray-500"
                      >
                        No loss factors configured.
                      </td>
                    </tr>
                  ) : (
                    scheme?.loss_factors.map((lf) => (
                      <tr key={lf.financial_year}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {lf.financial_year}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          01/Jul/{lf.financial_year} - 30/Jun/
                          {lf.financial_year + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {lf.dlf}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {lf.tlf}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {getMarkupTypeLabel(lf.markup_type)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatMarkupDisplay(lf.markup_type, lf.markup_value)}
                        </td>
                        {isEditing && (
                          <td className="px-4 py-3 text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEditLossFactor(lf)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() =>
                                  handleDeleteLossFactor(lf.financial_year)
                                }
                                disabled={
                                  deletingLossFactorYear === lf.financial_year
                                }
                              >
                                {deletingLossFactorYear === lf.financial_year
                                  ? "..."
                                  : "Delete"}
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}



      {/* Period Configuration */}
      {pageMode !== "create" && scheme && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Period</h2>
              {isEditing && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableWeekdayPricingPeriod"
                    checked={formData.enableWeekdayPricing}
                    onChange={(e) =>
                      handleInputChange(
                        "enableWeekdayPricing",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="enableWeekdayPricingPeriod"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Enable Weekday Pricing
                  </label>
                </div>
              )}
            </div>
            {isEditing && (
              <Button size="sm" variant="secondary" onClick={handleAddPeriod}>
                Add Period
              </Button>
            )}
          </div>

          {/* 显示时间槽 */}
          <div className="mb-6">
            <TimeSlotSelector
              periods={scheme.periods.map((p) => ({
                id: p.id,
                name: p.name,
                startTime: p.start_time,
                endTime: p.end_time,
                price: Number(p.price),
                group: p.period_group,
                color: "#f0f0f0", // 临时颜色，后续会被重新分配
                description: p.description,
              }))}
              enableWeekdayPricing={formData.enableWeekdayPricing}
              onPeriodAdd={isEditing ? handleTimeSlotAddPeriod : async () => {}}
              onPeriodUpdate={async () => {}} // Not used, handled by modal
              onPeriodDelete={async () => {}} // Not used, handled by modal
              onPeriodEdit={isEditing ? handleTimeSlotEditPeriod : () => {}}
              saving={saving}
            />
          </div>

          {/* 显示现有时段表格 */}
          {scheme.periods.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (AUD/kWh)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    {isEditing && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {periodsWithColors.map((period) => (
                    <tr key={period.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: period.color }}
                          />
                          {period.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {period.startTime}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {period.endTime}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {period.price.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            period.group === 0
                              ? "bg-blue-100 text-blue-800"
                              : period.group === 1
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {getPeriodGroupDisplay(period.group)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {period.description || "-"}
                      </td>
                      {isEditing && (
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const originalPeriod = scheme.periods.find(
                                  (p) => p.id === period.id
                                );
                                if (originalPeriod)
                                  handleEditPeriod(originalPeriod);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                const originalPeriod = scheme.periods.find(
                                  (p) => p.id === period.id
                                );
                                if (originalPeriod)
                                  handleDeletePeriod(originalPeriod);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Period Coverage Status */}
          {scheme.periods.length > 0 && (
            <div className="mt-4">
              {checkPeriodCoverage.isComplete ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Period configuration is complete
                      </p>
                      <p className="mt-1 text-sm text-green-700">
                        All time slots from 00:00 to 23:59 are configured.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-800">
                        Period configuration is incomplete
                      </p>
                      <p className="mt-1 text-sm text-yellow-700">
                        Please configure all time slots from 00:00 to 23:59.
                        Periods with the same name will be treated as the same
                        phase in subsequent statistics.
                      </p>
                      {checkPeriodCoverage.gaps.length > 0 && (
                        <p className="mt-2 text-sm text-yellow-700">
                          <span className="font-medium">
                            Missing time slots:
                          </span>{" "}
                          {checkPeriodCoverage.gaps.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Demand Configuration */}
      {pageMode !== "create" && scheme && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Demand Charges
              </h2>
              <span className="text-sm text-gray-500">
                {demandList.length} configured
              </span>
            </div>
            {isEditing && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAddDemandButtonClick}
              >
                Add Demand
              </Button>
            )}
          </div>

          {/* Multi-row demand timeline */}
          <div className="mb-6">
            <DemandTimeSlotSelector
              demands={demandList}
              saving={false}
              onCreateDemandFromRange={handleDemandCreateFromTimeline}
              onEditDemand={handleDemandEdit}
            />
          </div>

          {/* Demand list under the timeline */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              Demand list
            </p>
            {demandList.length === 0 ? (
              <p className="text-sm text-gray-500">
                No demand configurations yet.
              </p>
            ) : (
              <div className="space-y-2">
                {demandList.map((demand, index) => (
                  <div
                    key={demand.id}
                    className="border border-gray-200 rounded-md p-3 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {`Demand #${index + 1}: ${demand.name}`}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Time: {demand.start_time} - {demand.end_time} | Months{" "}
                          {demand.start_month} - {demand.end_month} | Lookback{" "}
                          {demand.lookback_days} days
                        </p>
                        <p className="text-sm text-gray-600">
                          Price base: ${Number(demand.price_base).toFixed(4)} /
                          kVA / day
                        </p>
                        <p className="text-sm text-gray-600">
                          Applicable Days:{" "}
                          {(() => {
                            const weekdayPricing = demand.weekday_pricing ?? "all_days";
                            return {
                              all_days: "All days",
                              weekday: "Weekday (Monday-Friday, excluding public holidays)",
                              weekend: "Weekend (Weekends + Public Holidays)",
                            }[weekdayPricing] || weekdayPricing;
                          })()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Sampling Method:{" "}
                          {demand.sampling_method === "daily_window_average"
                            ? "Daily Window Average"
                            : "Maximum Interval Value"}
                        </p>
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDemandEdit(demand)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDemandDelete(demand.id)}
                            disabled={demandDeletingId === demand.id}
                          >
                            {demandDeletingId === demand.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Note about demand billing */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All demand charges are billed year-round,
              even if the demand value is calculated using data from specific
              months and time periods. The month range and time range settings
              are only used to determine which historical data to analyze when
              calculating the maximum demand value, not to limit when charges
              are applied.
            </p>
          </div>
        </Card>
      )}

      {/* Additional Costs Configuration */}
      {pageMode !== "create" && scheme && (
        <Card title="Additional Costs">
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount ($)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST Exempt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    {isEditing && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.additionalCosts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                        No additional costs configured.
                      </td>
                    </tr>
                  ) : (
                    formData.additionalCosts.map((cost, index) => (
                      <tr key={cost.id || index}>
                         <td className="px-4 py-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={cost.name}
                              onChange={(e) => updateAdditionalCost(index, "name", e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Name"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{cost.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {isEditing ? (
                            <select
                              value={cost.cost_type}
                              onChange={(e) => updateAdditionalCost(index, "cost_type", e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="per_kwh">Per kWh (Excl. Loss)</option>
                              <option value="per_day">Per Day</option>
                              <option value="per_month">Per Month</option>
                              <option value="per_year">Per Year</option>
                            </select>
                          ) : (
                            <span className="text-sm text-gray-900">
                               {cost.cost_type === 'per_kwh' ? 'Per kWh (Excl. Loss)' : cost.cost_type}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {isEditing ? (
                             <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.000001"
                                value={cost.amount}
                                onChange={(e) => updateAdditionalCost(index, "amount", parseFloat(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-[100px]"
                              />
                              {cost.cost_type === 'per_kwh' && (
                                <Tooltip content="Enter the base value here. The calculation will use the value including loss (i.e., with DLF applied).">
                                  <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                                </Tooltip>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-900">{cost.amount}</span>
                          )}
                        </td>
                         <td className="px-4 py-2 text-center">
                          {isEditing ? (
                            <input
                              type="checkbox"
                              checked={cost.is_gst_exempt}
                              onChange={(e) => updateAdditionalCost(index, "is_gst_exempt", e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          ) : (
                             <span className="text-sm text-gray-900">
                              {cost.is_gst_exempt ? "Yes" : "No"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={cost.description || ""}
                              onChange={(e) => updateAdditionalCost(index, "description", e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Optional"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">{cost.description || "-"}</span>
                          )}
                        </td>
                        {isEditing && (
                          <td className="px-4 py-2 text-right">
                             <Button
                              size="sm"
                              variant="danger"
                              onClick={() => removeAdditionalCost(index)}
                            >
                              Remove
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {isEditing && (
              <div className="flex justify-between items-center mt-4">
                 <Button
                  size="sm"
                  variant="secondary"
                  onClick={addAdditionalCost}
                >
                  + Add Cost Item
                </Button>
                
                 <Button
                  onClick={handleSaveAdditionalCosts}
                  disabled={saving || !hasAdditionalCostsChanged}
                >
                  {saving ? "Saving..." : "Save Costs"}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* GST Configuration (New!) */}
      {pageMode !== "create" && scheme && (
        <Card title="GST Configuration">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Rate (1.0 = 100%, 0.1 = 10%)
              </label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <input
                    type="number"
                    step="0.001"
                    value={formData.gstRate}
                    onChange={(e) =>
                      handleInputChange("gstRate", parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 w-full">
                    {scheme?.gst_rate ?? 0.1}
                  </div>
                )}
                <span className="text-gray-500 text-sm whitespace-nowrap">
                   (= {((isEditing ? formData.gstRate : (scheme?.gst_rate ?? 0.1)) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
             {isEditing && (
              <Button
                onClick={handleSave}
                disabled={saving || !hasFormDataChanged}
              >
                {saving ? "Saving..." : "Save GST"}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* NMI Association */}
      {pageMode !== "create" && scheme && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              NMI Association ({scheme.nmis.length} NMIs)
            </h2>
            {isEditing && (
              <Button size="sm" variant="secondary" onClick={handleAddNMI}>
                Add NMI
              </Button>
            )}
          </div>

          {scheme.nmis.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No NMIs associated with this scheme yet.
              {isEditing && ' Click "Add NMI" to associate meters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NMI
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meter Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    {isEditing && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scheme.nmis.slice(0, 10).map((nmi) => (
                    <tr key={nmi.nmi}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {nmi.nmi}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {nmi.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {nmi.address || "-"}
                      </td>
                      {isEditing && (
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRemoveNMI(nmi.nmi)}
                          >
                            Remove
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {scheme.nmis.length > 10 && (
                    <tr>
                      <td
                        colSpan={isEditing ? 4 : 3}
                        className="px-4 py-3 text-center text-sm text-gray-500"
                      >
                        ... and {scheme.nmis.length - 10} more NMIs
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Period Configuration Modal */}
      <PeriodConfigModal
        isOpen={periodModalOpen}
        onClose={() => setPeriodModalOpen(false)}
        schemeId={schemeId || 0}
        enableWeekdayPricing={formData.enableWeekdayPricing}
        existingPeriods={scheme?.periods || []}
        periodToEdit={periodToEdit}
        dragResult={dragResult}
        onSuccess={async () => {
          // Clear drag result and refresh scheme data
          setDragResult(null);
          if (schemeId) {
            try {
              const response = await pricingSchemesApi.getPricingSchemeDetail(
                schemeId
              );
              setScheme(response.data);
            } catch (err) {
              console.error("Failed to refresh scheme data:", err);
            }
          }
        }}
      />

      {/* Demand Configuration Modal */}
      <DemandConfigModal
        isOpen={demandModalOpen}
        onClose={() => {
          setDemandModalOpen(false);
          setDemandToEdit(null);
          setDemandDragContext(null);
        }}
        schemeId={schemeId || 0}
        demandToEdit={demandToEdit}
        dragContext={demandDragContext}
        onSuccess={async () => {
          await refreshSchemeData();
        }}
      />

      {/* NMI Association Modal */}
      <NMIAssociationModal
        isOpen={nmiModalOpen}
        onClose={() => setNmiModalOpen(false)}
        schemeId={schemeId || 0}
        schemeName={scheme?.name || ""}
        onSuccess={async () => {
          // Refresh scheme data
          if (schemeId) {
            try {
              const response = await pricingSchemesApi.getPricingSchemeDetail(
                schemeId
              );
              setScheme(response.data);
            } catch (err) {
              console.error("Failed to refresh scheme data:", err);
            }
          }
        }}
      />

      {/* Loss Factor Modal */}
      <LossFactorModal
        isOpen={lossFactorModalOpen}
        onClose={() => setLossFactorModalOpen(false)}
        schemeId={schemeId || 0}
        existingLossFactors={scheme?.loss_factors || []}
        lossFactorToEdit={lossFactorToEdit}
        onSuccess={async () => {
          await refreshSchemeData();
        }}
      />
    </div>
  );
}
