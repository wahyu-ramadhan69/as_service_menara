"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { TfiHarddrive } from "react-icons/tfi";
import { BsCpu, BsMemory, BsTerminalX } from "react-icons/bs";
import {
  VscDebugRestart,
  VscDebugStart,
  VscTerminalPowershell,
} from "react-icons/vsc";
import { Menu } from "@headlessui/react";
import { GrPowerShutdown } from "react-icons/gr";
import { TbHandClick, TbLocationCode, TbLocationPin } from "react-icons/tb";
import PowerOffModal from "./PowerOffModal";
import { FaServer, FaUserAstronaut } from "react-icons/fa6";
import { LiaLaptopCodeSolid } from "react-icons/lia";
import PowerOnModal from "./PowerOnModal";
import { AiOutlineSync } from "react-icons/ai";
import RestartModal from "./RestartModal";
import ConsoleModal from "./ConsoleUi";
import Title from "../../Title";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SyncIPModal from "./SyncIPModal";

interface Member {
  name: string;
  node: string;
  status: string;
  maxdisk: number;
  maxmem: number;
  maxcpu: number;
  vmid: number;
  image: string;
  owner: string;
  username: string;
  ip: string;
  type_os: string;
  segment: string;
}

const ProjectUI = () => {
  const [items, setItems] = useState<Member[]>([]);
  const [filteredItems, setFilteredItems] = useState<Member[]>([]); // Initialize as empty array
  const [filter, setFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPowerOff, setSelectedPowerOff] = useState<Member | null>(null);
  const [isPowerOffModal, setIsPowerOffModal] = useState(false);
  const [selectedPowerOn, setSelectedPowerOn] = useState<Member | null>(null);
  const [isPowerOnModal, setIsPowerOnModal] = useState(false);
  const [selectedSync, setSelectedSync] = useState<Member | null>(null);
  const [isSyncModal, setIsSyncModal] = useState(false);
  const [selectedRestart, setSelectedRestart] = useState<Member | null>(null);
  const [isRestartModal, setIsRestartModal] = useState(false);
  const [selectedConsole, setSelectedConsole] = useState<Member | null>(null);
  const [isConsoleModal, setIsConsoleModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error);
        throw new Error(errorData.error || "Failed to fetch data from server");
      }
      const result = await response.json();
      setItems(result.mergedData);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = items;

    if (filter) {
      filtered = filtered.filter((item) => item.status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [filter, searchTerm, items]);

  const handlePoweroff = (item: Member) => {
    setSelectedPowerOff(item);
    setIsPowerOffModal(true);
  };

  const handlePowerOn = (item: Member) => {
    setSelectedPowerOn(item);
    setIsPowerOnModal(true);
  };

  const handleRestart = (item: Member) => {
    setSelectedRestart(item);
    setIsRestartModal(true);
  };

  const handleSync = (item: Member) => {
    setSelectedSync(item);
    setIsSyncModal(true);
  };

  const closeModalSync = async () => {
    setIsSyncModal(false);
    setSelectedSync(null);
  };

  const handleOpenConsole = (item: Member) => {
    setSelectedConsole(item);
    setIsConsoleModal(true);
  };

  const closeModalPowerOff = async () => {
    setIsPowerOffModal(false);
    setSelectedPowerOff(null);
  };

  const closeModalPowerOffSubmit = async () => {
    setIsPowerOffModal(false);
    setSelectedPowerOff(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await fetchProjects();
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const closeModalRestart = async () => {
    setIsRestartModal(false);
    setSelectedPowerOff(null);
  };

  const closeModalRestartSubmit = async () => {
    setIsRestartModal(false);
    setSelectedRestart(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await fetchProjects();
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const closeModalConsole = async () => {
    setIsConsoleModal(false);
    setSelectedConsole(null);
  };

  const closeModalPowerOn = async () => {
    setIsPowerOnModal(false);
    setSelectedPowerOn(null);
  };

  const closeModalPowerOnSubmit = async () => {
    setIsPowerOnModal(false);
    setSelectedPowerOn(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await fetchProjects();
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems =
    filteredItems && filteredItems.length
      ? filteredItems.slice(indexOfFirstItem, indexOfLastItem)
      : [];

  const totalPages = Math.ceil((filteredItems?.length || 0) / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="flex flex-col items-center">
      <ToastContainer />
      <>
        <div className="flex h-full w-full flex-col gap-3 px-[2%]W transition-all duration-500 ease-in-out md:px-[5%] 1g:px-[10%]">
          <div className="flex-1 rounded-md bg-white p-4">
            <div className="flex items-center justify-between">
              <Title>List Server</Title>
            </div>
            <div className="flex justify-center items-center">
              <div className="w-full max-w-full mb-4 flex justify-between items-center">
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
                      Filter by Status
                    </Menu.Button>
                  </div>
                  <Menu.Items className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={() => setFilter(null)}
                            className={`${
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-700"
                            } block px-4 py-2 text-sm w-full text-left`}
                          >
                            All
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={() => setFilter("running")}
                            className={`${
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-700"
                            } block px-4 py-2 text-sm w-full text-left`}
                          >
                            Running
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={() => setFilter("stopped")}
                            className={`${
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-700"
                            } block px-4 py-2 text-sm w-full text-left`}
                          >
                            Stopped
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Menu>

                {/* Search Box */}
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center">
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-full w-full">
                  {Array(5)
                    .fill(null)
                    .map((_, index) => (
                      <div
                        key={index}
                        className="relative bg-gray-200 animate-pulse shadow rounded-lg p-4 flex flex-col items-center"
                      >
                        <div className="w-16 h-16 bg-gray-300 rounded-full mb-4"></div>
                        <div className="w-32 h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="w-24 h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="w-20 h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="w-full">
                          <table>
                            <tbody>
                              <tr>
                                <td>
                                  <div className="w-16 h-4 bg-gray-300 rounded mb-2"></div>
                                </td>
                                <td>
                                  <div className="w-12 h-4 bg-gray-300 rounded mb-2"></div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="w-20 h-4 bg-gray-300 rounded mb-2"></div>
                                </td>
                                <td>
                                  <div className="w-14 h-4 bg-gray-300 rounded mb-2"></div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center">
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-full w-full">
                  {currentItems.map((item, index) => (
                    <div
                      key={index}
                      className="relative bg-white shadow rounded-lg p-4 flex flex-col items-center group overflow-hidden"
                    >
                      <Image
                        src={
                          item.type_os === "Ubuntu"
                            ? "/ubuntu.png"
                            : item.type_os === "Windows"
                            ? "/windows.png"
                            : item.type_os === "Centos"
                            ? "/centos.png"
                            : item.type_os === "OracleLinux"
                            ? "/oracle.png"
                            : "/proxmox.png"
                        }
                        alt={item.name}
                        width={64} // Atur ukuran sesuai kebutuhan
                        height={64}
                        className=" mb-4"
                      />

                      <div className="text-sm font-semibold mb-2">
                        {item.name}
                      </div>
                      <div className="flex justify-between mb-2">
                        <div className="text-xs text-gray-600 mr-2 flex justify-center items-center">
                          <LiaLaptopCodeSolid className="text-gray-600 text-2xl" />
                          <span className="bg-cyan-400 px-2 py-1 text-white rounded-xl ml-1">
                            {item.vmid}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 flex justify-center items-center">
                          <FaUserAstronaut className="text-gray-600 text-xs" />
                          <span className="px-2 py-1 text-gray-600">
                            {item.username}
                          </span>
                        </div>
                      </div>
                      {/* <div className="text-xs text-gray-600 mb-2 flex justify-center items-center">
                        <FaServer className="text-sm mr-2" /> {item.node}
                      </div> */}
                      <div className="text-xs text-gray-600 mb-2 flex justify-center items-center">
                        <TbLocationPin className="text-xl mr-2" /> {item.ip}
                      </div>
                      <table>
                        <tbody>
                          <tr>
                            <td>
                              <div
                                className={`text-xs text-white mb-2 px-2 py-1 rounded-full ${
                                  item.status === "stopped"
                                    ? "bg-red-500"
                                    : "bg-green-500"
                                }`}
                              >
                                {item.status}
                              </div>
                            </td>
                            <td>
                              <div className="text-xs text-gray-600 mb-2 flex justify-start items-center">
                                <TfiHarddrive className="text-2xl mx-2" />
                                <span>
                                  {(
                                    item.maxdisk /
                                    (1024 * 1024 * 1024)
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              {" "}
                              <div className="text-xs text-gray-600 mb-2 flex justify-start items-center">
                                <BsMemory className="text-2xl mx-2" />
                                {(item.maxmem / (1024 * 1024 * 1024)).toFixed(
                                  2
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="text-xs text-gray-600 mb-2 flex justify-start items-center">
                                <BsCpu className="text-2xl mx-2" />
                                {item.maxcpu}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="absolute bottom-0 w-full h-1/2 bg-black/10 flex flex-col transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-300 ease-in-out">
                        <div className="flex justify-between w-full h-full">
                          {item.status === "running" ? (
                            <button
                              className="bg-black text-white w-full m-1 flex  justify-center items-center rounded "
                              onClick={() => handleOpenConsole(item)}
                            >
                              <VscTerminalPowershell className="text-2xl text-white" />
                            </button>
                          ) : (
                            <button className="bg-black text-white w-full m-1 flex  justify-center items-center rounded ">
                              <BsTerminalX className="text-2xl text-white" />
                            </button>
                          )}

                          <button
                            className="bg-sky-400 text-white w-full  m-1 flex justify-center items-center rounded"
                            onClick={() => handleRestart(item)}
                          >
                            <VscDebugRestart className=" text-2xl text-white" />
                          </button>
                        </div>
                        <div className="flex justify-between w-full h-full">
                          {item.status === "stopped" ? (
                            <button
                              className="bg-green-400 text-white w-1/2 m-1 flex justify-center items-center rounded"
                              onClick={() => handlePowerOn(item)}
                            >
                              <VscDebugStart className=" text-2xl text-white" />
                            </button>
                          ) : (
                            <button
                              className="bg-red-400 text-white w-1/2 m-1 flex justify-center items-center rounded"
                              onClick={() => handlePoweroff(item)}
                            >
                              <GrPowerShutdown className="text-2xl text-white" />
                            </button>
                          )}
                          <button
                            className="bg-violet-400 text-white w-1/2 m-1 flex justify-center items-center rounded"
                            onClick={() => handleSync(item)}
                          >
                            <AiOutlineSync className=" text-2xl text-white mr-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center items-center">
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 text-gray-600 rounded disabled:bg-gray-300"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`px-3 py-1 rounded ${
                      currentPage === i + 1
                        ? "bg-cyan-400 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 text-gray-600 rounded disabled:bg-gray-300"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedPowerOff && (
          <PowerOffModal
            isOpen={isPowerOffModal}
            onClose={closeModalPowerOff}
            onCloseSubmit={closeModalPowerOffSubmit}
            data={selectedPowerOff}
          />
        )}

        {selectedPowerOn && (
          <PowerOnModal
            isOpen={isPowerOnModal}
            onClose={closeModalPowerOn}
            onCloseSubmit={closeModalPowerOnSubmit}
            data={selectedPowerOn}
          />
        )}

        {selectedRestart && (
          <RestartModal
            isOpen={isRestartModal}
            onClose={closeModalRestart}
            onCloseSubmit={closeModalRestartSubmit}
            data={selectedRestart}
          />
        )}

        {selectedConsole && (
          <ConsoleModal
            isOpen={isConsoleModal}
            onClose={closeModalConsole}
            data={selectedConsole}
          />
        )}

        {selectedSync && (
          <SyncIPModal
            isOpen={isSyncModal}
            onClose={closeModalSync}
            data={selectedSync}
          />
        )}
      </>
    </div>
  );
};

export default ProjectUI;
