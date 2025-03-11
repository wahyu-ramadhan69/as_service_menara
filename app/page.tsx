"use client";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <div className="flex items-center space-x-2">
          <img src="/landing.svg" className="w-2/3" alt="" />
        </div>
        <a
          onClick={() => router.push("/auth/login")}
          className="flex sm:inline-flex justify-center cursor-pointer items-center bg-gradient-to-tr from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500 active:from-indigo-700 active:to-purple-600 focus-visible:ring ring-indigo-300 text-white font-semibold text-center rounded-md outline-none transition duration-100 px-5 py-2"
        >
          Continue
        </a>
      </main>
    </div>
  );
}
