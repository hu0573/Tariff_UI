// NMI Association Management Modal Component
import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Loading } from "@/components/common/Loading";
import { pricingSchemesApi } from "@/api/pricingSchemes";
import { useNMIList, useRefreshStrategy } from "@/hooks/useConfig";
import type { NMIMeter, BatchAddNMIRequest } from "@/api/pricingSchemes";

interface NMIAssociationModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemeId: number;
  schemeName: string;
  onSuccess: () => void; // Callback to refresh data
}

interface SearchResult extends NMIMeter {
  selected: boolean;
}

export const NMIAssociationModal: React.FC<NMIAssociationModalProps> = ({
  isOpen,
  onClose,
  schemeId,
  schemeName,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [associatedNMIs, setAssociatedNMIs] = useState<Set<string>>(new Set());
  const [nmiSchemeMap, setNmiSchemeMap] = useState<Map<string, string>>(
    new Map()
  );
  const [nmiSchemeIdMap, setNmiSchemeIdMap] = useState<Map<string, number>>(
    new Map()
  );
  const [unbindingNMI, setUnbindingNMI] = useState<string | null>(null);
  const [loadingSchemes, setLoadingSchemes] = useState(false);

  // Fetch NMI list and refresh strategy
  const { data: nmiListData, isLoading: isLoadingNMIList } = useNMIList();
  const { data: refreshStrategy, isLoading: isLoadingStrategy } =
    useRefreshStrategy();

  // Fetch currently associated NMIs and all scheme associations
  useEffect(() => {
    if (isOpen && schemeId) {
      setLoadingSchemes(true);

      // Fetch current scheme's NMIs and all NMI associations in parallel
      // Use Promise.allSettled to handle partial failures
      Promise.allSettled([
        pricingSchemesApi.getSchemeNMIs(schemeId),
        pricingSchemesApi.getAllNMIAssociations(),
      ])
        .then(([currentSchemeResult, associationsResult]) => {
          // Handle current scheme's NMIs
          let associated = new Set<string>();
          if (currentSchemeResult.status === "fulfilled") {
            associated = new Set(
              currentSchemeResult.value.data.map((nmi: NMIMeter) => nmi.nmi)
            );
            setAssociatedNMIs(associated);
          } else {
            console.error(
              "Failed to fetch current scheme NMIs:",
              currentSchemeResult.reason
            );
          }

          // Build NMI -> Scheme mapping from all associations
          const map = new Map<string, string>();
          const idMap = new Map<string, number>();

          if (associationsResult.status === "fulfilled") {
            const allAssociations = associationsResult.value.data;

            // Add all associations to maps
            Object.entries(allAssociations).forEach(([nmi, schemeInfo]) => {
              if (
                typeof schemeInfo === "object" &&
                schemeInfo !== null &&
                "scheme_id" in schemeInfo &&
                "scheme_name" in schemeInfo
              ) {
                const info = schemeInfo as {
                  scheme_id: number;
                  scheme_name: string;
                };
                map.set(nmi, info.scheme_name);
                idMap.set(nmi, info.scheme_id);
              } else {
                // Backward compatibility: if it's just a string (scheme name)
                map.set(nmi, schemeInfo as string);
              }
            });
          } else {
            console.error(
              "Failed to fetch all NMI associations:",
              associationsResult.reason
            );
          }

          // Then, ensure current scheme's NMIs use the correct scheme name
          // (in case the scheme name in associations doesn't match)
          if (currentSchemeResult.status === "fulfilled") {
            currentSchemeResult.value.data.forEach((nmi: NMIMeter) => {
              map.set(nmi.nmi, schemeName);
              idMap.set(nmi.nmi, schemeId);
            });
          }

          setNmiSchemeMap(map);
          setNmiSchemeIdMap(idMap);
          setLoadingSchemes(false);
        })
        .catch((err) => {
          console.error("Unexpected error fetching NMI associations:", err);
          setLoadingSchemes(false);
        });
    }
  }, [isOpen, schemeId, schemeName]);

  // Create a map of monitored NMIs
  const monitoredNMIMap = useMemo(() => {
    const map = new Map<string, string>();
    const monitoredNMIs = refreshStrategy?.monitored_nmis || [];
    monitoredNMIs.forEach(
      (item: { nmi?: string; refresh_frequency?: string } | string) => {
        const nmi = typeof item === "string" ? item : item.nmi || "";
        const frequency =
          typeof item === "string"
            ? "daily"
            : item.refresh_frequency || "daily";
        if (nmi) {
          map.set(nmi, frequency);
        }
      }
    );
    return map;
  }, [refreshStrategy]);

  // Get all monitored NMIs from the NMI list
  const allMonitoredNMIs = useMemo(() => {
    const nmis =
      (
        nmiListData as
          | {
              nmis?: Array<
                | {
                    nmi?: string;
                    name?: string;
                    description?: string;
                    address?: string;
                    meter_type?: string;
                    meter_type_desc?: string;
                  }
                | string
              >;
            }
          | undefined
      )?.nmis || [];
    const allNMIs = nmis.map((nmi) => {
      if (typeof nmi === "string") {
        return {
          nmi,
          name: undefined,
          description: undefined,
          address: undefined,
          meter_type: undefined,
          meter_type_desc: undefined,
        };
      }
      return {
        nmi: nmi.nmi || "",
        name: nmi.name,
        description: nmi.description,
        address: nmi.address,
        meter_type: nmi.meter_type,
        meter_type_desc: nmi.meter_type_desc,
      };
    });

    // Filter: show all monitored NMIs (including those already associated with current or other schemes)
    return allNMIs.filter((nmi: { nmi: string }) =>
      monitoredNMIMap.has(nmi.nmi)
    );
  }, [nmiListData, monitoredNMIMap]);

  // Filter NMIs based on search query
  const filteredNMIs = useMemo(() => {
    if (!searchQuery.trim()) {
      return allMonitoredNMIs;
    }

    const searchLower = searchQuery.toLowerCase();
    return allMonitoredNMIs.filter(
      (nmi: {
        nmi: string;
        name?: string;
        address?: string;
        description?: string;
      }) => {
        const searchFields = [nmi.nmi, nmi.name, nmi.address, nmi.description]
          .filter(Boolean)
          .map((f) => f?.toLowerCase() || "");

        return searchFields.some((field) => field.includes(searchLower));
      }
    );
  }, [allMonitoredNMIs, searchQuery]);

  // Convert to SearchResult format with selection state
  const searchResults = useMemo(() => {
    return filteredNMIs.map(
      (nmi: {
        nmi: string;
        name?: string;
        description?: string;
        address?: string;
        meter_type?: string;
        meter_type_desc?: string;
      }) => ({
        ...nmi,
        selected: false,
      })
    );
  }, [filteredNMIs]);

  const [selectedResults, setSelectedResults] = useState<SearchResult[]>([]);

  // Update selected results when searchResults change
  useEffect(() => {
    setSelectedResults(
      searchResults.map((nmi: SearchResult) => ({
        ...nmi,
        selected: false,
      }))
    );
  }, [searchResults]);

  const selectedCount = useMemo(() => {
    return selectedResults.filter((nmi) => nmi.selected).length;
  }, [selectedResults]);

  // Handle individual NMI selection (only if not associated with any scheme)
  const handleNMIToggle = (nmi: string) => {
    // Check if NMI is associated with current scheme
    const isAssociatedWithCurrentScheme = associatedNMIs.has(nmi);
    // Get associated scheme from map
    const associatedScheme = nmiSchemeMap.get(nmi);
    // Don't allow selection if associated with any scheme (current or other)
    if (
      isAssociatedWithCurrentScheme ||
      (associatedScheme && associatedScheme !== schemeName)
    ) {
      return;
    }
    setSelectedResults((prev) =>
      prev.map((item) =>
        item.nmi === nmi ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Handle select all (only selectable NMIs)
  const handleSelectAll = () => {
    const selectableNMIs = selectedResults.filter(
      (nmi) =>
        !nmiSchemeMap.has(nmi.nmi) || nmiSchemeMap.get(nmi.nmi) === schemeName
    );
    const allSelected = selectableNMIs.every((nmi) => nmi.selected);
    setSelectedResults((prev) =>
      prev.map((nmi) => {
        // Only toggle if NMI is selectable (not associated with another scheme)
        const isSelectable =
          !nmiSchemeMap.has(nmi.nmi) ||
          nmiSchemeMap.get(nmi.nmi) === schemeName;
        if (isSelectable) {
          return { ...nmi, selected: !allSelected };
        }
        return nmi;
      })
    );
  };

  // Handle unbind NMI from its associated scheme
  const handleUnbindNMI = async (nmi: string) => {
    const associatedSchemeId = nmiSchemeIdMap.get(nmi);
    if (!associatedSchemeId) {
      setError("Cannot find associated scheme for this NMI.");
      return;
    }

    try {
      setUnbindingNMI(nmi);
      setError(null);

      await pricingSchemesApi.removeNMIFromScheme(associatedSchemeId, nmi);

      // Update maps: remove the NMI from both maps
      setNmiSchemeMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(nmi);
        return newMap;
      });
      setNmiSchemeIdMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(nmi);
        return newMap;
      });

      // If it was associated with current scheme, also remove from associatedNMIs
      if (associatedNMIs.has(nmi)) {
        setAssociatedNMIs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(nmi);
          return newSet;
        });
      }

      // Call onSuccess to refresh parent component
      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to unbind NMI:", err);
      const errorMessage =
        (
          err as {
            response?: { data?: { detail?: string } };
          }
        )?.response?.data?.detail || "Failed to unbind NMI. Please try again.";
      setError(errorMessage);
    } finally {
      setUnbindingNMI(null);
    }
  };

  // Handle add selected NMIs
  const handleAddSelectedNMIs = async () => {
    // Filter out NMIs that are associated with other schemes (safety check)
    const selectableNMIs = selectedResults.filter(
      (nmi) =>
        nmi.selected &&
        (!nmiSchemeMap.has(nmi.nmi) || nmiSchemeMap.get(nmi.nmi) === schemeName)
    );

    if (selectableNMIs.length === 0) {
      setError("Please select at least one NMI to add.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const nmiCodes = selectableNMIs.map((nmi) => nmi.nmi);
      const batchData: BatchAddNMIRequest = { nmis: nmiCodes };

      await pricingSchemesApi.batchAddNMIsToScheme(schemeId, batchData);

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to add NMIs:", err);
      // Handle partial failures - some NMIs might already be associated
      const errorMessage =
        (
          err as {
            response?: { data?: { detail?: { error?: { message?: string } } } };
          }
        )?.response?.data?.detail?.error?.message ||
        "Failed to add some NMIs. They may already be associated with other schemes.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setError(null);
      setSelectedResults(
        searchResults.map((nmi: SearchResult) => ({
          ...nmi,
          selected: false,
        }))
      );
    }
  }, [isOpen, searchResults]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add NMIs to "${schemeName}"`}
      size="xl"
    >
      <div className="space-y-6">
        {error && <ErrorMessage message={error} />}

        {isLoadingNMIList || isLoadingStrategy || loadingSchemes ? (
          <div className="py-8">
            <Loading />
            <p className="text-center text-gray-500 mt-2 text-sm">
              Loading monitored NMIs...
            </p>
          </div>
        ) : (
          <>
            {/* Search Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by NMI, name, address, or description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Search NMIs"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Only NMIs in the monitoring list are available. NMIs already
                  associated with other schemes cannot be selected.
                </p>
              </div>
            </div>

            {/* NMI List */}
            {selectedResults.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Available NMIs ({selectedResults.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleSelectAll}
                    >
                      {selectedResults.every((nmi) => nmi.selected)
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                    <span className="text-sm text-gray-600">
                      {selectedCount} selected
                    </span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={
                              selectedResults.length > 0 &&
                              selectedResults
                                .filter(
                                  (nmi) =>
                                    !nmiSchemeMap.has(nmi.nmi) ||
                                    nmiSchemeMap.get(nmi.nmi) === schemeName
                                )
                                .every((nmi) => nmi.selected)
                            }
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          NMI
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Associated Scheme
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedResults.map((nmi) => {
                        // Check if NMI is associated with current scheme
                        const isAssociatedWithCurrentScheme =
                          associatedNMIs.has(nmi.nmi);
                        // Get associated scheme from map, or use current scheme if associated with current
                        const associatedScheme = isAssociatedWithCurrentScheme
                          ? schemeName
                          : nmiSchemeMap.get(nmi.nmi);
                        // Disable if associated with any scheme (current or other)
                        const isDisabled = !!associatedScheme;

                        return (
                          <tr
                            key={nmi.nmi}
                            className={`hover:bg-gray-50 ${
                              nmi.selected ? "bg-blue-50" : ""
                            } ${isDisabled ? "opacity-60" : ""}`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={nmi.selected}
                                onChange={() => handleNMIToggle(nmi.nmi)}
                                disabled={isDisabled}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  isDisabled
                                    ? `This NMI is already associated with "${associatedScheme}"`
                                    : ""
                                }
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {nmi.nmi}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {nmi.name || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {associatedScheme || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {associatedScheme ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleUnbindNMI(nmi.nmi)}
                                  disabled={unbindingNMI === nmi.nmi || saving}
                                >
                                  {unbindingNMI === nmi.nmi
                                    ? "Unbinding..."
                                    : "Unbind"}
                                </Button>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery
                  ? `No monitored NMIs found matching "${searchQuery}".`
                  : "No monitored NMIs available. All monitored NMIs may already be associated with this scheme."}
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleAddSelectedNMIs}
            disabled={selectedCount === 0 || saving}
          >
            {saving ? "Adding..." : `Add Selected NMIs (${selectedCount})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
