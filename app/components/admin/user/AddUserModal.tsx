"use client";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";
import React, { useState, useEffect } from "react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  user?: User | null;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  jenis: string;
  divisi: Divisi | null;
}

interface Divisi {
  id: number;
  nama: string;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
}) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "USER",
    email: "",
    jenis: "Ldap",
    id_divisi: 0,
  });

  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: "",
        role: user.role,
        email: user.email,
        jenis: user.jenis,
        id_divisi: user.divisi ? user.divisi.id : 0,
      });
    } else {
      setFormData({
        username: "",
        password: "",
        role: "USER",
        email: "",
        jenis: "Ldap",
        id_divisi: 0,
      });
    }

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

    fetchDivisi();
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "id_divisi" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/users${user ? `/${user.id}` : ""}`, {
        method: user ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          username: "",
          password: "",
          role: "USER",
          email: "",
          jenis: "Ldap",
          id_divisi: 0,
        });
        toast.success(data.message);
        onSave(data.data);
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "An error occurred.");
        setErrorMessage(errorData.error);
      }
    } catch (error) {
      console.error(`Error ${user ? "updating" : "creating"} user:`, error);
      setErrorMessage("An unexpected error occurred.");
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
                {user ? "Edit User" : "Add User"}
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
                    htmlFor="jenis"
                  >
                    Jenis
                  </label>
                  <select
                    id="jenis"
                    name="jenis"
                    value={formData.jenis}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="Ldap">Ldap</option>
                    <option value="Local">Local</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                    disabled={!!user} // Disable if editing
                  />
                </div>
                {formData.jenis === "Local" && (
                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="role"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                    disabled={!!user} // Disable if editing
                  >
                    <option value="USER">User</option>
                    <option value="HEAD">Head</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="id_divisi"
                  >
                    Divisi
                  </label>
                  <select
                    id="id_divisi"
                    name="id_divisi"
                    value={formData.id_divisi}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Select Divisi</option>
                    {divisi.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nama}
                      </option>
                    ))}
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
      <ToastContainer />
    </div>
  );
};

export default AddUserModal;
