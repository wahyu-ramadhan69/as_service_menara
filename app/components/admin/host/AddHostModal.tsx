"use client";

import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Host {
  id: number;
  nama: string;
  segment: string;
}

interface AddHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (host: Host) => void;
  host: Host | null;
}

const AddHostModal: React.FC<AddHostModalProps> = ({
  isOpen,
  onClose,
  onSave,
  host,
}) => {
  const [id, setId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [segment, setSegment] = useState("INTERNAL");

  useEffect(() => {
    if (host) {
      setId(host.id || null);
      setNama(host.nama || "");
      setSegment(host.segment || "INTERNAL");
    } else {
      setId(null);
      setNama("");
      setSegment("INTERNAL");
    }
  }, [host]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const method = id ? "PUT" : "POST";

      const response = await fetch(`/api/host`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nama, segment }),
      });

      const result = await response.json();
      if (response.ok) {
        onSave(result.data);
        setId(null);
        setNama("");
        setSegment("INTERNAL");
        onClose();
      } else {
        toast.error(`Error: ${result.error || response.statusText}`);
      }
    } catch (error) {
      console.error(`Error ${id ? "updating" : "creating"} host:`, error);
      toast.error("Error processing request");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <ToastContainer />
      <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full">
        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {host ? "Edit Host" : "Add Host"}
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
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="nama"
                >
                  Nama
                </label>
                <input
                  id="nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="segment"
                >
                  Segment
                </label>
                <select
                  id="segment"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="INTERNAL">Internal</option>
                  <option value="BACKEND">Backend</option>
                  <option value="FRONTEND">Frontend</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddHostModal;
