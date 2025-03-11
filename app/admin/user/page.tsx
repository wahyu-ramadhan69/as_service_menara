"use client";
import AuthGuard from "@/app/lib/AuthGuard";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  divisi: { nama: string };
}

interface Divisi {
  id: number;
  nama: string;
}

const Page: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "USER",
    email: "",
    id_divisi: "",
  });

  const fetchUsers = async () => {
    const response = await fetch("/api/users");
    if (response.ok) {
      const data = await response.json();
      setUsers(data);
    } else {
      console.error("Failed to fetch users");
    }
  };

  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", {
      method: "DELETE",
    });

    if (response.ok) {
      // Remove token from local storage or cookies
      localStorage.removeItem("token");
      // Redirect to the login page or home page
      router.push("/auth/login");
    } else {
      console.error("Failed to log out");
    }
  };

  const fetchDivisi = async () => {
    const response = await fetch("/api/divisi");
    if (response.ok) {
      const data = await response.json();
      setDivisi(data);
    } else {
      console.error("Failed to fetch divisi");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDivisi();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      fetchUsers();
      setFormData({
        username: "",
        password: "",
        role: "USER",
        email: "",
        id_divisi: "",
      });
    } else {
      console.error("Failed to create user");
    }
  };

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <button
          onClick={handleLogout}
          className="bg-blue-500 text-white p-2 mt-2"
        >
          Logout
        </button>
        <form onSubmit={handleSubmit} className="mb-4">
          <div>
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="border p-2"
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="border p-2"
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="border p-2"
            />
          </div>
          <div>
            <label>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="border p-2"
            >
              <option value="USER">User</option>
              <option value="HEAD">Head</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label>Divisi</label>
            <select
              name="id_divisi"
              value={formData.id_divisi}
              onChange={handleChange}
              required
              className="border p-2"
            >
              <option value="">Select Divisi</option>
              {divisi.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 mt-2">
            Add User
          </button>
        </form>
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 border">ID</th>
              <th className="py-2 border">Username</th>
              <th className="py-2 border">Email</th>
              <th className="py-2 border">Role</th>
              <th className="py-2 border">Divisi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border px-4 py-2">{user.id}</td>
                <td className="border px-4 py-2">{user.username}</td>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">{user.role}</td>
                <td className="border px-4 py-2">{user.divisi.nama}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AuthGuard>
  );
};

export default Page;
