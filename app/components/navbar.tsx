"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../lib/authContext";
import { jwtDecode } from "jwt-decode";
import { CiMenuBurger, CiUser } from "react-icons/ci";
import { Menu } from "@headlessui/react";
import { GrPowerShutdown } from "react-icons/gr";
import { GiAstronautHelmet } from "react-icons/gi";
import { FiServer } from "react-icons/fi";
import {
  GoChecklist,
  GoPeople,
  GoPerson,
  GoQuote,
  GoStack,
} from "react-icons/go";
import { RxDashboard } from "react-icons/rx";

interface LinkItem {
  href: string;
  label: string;
  icon: React.ReactNode; // Add icon here
}

interface Links {
  ADMIN: LinkItem[];
  HEAD: LinkItem[];
  USER: LinkItem[];
}

const Navbar = () => {
  const { logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken: { role: string; exp: number; username: string } =
          jwtDecode(token);

        if (decodedToken.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          router.push("/auth/login");
        } else {
          setRole(decodedToken.role);
          setUsername(decodedToken.username);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
        router.push("/auth/login");
      }
    }
  }, [router]);

  // Update with icons
  const links: Links = {
    ADMIN: [
      { href: "/admin", label: "Dashboard", icon: <RxDashboard /> },
      { href: "/admin/team", label: "Teams", icon: <GoPeople /> },
      { href: "/admin/users", label: "Users", icon: <GoPerson /> },
      { href: "/admin/ip", label: "IP Address", icon: <GoQuote /> },
      { href: "/admin/host", label: "Host", icon: <GoQuote /> },
      { href: "/admin/template", label: "Template", icon: <GoStack /> },
      { href: "/admin/projects", label: "Server", icon: <FiServer /> },
    ],
    HEAD: [
      { href: "/head", label: "Dashboard", icon: <RxDashboard /> },
      {
        href: "/head/bucket",
        label: "Bucket Pengajuan",
        icon: <GoChecklist />,
      },
      { href: "/head/projects", label: "Server", icon: <FiServer /> },
    ],
    USER: [
      { href: "/user", label: "Dashboard", icon: <RxDashboard /> },
      {
        href: "/user/pengajuan",
        label: "Pengajuan",
        icon: <GoQuote />,
      },
      { href: "/user/projects", label: "Server", icon: <FiServer /> },
    ],
  };

  const renderLinks = () => {
    const roleLinks = links[role as keyof Links] || [];
    return roleLinks.map((link) => {
      const isActive = pathname === link.href;
      return (
        <Link
          key={link.href}
          href={link.href}
          prefetch={true}
          className={`translate-all rounded-full px-5 py-3 font-semibold duration-700 ease-in-out ${
            isActive
              ? "bg-slate-700 text-white"
              : "text-slate-700 hover:bg-slate-700 hover:text-white"
          } ${role === "ADMIN" ? "text-xs" : "text-sm"}`}
        >
          {/* Render label (text) for desktop and icon for mobile */}
          <span className="hidden md:inline">{link.label}</span>
          <span className="md:hidden text-lg">{link.icon}</span>{" "}
          {/* Show icon on mobile */}
        </Link>
      );
    });
  };

  return (
    <>
      <header className="hidden md:flex items-center justify-between rounded-xl bg-white px-5 py-3 shadow-md">
        <div>
          <img src="/proxmox.png" alt="Logo" className="w-10 cursor-pointer" />
        </div>

        <nav className="flex items-center gap-4 rounded-full bg-slate-100">
          {isAuthenticated && renderLinks()}
        </nav>

        <div className="flex items-center gap-1">
          <Menu as="div" className="relative">
            <Menu.Button>
              <CiUser className="translate-all cursor-pointer text-4xl duration-700 ease-in-out hover:bg-slate-700 hover:text-white rounded-full p-2" />
            </Menu.Button>

            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <Menu.Item>
                <div className="flex px-4 justify-start items-center cursor-pointer">
                  <GiAstronautHelmet />
                  <span className="block px-4 py-2 text-sm text-gray-700">
                    {username}
                  </span>
                </div>
              </Menu.Item>
              <Menu.Item>
                <div
                  className="flex px-4 justify-start items-center cursor-pointer"
                  onClick={
                    isAuthenticated ? logout : () => router.push("/auth/login")
                  }
                >
                  <GrPowerShutdown />
                  <span className="block px-4 py-2 text-sm text-gray-700">
                    Logout
                  </span>
                </div>
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </header>

      {/* Mobile Navbar */}
      <header className="flex md:hidden items-center justify-between rounded-xl bg-white px-5 py-3 shadow-md">
        <div>
          <img src="/proxmox.png" alt="Logo" className="w-8 cursor-pointer" />
        </div>

        <Menu as="div" className="relative">
          <Menu.Button>
            <CiMenuBurger className="translate-all cursor-pointer text-4xl duration-700 ease-in-out hover:bg-slate-700 hover:text-white rounded-full p-2" />
          </Menu.Button>

          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <Menu.Item>
              <div className="flex px-4 justify-start items-center cursor-pointer">
                <GiAstronautHelmet />
                <span className="block px-4 py-2 text-sm text-gray-700">
                  {username}
                </span>
              </div>
            </Menu.Item>
            <Menu.Item>
              <div
                className="flex px-4 justify-start items-center cursor-pointer"
                onClick={
                  isAuthenticated ? logout : () => router.push("/auth/login")
                }
              >
                <GrPowerShutdown />
                <span className="block px-4 py-2 text-sm text-gray-700">
                  Logout
                </span>
              </div>
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </header>

      {/* Mobile Bottom Navbar */}
      <div className="fixed inset-x-0 bottom-2 mx-4 rounded-full z-50 flex justify-between bg-white p-4 shadow-md md:hidden">
        {isAuthenticated && renderLinks()}
      </div>
    </>
  );
};

export default Navbar;
