"use client";
import React, { useState, useEffect, useRef } from "react";
import AddBucketPengajuanModal from "./AddBucketPengajuan";
import { Menu } from "@headlessui/react";
import Title from "../../Title";
import SearchComponent from "./SearchComponent";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";

interface BucketPengajuan {
  id: number;
  type_os: string;
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
  tanggal_pengajuan: string;
  nama_baru: string;
  vmid_old: number;
  user: string;
  template: Template;
}

interface User {
  username: string;
  email: string;
}

interface Template {
  id: number;
  type_os: string;
}

export default function BucketPengajuanUi() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBucketPengajuan, setCurrentBucketPengajuan] =
    useState<BucketPengajuan | null>(null);
  const [bucketPengajuan, setBucketPengajuan] = useState<BucketPengajuan[]>([]);
  const [filteredPengajuan, setFilteredPengajuan] = useState<BucketPengajuan[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchBucketPengajuan = async (
    page: number = 1,
    replaceData = false
  ) => {
    try {
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
        throw new Error("Network response was not ok");
      }

      const data = await res.json();

      if (data.pengajuan && data.pengajuan.length > 0) {
        setBucketPengajuan((prev) =>
          replaceData ? [...data.pengajuan] : [...prev, ...data.pengajuan]
        );
        setFilteredPengajuan((prev) =>
          replaceData ? [...data.pengajuan] : [...prev, ...data.pengajuan]
        );
        setHasMore(data.pengajuan.length > 0);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch bucketPengajuan:", error);
      setBucketPengajuan([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBucketPengajuan(1, true);
  }, []);

  useEffect(() => {
    let filtered = bucketPengajuan;

    if (filter) {
      filtered = filtered.filter((item) => item.jenis_pengajuan === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.nama_aplikasi?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPengajuan(filtered);
  }, [filter, searchTerm, bucketPengajuan]);

  useEffect(() => {
    if (loading || !hasMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) {
        setCurrentPage((prevPage) => prevPage + 1);
      }
    });

    if (loadMoreRef.current) observer.current.observe(loadMoreRef.current);
  }, [loading, hasMore]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchBucketPengajuan(currentPage);
    }
  }, [currentPage]);

  const handleAddBucketPengajuan = (newBucket: BucketPengajuan) => {
    if (!newBucket.id) {
      console.error("Error: ID is missing");
      toast.error(`Konfigurasi gagal dilakukan`);
      return;
    }
    if (
      newBucket.status_pengajuan === "Reject" ||
      newBucket.status_pengajuan === "Selesai"
    ) {
      const filteredBucket = bucketPengajuan.filter(
        (d) => d.id !== newBucket.id
      );
      setBucketPengajuan(filteredBucket);

      setCurrentBucketPengajuan(null);
    } else {
      const updateBucket = bucketPengajuan.map((d) =>
        d.id === newBucket.id ? newBucket : d
      );
      setBucketPengajuan(updateBucket);
      setCurrentBucketPengajuan(null);
    }
  };

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("id-ID", options);
  };

  const handleApproveBucketPengajuan = (bucketPengajuan: BucketPengajuan) => {
    setCurrentBucketPengajuan(bucketPengajuan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentBucketPengajuan(null);
  };

  return (
    <div className="flex h-full w-full flex-col gap-3 px-[2%] transition-all duration-500 ease-in-out md:px-[5%] 1g:px-[10%]">
      <ToastContainer />
      <div className="flex-1 rounded-md bg-white p-4">
        <div className="flex items-center justify-between ">
          <Title>List Pengajuan</Title>
        </div>

        <div className="flex space-x-4 justify-between items-center py-2">
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                Filter by Jenis
              </Menu.Button>
            </div>
            <Menu.Items className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
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
                      onClick={() => setFilter("New")}
                      className={`${
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      } block px-4 py-2 text-sm w-full text-left`}
                    >
                      New
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setFilter("Existing")}
                      className={`${
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      } block px-4 py-2 text-sm w-full text-left`}
                    >
                      Existing
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setFilter("Perubahan")}
                      className={`${
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      } block px-4 py-2 text-sm w-full text-left`}
                    >
                      Perubahan
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setFilter("Delete")}
                      className={`${
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      } block px-4 py-2 text-sm w-full text-left`}
                    >
                      Delete
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>

          <div className=" flex justify-center items-center">
            <SearchComponent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>
        </div>

        <AddBucketPengajuanModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleAddBucketPengajuan}
          bucketPengajuan={currentBucketPengajuan}
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-gray-200 animate-pulse p-4 rounded-lg"
              >
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
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
                    Segment
                  </th>

                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    Nama Aplikasi
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
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
              <tbody className="bg-white">
                {filteredPengajuan.map((p) => (
                  <tr key={p.id}>
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
                      {p.segment}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {p.jenis_pengajuan === "Existing"
                        ? `${p.nama_baru}`
                        : `${p.nama_aplikasi}`}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {formatTanggal(p.tanggal_pengajuan)}
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
                      ) : p.status_pengajuan === "Waiting For Dept Head" ? (
                        <div className="flex justify-center items-center bg-gray-300 text-xs text-center text-black px-2 py-1 rounded-2xl">
                          {p.status_pengajuan}
                        </div>
                      ) : (
                        <>{p.status_pengajuan}</>
                      )}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-sm">
                      {p.status_pengajuan === "Waiting For Dept Head" ? (
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => handleApproveBucketPengajuan(p)}
                        >
                          Approve
                        </button>
                      ) : (
                        <></>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && hasMore && (
          <div ref={loadMoreRef} className="h-10 bg-transparent"></div>
        )}
      </div>
    </div>
  );
}
