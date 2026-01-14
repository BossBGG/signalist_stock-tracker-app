"use client";

import { calculateProximity, formatPrice, getAlertText } from "@/lib/utils";
import { Pencil, Trash2, BellRing } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AlertsListProps {
  alertData: Alert[];
  watchlist: StockWithData[];
  onEditAlert: (alert: Alert) => void;
  onDeleteAlert: (alertId: string) => void;
}

const AlertsList = ({ alertData, watchlist, onEditAlert, onDeleteAlert }: AlertsListProps) => {

  const getEnrichedAlert = (alert: Alert) => {
    const stockData = watchlist.find((s) => s.symbol === alert.symbol);
    return {
      ...alert,
      currentPrice: stockData?.currentPrice || alert.currentPrice || 0,
      changePercent: stockData?.changePercent || 0,
      logo: stockData?.logo || "",
    };
  };

  return (
    <div className="alert-list space-y-4 p-1 max-h-[450px] overflow-y-auto scrollbar-hide-default">
      {alertData.length === 0 ? (
        <div className="alert-empty flex flex-col items-center justify-center h-40 text-gray-500">
          <BellRing className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-medium">No alerts set</p>
          <p className="text-xs mt-1 opacity-60">Create alerts to track price movements.</p>
        </div>
      ) : (
        alertData.map((rawAlert) => {
          const alert = getEnrichedAlert(rawAlert);

          const proximity = calculateProximity(alert.currentPrice, alert.threshold);
          const isPositiveChange = (alert.changePercent || 0) >= 0;
          

          const distanceText = proximity > 0
            ? `+${proximity.toFixed(2)}%`
            : `${proximity.toFixed(2)}%`;
            
          const proximityColor = proximity > 0 ? "text-green-400" : "text-red-400";

          return (
            <div key={alert.id} className="bg-[#1E1E1E] rounded-xl p-4 border border-gray-800 shadow-sm transition-all hover:border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-gray-700 rounded-lg">
                    <AvatarImage src={alert.logo} alt={alert.company} className="object-contain p-1" />
                    <AvatarFallback className="bg-gray-700 text-gray-300 font-bold rounded-lg text-xs">
                      {alert.symbol.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-white text-base leading-tight">{alert.company}</h4>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{alert.symbol}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-white font-bold text-base tracking-wide">
                    {formatPrice(alert.currentPrice)}
                  </div>
                   <span className={`text-[10px] mt-0.5 ${proximityColor} opacity-80`}>
                        {distanceText}
                    </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium">Alert:</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditAlert(alert)}
                        className="text-gray-500 hover:text-white transition-colors p-0.5"
                        title="Edit Alert"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          console.log("[ALERT LIST] Delete button clicked for alert:", alert.id, alert);
                          onDeleteAlert(alert.id);
                        }}
                        className="text-gray-500 hover:text-red-500 transition-colors p-0.5"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

              <div className="h-px bg-gray-800 w-full mb-3"></div>
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base">
                       Price {alert.condition === 'greater' ? '>' : '<'} {formatPrice(alert.threshold)}
                    </span>
                   
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span className="text-[10px] font-medium px-2 py-1 bg-[#2A2A2A] text-yellow-500 rounded border border-yellow-500/20">
                    {alert.frequency === 'once_per_minute' ? 'Once per minute' : 
                     alert.frequency === 'once_per_hour' ? 'Once per hour' : 
                     alert.frequency === 'once_per_day' ? 'Once per day' : 'Once'}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AlertsList;