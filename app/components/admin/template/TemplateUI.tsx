"use client";

import React, { useState, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";
import Title from "../../Title";
import AddModal from "./AddModal";
import DeleteModal from "./DeleteModal";
import { GoPlus } from "react-icons/go";

interface Template {
  id: number;
  nama_template: string;
  type_os: string;
  vmid: number;
  nodes: string;
  keterangan: string;
}

const TemplateUi: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/template");

      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await res.json();
      console.log(data);
      setTemplates(data.data);
    } catch (error) {
      console.error("Failed to fetch divisies:", error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddTemplate = (template: Template) => {
    const updatedDivisies = currentTemplate
      ? templates.map((d) => (d.id === template.id ? template : d))
      : [...templates, template];
    setTemplates(updatedDivisies);
    setCurrentTemplate(null);
  };

  const handleEditTemplate = (template: Template) => {
    setCurrentTemplate(template);
    setIsModalOpen(true);
  };

  const handleDeleteTemplate = async () => {
    if (!currentTemplate) return;

    try {
      const response = await fetch(`/api/template/${currentTemplate.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTemplates(templates.filter((d) => d.id !== currentTemplate.id));
        setCurrentTemplate(null);
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

  const handleOpenDeleteModal = (template: Template) => {
    setCurrentTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTemplate(null);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentTemplate(null);
  };

  return (
    <div className="flex h-full w-full flex-col gap-3 px-[2%] transition-all duration-500 ease-in-out md:px-[5%] 1g:px-[10%]">
      <ToastContainer />
      <div className="flex-1 rounded-md bg-white p-4">
        <div className="flex items-center justify-between">
          <Title>List Templates</Title>
        </div>
        <div className="flex justify-end items-center mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            <GoPlus className="md:hidden text-lg" /> {/* Icon for mobile */}
            <span className="hidden md:inline ml-2">Add Templates</span>
          </button>
        </div>
        <AddModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleAddTemplate}
          template={currentTemplate}
        />
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteTemplate}
        />
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Nama Template
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Type OS
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  VM ID
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Nodes
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {templates.map((d) => (
                <tr key={d.id}>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.nama_template}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.type_os}{" "}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.vmid}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.nodes}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {d.keterangan}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    <span
                      className="text-blue-500 hover:text-blue-700 cursor-pointer mr-4"
                      onClick={() => handleEditTemplate(d)}
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

export default TemplateUi;
