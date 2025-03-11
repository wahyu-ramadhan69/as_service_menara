"use client";

import React, { useState, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";

interface AddDivisiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (divisi: Divisi) => void;
  divisi?: Divisi | null;
  storages: Storage[];
}

interface Divisi {
  id: number;
  nama: string;
  cpu: number;
  storage: number;
  ram: number;
  nama_storage: string;
  head: string;
}

interface Storage {
  storage: string;
}

const AddDivisiModal: React.FC<AddDivisiModalProps> = ({
  isOpen,
  onClose,
  onSave,
  divisi,
  storages,
}) => {
  const [nama, setNama] = useState("");
  const [cpu, setCpu] = useState("");
  const [storage, setStorage] = useState("");
  const [ram, setRam] = useState("");
  const [namaStorage, setNamaStorage] = useState("");
  const [head, setHead] = useState("");

  useEffect(() => {
    if (divisi) {
      setNama(divisi.nama);
      setCpu(divisi.cpu.toString());
      setStorage(divisi.storage.toString());
      setRam(divisi.ram.toString());
      setNamaStorage(divisi.nama_storage);
      setHead(divisi.head);
    } else {
      setNama("");
      setCpu("");
      setStorage("");
      setRam("");
      setNamaStorage("");
      setHead("");
    }
  }, [divisi]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validasi jika salah satu field kosong
    if (!nama || !cpu || !storage || !ram || !namaStorage) {
      toast.error("Semua field harus diisi!");
      return;
    }

    try {
      const response = await fetch(
        `/api/divisi${divisi ? `/${divisi.id}` : ""}`,
        {
          method: divisi ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nama,
            cpu: Number(cpu),
            storage: Number(storage),
            ram: Number(ram),
            nama_storage: namaStorage,
            head,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setNama("");
        setCpu("");
        setStorage("");
        setRam("");
        setNamaStorage("");
        setHead("");
        toast.success(result.message);

        onSave(result.data);
        onClose();
      } else {
        const errorResponse = await response.json();
        toast.error(`Failed: ${errorResponse.error}`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Error: ${errorMessage}`);
    }
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {divisi ? "Edit Divisi" : "Add Divisi"}
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
                    Nama Divisi
                  </label>
                  <input
                    id="nama"
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                    disabled={!!divisi}
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="cpu"
                  >
                    CPU
                  </label>
                  <input
                    id="cpu"
                    type="text"
                    value={cpu}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setCpu(value);
                      }
                    }}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="ram"
                  >
                    RAM
                  </label>
                  <input
                    id="ram"
                    type="text"
                    value={ram}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setRam(value);
                      }
                    }}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="storage"
                  >
                    Storage
                  </label>
                  <input
                    id="storage"
                    type="text"
                    value={storage}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setStorage(value);
                      }
                    }}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="namaStorage"
                  >
                    Storage Type
                  </label>
                  <select
                    id="namaStorage"
                    value={namaStorage}
                    onChange={(e) => setNamaStorage(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Select storage</option>
                    {storages.map((s) => (
                      <option key={s.storage} value={s.storage}>
                        {s.storage}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="storage"
                  >
                    Head
                  </label>
                  <input
                    id="head"
                    type="text"
                    value={head}
                    onChange={(e) => setHead(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
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

export default AddDivisiModal;
