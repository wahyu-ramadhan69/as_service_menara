"use client";
import React, { useEffect, useState } from "react";
import Title from "../Title";
import { AiOutlineSync } from "react-icons/ai";
import { GrPowerShutdown } from "react-icons/gr";
import {
  VscDebugRestart,
  VscDebugStart,
  VscTerminalPowershell,
} from "react-icons/vsc";

interface Summary {
  id: number;
  label: string;
  used: number;
  total: number;
  color: string;
}

interface LogEvent {
  activity: string;
  id: number;
  id_user: number;
  tanggal_activity: string;
  tujuan: string;
  vmid: number;
  user: string;
  divisi: string;
}

interface ApiResponse {
  divisi: {
    cpu: number;
    id: number;
    nama: string;
    ram: number;
    storage: number;
  };
  totalMaxCpu: number;
  totalMaxDiskGB: number;
  totalMaxMemGB: number;
}

const DashboardMenu: React.FC = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logEvent, setLogEvent] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/proxmox/vms/logvm");
        const data = await response.json();
        setLogEvent(data.data || []);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };
    setLoading(false);

    fetchLogs();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/proxmox/cluster/resource");
        const data = await response.json();

        const processedData: Summary[] = [
          {
            id: 1,
            label: "CPU's",
            used: data.data.totalUsedCpu,
            total: data.data.totalCPUMax,
            color: "bg-green-100",
          },
          {
            id: 2,
            label: "RAM",
            used: Math.round(data.data.totalUsedRAM), // Mengkonversi RAM yang digunakan menjadi number
            total: Math.round(data.data.totalRAMMax), // Mengkonversi total RAM menjadi number
            color: "bg-blue-100",
          },
          {
            id: 3,
            label: "Storage",
            used: Math.round(data.data.totalStorageUsed), // Mengkonversi storage yang digunakan menjadi number
            total: Math.round(data.data.totalStorageDisk), // Mengkonversi total storage menjadi number
            color: "bg-orange-100",
          },
        ];

        setSummaries(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPercentage = (used: number, total: number) => {
    const usedValue = parseFloat(used.toString());
    const totalValue = parseFloat(total.toString());
    return (usedValue / totalValue) * 100;
  };

  return (
    <div className="flex h-full w-full flex-col gap-3 bg-slate-200 px-[2%] py-3 transition-all duration-500 ease-in-out md:px-[5%] 1g:px-[10%]">
      <div className="flex flex-col items-start gap-3 md:flex-row">
        <div className="flex w-full flex-col gap-3">
          <div className="flex-1 rounded-md bg-white p-4">
            <div className="flex items-center justify-between">
              <Title>Limit Quota</Title>
            </div>
            {isLoading ? (
              <div className="flex flex-wrap gap-4">
                {Array(3)
                  .fill("")
                  .map((_, index) => (
                    <div
                      key={index}
                      className="flex w-[100%] animate-pulse bg-gray-200 items-center justify-between rounded-lg p-8 lg:w-[31%]"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="h-6 w-32 bg-gray-300 rounded"></div>
                        <div className="h-4 w-20 bg-gray-300 rounded"></div>
                      </div>
                      <div className="w-14 h-14 mb-2 relative bg-gray-300 rounded-full"></div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex-1 rounded-md bg-white p-4">
                <div className="flex flex-wrap gap-4">
                  {summaries.map((item) => (
                    <div
                      key={item.id}
                      className={`flex w-[100%] ${item.color} items-center justify-between rounded-lg p-8 lg:w-[31%]`}
                    >
                      <div className="flex flex-col gap-3">
                        <h1 className="text-xl font-bold">{item.label}</h1>
                        <span className="text-xs text-gray-600">
                          {item.label === "CPU's"
                            ? `Terpakai ${item.used} core dari ${item.total} core`
                            : `Terpakai ${item.used} GB dari ${item.total} GB`}
                        </span>
                      </div>
                      <div className="w-14 h-14 mb-2 relative">
                        <svg viewBox="0 0 36 36" className="w-full h-full">
                          <path
                            className="text-white"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4.8"
                          />
                          <path
                            className="text-purple-500"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                            fill="none"
                            strokeDasharray={`${getPercentage(
                              item.used,
                              item.total
                            )}, 100`}
                            stroke="currentColor"
                            strokeWidth="4.8"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-800">
                            {Math.round((item.used / item.total) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex w-[100%] flex-col gap-3 border-2 md:w-[500px]">
          <div className="flex-1 rounded-lg bg-white p-4">
            <div className="flex justify-start py-2">
              <span className="text-gray-400 text-sm">Last Activity</span>
            </div>
            {loading ? (
              // Skeleton loading
              <div className="animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-6 bg-gray-300 rounded"></div>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-100 p-4">
                <table className="table-auto">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-xs">#</th>
                      <th className="px-4 py-2 text-xs">Action</th>
                      <th className="px-4 py-2 text-xs">User</th>
                      <th className="px-4 py-2 text-xs">Divisi</th>
                      <th className="px-4 py-2 text-xs">VM ID</th>
                    </tr>
                  </thead>
                  {logEvent.map((item) => (
                    <tbody key={item.id}>
                      <tr>
                        <td className="px-4 py-2">
                          {item.activity === "Console" ? (
                            <VscTerminalPowershell className="rounded-full bg-slate-600 p-2 text-3xl font-bold text-white" />
                          ) : item.activity === "Restart" ? (
                            <VscDebugRestart className="rounded-full bg-sky-400 p-2 text-3xl font-bold text-white" />
                          ) : item.activity === "PowerOff" ? (
                            <GrPowerShutdown className="rounded-full bg-red-400 p-2 text-3xl font-bold text-white" />
                          ) : item.activity === "PowerOn" ? (
                            <VscDebugStart className="rounded-full bg-green-400 p-2 text-3xl font-bold text-white" />
                          ) : item.activity === "IPSync" ? (
                            <AiOutlineSync className="rounded-full bg-purple-400 p-2 text-3xl font-bold text-white" />
                          ) : (
                            <></>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <h1 className="font-normal text-xs text-slate-500">
                            {item.activity}
                          </h1>
                        </td>
                        <td className="px-4 py-2">
                          <h1 className="font-normal text-xs text-slate-500">
                            {item.user}
                          </h1>
                        </td>
                        <td className="px-4 py-2">
                          <h1 className="font-normal text-xs text-slate-500">
                            {item.divisi}
                          </h1>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-slate-500 text-xs">
                            {item.vmid}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  ))}
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMenu;
