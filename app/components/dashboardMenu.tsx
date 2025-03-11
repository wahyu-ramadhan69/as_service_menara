import React from "react";

const summaries = [
  { id: 1, label: "CPU's", used: 2, total: 216 },
  { id: 2, label: "RAM", used: 18, total: 377 },
  { id: 3, label: "Storage", used: "553", total: "6686" },
  { id: 4, label: "Floating IPs", used: 0, total: 50 },
  { id: 5, label: "Security Groups", used: 1, total: 10 },
  { id: 6, label: "Volumes", used: 0, total: 10 },
  // { id: 7, label: "Volume Storage", used: "0Bytes", total: "1000.0GB" },
];

const getPercentage = (used: any, total: any) => {
  const usedValue = parseFloat(used);
  const totalValue = parseFloat(total);
  return (usedValue / totalValue) * 100;
};

const DashboardMenu = () => {
  return (
    <div className="px-8 py-4 max-w-screen-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Overview</h2>
      <div className="text-lg font-semibold mb-2">Limit Summary</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {summaries.map((summary) => (
          <div
            key={summary.id}
            className="bg-white shadow rounded-lg p-4 flex flex-col items-center"
          >
            <div className="w-24 h-24 mb-2 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  className="text-gray-200"
                  d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.8"
                />
                <path
                  className="text-blue-600"
                  d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831"
                  fill="none"
                  strokeDasharray={`${getPercentage(
                    summary.used,
                    summary.total
                  )}, 100`}
                  stroke="currentColor"
                  strokeWidth="3.8"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-800">
                  {summary.used}/{summary.total}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-800 font-medium">{summary.label}</div>
              <div className="text-gray-600">{`Used ${summary.used} of ${summary.total}`}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardMenu;
