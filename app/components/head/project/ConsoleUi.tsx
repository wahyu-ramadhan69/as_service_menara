import React, { useState } from "react";
import { GoScreenFull } from "react-icons/go";
import { IoIosClose } from "react-icons/io";

interface Member {
  name: string;
  node: string;
  status: string;
  maxdisk: number;
  maxmem: number;
  maxcpu: number;
  vmid: number;
  image: string;
  ip: string;
}

interface ConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Member | null;
}

const ConsoleModal: React.FC<ConsoleModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [port, setPort] = useState<number | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const openInNewTab = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/proxmox/console`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          node: data?.node,
          vmid: data?.vmid,
        }),
      });

      const response = await res.json();
      console.log(response.port);

      if (response.port && response.password) {
        const url = `https://10.20.210.114:${
          response.port
        }/vnc.html?password=${encodeURIComponent(
          response.password
        )}&autoconnect=true&resize=scale`;
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        alert("Failed to retrieve console details for new tab.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error connecting to console.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxmox/console`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          node: data?.node,
          vmid: data?.vmid,
        }),
      });

      const response = await res.json();

      if (response.port && response.password) {
        setPort(response.port);
        setPassword(response.password);
      } else {
        alert("Failed to retrieve console details.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error connecting to console.");
    } finally {
      setLoading(false);
    }
  };

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
        <div
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${
            port && password ? "sm:max-w-7xl" : "sm:max-w-lg"
          } sm:w-full`}
        >
          <div className="bg-white px-4 pt-5 pb-4 relative">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {data?.name} {data?.ip}
              </h3>
              <button
                onClick={onClose}
                className=" flex justify-center items-center text-gray-400 hover:text-gray-600 focus:outline-none p-1 bg-red-400 rounded-full"
              >
                <IoIosClose className="text-gray-600 text-sm" />
              </button>
            </div>

            <div className="flex flex-col justify-center items-center mt-4">
              {loading ? (
                <p>Loading...</p>
              ) : port && password ? (
                <iframe
                  src={`https://10.20.210.114:${port}/vnc.html?password=${encodeURIComponent(
                    password
                  )}&autoconnect=true&resize=scale`}
                  width="100%"
                  height="700px"
                  className="border border-gray-300 rounded"
                  title="VM Console"
                ></iframe>
              ) : (
                <div className="flex space-x-4">
                  <button
                    className="bg-sky-400 px-4 py-2 text-white rounded-lg"
                    onClick={handleConnect}
                  >
                    Open Console
                  </button>
                  <button
                    className="bg-blue-500 px-4 py-2 text-white rounded-lg"
                    onClick={openInNewTab}
                  >
                    Open in New Tab
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsoleModal;
