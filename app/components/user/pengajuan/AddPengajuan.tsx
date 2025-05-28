"use client";

import React, { useEffect, useState } from "react";
import { GoSearch } from "react-icons/go";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface AddPengajuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pengajuan: Pengajuan) => void;
  pengajuan?: Pengajuan | null;
}

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

const AddPengajuanModal: React.FC<AddPengajuanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  pengajuan,
}) => {
  const [formData, setFormData] = useState({
    id_template: "",
    cpu: 2,
    ram: 2048,
    storage: "",
    segment: "internal",
    nama_aplikasi: "",
    tujuan_pengajuan: "",
    jenis_pengajuan: "New",
    vmid: 0,
    nama_baru: "",
    node: "",
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSearch = async () => {
    setLoadingSearch(true);
    setError("");
    try {
      const proxmoxResponse = await fetch(`/api/proxmox/vmid/${searchQuery}`);

      if (!proxmoxResponse.ok) {
        const errorData = await proxmoxResponse.json();
        toast.error(errorData.error || "Error fetching server data");
        setLoadingSearch(false);
        throw new Error(errorData.error || "Error fetching Proxmox data");
      }

      const serverResponse = await fetch(
        `/api/pengajuan/server/${searchQuery}`
      );

      if (!serverResponse.ok) {
        const errorData = await serverResponse.json();
        toast.error(errorData.error || "Error fetching server data");
        setLoadingSearch(false);
        throw new Error(errorData.error || "Error fetching server data");
      }

      const dataProxmox = await proxmoxResponse.json();

      const dataServer = await serverResponse.json();

      setFormData((prevData) => ({
        ...prevData,
        nama_aplikasi: dataProxmox.data.vmStatus.name,
        vmid: Number(dataProxmox.data.vmStatus.vmid),
        ram: Math.round(dataProxmox.data.vmStatus.maxmem / (1024 * 1024)),
        cpu: Number(dataProxmox.data.vmStatus.cpus),
        storage: Math.floor(
          dataProxmox.data.vmStatus.maxdisk / (1024 * 1024 * 1024)
        ).toString(),
        segment: dataServer.data.segment,
        node: dataProxmox.data.targetNode,
        id_template: dataServer.data.id_template,
      }));

      setLoadingSearch(false);
    } catch (error) {
      setError((error as Error).message);
      setLoadingSearch(false);
    }
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/template");
        const data = await response.json();

        setTemplates(data.data); // Store the fetched template data
      } catch (error) {
        console.error("Error fetching template data:", error);
        toast.error("Error fetching template data");
      }
    };

    fetchTemplates();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "nama_aplikasi") {
      const regex = /^[a-zA-Z0-9-]*$/;
      if (!regex.test(value)) {
        setFieldErrors((prevErrors) => ({
          ...prevErrors,
          [name]: "Nama server hanya boleh berisi huruf, angka, dan karakter -",
        }));
        return;
      } else {
        setFieldErrors((prevErrors) => {
          const updatedErrors = { ...prevErrors };
          delete updatedErrors[name];
          return updatedErrors;
        });
      }
    }

    const updatedValue =
      name === "cpu" || name === "ram" || name === "id_template"
        ? Number(value)
        : name === "storage" && value === ""
        ? ""
        : name === "storage"
        ? Number(value)
        : value;

    setFormData({
      ...formData,
      [name]: updatedValue,
    });
  };

  const handleClose = () => {
    setFormData({
      id_template: "",
      cpu: 2,
      ram: 2048,
      storage: "",
      segment: "internal",
      nama_aplikasi: "",
      tujuan_pengajuan: "",
      jenis_pengajuan: "New",
      vmid: 0,
      nama_baru: "",
      node: "",
    });
    onClose();
  };

  const handleJenisPengajuanChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const jenisPengajuan = event.target.value;

    setFormData({
      id_template: "",
      cpu: 2,
      ram: 2048,
      storage: "",
      segment: "internal",
      nama_aplikasi: "",
      tujuan_pengajuan: "",
      jenis_pengajuan: jenisPengajuan,
      vmid: 40,
      nama_baru: "",
      node: "",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formData.jenis_pengajuan === "New" && !formData.id_template) {
      toast.error("Pilih Type OS");
      return;
    }

    try {
      const response = await fetch(`/api/pengajuan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          storage: Number(formData.storage),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSave(result.data);
        setFormData({
          id_template: "",
          cpu: 2,
          ram: 2048,
          storage: "",
          segment: "internal",
          nama_aplikasi: "",
          tujuan_pengajuan: "",
          jenis_pengajuan: "New",
          vmid: 0,
          nama_baru: "",
          node: "",
        });
        toast.success(result.message || "Pengajuan berhasil dibuat");
        onClose();
      } else {
        toast.error(result.error || "Error pengajuan");
      }
    } catch (error) {
      const errorMessage =
        (error as Error).message || "An unexpected error occurred";
      toast.error(`An unexpected error occurred: ${errorMessage}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <ToastContainer />
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {pengajuan ? "Edit Pengajuan" : "Add Pengajuan"}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-2 px-1">
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="jenis_pengajuan"
                >
                  Jenis Pengajuan
                </label>
                <select
                  id="jenis_pengajuan"
                  name="jenis_pengajuan"
                  value={formData.jenis_pengajuan}
                  onChange={handleJenisPengajuanChange}
                  className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="New">New</option>
                  <option value="Existing">Existing</option>
                  <option value="Perubahan">Changes</option>
                  <option value="Delete">Delete</option>
                </select>
              </div>

              {formData.jenis_pengajuan === "New" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="type_os"
                      >
                        Type OS
                      </label>
                      <select
                        id="id_template"
                        name="id_template"
                        value={formData.id_template}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        {/* <option value="">Type OS</option> */}
                        <option value="">Pilih OS</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.nama_template}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* CPU */}
                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="cpu"
                      >
                        CPU (Cores)
                      </label>
                      <select
                        id="cpu"
                        name="cpu"
                        value={formData.cpu}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value={2}>2 Cores</option>
                        <option value={4}>4 Cores</option>
                        <option value={6}>6 Cores</option>
                        <option value={8}>8 Cores</option>
                        <option value={10}>10 Cores</option>
                        <option value={12}>12 Cores</option>
                        <option value={16}>16 Cores</option>
                        <option value={24}>24 Cores</option>
                        <option value={32}>32 Cores</option>
                        <option value={64}>64 Cores</option>
                      </select>
                    </div>

                    {/* RAM */}
                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="ram"
                      >
                        RAM (GB)
                      </label>
                      <select
                        id="ram"
                        name="ram"
                        value={formData.ram}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value={2048}>2 GB</option>
                        <option value={4096}>4 GB</option>
                        <option value={6144}>6 GB</option>
                        <option value={8192}>8 GB</option>
                        <option value={10240}>10 GB</option>
                        <option value={12288}>12 GB</option>
                        <option value={16384}>16 GB</option>
                        <option value={24576}>24 GB</option>
                        <option value={32768}>32 GB</option>
                        <option value={65536}>64 GB</option>
                        <option value={131072}>128 GB</option>
                      </select>
                    </div>

                    {/* Storage */}
                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="storage"
                      >
                        Storage (GB)
                      </label>
                      <input
                        id="storage"
                        name="storage"
                        type="text"
                        value={formData.storage}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            handleChange(e);
                          }
                        }}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>

                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="segment"
                      >
                        Segment
                      </label>
                      <select
                        id="segment"
                        name="segment"
                        value={formData.segment}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value="internal">Internal</option>
                        <option value="backend">Backend</option>
                        <option value="frontend">Frontend</option>
                      </select>
                    </div>

                    {/* Nama Server */}
                    <div className="mb-4">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="nama_aplikasi"
                      >
                        Nama Server
                      </label>
                      <input
                        id="nama_aplikasi"
                        name="nama_aplikasi"
                        type="text"
                        value={formData.nama_aplikasi}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                      {fieldErrors.nama_aplikasi && (
                        <p className="text-red-500 text-xs italic mt-2">
                          {fieldErrors.nama_aplikasi}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="tujuan_pengajuan"
                    >
                      Tujuan Pengajuan
                    </label>
                    <textarea
                      id="tujuan_pengajuan"
                      name="tujuan_pengajuan"
                      value={formData.tujuan_pengajuan}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                      rows={4}
                    />
                  </div>
                </>
              ) : formData.jenis_pengajuan === "Existing" ? (
                <>
                  <div className="flex justify-center items-center mb-4">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Masukkan VMID..."
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center p-4 bg-gray-300 rounded-r-full">
                        <button
                          onClick={handleSearch}
                          className="text-gray-400 focus:outline-none"
                        >
                          {loadingSearch ? (
                            <svg
                              className="animate-spin border-indigo-300"
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 40 40"
                              fill="none"
                            >
                              <g id="Group 1000003698">
                                <circle
                                  id="Ellipse 713"
                                  cx="19.9997"
                                  cy="19.9277"
                                  r="15"
                                  stroke="#E5E7EB"
                                  strokeWidth="2"
                                />
                                <path
                                  id="Ellipse 714"
                                  d="M26.3311 33.528C29.9376 31.8488 32.7294 28.8058 34.0923 25.0683C35.4552 21.3308 35.2775 17.2049 33.5984 13.5984C31.9193 9.99189 28.8762 7.20011 25.1387 5.83723C21.4012 4.47434 17.2754 4.652 13.6689 6.33112"
                                  stroke="url(#paint0_linear_13416_7408)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </g>
                              <defs>
                                <linearGradient
                                  id="paint0_linear_13416_7408"
                                  x1="0.0704424"
                                  y1="12.6622"
                                  x2="12.7327"
                                  y2="39.8591"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop stopColor="#4F46E5" />
                                  <stop offset="1" stopColor="#8B5CF6" />
                                </linearGradient>
                              </defs>
                            </svg>
                          ) : (
                            <GoSearch className="text-lg text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Nama Server */}
                    <div className="mb-4">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="nama_aplikasi"
                      >
                        Nama Server
                      </label>
                      <input
                        id="nama_aplikasi"
                        name="nama_aplikasi"
                        type="text"
                        value={formData.nama_aplikasi}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        readOnly
                        required
                      />
                      {fieldErrors.nama_aplikasi && (
                        <p className="text-red-500 text-xs italic mt-2">
                          {fieldErrors.nama_aplikasi}
                        </p>
                      )}
                    </div>

                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="cpu"
                      >
                        CPU (Cores)
                      </label>
                      <select
                        id="cpu"
                        name="cpu"
                        value={formData.cpu}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                        disabled
                      >
                        <option value={2}>2 Cores</option>
                        <option value={4}>4 Cores</option>
                        <option value={6}>6 Cores</option>
                        <option value={8}>8 Cores</option>
                        <option value={10}>10 Cores</option>
                        <option value={12}>12 Cores</option>
                        <option value={16}>16 Cores</option>
                        <option value={32}>32 Cores</option>
                        <option value={64}>64 Cores</option>
                      </select>
                    </div>

                    {/* RAM */}
                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="ram"
                      >
                        RAM (GB)
                      </label>
                      <select
                        id="ram"
                        name="ram"
                        value={formData.ram}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        disabled
                        aria-readonly
                      >
                        <option value={2048}>2 GB</option>
                        <option value={4096}>4 GB</option>
                        <option value={8192}>8 GB</option>
                        <option value={16384}>16 GB</option>
                        <option value={24576}>24 GB</option>
                        <option value={32768}>32 GB</option>
                      </select>
                    </div>

                    {/* Storage */}
                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="storage"
                      >
                        Storage (GB)
                      </label>
                      <input
                        id="storage"
                        name="storage"
                        type="text"
                        value={formData.storage}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            handleChange(e);
                          }
                        }}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>

                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="segment"
                      >
                        Segment
                      </label>
                      <select
                        id="segment"
                        name="segment"
                        value={formData.segment}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value="internal">Internal</option>
                        <option value="backend">Backend</option>
                        <option value="frontend">Frontend</option>
                      </select>
                    </div>

                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="nama_aplikasi"
                      >
                        Nama Server Baru
                      </label>
                      <input
                        id="nama_baru"
                        name="nama_baru"
                        type="text"
                        value={formData.nama_baru}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                      {fieldErrors.nama_aplikasi && (
                        <p className="text-red-500 text-xs italic mt-2">
                          {fieldErrors.nama_aplikasi}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="tujuan_pengajuan"
                    >
                      Tujuan Pengajuan
                    </label>
                    <textarea
                      id="tujuan_pengajuan"
                      name="tujuan_pengajuan"
                      value={formData.tujuan_pengajuan}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                      rows={4}
                    />
                  </div>
                </>
              ) : formData.jenis_pengajuan === "Perubahan" ? (
                <>
                  <div className="flex justify-center items-center mb-4">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Masukkan VMID..."
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center p-4 bg-gray-300 rounded-r-full">
                        <button
                          onClick={handleSearch}
                          className="text-gray-400 focus:outline-none "
                        >
                          {loadingSearch ? (
                            <svg
                              className="animate-spin border-indigo-300"
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 40 40"
                              fill="none"
                            >
                              <g id="Group 1000003698">
                                <circle
                                  id="Ellipse 713"
                                  cx="19.9997"
                                  cy="19.9277"
                                  r="15"
                                  stroke="#E5E7EB"
                                  strokeWidth="2"
                                />
                                <path
                                  id="Ellipse 714"
                                  d="M26.3311 33.528C29.9376 31.8488 32.7294 28.8058 34.0923 25.0683C35.4552 21.3308 35.2775 17.2049 33.5984 13.5984C31.9193 9.99189 28.8762 7.20011 25.1387 5.83723C21.4012 4.47434 17.2754 4.652 13.6689 6.33112"
                                  stroke="url(#paint0_linear_13416_7408)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </g>
                              <defs>
                                <linearGradient
                                  id="paint0_linear_13416_7408"
                                  x1="0.0704424"
                                  y1="12.6622"
                                  x2="12.7327"
                                  y2="39.8591"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop stopColor="#4F46E5" />
                                  <stop offset="1" stopColor="#8B5CF6" />
                                </linearGradient>
                              </defs>
                            </svg>
                          ) : (
                            <GoSearch className="text-lg text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Nama Server */}
                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="nama_aplikasi"
                      >
                        Nama Server
                      </label>
                      <input
                        id="nama_aplikasi"
                        name="nama_aplikasi"
                        type="text"
                        value={formData.nama_aplikasi}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                        readOnly
                      />
                      {fieldErrors.nama_aplikasi && (
                        <p className="text-red-500 text-xs italic mt-2">
                          {fieldErrors.nama_aplikasi}
                        </p>
                      )}
                    </div>

                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="cpu"
                      >
                        CPU (Cores)
                      </label>
                      <select
                        id="cpu"
                        name="cpu"
                        value={formData.cpu}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value={2}>2 Cores</option>
                        <option value={4}>4 Cores</option>
                        <option value={6}>6 Cores</option>
                        <option value={8}>8 Cores</option>
                        <option value={10}>10 Cores</option>
                        <option value={12}>12 Cores</option>
                        <option value={16}>16 Cores</option>
                        <option value={32}>32 Cores</option>
                        <option value={64}>64 Cores</option>
                      </select>
                    </div>

                    {/* RAM */}
                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="ram"
                      >
                        RAM (GB)
                      </label>
                      <select
                        id="ram"
                        name="ram"
                        value={formData.ram}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value={2048}>2 GB</option>
                        <option value={4096}>4 GB</option>
                        <option value={8192}>8 GB</option>
                        <option value={16384}>16 GB</option>
                        <option value={24576}>24 GB</option>
                        <option value={32768}>32 GB</option>
                      </select>
                    </div>

                    {/* Storage */}
                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="storage"
                      >
                        Storage (GB)
                      </label>
                      <input
                        id="storage"
                        name="storage"
                        type="text"
                        value={formData.storage}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            handleChange(e);
                          }
                        }}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="tujuan_pengajuan"
                    >
                      Tujuan Pengajuan
                    </label>
                    <textarea
                      id="tujuan_pengajuan"
                      name="tujuan_pengajuan"
                      value={formData.tujuan_pengajuan}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center items-center mb-4">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Masukkan VMID..."
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center p-4 bg-gray-300 rounded-r-full">
                        <button
                          onClick={handleSearch}
                          className="text-gray-400 focus:outline-none"
                        >
                          {loadingSearch ? (
                            <svg
                              className="animate-spin border-indigo-300"
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 40 40"
                              fill="none"
                            >
                              <g id="Group 1000003698">
                                <circle
                                  id="Ellipse 713"
                                  cx="19.9997"
                                  cy="19.9277"
                                  r="15"
                                  stroke="#E5E7EB"
                                  strokeWidth="2"
                                />
                                <path
                                  id="Ellipse 714"
                                  d="M26.3311 33.528C29.9376 31.8488 32.7294 28.8058 34.0923 25.0683C35.4552 21.3308 35.2775 17.2049 33.5984 13.5984C31.9193 9.99189 28.8762 7.20011 25.1387 5.83723C21.4012 4.47434 17.2754 4.652 13.6689 6.33112"
                                  stroke="url(#paint0_linear_13416_7408)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </g>
                              <defs>
                                <linearGradient
                                  id="paint0_linear_13416_7408"
                                  x1="0.0704424"
                                  y1="12.6622"
                                  x2="12.7327"
                                  y2="39.8591"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop stopColor="#4F46E5" />
                                  <stop offset="1" stopColor="#8B5CF6" />
                                </linearGradient>
                              </defs>
                            </svg>
                          ) : (
                            <GoSearch className="text-lg text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Nama Server */}
                    <div className="mb-4">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="nama_aplikasi"
                      >
                        Nama Server
                      </label>
                      <input
                        id="nama_aplikasi"
                        name="nama_aplikasi"
                        type="text"
                        value={formData.nama_aplikasi}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                        readOnly
                      />
                      {fieldErrors.nama_aplikasi && (
                        <p className="text-red-500 text-xs italic mt-2">
                          {fieldErrors.nama_aplikasi}
                        </p>
                      )}
                    </div>

                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="cpu"
                      >
                        CPU (Cores)
                      </label>
                      <select
                        id="cpu"
                        name="cpu"
                        value={formData.cpu}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value={2}>2 Cores</option>
                        <option value={4}>4 Cores</option>
                        <option value={6}>6 Cores</option>
                        <option value={8}>8 Cores</option>
                        <option value={10}>10 Cores</option>
                        <option value={12}>12 Cores</option>
                        <option value={16}>16 Cores</option>
                        <option value={32}>32 Cores</option>
                        <option value={64}>64 Cores</option>
                      </select>
                    </div>

                    {/* RAM */}
                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="ram"
                      >
                        RAM (GB)
                      </label>
                      <select
                        id="ram"
                        name="ram"
                        value={formData.ram}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value={2048}>2 GB</option>
                        <option value={4096}>4 GB</option>
                        <option value={8192}>8 GB</option>
                        <option value={16384}>16 GB</option>
                        <option value={24576}>24 GB</option>
                        <option value={32768}>32 GB</option>
                      </select>
                    </div>

                    {/* Storage */}
                    <div className="mb-2">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="storage"
                      >
                        Storage (GB)
                      </label>
                      <input
                        id="storage"
                        name="storage"
                        type="text"
                        value={formData.storage}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            handleChange(e);
                          }
                        }}
                        className="shadow appearance-none border rounded-full w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="tujuan_pengajuan"
                    >
                      Tujuan Pengajuan
                    </label>
                    <textarea
                      id="tujuan_pengajuan"
                      name="tujuan_pengajuan"
                      value={formData.tujuan_pengajuan}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                      rows={4} // Adjust the number of rows to control the height of the textarea
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPengajuanModal;
