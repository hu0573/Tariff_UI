import React, { useMemo } from 'react';
import type { BillingBreakdownTableProps } from '../BillingCalculation.types';

export const BillingBreakdownTable: React.FC<BillingBreakdownTableProps> = ({
  data,
  periodNames,
  demandNames,
  demandKeyMap,
  pricingPeriodKeyMap,
}) => {
  // Memoize headers to avoid recalculation
  const headers = useMemo(() => {
    return [
      { key: 'date', label: 'Date' },
      { key: 'spot_market_buy', label: 'Spot Buy ($)' },
      { key: 'spot_market_sell', label: 'Spot Sell ($)' },
      ...periodNames.map(name => ({ key: pricingPeriodKeyMap[name], label: name })),
      ...demandNames.map(name => ({ key: demandKeyMap[name], label: name })),
    ];
  }, [periodNames, demandNames, demandKeyMap, pricingPeriodKeyMap]);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Daily Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  scope="col"
                  className="px-3 py-1.5 font-semibold text-gray-600 whitespace-nowrap"
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {headers.map((header) => {
                  const val = row[header.key];
                  const isNumber = typeof val === 'number';
                  return (
                    <td
                      key={header.key}
                      className="px-3 py-1.5 whitespace-nowrap text-gray-600"
                    >
                      {isNumber ? `$${val.toFixed(2)}` : val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
