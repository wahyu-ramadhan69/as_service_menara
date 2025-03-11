"use client";

import React, { useState, useEffect } from "react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
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
    jenis: "",
    id_divisi: 0,
  });

  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for error message

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
        jenis: "",
        email: "",
        id_divisi: 0,
      });
    }

    // Fetch Divisi list
    const fetchDivisi = async () => {
      try {
        const res = await fetch("/api/divisi");
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await res.json();
        setDivisi(data);
      } catch (error) {
        console.error("Failed to fetch divisi:", error);
      }
    };

    fetchDivisi();
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null); // Clear previous error messages

    try {
      const response = await fetch(`/api/users${user ? `/${user?.id}` : ""}`, {
        method: user ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
        setFormData({
          username: "",
          password: "",
          role: "USER",
          email: "",
          jenis: "",
          id_divisi: 0,
        });
        onClose();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error); // Set the error message
      }
    } catch (error) {
      console.error(`Error ${user ? "updating" : "creating"} user:`, error);
      setErrorMessage("An unexpected error occurred."); // Set a general error message
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
                    required={!user}
                  />
                  {errorMessage && (
                    <p className="text-red-500 text-xs mt-2">{errorMessage}</p>
                  )}
                </div>
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
                    required
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
                    value={formData.jenis}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="USER">Ldap</option>
                    <option value="HEAD">Local</option>
                  </select>
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
    </div>
  );
};

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
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
              <p>Are you sure you want to delete this user?</p>
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

export default function UserUi() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    fetchUsers(); // Re-fetch users after adding or editing
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers(); // Re-fetch users after deleting
        setCurrentUser(null);
        setIsDeleteModalOpen(false);
      } else {
        console.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleOpenDeleteModal = (user: User) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentUser(null);
  };

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Users</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add User
          </button>
        </div>
        <AddUserModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleAddUser} // Modified
          user={currentUser}
        />
        <DeleteUserModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteUser}
        />
        <p className="text-sm text-gray-600 mb-4">
          A list of all the users including their username, email, role, and
          divisi.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Divisi
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {u.username}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {u.role}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {u.jenis}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    {u.divisi ? u.divisi.nama : "No Divisi"}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 text-sm">
                    <span
                      className="text-blue-500 hover:text-blue-700 cursor-pointer mr-4"
                      onClick={() => handleEditUser(u)}
                    >
                      Edit
                    </span>
                    <span
                      className="text-pink-500 hover:text-pink-700 cursor-pointer"
                      onClick={() => handleOpenDeleteModal(u)}
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
