"use client";

import "react-toastify/dist/ReactToastify.css";
import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { MdClose } from "react-icons/md";

// Interface Definitions
interface AddBucketPengajuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (BucketPengajuan: BucketPengajuan) => void;
  bucketPengajuan?: BucketPengajuan | null;
}

interface BucketPengajuan {
  id: number;
  id_template: number;
  type_os: string;
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

const AddBucketPengajuanModal: React.FC<AddBucketPengajuanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  bucketPengajuan,
}) => {
  const [formData, setFormData] = useState({
    id_template: 0,
    type_os: "",
    cpu: 0,
    ram: 0,
    storage: 0,
    segment: "internal",
    nama_aplikasi: "",
    tujuan_pengajuan: "",
    jenis_pengajuan: "New",
    vmid: 0,
    cpu_sekarang: 0,
    ram_sekarang: 0,
    tanggal_pengajuan: "",
    storage_sekarang: 0,
    username: "",
    nama_baru: "",
    vmid_old: 0,
  });

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long", // Correct type for weekday
      year: "numeric",
      month: "long", // Correct type for month
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("id-ID", options);
  };

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingReject, setLoadingReject] = useState(false);

  useEffect(() => {
    if (bucketPengajuan) {
      setFormData({
        id_template: bucketPengajuan.template.id,
        type_os: bucketPengajuan.template.type_os,
        cpu: bucketPengajuan.cpu,
        ram: bucketPengajuan.ram,
        storage: bucketPengajuan.storage,
        segment: bucketPengajuan.segment,
        nama_aplikasi: bucketPengajuan.nama_aplikasi,
        tujuan_pengajuan: bucketPengajuan.tujuan_pengajuan,
        jenis_pengajuan: bucketPengajuan.jenis_pengajuan,
        vmid: bucketPengajuan.vmid,
        cpu_sekarang: bucketPengajuan.cpu,
        ram_sekarang: bucketPengajuan.ram,
        storage_sekarang: bucketPengajuan.storage,
        username: bucketPengajuan.user,
        nama_baru: bucketPengajuan.nama_baru,
        vmid_old: bucketPengajuan.vmid_old,
        tanggal_pengajuan: bucketPengajuan.tanggal_pengajuan,
      });
    } else {
      setFormData({
        id_template: 0,
        type_os: "",
        cpu: 0,
        ram: 0,
        storage: 0,
        segment: "internal",
        nama_aplikasi: "",
        tujuan_pengajuan: "",
        jenis_pengajuan: "New",
        vmid: 0,
        cpu_sekarang: 0,
        ram_sekarang: 0,
        storage_sekarang: 0,
        username: "",
        nama_baru: "",
        vmid_old: 0,
        tanggal_pengajuan: "",
      });
    }
  }, [bucketPengajuan]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingSubmit(true);
    try {
      const response = await fetch(
        `/api/pengajuan/aproval/${bucketPengajuan?.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      if (response.ok) {
        onSave(result.data);
        setFormData({
          id_template: 0,
          type_os: "",
          cpu: 0,
          ram: 0,
          storage: 0,
          segment: "internal",
          nama_aplikasi: "",
          tujuan_pengajuan: "",
          jenis_pengajuan: "New",
          vmid: 0,
          cpu_sekarang: 0,
          ram_sekarang: 0,
          storage_sekarang: 0,
          username: "",
          nama_baru: "",
          vmid_old: 0,
          tanggal_pengajuan: "",
        });

        toast.success(result.message || "Pengajuan berhasil dibuat");
        onClose();
      } else {
        toast.error(`${result.error || response.statusText}`);
        console.log("error", result.error);
      }
    } catch (error) {
      const errorMessage =
        (error as Error).message || "An unexpected error occurred";
      toast.error(`An unexpected error occurred: ${errorMessage}`);
    }
    setLoadingSubmit(false);
  };

  const handleReject = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingReject(true);
    try {
      const response = await fetch(
        `/api/pengajuan/reject/${bucketPengajuan?.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      const result = await response.json();
      if (response.ok) {
        onSave(result.data);
        onClose();
        setFormData({
          id_template: 0,
          type_os: "",
          cpu: 0,
          ram: 0,
          storage: 0,
          segment: "internal",
          nama_aplikasi: "",
          tujuan_pengajuan: "",
          jenis_pengajuan: "New",
          vmid: 0,
          cpu_sekarang: 0,
          ram_sekarang: 0,
          storage_sekarang: 0,
          username: "",
          nama_baru: "",
          vmid_old: 0,
          tanggal_pengajuan: "",
        });
        toast.success(result.message || "Reject server berhasil dilakukan");
      } else {
        console.error("Failed to update bucketPengajuan");
      }
    } catch (error) {
      console.error("Error updating bucketPengajuan:", error);
    }
    setLoadingReject(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative">
            <div className="flex justify-between items-center">
              <h3 className="text-xl leading-6 font-medium text-gray-800">
                View Bucket Pengajuan
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <MdClose />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div>
                <h1 className="text-base font-semibold text-gray-700">
                  Type OS:
                </h1>
                <span className="text-sm text-gray-600">
                  {formData.type_os}
                </span>

                <h1 className="mt-4 text-base font-semibold text-gray-700">
                  CPU (Cores):
                </h1>
                <span className="text-sm text-gray-600">
                  {formData.cpu} Cores
                </span>

                <h1 className="mt-4 text-base font-semibold text-gray-700">
                  RAM (GB):
                </h1>
                <span className="text-sm text-gray-600">{formData.ram} GB</span>

                <h1 className="mt-4 text-base font-semibold text-gray-700">
                  Storage (GB):
                </h1>
                <span className="text-sm text-gray-600">
                  {formData.storage} GB
                </span>

                <h1 className="mt-4 text-base font-semibold text-gray-700">
                  User:
                </h1>
                <span className="text-sm text-gray-600">
                  {formData.username}
                </span>
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-700">
                  Segment:
                </h1>
                <span className="text-sm text-gray-600">
                  {formData.segment}
                </span>

                <h1 className="mt-4 text-base font-semibold text-gray-700">
                  Nama Server:
                </h1>
                <span className="text-sm text-gray-600">
                  {formData.jenis_pengajuan === "Existing"
                    ? `${formData.nama_baru}`
                    : `${formData.nama_aplikasi}`}
                </span>

                <h1 className="mt-4 text-base font-semibold text-gray-700">
                  Tujuan Pengajuan:
                </h1>
                <span className="text-sm text-gray-600">
                  {formData.tujuan_pengajuan}
                </span>
                <h1 className="mt-4 text-base font-semibold text-gray-700">
                  Jenis Pengajuan:
                </h1>
                <span className="text-sm text-gray-600">
                  {formData.jenis_pengajuan}
                </span>
                <h1 className="mt-4 text-base font-semibold text-gray-700">
                  Tanggal Pengajuan:
                </h1>
                <span className="text-sm text-gray-600">
                  {formatTanggal(formData.tanggal_pengajuan)}
                </span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-start">
              <button
                onClick={handleSubmit}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline mr-2"
              >
                {loadingSubmit ? (
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
                  <>Approve</>
                )}
              </button>

              <button
                onClick={handleReject}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
              >
                {loadingReject ? (
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
                  <>Reject</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBucketPengajuanModal;
