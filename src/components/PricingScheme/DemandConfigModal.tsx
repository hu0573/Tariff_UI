import React, { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Tooltip } from "@/components/common/Tooltip";
import {
  pricingSchemesApi,
  type Demand,
  type CreateDemandRequest,
  type UpdateDemandRequest,
} from "@/api/pricingSchemes";

interface DemandConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemeId: number;
  demandToEdit?: Demand | null;
  dragContext?: {
    startSlot: number;
    endSlot: number;
    startTime: string;
    endTime: string;
  } | null;
  onSuccess: () => void;
}



const normalizeTime = (value: string): string => {
  if (!value) return "";
  const trimmed = value.trim();

  if (trimmed.includes("T")) {
    const [, timePart] = trimmed.split("T");
    if (timePart) {
      const [h, m] = timePart.split(":");
      const hours = Number.parseInt(h ?? "0", 10) || 0;
      const minutes = Number.parseInt(m ?? "0", 10) || 0;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }
  }

  const [h, m] = trimmed.split(":");
  if (!h) return trimmed;
  const hours = Number.parseInt(h, 10);
  const minutes = Number.parseInt(m ?? "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return trimmed;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

export const DemandConfigModal: React.FC<DemandConfigModalProps> = ({
  isOpen,
  onClose,
  schemeId,
  demandToEdit,
  dragContext,
  onSuccess,
}) => {
  const isEditing = !!demandToEdit;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startTime: "00:00",
    endTime: "23:59",
    startMonth: 1,
    endMonth: 12,
    lookbackDays: 365,
    priceBase: "" as string | number,
    weekdayPricing: "all_days" as "all_days" | "weekday" | "weekend",
    samplingMethod: "maximum_interval" as "maximum_interval" | "daily_window_average",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidTime = (time: string): boolean =>
    /^([01]?\d|2[0-3]):[0-5]\d$/.test(time);

  // Initialize form from existing demand or drag context
  useEffect(() => {
    if (!isOpen) return;

    if (isEditing && demandToEdit) {
      setFormData({
        name: demandToEdit.name ?? "",
        description: demandToEdit.description ?? "",
        startTime: normalizeTime(demandToEdit.start_time ?? "00:00"),
        endTime: normalizeTime(demandToEdit.end_time ?? "23:59"),
        startMonth: demandToEdit.start_month ?? 1,
        endMonth: demandToEdit.end_month ?? 12,
        lookbackDays: demandToEdit.lookback_days ?? 365,
        priceBase: demandToEdit.price_base ?? "",
        weekdayPricing: (demandToEdit.weekday_pricing ?? "all_days") as "all_days" | "weekday" | "weekend",
        samplingMethod: (demandToEdit.sampling_method ?? "maximum_interval") as "maximum_interval" | "daily_window_average",
      });
      setError(null);
    } else if (dragContext) {
      setFormData({
        name: "",
        description: "",
        startTime: normalizeTime(dragContext.startTime),
        endTime: normalizeTime(dragContext.endTime),
        startMonth: 1,
        endMonth: 12,
        lookbackDays: 365,
        priceBase: "",
        weekdayPricing: "all_days" as "all_days" | "weekday" | "weekend",
        samplingMethod: "maximum_interval",
      });
      setError(null);
    } else {
      setFormData({
        name: "",
        description: "",
        startTime: "00:00",
        endTime: "23:59",
        startMonth: 1,
        endMonth: 12,
        lookbackDays: 365,
        priceBase: "",
        weekdayPricing: "all_days" as "all_days" | "weekday" | "weekend",
        samplingMethod: "maximum_interval",
      });
      setError(null);
    }
  }, [isOpen, isEditing, demandToEdit, dragContext]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "Demand name is required.";
    }
    if (!isValidTime(formData.startTime)) {
      return "Start time must follow HH:MM format.";
    }
    if (!isValidTime(formData.endTime)) {
      return "End time must follow HH:MM format.";
    }
    if (formData.startTime === formData.endTime) {
      return "Start time and end time cannot be the same.";
    }
    if (
      formData.startMonth < 1 ||
      formData.startMonth > 12 ||
      formData.endMonth < 1 ||
      formData.endMonth > 12
    ) {
      return "Month must be between 1 and 12.";
    }
    if (formData.lookbackDays < 1) {
      return "Lookback days must be at least 1.";
    }
    if (formData.priceBase === "" || Number(formData.priceBase) <= 0) {
      return "Price base must be greater than 0.";
    }
    return null;
  };

  const buildPayload = (): CreateDemandRequest | UpdateDemandRequest | null => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return null;
    }

    setError(null);

    return {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      start_time: formData.startTime,
      end_time: formData.endTime,
      start_month: Number(formData.startMonth),
      end_month: Number(formData.endMonth),
      lookback_days: Number(formData.lookbackDays),
      price_base: Number(formData.priceBase),
      weekday_pricing: formData.weekdayPricing,
      sampling_method: formData.samplingMethod,
    };
  };

  const handleSave = async () => {
    if (!schemeId) {
      setError("Scheme ID is missing. Please reload the page and try again.");
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    try {
      setSaving(true);
      setError(null);

      if (isEditing && demandToEdit) {
        const updateData: UpdateDemandRequest = payload as UpdateDemandRequest;
        await pricingSchemesApi.updateDemand(demandToEdit.id, updateData);
      } else {
        const createData: CreateDemandRequest = payload as CreateDemandRequest;
        await pricingSchemesApi.createDemand(schemeId, createData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to save demand:", err);
      const detailMessage =
        err?.response?.data?.detail?.error?.message ||
        err?.response?.data?.detail?.message ||
        err?.response?.data?.detail ||
        "Failed to save demand. Please try again.";
      setError(detailMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !demandToEdit) return;
    if (
      !confirm(
        "Are you sure you want to delete this demand configuration? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await pricingSchemesApi.deleteDemand(demandToEdit.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to delete demand:", err);
      const detailMessage =
        err?.response?.data?.detail?.error?.message ||
        err?.response?.data?.detail?.message ||
        err?.response?.data?.detail ||
        "Failed to delete demand. Please try again.";
      setError(detailMessage);
    } finally {
      setSaving(false);
    }
  };

  const lookbackHelpContent = (
    <div>
      <div><b>SAPN Configuration Guide:</b></div>
      <div className="mt-1 mb-2 text-blue-700 bg-blue-50 p-2 rounded text-xs border border-blue-100">
        <b>Note:</b> Lookback days are calculated relative to the <b>last day</b> of the target billing month (e.g., for a December bill, the window is anchored to Dec 31st).
      </div>
      <ul className="list-disc pl-4 mt-1 space-y-1">
        <li>
          <b>Monthly Demand Tariffs (e.g., LBMD)</b>: For Seasonal Peak Demand charges (often named "Demand All days non CBD Nov-Mar"), this is based on the <b>current month only</b>. Set to <b>31 days</b>.
        </li>
        <li>
          <b>Annual Demand Tariffs (e.g., LBAD)</b>: For Seasonal Peak Demand charges, this is based on the <b>last 12 months</b>. Set to <b>365 days</b>.
        </li>
        <li>
          <b>Anytime Demand</b>: Typically based on the <b>last 12 months</b>. Set to <b>365 days</b>.
        </li>
      </ul>
    </div>
  );

  const samplingHelpContent = (
    <div className="space-y-2">
      <div>
        <b>Maximum Interval Value</b>:
        <br />
        The demand is based on the single highest half-hour interval (kVA) within the measurement window. Typically used for <b>Anytime Demand</b> (Legacy/Transition) and <b>Actual Demand</b> calculation.
      </div>
      <div>
        <b>Daily Window Average</b>:
        <br />
        The daily measure is the mathematical average of all half-hour intervals within the specified window (e.g., 4 or 6-hour window). The billing demand is the highest of these "daily measures" over the period. Mandatory for <b>SAPN Annual Demand</b> and <b>Monthly Demand</b> tariffs.
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Demand" : "Add Demand"}
      size="md"
    >
      <div className="space-y-6">
        {error && <ErrorMessage message={error} />}

        {/* Demand Name */}
        <div>
          <label
            htmlFor="demand-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Demand Name *
          </label>
          <input
            id="demand-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Peak Period Demand"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="demand-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <input
            id="demand-description"
            type="text"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional description for this demand"
          />
        </div>

        {/* Day Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="demand-start-time"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Time *
            </label>
            <input
              id="demand-start-time"
              type="text"
              value={formData.startTime}
              onChange={(e) => handleInputChange("startTime", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="HH:MM"
            />
          </div>
          <div>
            <label
              htmlFor="demand-end-time"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Time *
            </label>
            <input
              id="demand-end-time"
              type="text"
              value={formData.endTime}
              onChange={(e) => handleInputChange("endTime", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="HH:MM"
            />
          </div>
        </div>

        {/* Year Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="demand-start-month"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Month *
            </label>
            <input
              id="demand-start-month"
              type="number"
              min={1}
              max={12}
              value={formData.startMonth}
              onChange={(e) =>
                handleInputChange("startMonth", Number(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="demand-end-month"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Month *
            </label>
            <input
              id="demand-end-month"
              type="number"
              min={1}
              max={12}
              value={formData.endMonth}
              onChange={(e) =>
                handleInputChange("endMonth", Number(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        {/* Month range hint */}
        {formData.startMonth &&
          formData.endMonth &&
          formData.startMonth > formData.endMonth && (
            <div className="text-xs text-blue-600 mt-1 font-medium">
              Cross-year range: Month {formData.startMonth} - December, January
              - Month {formData.endMonth}
            </div>
          )}

        {/* Lookback & Price Base */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label
                htmlFor="demand-lookback-days"
                className="block text-sm font-medium text-gray-700"
              >
                Lookback Days *
              </label>
              <Tooltip content={lookbackHelpContent}>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                </button>
              </Tooltip>
            </div>
            <input
              id="demand-lookback-days"
              type="number"
              min={1}
              value={formData.lookbackDays}
              onChange={(e) =>
                handleInputChange("lookbackDays", Number(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="demand-price-base"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price Base ($/kVA/day) *
            </label>
            <input
              id="demand-price-base"
              type="number"
              min={0}
              step="0.0001"
              value={formData.priceBase}
              onChange={(e) =>
                handleInputChange("priceBase", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sampling Method */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label
              htmlFor="demand-sampling-method"
              className="block text-sm font-medium text-gray-700"
            >
              Sampling Method *
            </label>
            <Tooltip content={samplingHelpContent}>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
              </button>
            </Tooltip>
          </div>
          <select
            id="demand-sampling-method"
            value={formData.samplingMethod}
            onChange={(e) =>
              handleInputChange(
                "samplingMethod",
                e.target.value as "maximum_interval" | "daily_window_average"
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="maximum_interval">Maximum Interval Value</option>
            <option value="daily_window_average">Daily Window Average</option>
          </select>
        </div>

        {/* Applicable Days */}
        <div>
          <label
            htmlFor="demand-weekday-pricing"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Applicable Days (Weekday/Weekend Setting) *
          </label>
          <select
            id="demand-weekday-pricing"
            value={formData.weekdayPricing}
            onChange={(e) =>
              handleInputChange(
                "weekdayPricing",
                e.target.value as "all_days" | "weekday" | "weekend"
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all_days">All days</option>
            <option value="weekday">
              Weekday (Monday-Friday, excluding public holidays)
            </option>
            <option value="weekend">Weekend (Weekends + Public Holidays)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          {isEditing ? (
            <div>
              <Button variant="danger" onClick={handleDelete} disabled={saving}>
                {saving ? "Deleting..." : "Delete"}
              </Button>
            </div>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? isEditing
                  ? "Saving..."
                  : "Saving..."
                : isEditing
                ? "Save Changes"
                : "Create Demand"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
