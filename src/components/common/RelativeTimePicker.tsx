

export interface RelativeTimePickerProps {
  isRelative: boolean;
  onIsRelativeChange: (isRelative: boolean) => void;
  relativeOption: string;
  onRelativeOptionChange: (option: string) => void;
  options?: { value: string; label: string }[];
  calculatedRange?: {
    startDate: string;
    endDate: string;
  } | null;
  absoluteContent: React.ReactNode;
}

export function RelativeTimePicker({
  isRelative,
  onIsRelativeChange,
  relativeOption,
  onRelativeOptionChange,
  options = [
    { value: "last_full_month", label: "Last Full Month" },
    { value: "last_full_year", label: "Last Full Year" },
  ],
  calculatedRange,
  absoluteContent,
}: RelativeTimePickerProps) {
  return (
    <div className="space-y-4">
      {/* Relative/Absolute Toggle */}
      <div className="flex bg-gray-100 p-1 rounded-md h-10">
        <button
          onClick={() => onIsRelativeChange(true)}
          className={`flex-1 flex items-center justify-center text-sm font-medium rounded-md transition-all ${
            isRelative
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Relative Time
        </button>
        <button
          onClick={() => onIsRelativeChange(false)}
          className={`flex-1 flex items-center justify-center text-sm font-medium rounded-md transition-all ${
            !isRelative
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Absolute Time
        </button>
      </div>

      {isRelative ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Relative Option:
            </label>
            <select
              value={relativeOption}
              onChange={(e) => onRelativeOptionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {calculatedRange && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <div className="text-xs text-blue-800 font-medium">
                Current selection:
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {calculatedRange.startDate} to {calculatedRange.endDate}
              </div>
            </div>
          )}
        </div>
      ) : (
        absoluteContent
      )}
    </div>
  );
}
