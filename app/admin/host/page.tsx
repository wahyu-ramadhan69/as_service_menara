"use client";

import React, { useState, useEffect, useRef } from "react";
import AddHostModal from "@/app/components/admin/host/AddHostModal";
import { Menu } from "@headlessui/react";
import { ToastContainer } from "react-toastify";
import Title from "@/app/components/Title";
import { GoFilter, GoPlus } from "react-icons/go";
import { RiFileExcel2Line } from "react-icons/ri";

interface Host {
  id: number;
  nama: string;
  segment: string;
}

const Page = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalImport, setIsModalImport] = useState(false);
  const [currentHost, setCurrentHost] = useState<Host | null>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [filteredHosts, setFilteredHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const loaderRef = useRef(null);

  const handleAddHost = (newHost: Host) => {
    if (!newHost.id) return;
    const exists = hosts.some((d) => d.id === newHost.id);
    if (exists) {
      setHosts((prev) => prev.map((d) => (d.id === newHost.id ? newHost : d)));
    } else {
      setHosts((prev) => [newHost, ...prev]);
    }
    setCurrentHost(null);
  };

  const handleReset = () => {
    setCurrentPage(1);
    setHosts([]);
    setHasMore(true);
  };

  const handleEdit = (host: Host) => {
    setCurrentHost(host);
    setIsModalOpen(true);
  };

  const fetchHosts = async (page: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/host?page=${page}&limit=${itemsPerPage}`);
      if (!res.ok) throw new Error("Network response was not ok");
      const result = await res.json();
      const fetchedData: Host[] = result.data.data;
      const totalPages = result.data.totalPages;
      setHosts((prev) => [...prev, ...fetchedData]);
      if (page >= totalPages) setHasMore(false);
    } catch (error) {
      console.error("Failed to fetch hosts:", error);
      setHosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentHost(null);
  };

  const handleCloseModalImport = () => {
    setIsModalImport(false);
  };

  useEffect(() => {
    fetchHosts(currentPage);
  }, [currentPage]);

  useEffect(() => {
    let filtered = hosts;
    if (filter) {
      filtered = filtered.filter((item) => item.segment === filter);
    }
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredHosts(filtered);
  }, [filter, searchTerm, hosts]);

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
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, loading]);

  return (
    <div className="flex h-full w-full flex-col gap-3 px-[2%] transition-all duration-500 ease-in-out md:px-[5%] 1g:px-[10%]">
      <ToastContainer />
      <div className="flex-1 rounded-md bg-white p-4">
        <div className="flex items-center justify-between">
          <Title>List Host</Title>
        </div>

        <div className="flex space-x-4 justify-between items-center">
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <span className="hidden md:inline">Filter by Segment</span>
                <GoFilter className="md:hidden h-5 w-5" />
              </Menu.Button>
            </div>
            <Menu.Items className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
                {["All", "INTERNAL", "BACKEND", "FRONTEND"].map((seg) => (
                  <Menu.Item key={seg}>
                    {({ active }: { active: boolean }) => (
                      <button
                        onClick={() => setFilter(seg === "All" ? null : seg)}
                        className={`${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } block px-4 py-2 text-sm w-full text-left`}
                      >
                        {seg}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Menu>

          <div className="flex justify-center items-center">
            <input
              type="text"
              placeholder="Search by Nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center ml-4"
            >
              <GoPlus className="md:hidden text-lg" />
              <span className="hidden md:inline ml-2">Add Host</span>
            </button>
            <button
              onClick={() => setIsModalImport(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center ml-4"
            >
              <RiFileExcel2Line className="md:hidden text-lg" />
              <span className="hidden md:inline ml-2">Import Host</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto py-4">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Segment
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredHosts.map((host) => (
                <tr key={host.id}>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {host.nama}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {host.segment}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    <button
                      onClick={() => handleEdit(host)}
                      className="text-blue-500 hover:text-blue-700"
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

      <AddHostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleAddHost}
        host={currentHost}
      />
    </div>
  );
};

export default Page;
