// app/components/AuthGuard.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles: string[];
}

interface DecodedToken {
  userId: string;
  role: string;
}

const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken: DecodedToken = jwtDecode(token);
      if (allowedRoles.includes(decodedToken.role)) {
        setIsAuthenticated(true);
      } else {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router, allowedRoles]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
