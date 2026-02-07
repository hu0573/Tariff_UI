// Period Configuration Modal Component
import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { pricingSchemesApi } from "@/api/pricingSchemes";
import type {
  PricingPeriod,
  CreatePricingPeriodRequest,
  UpdatePricingPeriodRequest,
} from "@/api/pricingSchemes";

interface PeriodConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemeId: number;
  enableWeekdayPricing: boolean;
  existingPeriods: PricingPeriod[];
  periodToEdit?: PricingPeriod | null;
  dragResult?: {
    startTime: string;
    endTime: string;
    group: 0 | 1 | 2;
  } | null;
  onSuccess: () => void; // Callback to refresh data
}

export const PeriodConfigModal: React.FC<PeriodConfigModalProps> = ({
  isOpen,
  onClose,
  schemeId,
  enableWeekdayPricing,
  existingPeriods,
  periodToEdit,
  dragResult,
  onSuccess,
}) => {
  const isEditing = !!periodToEdit;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    price: "",
    periodGroup: 0 as 0 | 1 | 2,
    description: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate time format (HH:MM)
  const isValidTime = (time: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  // Convert time string to minutes since midnight for comparison
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Check if two time periods overlap using "front inclusive, back exclusive" rule
  // Two periods overlap if max(start1, start2) < min(end1, end2)
  const periodsOverlap = useCallback(
    (start1: string, end1: string, start2: string, end2: string): boolean => {
      const start1Min = timeToMinutes(start1);
      const end1Min = timeToMinutes(end1);
      const start2Min = timeToMinutes(start2);
      const end2Min = timeToMinutes(end2);

      // Handle cross-day periods (end time is earlier than start time)
      const normalizedEnd1 = end1Min < start1Min ? end1Min + 1440 : end1Min;
      const normalizedEnd2 = end2Min < start2Min ? end2Min + 1440 : end2Min;

      return (
        Math.max(start1Min, start2Min) <
        Math.min(normalizedEnd1, normalizedEnd2)
      );
    },
    []
  );

  const formatApiTimeToInput = (timeValue: string): string => {
    if (!timeValue) return "";
    const trimmed = timeValue.trim();

    if (trimmed.startsWith("PT")) {
      const hourMatch = trimmed.match(/(\d+)H/);
      const minuteMatch = trimmed.match(/(\d+)M/);
      const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
      const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
      const totalMinutes = hours * 60 + minutes;
      const normalizedHours = Math.floor(totalMinutes / 60) % 24;
      const normalizedMinutes = totalMinutes % 60;
      return `${normalizedHours.toString().padStart(2, "0")}:${normalizedMinutes
        .toString()
        .padStart(2, "0")}`;
    }

    if (trimmed.includes("T")) {
      const [, timePart] = trimmed.split("T");
      if (timePart) {
        const [hourPart, minutePart] = timePart.split(":");
        const hours = parseInt(hourPart ?? "0", 10);
        const minutes = parseInt(minutePart ?? "0", 10);
        return `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      }
    }

    const [hoursStr, minutesStr] = trimmed.split(":");
    const hours = parseInt(hoursStr ?? "0", 10);
    const minutes = parseInt(minutesStr ?? "0", 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }

    return trimmed;
  };

  // Check if a period overlaps with existing periods in the same group
  // Returns error message if overlap found, null otherwise
  const checkPeriodOverlap = useCallback(
    (
      startTime: string,
      endTime: string,
      periodGroup: 0 | 1 | 2,
      excludePeriodId?: number
    ): string | null => {
      // Time format validation - if invalid, don't check overlap
      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        return null;
      }

      // Normalize existing periods
      const normalizedExistingPeriods = existingPeriods.map((period) => ({
        id: period.id,
        name: period.name,
        periodGroup: period.period_group,
        startTime: formatApiTimeToInput(period.start_time),
        endTime: formatApiTimeToInput(period.end_time),
      }));

      // Filter periods in the same group, excluding the current period if editing
      const sameGroupPeriods = normalizedExistingPeriods.filter(
        (p) => p.periodGroup === periodGroup && p.id !== excludePeriodId
      );

      // Check for overlaps and collect all overlapping period names
      const overlappingPeriods: Array<{ name: string }> = [];
      for (const existingPeriod of sameGroupPeriods) {
        if (
          periodsOverlap(
            startTime,
            endTime,
            existingPeriod.startTime,
            existingPeriod.endTime
          )
        ) {
          overlappingPeriods.push({ name: existingPeriod.name });
        }
      }

      // If overlaps found, return error message with all overlapping period names
      if (overlappingPeriods.length > 0) {
        const groupName =
          periodGroup === 0
            ? "General"
            : periodGroup === 1
            ? "Weekday"
            : "Weekend";
        const periodNames = overlappingPeriods
          .map((p) => `"${p.name}"`)
          .join(", ");
        return `This time range overlaps with existing period(s) ${periodNames} in the ${groupName} group. Please delete the overlapping period(s) first.`;
      }

      return null;
    },
    [existingPeriods, periodsOverlap]
  );

  // Reset form when modal opens/closes or periodToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && periodToEdit) {
        setFormData({
          name: periodToEdit.name,
          startTime: formatApiTimeToInput(periodToEdit.start_time),
          endTime: formatApiTimeToInput(periodToEdit.end_time),
          price: periodToEdit.price.toString(),
          periodGroup: periodToEdit.period_group,
          description: periodToEdit.description || "",
        });
        setError(null);
      } else if (dragResult) {
        // 拖拽创建新时段，使用拖拽结果预填充
        console.log("Using dragResult:", dragResult);
        setFormData({
          name: "",
          startTime: dragResult.startTime,
          endTime: dragResult.endTime,
          price: "",
          periodGroup: dragResult.group,
          description: "",
        });
        // Immediately check for overlaps when drag result is available
        const overlapError = checkPeriodOverlap(
          dragResult.startTime,
          dragResult.endTime,
          dragResult.group
        );
        if (overlapError) {
          setError(overlapError);
        } else {
          setError(null);
        }
      } else {
        setFormData({
          name: "",
          startTime: "",
          endTime: "",
          price: "",
          periodGroup: 0,
          description: "",
        });
        setError(null);
      }
    }
  }, [
    isOpen,
    isEditing,
    periodToEdit,
    dragResult,
    existingPeriods,
    checkPeriodOverlap,
  ]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value };

      // When time or group fields change, check for overlaps in real-time
      if (
        field === "startTime" ||
        field === "endTime" ||
        field === "periodGroup"
      ) {
        // Only check if both time fields are valid
        const startTime =
          field === "startTime" ? String(value) : newFormData.startTime;
        const endTime =
          field === "endTime" ? String(value) : newFormData.endTime;
        const periodGroup =
          field === "periodGroup"
            ? (value as 0 | 1 | 2)
            : newFormData.periodGroup;

        if (isValidTime(startTime) && isValidTime(endTime)) {
          const overlapError = checkPeriodOverlap(
            startTime,
            endTime,
            periodGroup,
            periodToEdit?.id // Exclude current period if editing
          );

          if (overlapError) {
            setError(overlapError);
          } else {
            // Clear overlap error, but keep other errors if any
            setError((currentError) => {
              if (currentError && currentError.includes("overlaps")) {
                return null;
              }
              return currentError;
            });
          }
        } else {
          // Time format invalid, clear overlap error if exists
          setError((currentError) => {
            if (currentError && currentError.includes("overlaps")) {
              return null;
            }
            return currentError;
          });
        }
      } else {
        // Other fields changed, clear error if it's an overlap error
        setError((currentError) => {
          if (currentError && currentError.includes("overlaps")) {
            return null;
          }
          return currentError;
        });
      }

      return newFormData;
    });
  };

  // Validate form and check for overlaps
  const validateForm = (): string | null => {
    // Required fields validation
    if (!formData.name.trim()) return "Period name is required.";
    if (!formData.startTime) return "Start time is required.";
    if (!formData.endTime) return "End time is required.";
    if (!formData.price) return "Price is required.";

    // Time format validation
    if (!isValidTime(formData.startTime))
      return "Start time must be in HH:MM format.";
    if (!isValidTime(formData.endTime))
      return "End time must be in HH:MM format.";

    // Price validation
    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue) || priceValue < 0)
      return "Price must be a positive number.";

    // Period group validation
    if (!enableWeekdayPricing && formData.periodGroup !== 0) {
      return "Cannot use weekday/weekend groups when weekday pricing is disabled.";
    }

    // Overlap validation using unified checkPeriodOverlap function
    const overlapError = checkPeriodOverlap(
      formData.startTime,
      formData.endTime,
      formData.periodGroup,
      periodToEdit?.id
    );
    if (overlapError) {
      return overlapError;
    }

    return null;
  };

  // Handle save
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const priceValue = parseFloat(formData.price);

      if (isEditing && periodToEdit) {
        // Update existing period
        const updateData: UpdatePricingPeriodRequest = {
          name: formData.name.trim(),
          start_time: String(formData.startTime).trim(),
          end_time: String(formData.endTime).trim(),
          price: priceValue,
          period_group: formData.periodGroup,
          description: formData.description.trim() || undefined,
        };

        await pricingSchemesApi.updatePricingPeriod(
          periodToEdit.id,
          updateData
        );
      } else {
        // Create new period
        const createData: CreatePricingPeriodRequest = {
          name: formData.name.trim(),
          start_time: String(formData.startTime).trim(),
          end_time: String(formData.endTime).trim(),
          price: priceValue,
          period_group: formData.periodGroup,
          description: formData.description.trim() || undefined,
        };

        console.log("Creating period with data:", createData);
        await pricingSchemesApi.addPricingPeriod(schemeId, createData);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to save period:", err);
      const errorMessage =
        (
          err as {
            response?: {
              data?: {
                detail?: { error?: { message?: string }; message?: string };
              };
            };
          }
        ).response?.data?.detail?.error?.message ||
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail ||
        "Failed to save period. Please try again.";

      // Provide more helpful error message for weekday pricing issues
      if (errorMessage.includes("Weekday/weekend pricing is not enabled")) {
        setError(
          "Weekday/weekend pricing is not enabled for this scheme. Please enable weekday pricing in the scheme settings first."
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  // Get available period groups
  const getAvailableGroups = () => {
    const groups = [{ value: 0, label: "General" }];
    if (enableWeekdayPricing) {
      groups.push(
        { value: 1, label: "Weekday" },
        { value: 2, label: "Weekend" }
      );
    }
    return groups;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Period" : "Add New Period"}
      size="md"
    >
      <div className="space-y-6">
        {error && <ErrorMessage message={error} />}

        {/* Period Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Period Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Peak Period, Off-Peak Period"
            required
          />
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
              placeholder="HH:MM (24h)"
              value={formData.startTime}
              onChange={(e) => handleInputChange("startTime", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
              placeholder="HH:MM (24h)"
              value={formData.endTime}
              onChange={(e) => handleInputChange("endTime", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Price and Group */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (AUD/kWh) *
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.0000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group *
            </label>
            <select
              value={formData.periodGroup}
              onChange={(e) =>
                handleInputChange("periodGroup", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getAvailableGroups().map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional description for this period"
          />
        </div>

        {/* Help Text */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <strong>Note:</strong> Time periods use "front inclusive, back
          exclusive" logic. For example, 17:00-21:00 includes data from 17:00
          but excludes data at 21:00. Periods in the same group cannot overlap.
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? isEditing
                ? "Updating..."
                : "Adding..."
              : isEditing
              ? "Update Period"
              : "Add Period"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
