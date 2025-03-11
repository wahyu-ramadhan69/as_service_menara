"use client";

import "../app/globals.css";
import { ReactNode } from "react";
import Navbar from "./components/navbar";
import { AuthProvider, useAuth } from "./lib/authContext";

interface RootLayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: RootLayoutProps) => {
  const { isAuthenticated } = useAuth();
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
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
