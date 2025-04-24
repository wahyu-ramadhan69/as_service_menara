"use client";

import React, { useState, useEffect } from "react";
import AddDivisiModal from "./AddDivisiModal";
import DeleteDivisiModal from "./DeleteDivisiModal";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";
import Title from "../../Title";
import { GoPlus } from "react-icons/go";

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

const DivisiUi: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentDivisi, setCurrentDivisi] = useState<Divisi | null>(null);
  const [divisies, setDivisies] = useState<Divisi[]>([]);
  const [storage, setStorage] = useState<Storage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDivisies = async () => {
    try {
      const res = await fetch("/api/divisi");

      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await res.json();
      setDivisies(data.data.divisies);
      setStorage(data.data.storage);
    } catch (error) {
      console.error("Failed to fetch divisies:", error);
      setDivisies([]);
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
        toast.success("Divisi deleted successfully");
      } else {
        const errorData = await response.json(); // Get error message from server response
        toast.error(`${errorData.data || "Unknown error"}`);
        setIsDeleteModalOpen(false);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`${errorMessage}`);
      setIsDeleteModalOpen(false);
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
    <div className="flex h-full w-full flex-col gap-3 px-[2%] transition-all duration-500 ease-in-out md:px-[5%] 1g:px-[10%]">
      <ToastContainer />
      <div className="flex-1 rounded-md bg-white p-4">
        <div className="flex items-center justify-between">
          <Title>List Divisies</Title>
        </div>
        <div className="flex justify-end items-center mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            <GoPlus className="md:hidden text-lg" /> {/* Icon for mobile */}
            <span className="hidden md:inline ml-2">Add Divisi</span>
          </button>
        </div>
        <AddDivisiModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleAddDivisi}
          divisi={currentDivisi}
          storages={storage}
        />
        <DeleteDivisiModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteDivisi}
        />
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Quota CPU
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Quota RAM
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Quota Storage
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Nama Storage
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Head
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
                    {d.cpu} <span className="text-xs text-gray-700">core</span>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.ram} <span className="text-xs text-gray-700">GB</span>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.storage}{" "}
                    <span className="text-xs text-gray-700">GB</span>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.nama_storage}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.head}
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
};

export default DivisiUi;
