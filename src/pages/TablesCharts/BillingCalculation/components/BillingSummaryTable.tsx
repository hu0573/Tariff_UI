import React from 'react';
import type { BillingSummaryTableProps } from '../BillingCalculation.types';
import { Tooltip } from '../../../../components/common/Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export const BillingSummaryTable: React.FC<BillingSummaryTableProps> = ({
  summary,
  rangeDisplay,
  state,
}) => {
  const formatCurrency = (val?: number) => 
    val === undefined ? '-' : `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatNumber = (val?: number, decimals: number = 2) => 
    val === undefined ? '-' : val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const renderRowWithDetail = (
    label: string,
    value: number | string | undefined,
    detail?: string,
    cls: string = "py-1.5",
    valueCls: string = "font-medium text-gray-900",
    description?: string
  ) => (
    <div className={`flex items-start justify-between ${cls}`}>
      <div className="flex flex-col">
        <div className="text-sm text-gray-700">{label}</div>
        {description && <div className="text-xs text-gray-500">{description}</div>}
        {detail && <div className="text-xs text-gray-500 whitespace-pre-line">{detail}</div>}
      </div>
      <div className={`text-sm ${valueCls} text-right ml-4`}>
        {typeof value === 'number' ? formatCurrency(value) : value}
      </div>
    </div>
  );

  const renderSectionHeader = (title: string, value?: number) => (
    <div className="flex items-center justify-between py-2 mt-4 mb-2 border-b border-gray-100">
      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{title}</h4>
      {value !== undefined && (
        <span className="text-sm font-bold text-gray-900">{formatCurrency(value)}</span>
      )}
    </div>
  );

  const renderSubHeader = (title: string, value?: number, tooltipContent?: React.ReactNode) => (
    <div className="flex items-center justify-between py-2 mt-2">
      <div className="flex items-center gap-1">
        <h5 className="text-sm font-semibold text-gray-800">{title}</h5>
        {tooltipContent && (
          <Tooltip content={tooltipContent} position="right">
            <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </Tooltip>
        )}
      </div>
      {value !== undefined && (
        <span className="text-sm font-semibold text-gray-900">{formatCurrency(value)}</span>
      )}
    </div>
  );

  const fixedRateTooltipContent = (
    <div className="text-left w-72 md:w-96 font-normal">
      <p className="mb-2">There are two primary reasons why the calculated Fixed Rate Usage might differ from the official retailer bill (e.g., Flow Power):</p>
      <ol className="list-decimal pl-4 space-y-2">
        <li>
          <strong>Non-Standard Retailer Peak Windows</strong>: Retailers may occasionally apply peak windows that differ from the standard SAPN definition. For example, we observed that for NMI <code>EXAMPLE123456</code>, the bill for <strong>December 2025</strong> used a Peak window of <strong>09:00 AM - 09:00 PM</strong>, instead of the standard SAPN definition (07:00 AM - 09:00 PM). However, the bill for <strong>November 2025</strong> for the same NMI correctly followed the standard 07:00 AM start time.
        </li>
        <li>
          <strong>Boundary Classification Anomalies</strong>: Retailers may sometimes misclassify individual interval records at time boundaries. For instance, in the December 2025 data for NMI <code>EXAMPLE123456</code>, a minor residual difference remained even after adjusting for the peak window. The calculation only perfectly matched the bill when the specific record at <strong>2025-12-30 08:30 AM</strong> (officially Off-Peak) was manually treated as Peak.
        </li>
      </ol>
    </div>
  );

  const startDate = summary.start_date || rangeDisplay?.start;
  const endDate = summary.end_date || rangeDisplay?.end;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print-stats print:shadow-none print:border print:p-4">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Billing Summary</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Base Charges */}
        <div>
          {renderSectionHeader("Base Charges")}
          
          {/* Dynamic Pricing */}
          {renderSubHeader("Dynamic Pricing (Spot Market)")}
          <div className="pl-4 border-l-2 border-gray-100 ml-1 space-y-1">
             {summary.dynamic_pricing_formula && (
                <div className="py-1.5 text-gray-500 font-mono text-xs mb-2">
                    {summary.dynamic_pricing_formula}
                </div>
             )}
            {renderRowWithDetail(
              "Spot Market Buy", 
              summary.total_spot_market_buy, 
              summary.total_spot_market_buy_kwh ? `(${formatNumber(summary.total_spot_market_buy_kwh)} kWh)` : undefined
            )}
            {renderRowWithDetail(
              "Spot Market Sell", 
              summary.total_spot_market_sell,
              summary.total_spot_market_sell_kwh ? `(${formatNumber(summary.total_spot_market_sell_kwh)} kWh)` : undefined
            )}
          </div>

          {/* Fixed Rate Usage */}
          {renderSubHeader("Fixed Rate Usage", summary.total_period_charge, fixedRateTooltipContent)}
          {summary.period_breakdown && summary.period_breakdown.length > 0 && (
            <div className="pl-4 border-l-2 border-gray-100 ml-1 space-y-1">
              {summary.period_breakdown.map((item, index) => (
                <React.Fragment key={index}>
                  {renderRowWithDetail(
                    item.label, 
                    item.amount, 
                     (item.total_kwh !== undefined && item.rate !== undefined) 
                     ? `(${formatNumber(item.total_kwh, 0)} kWh @ $${item.rate.toFixed(4)})` 
                     : undefined,
                    "py-1"
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Demand Charges */}
          {renderSubHeader("Demand Charges", summary.total_demand_charge)}
          {summary.demand_breakdown && summary.demand_breakdown.length > 0 && (
            <div className="pl-4 border-l-2 border-gray-100 ml-1 space-y-1">
              {summary.demand_breakdown.map((item, index) => (
                <React.Fragment key={index}>
                  {renderRowWithDetail(item.label, item.amount, undefined, "py-1", "font-medium text-gray-900", item.description)}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Additional Charges */}
        <div>
          {renderSectionHeader("Additional Charges")}
          <div className="pl-4 border-l-2 border-gray-100 ml-1 space-y-1">
            {summary.additional_breakdown?.map((item, index) => (
               <React.Fragment key={index}>
                 {renderRowWithDetail(
                    item.label, 
                    item.amount, 
                    item.billing_detail, // Use mapping from backend
                    "py-1", 
                    "font-medium text-gray-900", 
                    item.description
                 )}
               </React.Fragment>
            ))}
            {(!summary.additional_breakdown || summary.additional_breakdown.length === 0) && (
              <p className="text-sm text-gray-400 italic py-2">No additional charges</p>
            )}
            <div className="pt-2 mt-2 border-t border-gray-100">
               {renderRowWithDetail("Total Additional", summary.total_additional_charges || 0, undefined, "py-1", "font-bold text-gray-900")}
            </div>
          </div>
        </div>

        {/* Column 3: Total Payable */}
        <div className="flex flex-col h-full">
          {renderSectionHeader("Total Payable")} 
          <div className="bg-gray-50 p-4 rounded-lg mt-2 flex-grow">
            <div className="space-y-2">
              {renderRowWithDetail("Subtotal (Ex GST)", summary.total_cost_excl_gst)}
              {renderRowWithDetail("GST (10%)", summary.gst_amount, undefined, "py-1.5", "font-medium text-gray-900")}
              
              <div className="border-t border-gray-200 mt-3 pt-3">
                 <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">Total (Inc GST)</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(summary.total_cost_incl_gst)}</span>
                 </div>
              </div>
            </div>
            
            <div className="mt-6 text-xs text-gray-500 text-right">
              {startDate && endDate && (
                <>Period: {startDate} ~ {endDate}<br/></>
              )}
              State: {state}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
