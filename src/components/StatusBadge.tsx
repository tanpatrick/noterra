import React from "react";
import { formatTime } from "../utils/dateFormat";

interface StatusBadgeProps {
  synced: boolean;
  updatedAt: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ synced, updatedAt }) => {
  return (
    <div className={`flex items-center gap-1 font-medium ${synced ? "text-green-600" : "text-gray-400"}`}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      <span>{synced ? "Synced" : "Unsynced"}</span>
      <span>{formatTime(updatedAt)}</span>
    </div>
  );
};
