"use client";

import React, { useState, useEffect } from "react";

interface AddDivisiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (divisi: Divisi) => void;
  divisi?: Divisi | null;
}

interface Divisi {
  id: number;
  nama: string;
  cpu: number;
  storage: number;
  ram: number;
}

const AddDivisiModal: React.FC<AddDivisiModalProps> = ({
  isOpen,
  onClose,
  onSave,
  divisi,
}) => {
  const [nama, setNama] = useState("");
  const [cpu, setCpu] = useState(0);
  const [storage, setStorage] = useState(0);
  const [ram, setRam] = useState(0);

  useEffect(() => {
    if (divisi) {
      setNama(divisi.nama);
      setCpu(divisi.cpu);
      setStorage(divisi.storage);
      setRam(divisi.ram);
    } else {
      setNama("");
      setCpu(0);
      setStorage(0);
      setRam(0);
    }
  }, [divisi]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(
        `/api/divisi${divisi ? `/${divisi.id}` : ""}`,
        {
          method: divisi ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nama, cpu, storage, ram }),
        }
      );

      if (response.ok) {
        const updatedDivisi = await response.json();
        onSave(updatedDivisi);
        setNama("");
        setCpu(0);
        setStorage(0);
        setRam(0);
        onClose();
      } else {
        console.error(`Failed to ${divisi ? "update" : "create"} divisi`);
      }
    } catch (error) {
      console.error(`Error ${divisi ? "updating" : "creating"} divisi:`, error);
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
                    type="number"
                    value={cpu}
                    onChange={(e) => setCpu(Number(e.target.value))}
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
                    type="number"
                    value={ram}
                    onChange={(e) => setRam(Number(e.target.value))}
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
                    type="number"
                    value={storage}
                    onChange={(e) => setStorage(Number(e.target.value))}
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

interface DeleteDivisiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteDivisiModal: React.FC<DeleteDivisiModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
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
              <p>Are you sure you want to delete this divisi?</p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DivisiUi() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentDivisi, setCurrentDivisi] = useState<Divisi | null>(null);
  const [divisies, setDivisies] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDivisies = async () => {
    try {
      const res = await fetch("/api/divisi");
      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await res.json();
      setDivisies(data);
    } catch (error) {
      console.error("Failed to fetch divisies:", error);
      setDivisies([]); // set an empty array or handle accordingly
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisies();
  }, []);

  const handleAddDivisi = (divisi: Divisi) => {
    const updatedDivisies = currentDivisi
      ? divisies.map((d) => (d.id === divisi.id ? divisi : d))
      : [...divisies, divisi];
    setDivisies(updatedDivisies);
    setCurrentDivisi(null);
  };

  const handleEditDivisi = (divisi: Divisi) => {
    setCurrentDivisi(divisi);
    setIsModalOpen(true);
  };

  const handleDeleteDivisi = async () => {
    if (!currentDivisi) return;
    try {
      const response = await fetch(`/api/divisi/${currentDivisi.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDivisies(divisies.filter((d) => d.id !== currentDivisi.id));
        setCurrentDivisi(null);
        setIsDeleteModalOpen(false);
      } else {
        console.error("Failed to delete divisi");
      }
    } catch (error) {
      console.error("Error deleting divisi:", error);
    }
  };

  const handleOpenDeleteModal = (divisi: Divisi) => {
    setCurrentDivisi(divisi);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentDivisi(null);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentDivisi(null);
  };

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Divisies</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Divisi
          </button>
        </div>
        <AddDivisiModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleAddDivisi}
          divisi={currentDivisi}
        />
        <DeleteDivisiModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteDivisi}
        />
        <p className="text-sm text-gray-600 mb-4">Teams</p>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  CPU
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  RAM
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Storage
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {divisies.map((d) => (
                <tr key={d.id}>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.nama}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.cpu}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.ram}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.storage}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    <span
                      className="text-blue-500 hover:text-blue-700 cursor-pointer mr-4"
                      onClick={() => handleEditDivisi(d)}
                    >
                      Edit
                    </span>
                    <span
                      className="text-pink-500 hover:text-pink-700 cursor-pointer"
                      onClick={() => handleOpenDeleteModal(d)}
                    >
                      Delete
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
