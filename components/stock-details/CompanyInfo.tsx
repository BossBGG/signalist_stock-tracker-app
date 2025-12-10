// components/stock-details/CompanyInfo.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CompanyInfo = ({ profile }: { profile: any }) => {
  if (!profile) return null;

  return (
    <Card className="bg-[#161616] border-none shadow-none w-full h-full p-6 text-white">
      {/* Header Section */}
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-bold text-white tracking-wide">
          Company Info
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 pb-0 space-y-4">
        
        {/* IPO */}
        <div className="flex justify-between items-center text-base">
          <span className="text-gray-300 font-medium">IPO:</span>
          <span className="text-white font-medium">{profile.ipo || "-"}</span>
        </div>

        {/* Country */}
        <div className="flex justify-between items-center text-base">
          <span className="text-gray-300 font-medium">Country:</span>
          <span className="text-white font-medium">{profile.country || "-"}</span>
        </div>

        {/* Shares */}
        <div className="flex justify-between items-center text-base">
          <span className="text-gray-300 font-medium">Shares:</span>
          <span className="text-white font-medium">
            {profile.shareOutstanding
              ? `${Math.floor(profile.shareOutstanding).toLocaleString()}M`
              : "-"}
          </span>
        </div>

        {/* Employees (FY) */}
        {profile.employeeTotal && (
          <div className="flex justify-between items-center text-base">
            <span className="text-gray-300 font-medium">Employees: (FY)</span>
            <span className="text-white font-medium">
                {profile.employeeTotal > 1000 
                    ? `${Math.round(profile.employeeTotal / 1000)}K` 
                    : profile.employeeTotal}
            </span>
          </div>
        )}

        {/* ISIN */}
        <div className="flex justify-between items-center text-base">
          <span className="text-gray-300 font-medium">ISIN</span>
          <span className="text-white font-medium">{profile.isin || "—"}</span>
        </div>

        {/* Website */}
        {profile.weburl && (
          <div className="flex justify-between items-center text-base">
            <span className="text-gray-300 font-medium">Website:</span>
            <a
              href={profile.weburl}
              target="_blank"
              rel="noreferrer"
              className="text-yellow-400 underline hover:text-yellow-300 font-medium"
            >
              {profile.weburl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
            </a>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default CompanyInfo;