// Channel Mapping Required Prompt Component
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import type { ChannelMappingError } from "@/api/channelMapping";

interface ChannelMappingRequiredPromptProps {
  error: ChannelMappingError;
}

export const ChannelMappingRequiredPrompt: React.FC<
  ChannelMappingRequiredPromptProps
> = ({ error }) => {
  const navigate = useNavigate();

  const handleNavigateToConfig = () => {
    // Navigate to Channel Mapping configuration page, automatically select current NMI
    // Pass state to indicate we came from Data Viewer
    navigate(`/data-configuration/channel-mapping/${error.nmi}`, {
      state: {
        fromDataViewer: true,
      },
    });
  };

  return (
    <Card className="mb-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Channel Mapping Required
            </h3>
            <p className="text-sm text-yellow-800 mb-3">
              Meter <strong>{error.nmi}</strong> has not been configured with
              Channel Mapping. Power metrics data cannot be viewed without
              proper channel configuration.
            </p>
            <p className="text-sm text-yellow-700 mb-4">
              {error.suggestion ||
                "Please configure Channel Mapping first to view power metrics."}
            </p>
            <Button
              variant="primary"
              onClick={handleNavigateToConfig}
              className="mt-2"
            >
              Configure Channel Mapping
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
