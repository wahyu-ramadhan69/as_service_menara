"use client";

import React, { useState, useEffect, useRef } from "react";
import AddPengajuanModal from "./AddPengajuan";
import CancelPengajuanModal from "./CancelPengajuan";
import { IoCheckmarkDone, IoClose } from "react-icons/io5";
import { TiCancel } from "react-icons/ti";
import { MdPlaylistAdd } from "react-icons/md";
import { Menu } from "@headlessui/react";
import Title from "../../Title";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";
import { GoFilter, GoPlus } from "react-icons/go";

interface Pengajuan {
  id: number;
  id_template: number;
  cpu: number;
  ram: number;
  storage: number;
  segment: string;
  nama_aplikasi: string;
  tujuan_pengajuan: string;
  jenis_pengajuan: string;
  status_pengajuan: string;
  vmid: number;
  nama_baru: string;
  template: Template;
}

interface Template {
  id: number;
  nama_template: string;
  type_os: string;
}

export default function PengajuanUi() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [currentPengajuan, setCurrentPengajuan] = useState<Pengajuan | null>(
    null
  );
  const [pengajuan, setPengajuan] = useState<Pengajuan[]>([]);
  const [filteredPengajuan, setFilteredPengajuan] = useState<Pengajuan[]>([]);
  const [initialLoading, setInitialLoading] = useState(true); // Separate state for initial loading
  const [loadMoreLoading, setLoadMoreLoading] = useState(false); // State for loading more data
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [fetchedPages, setFetchedPages] = useState<Set<number>>(new Set());

  const fetchPengajuan = async (page: number, replaceData = false) => {
    if (loadMoreLoading || fetchError || fetchedPages.has(page)) return;

    try {
      setInitialLoading(page === 1 && !fetchedPages.has(page));
      setLoadMoreLoading(page > 1);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authorization token found");
      }

      const res = await fetch(`/api/pengajuan?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 500) {
          setFetchError(true);
          setHasMore(false);
        }
        throw new Error("Network response was not ok");
      }

      const data = await res.json();

      setFetchedPages((prev) => new Set(prev).add(page)); // Mark page as fetched

      if (data.pengajuan.length === 0) {
        setHasMore(false);
      } else {
        setPengajuan((prev) =>
          replaceData ? [...data.pengajuan] : [...prev, ...data.pengajuan]
        );
        setFilteredPengajuan((prev) =>
          replaceData ? [...data.pengajuan] : [...prev, ...data.pengajuan]
        );
      }

      setFetchError(false);
    } catch (error) {
      console.error("Failed to fetch pengajuan:", error);
      setFetchError(true);
    } finally {
      setInitialLoading(false);
      setLoadMoreLoading(false);
    }
  };

  useEffect(() => {
    if (!fetchedPages.has(1)) {
      fetchPengajuan(1, true);
    }
  }, []);

  useEffect(() => {
    let filtered = pengajuan;

    if (filter) {
      filtered = filtered.filter((item) => item.status_pengajuan === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.nama_aplikasi?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPengajuan(filtered);
  }, [filter, searchTerm, pengajuan]);

  useEffect(() => {
    if (loadMoreLoading || !hasMore || fetchError) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadMoreLoading && !fetchError) {
        setCurrentPage((prevPage) => prevPage + 1);
      }
    });

    if (loadMoreRef.current) observer.current.observe(loadMoreRef.current);
  }, [loadMoreLoading, hasMore, fetchError]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchPengajuan(currentPage);
    }
  }, [currentPage]);

  const handleAddPengajuan = (newPengajuan: Pengajuan) => {
    if (!newPengajuan.id) {
      console.error("Error: ID is missing");
      toast.error(`Konfigurasi gagal dilakukan`);
      return;
    }
    const exists = pengajuan.some((d) => d.id === newPengajuan.id);

    if (exists) {
      const updatePengajuan = pengajuan.map((d) =>
        d.id === newPengajuan.id ? newPengajuan : d
      );
      setPengajuan(updatePengajuan);
    } else {
      const updatePengajuan = [newPengajuan, ...pengajuan];
      toast.success("Berhasil menambah pengajuan");
      setPengajuan(updatePengajuan);
    }
  };

  const handleCancelPengajuan = (newPengajuan: Pengajuan) => {
    if (!newPengajuan.id) {
      console.error("Error: ID is missing");
      toast.error(`Konfigurasi gagal dilakukan`);
      return;
    }

    const updatePengajuan = pengajuan.map((d) =>
      d.id === newPengajuan.id ? newPengajuan : d
    );
    setPengajuan(updatePengajuan);
  };

  const handleOpenCancelModal = (pengajuan: Pengajuan) => {
    setCurrentPengajuan(pengajuan);
    setIsCancelModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPengajuan(null);
  };

  const handleCloseDeleteModal = () => {
    setIsCancelModalOpen(false);
    setCurrentPengajuan(null);
  };

  return (
    <div className="flex h-full w-full flex-col gap-3 px-[2%] transition-all duration-500 ease-in-out md:px-[5%] 1g:px-[10%]">
      <ToastContainer />
      <div className="flex-1 rounded-md bg-white p-4">
        <div className="flex items-center justify-between">
          <Title>List Pengajuan</Title>
        </div>

        <div className="flex space-x-4 justify-between items-center py-2">
          {/* Filter Menu */}
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              {/* Show text on medium screens and larger, show icon on mobile */}
              <span className="hidden md:inline">Filter by Status</span>
              <GoFilter className="md:hidden h-6 w-6" /> {/* Icon for mobile */}
            </Menu.Button>
            <Menu.Items className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <Menu.Item>
                {({ active }) => (
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
                {({ active }) => (
                  <button
                    onClick={() => setFilter("Proses pengerjaan")}
                    className={`${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    } block px-4 py-2 text-sm w-full text-left`}
                  >
                    Proses pengerjaan
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setFilter("Selesai")}
                    className={`${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    } block px-4 py-2 text-sm w-full text-left`}
                  >
                    Selesai
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setFilter("Reject")}
                    className={`${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    } block px-4 py-2 text-sm w-full text-left`}
                  >
                    Reject
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setFilter("Canceled")}
                    className={`${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    } block px-4 py-2 text-sm w-full text-left`}
                  >
                    Canceled
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setFilter("Waiting For Dept Head")}
                    className={`${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    } block px-4 py-2 text-sm w-full text-left`}
                  >
                    Waiting For Dept Head
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm"
          />

          {/* Add Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center"
          >
            <GoPlus className="text-lg" /> {/* Icon for add button */}
            {/* Show text on medium screens and larger, show icon on mobile */}
            <span className="hidden md:inline ml-2">Add</span>
          </button>
        </div>

        <AddPengajuanModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleAddPengajuan}
        />
        <CancelPengajuanModal
          isOpen={isCancelModalOpen}
          onClose={handleCloseDeleteModal}
          data={currentPengajuan}
          onSave={handleCancelPengajuan}
        />

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Type OS
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  CPU
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  RAM (GB)
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Storage (GB)
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Nama Aplikasi
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Tujuan Pengajuan
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Segment
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Pengajuan
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Status Pengajuan
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            {initialLoading ? (
              <tbody>
                {Array(5)
                  .fill(null)
                  .map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 border-b border-gray-200 text-sm">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-200 text-sm">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-200 text-sm">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-200 text-sm">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-200 text-sm">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-200 text-sm">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-200 text-sm">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-200 text-sm">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-200 text-sm">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-200 text-sm">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            ) : (
              <tbody className="bg-white">
                {filteredPengajuan.map((p, index) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {p.vmid}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {p.template.type_os}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {p.cpu}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {p.ram}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {p.storage}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {p.jenis_pengajuan === "Existing"
                        ? `${p.nama_baru}`
                        : `${p.nama_aplikasi}`}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {p.tujuan_pengajuan}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {p.segment}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      <span
                        className={`text-sm text-white px-2 py-1 rounded-xl ${
                          p.jenis_pengajuan === "New"
                            ? "bg-cyan-400"
                            : p.jenis_pengajuan === "Existing"
                            ? "bg-yellow-400"
                            : p.jenis_pengajuan === "Perubahan"
                            ? "bg-violet-400"
                            : p.jenis_pengajuan === "Delete"
                            ? "bg-red-400"
                            : ""
                        }`}
                      >
                        {p.jenis_pengajuan}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      <div className="flex justify-center items-center h-full">
                        {p.status_pengajuan === "Proses pengerjaan" ? (
                          <div className="flex justify-center items-center">
                            <svg
                              className="animate-spin h-7 w-7 text-purple-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              ></path>
                            </svg>
                          </div>
                        ) : p.status_pengajuan === "Selesai" ? (
                          <div className="flex justify-center items-center text-xs text-center bg-green-500 text-white px-2 py-1 rounded-2xl">
                            <IoCheckmarkDone className="text-lg" />
                            Selesai
                          </div>
                        ) : p.status_pengajuan === "Reject" ? (
                          <div className="flex justify-center items-center bg-red-500 text-white px-2 py-1 rounded-2xl">
                            <IoClose className="text-lg" />
                            Reject
                          </div>
                        ) : p.status_pengajuan === "Canceled" ? (
                          <div className="flex justify-center items-center text-xs text-center bg-pink-400 text-white px-2 py-1 rounded-2xl">
                            <TiCancel className="text-lg" />
                            {p.status_pengajuan}
                          </div>
                        ) : p.status_pengajuan === "Waiting For Dept Head" ? (
                          <div className="flex justify-center items-center bg-gray-300 text-xs text-center text-black px-2 py-1 rounded-2xl">
                            {p.status_pengajuan}
                          </div>
                        ) : (
                          <>{p.status_pengajuan}</>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {p.status_pengajuan === "Waiting For Dept Head" ? (
                        <span
                          className="text-pink-500 hover:text-pink-700 cursor-pointer"
                          onClick={() => handleOpenCancelModal(p)}
                        >
                          Cancel
                        </span>
                      ) : (
                        <></>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {loadMoreLoading && <p>Loading more data...</p>}
        {fetchError && (
          <p className="text-red-500">
            Error fetching data. Please try again later.
          </p>
        )}
        {!loadMoreLoading && hasMore && !fetchError && (
          <div ref={loadMoreRef} className="h-10 bg-transparent"></div>
        )}
      </div>
    </div>
  );
}
