import React, { useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci";
import { toast, ToastContainer } from "react-toastify";

interface Member {
  name: string;
  node: string;
  status: string;
  maxdisk: number;
  maxmem: number;
  maxcpu: number;
  vmid: number;
  image: string;
}

interface Divisi {
  id: number;
  nama: string;
}

interface Template {
  id: number;
  nama_template: string;
  type_os: string;
}

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseSubmit: () => void;
  data: Member | null;
}

const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onCloseSubmit,
  data,
}) => {
  const [formData, setFormData] = useState({
    vmid: data?.vmid || 0,
    segment: "",
    jenis_os: "",
    user: "",
    divisi: "",
  });

  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/template");
        const data = await response.json();
        setTemplates(data.data);
      } catch (error) {
        console.error("Error fetching template data:", error);
        toast.error("Error fetching template data");
      }
    };

    const fetchDivisi = async () => {
      try {
        const res = await fetch("/api/divisi");
        if (!res.ok) throw new Error("Failed to fetch Divisi data.");
        const data = await res.json();
        setDivisi(data.data.divisies);
      } catch (error) {
        console.error("Failed to fetch divisi:", error);
        toast.error("Failed to load Divisi options.");
      }
    };

    fetchTemplates();
    fetchDivisi();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (
      !formData.segment ||
      !formData.jenis_os ||
      !formData.user ||
      !formData.divisi
    ) {
      toast.error("Semua field harus diisi.");
      return;
    }

    const requestData = {
      vmid: formData.vmid,
      nama_server: data?.name,
      segment: formData.segment,
      id_template: parseInt(formData.jenis_os),
      user: formData.user,
      divisi: formData.divisi,
    };

    try {
      setLoading(true);
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Terjadi kesalahan.");
      }
      setLoading(false);
      toast.success("Server berhasil diregistrasi!");
      onCloseSubmit();
    } catch (error: any) {
      console.error("Gagal membuat server:", error);
      toast.error(error.message);
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
                Register VM
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
              <div className="mb-4">
                <label className="text-xs">ID VM</label>
                <input
                  disabled
                  type="text"
                  value={data?.vmid}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="mb-4">
                <label className="text-xs">Segment IP</label>
                <select
                  name="segment"
                  value={formData.segment}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Pilih Segment</option>
                  <option value="internal">Internal</option>
                  <option value="backend">Backend</option>
                  <option value="frontend">Frontend</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="text-xs">Jenis OS</label>
                <select
                  name="jenis_os"
                  value={formData.jenis_os}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Pilih OS</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.nama_template}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="text-xs">User</label>
                <input
                  type="text"
                  name="user"
                  value={formData.user}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="mb-4">
                <label className="text-xs">Divisi</label>
                <select
                  name="divisi"
                  value={formData.divisi}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Divisi</option>
                  {divisi.map((d) => (
                    <option key={d.id} value={d.nama}>
                      {d.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="bg-cyan-500 flex justify-center items-center hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {loading === true ? (
                  <svg
                    className="animate-spin h-5 w-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                ) : (
                  <CiEdit className="text-2xl text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default RegisterModal;
