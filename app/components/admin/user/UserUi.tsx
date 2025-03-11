"use client";

import React, { useState, useEffect } from "react";
import AddUserModal from "./AddUserModal";
import DeleteUserModal from "./DeleteUserModal";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";
import Title from "../../Title";
import { Menu } from "@headlessui/react"; // for filtering UI
import { GoFilter, GoPlus } from "react-icons/go";

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

export default function UserUi() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string | null>("ALL");
  const [filterDivisi, setFilterDivisi] = useState<string | null>(null);
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/users");
      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to fetch data");
      }
      setUsers(responseData.data);
      setFilteredUsers(responseData.data); // Initialize filteredUsers
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisi = async () => {
    try {
      const res = await fetch("/api/divisi");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setDivisi(data.data.divisies);
    } catch (error) {
      console.error("Failed to fetch divisi:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDivisi(); // Fetch divisions
  }, []);

  // Handle user addition/edit
  const handleAddUser = (user: User) => {
    console.log("User Data:", user); // Log data user untuk memastikan divisi ada
    const updatedUsers = currentUser
      ? users.map((d) => (d.id === user.id ? { ...d, ...user } : d))
      : [...users, user]; // Tambah user baru
    setUsers(updatedUsers);
    setFilteredUsers(updatedUsers);
    setCurrentUser(null);
  };

  useEffect(() => {
    let filtered = users;

    if (filterRole && filterRole !== "ALL") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    if (filterDivisi) {
      filtered = filtered.filter(
        (user) => user.divisi && user.divisi.nama === filterDivisi
      );
    }

    // Search by username or email
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [filterRole, filterDivisi, searchTerm, users]);

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
        setUsers(users.filter((d) => d.id !== currentUser.id));
        setFilteredUsers(users.filter((d) => d.id !== currentUser.id));
        toast.success("User deleted successfully");
        setCurrentUser(null);
        setIsDeleteModalOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error);
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
    <div className="flex h-full w-full flex-col gap-3 px-[2%] transition-all duration-500 ease-in-out md:px-[5%] 1g:px-[10%]">
      <ToastContainer />
      <div className="flex-1 rounded-md bg-white p-4">
        <div className="flex items-center justify-between">
          <Title>List User</Title>
        </div>

        <div className="flex justify-between items-center pb-4">
          <div className="flex justify-center items-center">
            {/* Filter by Role */}
            <Menu as="div" className="relative inline-block text-left mr-2">
              <div>
                <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  {/* Show text on larger screens, show icon on mobile */}
                  <span className="hidden md:inline">Filter by Role</span>
                  <GoFilter className="md:hidden h-5 w-5" />{" "}
                  {/* Smaller icon for mobile */}
                </Menu.Button>
              </div>
              <Menu.Items className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }: { active: boolean }) => (
                      <button
                        onClick={() => setFilterRole("ALL")}
                        className={`${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } block px-4 py-2 text-sm w-full text-left`}
                      >
                        All
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }: { active: boolean }) => (
                      <button
                        onClick={() => setFilterRole("ADMIN")}
                        className={`${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } block px-4 py-2 text-sm w-full text-left`}
                      >
                        Admin
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }: { active: boolean }) => (
                      <button
                        onClick={() => setFilterRole("HEAD")}
                        className={`${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } block px-4 py-2 text-sm w-full text-left`}
                      >
                        Head
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }: { active: boolean }) => (
                      <button
                        onClick={() => setFilterRole("USER")}
                        className={`${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } block px-4 py-2 text-sm w-full text-left`}
                      >
                        User
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>

            {/* Filter by Divisi */}
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  {/* Show text on larger screens, show icon on mobile */}
                  <span className="hidden md:inline">Filter by Divisi</span>
                  <GoFilter className="md:hidden h-5 w-5" />{" "}
                  {/* Smaller icon for mobile */}
                </Menu.Button>
              </div>
              <Menu.Items className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }: { active: boolean }) => (
                      <button
                        onClick={() => setFilterDivisi(null)}
                        className={`${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } block px-4 py-2 text-sm w-full text-left`}
                      >
                        All Divisi
                      </button>
                    )}
                  </Menu.Item>
                  {divisi.map((d) => (
                    <Menu.Item key={d.id}>
                      {({ active }: { active: boolean }) => (
                        <button
                          onClick={() => setFilterDivisi(d.nama)}
                          className={`${
                            active
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700"
                          } block px-4 py-2 text-sm w-full text-left`}
                        >
                          {d.nama}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Menu>
          </div>

          {/* Search Box and Add Button */}
          <div className="flex justify-center items-center">
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md mr-2 shadow-sm px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40 sm:w-40 md:w-52"
            />

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg flex items-center justify-center"
            >
              {/* Show text on larger screens, show icon on mobile */}
              <GoPlus className="md:hidden text-lg" /> {/* Icon for mobile */}
              <span className="hidden md:inline ml-2">Add User</span>
            </button>
          </div>
        </div>

        <AddUserModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleAddUser}
          user={currentUser}
        />

        <DeleteUserModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteUser}
        />

        {loading ? (
          <p>Loading...</p>
        ) : errorMessage ? (
          <p className="text-red-500">{errorMessage}</p>
        ) : (
          <>
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
                  {filteredUsers.map((u) => (
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
          </>
        )}
      </div>
    </div>
  );
}
