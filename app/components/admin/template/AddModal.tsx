"use client";

import React, { useState, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Template) => void;
  template?: Template | null;
}

interface Template {
  id: number;
  nama_template: string;
  type_os: string;
  vmid: number;
  nodes: string;
  keterangan: string;
}

interface ProxmoxTemplate {
  name: string;
  vmid: number;
  node: string;
}

const AddModal: React.FC<AddModalProps> = ({
  isOpen,
  onClose,
  onSave,
  template,
}) => {
  const [namaTemplate, setNamaTemplate] = useState("");
  const [typeOs, setTypeOs] = useState("");
  const [vmid, setVmid] = useState<number | string>("");
  const [nodes, setNodes] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [proxmoxTemplates, setProxmoxTemplates] = useState<ProxmoxTemplate[]>(
    []
  );

  useEffect(() => {
    if (template) {
      setNamaTemplate(template.nama_template);
      setTypeOs(template.type_os);
      setVmid(template.vmid);
      setNodes(template.nodes);
      setKeterangan(template.keterangan);
    } else {
      resetForm();
    }
  }, [template]);

  useEffect(() => {
    // Fetch Proxmox templates data
    const fetchProxmoxTemplates = async () => {
      try {
        const res = await fetch("/api/proxmox/templates");
        if (!res.ok) {
          throw new Error("Failed to fetch templates");
        }
        const data = await res.json();
        setProxmoxTemplates(data.data); // Assuming the data is under "data" field
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast.error("Failed to load VM templates");
      }
    };

    fetchProxmoxTemplates();
  }, []);

  const resetForm = () => {
    setNamaTemplate("");
    setTypeOs("");
    setVmid("");
    setNodes("");
    setKeterangan("");
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleVmidChange = (vmidValue: string) => {
    const selectedTemplate = proxmoxTemplates.find(
      (template) => template.vmid === Number(vmidValue)
    );
    if (selectedTemplate) {
      setNodes(selectedTemplate.node);
    }
    setVmid(vmidValue);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!namaTemplate || !typeOs || !vmid || !nodes) {
      toast.error("Semua field harus diisi!");
      return;
    }

    try {
      const response = await fetch(
        `/api/template${template ? `/${template.id}` : ""}`,
        {
          method: template ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nama_template: namaTemplate,
            type_os: typeOs,
            vmid: Number(vmid),
            nodes,
            keterangan,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        resetForm();
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
                {template ? "Edit Template" : "Add Template"}
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
                    htmlFor="namaTemplate"
                  >
                    Nama Template
                  </label>
                  <input
                    id="namaTemplate"
                    type="text"
                    value={namaTemplate}
                    onChange={(e) => setNamaTemplate(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="typeOs"
                  >
                    Type OS
                  </label>
                  <select
                    id="typeOs"
                    value={typeOs}
                    onChange={(e) => setTypeOs(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Select OS</option>
                    <option value="Windows">Windows</option>
                    <option value="Ubuntu">Ubuntu</option>
                    <option value="CentOS">CentOS</option>
                    <option value="Oracle Linux">Oracle Linux</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="vmid"
                  >
                    VM ID
                  </label>
                  <select
                    id="vmid"
                    value={vmid}
                    onChange={(e) => handleVmidChange(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Select VM ID</option>
                    {proxmoxTemplates.map((template) => (
                      <option key={template.vmid} value={template.vmid}>
                        {template.name} - VMID: {template.vmid}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="nodes"
                  >
                    Nodes
                  </label>
                  <input
                    id="nodes"
                    type="text"
                    value={nodes}
                    onChange={(e) => setNodes(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                    disabled
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="keterangan"
                  >
                    Keterangan
                  </label>
                  <textarea
                    id="keterangan"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows={4} // Anda bisa mengatur tinggi area teks dengan rows
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

export default AddModal;
