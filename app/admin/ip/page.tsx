"use client";

import React, { useState, useEffect, useRef } from "react";
import AddIpInternalModal from "@/app/components/admin/ip/AddIpInternalModal";
import { Menu } from "@headlessui/react";
import { ToastContainer } from "react-toastify";
import Title from "@/app/components/Title";
import { GoFilter, GoPlus } from "react-icons/go";
import ImportIpModal from "@/app/components/admin/ip/ImportIpModal";
import { RiFileExcel2Line } from "react-icons/ri";

interface IpInternal {
  id: number;
  ip: string;
  nama_server: string;
  status: string;
  type: string;
}

const Page = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalImport, setIsModalImport] = useState(false);
  const [currentIpInternal, setCurrentIpInternal] = useState<IpInternal | null>(
    null
  );
  const [ipInternal, setIpInternal] = useState<IpInternal[]>([]);
  const [filteredIpInternal, setFilteredIpInternal] = useState<IpInternal[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true); // New state to track if more data is available
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const loaderRef = useRef(null);

  const handleAddIpInternal = (newIpInternal: IpInternal) => {
    if (!newIpInternal.id) {
      console.error("Error: ID is missing");
      return;
    }
    const exists = ipInternal.some((d) => d.id === newIpInternal.id);

    if (exists) {
      const updatedIpInternal = ipInternal.map((d) =>
        d.id === newIpInternal.id ? newIpInternal : d
      );
      setIpInternal(updatedIpInternal);
    } else {
      const updatedIpInternal = [newIpInternal, ...ipInternal];
      setIpInternal(updatedIpInternal);
    }

    setCurrentIpInternal(null);
  };

  const handleReset = () => {
    fetchIpInternals(1);
  };

  const handleEdit = (ipInternal: IpInternal) => {
    setCurrentIpInternal(ipInternal);
    setIsModalOpen(true);
  };

  const fetchIpInternals = async (page: number) => {
    if (!hasMore) return; // If no more data, don't fetch

    try {
      setLoading(true);
      const res = await fetch(`/api/ip/?page=${page}&limit=${itemsPerPage}`);
      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await res.json();

      if (data.length < itemsPerPage) {
        setHasMore(false); // No more data to load if fewer items are returned
      }

      setIpInternal((prev) => [...prev, ...data]);
    } catch (error) {
      console.error("Failed to fetch IP Internals:", error);
      setIpInternal([]); // set an empty array or handle accordingly
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentIpInternal(null);
  };

  const handleCloseModalImport = () => {
    setIsModalImport(false);
  };

  useEffect(() => {
    fetchIpInternals(currentPage);
  }, [currentPage]);

  useEffect(() => {
    let filtered = ipInternal;

    if (filter) {
      filtered = filtered.filter((item) => item.type === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.ip.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredIpInternal(filtered);
  }, [filter, searchTerm, ipInternal]);

  const handleObserver = (entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "20px",
      threshold: 1.0,
    });
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, loading]);

  return (
    <div className="flex h-full w-full flex-col gap-3 px-[2%] transition-all duration-500 ease-in-out md:px-[5%] 1g:px-[10%]">
      <ToastContainer />
      <div className="flex-1 rounded-md bg-white p-4">
        <div className="flex items-center justify-between">
          <Title>List IP Address</Title>
        </div>

        <div className="flex space-x-4 justify-between items-center">
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <span className="hidden md:inline">Filter by Type</span>
                <GoFilter className="md:hidden h-5 w-5" />
              </Menu.Button>
            </div>
            <Menu.Items className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      onClick={() => setFilter(null)}
                      className={`${
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      } block px-4 py-2 text-sm w-full text-left`}
                    >
                      All
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      onClick={() => setFilter("INTERNAL")}
                      className={`${
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      } block px-4 py-2 text-sm w-full text-left`}
                    >
                      Internal
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      onClick={() => setFilter("BACKEND")}
                      className={`${
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      } block px-4 py-2 text-sm w-full text-left`}
                    >
                      Backend
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      onClick={() => setFilter("FRONTEND")}
                      className={`${
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      } block px-4 py-2 text-sm w-full text-left`}
                    >
                      Frontend
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>

          <div className="flex justify-center items-center">
            <input
              type="text"
              placeholder="Search by IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center ml-4"
            >
              <GoPlus className="md:hidden text-lg" />
              <span className="hidden md:inline ml-2">Add IP</span>
            </button>

            <button
              onClick={() => setIsModalImport(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center ml-4"
            >
              <RiFileExcel2Line className="md:hidden text-lg" />
              <span className="hidden md:inline ml-2">Import IP</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto py-4">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Alamat IP
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Nama Server
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredIpInternal.map((i) => (
                <tr key={i.id}>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {i.ip}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {i.nama_server}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {i.status}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {i.type}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    <button
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => handleEdit(i)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className="flex justify-center">
            <p>Loading more data...</p>
          </div>
        )}
        {!hasMore && !loading && (
          <div className="flex justify-center">
            <p>No more data to load.</p>
          </div>
        )}
        <div ref={loaderRef} />
      </div>

      <AddIpInternalModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleAddIpInternal}
        ipInternal={currentIpInternal}
      />

      <ImportIpModal
        isOpen={isModalImport}
        onClose={handleCloseModalImport}
        onSave={handleReset}
      />
    </div>
  );
};

export default Page;
