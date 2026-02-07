import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import type {
  CreateDemandRequest,
  Demand,
  UpdateDemandRequest,
} from "@/api/pricingSchemes";

type DemandPayload = CreateDemandRequest | UpdateDemandRequest;

interface DemandConfigRowProps {
  demand?: Demand;
  readOnly?: boolean;
  saving?: boolean;
  onSave?: (payload: DemandPayload, demandId?: number) => Promise<void>;
  onDelete?: (demandId: number) => Promise<void>;
  onCancelNew?: () => void;
}

const normalizeTime = (value: string): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.includes("T")) {
    const [, timePart] = trimmed.split("T");
    if (timePart) {
      const [h, m] = timePart.split(":");
      return `${(parseInt(h ?? "0", 10) || 0).toString().padStart(2, "0")}:${(
        parseInt(m ?? "0", 10) || 0
      )
        .toString()
        .padStart(2, "0")}`;
    }
  }

  const [h, m] = trimmed.split(":");
  if (!h) return trimmed;
  const hours = parseInt(h, 10);
  const minutes = parseInt(m ?? "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return trimmed;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

export const DemandConfigRow: React.FC<DemandConfigRowProps> = ({
  demand,
  readOnly = false,
  saving = false,
  onSave,
  onDelete,
  onCancelNew,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: demand?.name ?? "",
    description: demand?.description ?? "",
    startTime: normalizeTime(demand?.start_time ?? "00:00"),
    endTime: normalizeTime(demand?.end_time ?? "23:59"),
    startMonth: demand?.start_month ?? 1,
    endMonth: demand?.end_month ?? 12,
    lookbackDays: demand?.lookback_days ?? 365,
    priceBase: demand?.price_base ?? 0,
    weekdayPricing: (demand?.weekday_pricing ?? "all_days") as "all_days" | "weekday" | "weekend",
  });

  useEffect(() => {
    setFormData({
      name: demand?.name ?? "",
      description: demand?.description ?? "",
      startTime: normalizeTime(demand?.start_time ?? "00:00"),
      endTime: normalizeTime(demand?.end_time ?? "23:59"),
      startMonth: demand?.start_month ?? 1,
      endMonth: demand?.end_month ?? 12,
      lookbackDays: demand?.lookback_days ?? 365,
      priceBase: demand?.price_base ?? 0,
      weekdayPricing: (demand?.weekday_pricing ?? "all_days") as "all_days" | "weekday" | "weekend",
    });
    setError(null);
  }, [demand]);

  const isValidTime = (time: string): boolean =>
    /^([01]?\d|2[0-3]):[0-5]\d$/.test(time);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = (): DemandPayload | null => {
    if (!formData.name.trim()) {
      setError("Demand name is required.");
      return null;
    }
    if (!isValidTime(formData.startTime) || !isValidTime(formData.endTime)) {
      setError("Time must follow HH:MM format.");
      return null;
    }
    if (formData.startTime === formData.endTime) {
      setError("Start time and end time cannot be the same.");
      return null;
    }
    if (
      formData.startMonth < 1 ||
      formData.startMonth > 12 ||
      formData.endMonth < 1 ||
      formData.endMonth > 12
    ) {
      setError("Month must be between 1 and 12.");
      return null;
    }
    if (formData.lookbackDays < 1) {
      setError("Lookback days must be at least 1.");
      return null;
    }
    if (formData.priceBase <= 0) {
      setError("Price base must be greater than 0.");
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
    };
  };

  const handleSave = async () => {
    if (!onSave || readOnly) return;
    const payload = buildPayload();
    if (!payload) return;

    await onSave(payload, demand?.id);
  };

  const handleDelete = async () => {
    if (!onDelete || !demand?.id || readOnly) return;
    await onDelete(demand.id);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Demand Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Enter demand name"
            disabled={readOnly || saving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Optional description"
            disabled={readOnly || saving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time *
          </label>
          <input
            type="text"
            value={formData.startTime}
            onChange={(e) => handleInputChange("startTime", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="HH:MM"
            disabled={readOnly || saving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time *
          </label>
          <input
            type="text"
            value={formData.endTime}
            onChange={(e) => handleInputChange("endTime", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="HH:MM"
            disabled={readOnly || saving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Month *
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={formData.startMonth}
            onChange={(e) =>
              handleInputChange("startMonth", Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            disabled={readOnly || saving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Month *
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={formData.endMonth}
            onChange={(e) =>
              handleInputChange("endMonth", Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            disabled={readOnly || saving}
          />
          {/* Month range hint */}
          {formData.startMonth &&
            formData.endMonth &&
            formData.startMonth > formData.endMonth && (
              <div className="text-xs text-blue-600 mt-1 font-medium">
                Cross-year range: Month {formData.startMonth} - December,
                January - Month {formData.endMonth}
              </div>
            )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lookback Days *
          </label>
          <input
            type="number"
            min={1}
            value={formData.lookbackDays}
            onChange={(e) =>
              handleInputChange("lookbackDays", Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            disabled={readOnly || saving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Base ($/kVA/day) *
          </label>
          <input
            type="number"
            min={0}
            step="0.0001"
            value={formData.priceBase}
            onChange={(e) =>
              handleInputChange("priceBase", Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            disabled={readOnly || saving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Applicable Days (Weekday/Weekend Setting) *
          </label>
          <select
            value={formData.weekdayPricing}
            onChange={(e) =>
              handleInputChange(
                "weekdayPricing",
                e.target.value as "all_days" | "weekday" | "weekend"
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            disabled={readOnly || saving}
          >
            <option value="all_days">All days</option>
            <option value="weekday">
              Weekday (Monday-Friday, excluding public holidays)
            </option>
            <option value="weekend">Weekend (Weekends + Public Holidays)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-3">
          <ErrorMessage message={error} />
        </div>
      )}

      {!readOnly && (
        <div className="flex justify-end gap-2 mt-4">
          {onCancelNew && (
            <Button variant="secondary" onClick={onCancelNew} disabled={saving}>
              Cancel
            </Button>
          )}
          {onDelete && demand?.id && (
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !onSave}>
            {saving ? "Saving..." : "Save Demand"}
          </Button>
        </div>
      )}
    </div>
  );
};
