"use client";

import "../globals.css";
import { ReactNode } from "react";
import Navbar from "../components/navbar";
import { AuthProvider, useAuth } from "../lib/authContext";

interface RootLayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <head />
      <body className="bg-slate-200">
        <div className="flex h-full w-full flex-col gap-3 px-[2%] py-4 transition-all duration-500 ease-in-out md:px-[5%] 1g:px-[10%]">
          <Navbar />
        </div>
        {children}
      </body>
    </html>
  );
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <AuthProvider>
      <Layout>{children}</Layout>
    </AuthProvider>
  );
}
