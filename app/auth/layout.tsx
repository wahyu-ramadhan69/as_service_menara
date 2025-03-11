"use client";

import "../globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "../lib/authContext";

interface RootLayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <head />
      <body className="bg-white">{children}</body>
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
