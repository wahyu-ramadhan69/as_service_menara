"use client";

import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface IpInternal {
  id: number;
  ip: string;
  nama_server: string;
  status: string;
  type: string;
}

interface AddIpInternalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ipInternal: IpInternal) => void;
  ipInternal: IpInternal | null;
}

const AddIpInternalModal: React.FC<AddIpInternalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  ipInternal,
}) => {
  const [id, setId] = useState<number | null>(null); // Store ID for editing
  const [ip, setIp] = useState("");
  const [nama_server, setNamaServer] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [type, setType] = useState("INTERNAL");

  useEffect(() => {
    if (ipInternal) {
      console.log("Editing ipInternal with id: ", ipInternal.id);
      setId(ipInternal.id || null);
      setIp(ipInternal.ip || "");
      setNamaServer(ipInternal.nama_server || "");
      setStatus(ipInternal.status || "AVAILABLE");
      setType(ipInternal.type || "INTERNAL");
    } else {
      console.log("Adding new ipInternal");
      setId(null);
      setIp("");
      setNamaServer("");
      setStatus("AVAILABLE");
      setType("INTERNAL");
    }
  }, [ipInternal]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const method = id ? "PUT" : "POST";

      const response = await fetch(`/api/ip/${id ? id : ""}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ip, nama_server, status, type }),
      });

      const updatedIpInternal = await response.json();
      if (response.ok) {
        onSave(updatedIpInternal.data);
        setId(null);
        setIp("");
        setNamaServer("");
        setStatus("AVAILABLE");
        setType("INTERNAL");
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error(`Error ${id ? "updating" : "creating"} ipInternal:`, error);
      toast.error("Error processing request");
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
                {ipInternal ? "Edit IP Internal" : "Add IP Internal"}
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
                    htmlFor="ip"
                  >
                    Alamat IP
                  </label>
                  <input
                    id="ip"
                    type="text"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="nama_server"
                  >
                    Nama Server
                  </label>
                  <input
                    id="nama_server"
                    type="text"
                    value={nama_server}
                    onChange={(e) => setNamaServer(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="status"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="NOT_AVAILABLE">Not Available</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="type"
                  >
                    Type
                  </label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
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
    </div>
  );
};

export default AddIpInternalModal;
