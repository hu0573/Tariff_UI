
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { pricingSchemesApi } from "@/api/pricingSchemes";
import type { LossFactor } from "@/api/pricingSchemes";

interface LossFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemeId: number;
  existingLossFactors: LossFactor[];
  lossFactorToEdit?: LossFactor | null;
  onSuccess: () => void;
}

export const LossFactorModal: React.FC<LossFactorModalProps> = ({
  isOpen,
  onClose,
  schemeId,
  existingLossFactors,
  lossFactorToEdit,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    financial_year: new Date().getFullYear(),
    dlf: "0.0",
    tlf: "0.0",
    markup_type: "none",
    markup_value: "0",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (lossFactorToEdit) {
        setFormData({
          financial_year: lossFactorToEdit.financial_year,
          dlf: String(lossFactorToEdit.dlf),
          tlf: String(lossFactorToEdit.tlf),
          markup_type: lossFactorToEdit.markup_type || "none",
          markup_value: lossFactorToEdit.markup_value?.toString() || "0",
        });
      } else {
        // Default to next available year or current year
        const currentYear = new Date().getFullYear();
        // Check if current year exists
        const exists = existingLossFactors.some(
          (lf) => lf.financial_year === currentYear
        );
        setFormData({
          financial_year: exists ? currentYear + 1 : currentYear,
          dlf: "0.0",
          tlf: "0.0",
          markup_type: "none",
          markup_value: "0",
        });
      }
    }
  }, [isOpen, lossFactorToEdit, existingLossFactors]);

  const handleSubmit = async () => {
    // Validation
    if (formData.financial_year < 2000 || formData.financial_year > 2100) {
        setError("Invalid financial year (must be between 2000 and 2100)");
        return;
    }
    // Loss factors can be negative (e.g. TLF credit), so no negative check here.

    const dlfValue = parseFloat(formData.dlf);
    const tlfValue = parseFloat(formData.tlf);
    const markupValue = parseFloat(formData.markup_value);

    if (isNaN(dlfValue)) {
      setError("Invalid DLF value");
      return;
    }
    if (isNaN(tlfValue)) {
      setError("Invalid TLF value");
      return;
    }
    if (formData.markup_type !== "none" && isNaN(markupValue)) {
      setError("Invalid Markup Value");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const commonData = {
        dlf: dlfValue,
        tlf: tlfValue,
        markup_type: formData.markup_type,
        markup_value: formData.markup_type === "none" ? undefined : markupValue,
      };

      if (lossFactorToEdit) {
        // Edit
        await pricingSchemesApi.updateLossFactor(
          schemeId,
          lossFactorToEdit.financial_year,
          commonData
        );
      } else {
        // Add
        // Check duplicate
        if (
          existingLossFactors.some(
            (lf) => lf.financial_year === formData.financial_year
          )
        ) {
          setError(
            `Loss factors for Financial Year ${formData.financial_year} already exist.`
          );
          setSaving(false);
          return;
        }

        await pricingSchemesApi.addLossFactor(schemeId, {
          financial_year: formData.financial_year,
          ...commonData,
        });
      }
        
        onSuccess();
        onClose();
    } catch (err: any) {
        console.error("Failed to save loss factors:", err);
        const msg = err.response?.data?.detail?.error?.message || err.response?.data?.detail || "Failed to save loss factors";
        setError(msg);
    } finally {
        setSaving(false);
    }
  };

  const isEdit = !!lossFactorToEdit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Annual Loss Factor (${formData.financial_year})` : "Add Annual Loss Factor"}
    >
        <div className="space-y-4">
            {error && <ErrorMessage message={error} />}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Financial Year (Start Year)
                </label>
                {isEdit ? (
                     <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {formData.financial_year}
                     </div>
                ) : (
                    <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.financial_year}
                        onChange={(e) => setFormData(prev => ({ ...prev, financial_year: parseInt(e.target.value) || 0 }))}
                    />
                )}
                <p className="text-xs text-gray-500 mt-1">
                    * Applies to period: 01/Jul/{formData.financial_year} - 30/Jun/{formData.financial_year + 1}
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distribution Loss Factor (DLF)
                </label>
                <input
                    type="number"
                    step="0.0001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.dlf}
                    onChange={(e) => setFormData(prev => ({ ...prev, dlf: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                    * Enter as decimal (e.g. 6.2% = 0.0620)
                </p>
            </div>

            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transmission Loss Factor (TLF)
                </label>
                <input
                    type="number"
                    step="0.0001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.tlf}
                    onChange={(e) => setFormData(prev => ({ ...prev, tlf: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                    * Enter as decimal (e.g. 6.2% = 0.0620, -1.72% = -0.0172)
                </p>
            </div>

            {/* Markup Configuration */}
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Pricing Markup
              </label>
              
              <div className="flex gap-4 mb-3">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="markup_type"
                    value="none"
                    checked={formData.markup_type === "none"}
                    onChange={(e) => setFormData(prev => ({ ...prev, markup_type: e.target.value }))}
                  />
                  <span className="ml-2 text-sm text-gray-700">None</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="markup_type"
                    value="percentage"
                    checked={formData.markup_type === "percentage"}
                    onChange={(e) => setFormData(prev => ({ ...prev, markup_type: e.target.value }))}
                  />
                  <span className="ml-2 text-sm text-gray-700">Percentage (%)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="markup_type"
                    value="per_kwh"
                    checked={formData.markup_type === "per_kwh"}
                    onChange={(e) => setFormData(prev => ({ ...prev, markup_type: e.target.value }))}
                  />
                  <span className="ml-2 text-sm text-gray-700">Fixed ($/kWh)</span>
                </label>
              </div>

              {formData.markup_type !== "none" && (
                <div>
                   <input
                      type="number"
                      step={formData.markup_type === "percentage" ? "0.1" : "0.0001"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.markup_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, markup_value: e.target.value }))}
                       placeholder={formData.markup_type === "percentage" ? "e.g. 0.1" : "e.g. 0.02"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                      {formData.markup_type === "percentage" 
                        ? "* Percentage markup added to the final spot rate (e.g. 0.1 = 10%)" 
                        : "* Fixed amount added per kWh (e.g. 0.02 = 2 cents/kWh)"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button variant="secondary" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                </Button>
            </div>
        </div>
    </Modal>
  );
};
