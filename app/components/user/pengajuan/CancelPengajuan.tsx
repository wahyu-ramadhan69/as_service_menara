"use client";

import React from "react";

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

interface CancelPengajuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Pengajuan | null;
  onSave: (Pengajuan: Pengajuan) => void;
}

const CancelPengajuanModal: React.FC<CancelPengajuanModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
}) => {
  if (!isOpen) return null;

  const handleCancel = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(`/api/pengajuan/cancel/${data?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (response.ok) {
        onSave(result.data);
        onClose();
      } else {
        console.log("error", result.error);
      }
    } catch (error) {
      const errorMessage =
        (error as Error).message || "An unexpected error occurred";
    }
  };

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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Confirm Delete
              </h3>
              <button
                onClick={onClose}
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
              <p>Are you sure you want to delete this pengajuan?</p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                >
                  Close
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelPengajuanModal;
