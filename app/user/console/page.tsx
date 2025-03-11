"use client";

import { useState } from "react";

export default function ConsolePage() {
  const [node, setNode] = useState("");
  const [vmid, setVmid] = useState("");
  const [port, setPort] = useState(null);
  const [password, setPassword] = useState(null);

  const handleConnect = async () => {
    try {
      const res = await fetch(`/api/proxmox/console`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ node, vmid }),
      });

      const data = await res.json();
      setPort(data.port);
      setPassword(data.password);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
          Console VM Proxmox
        </h2>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="node"
          >
            Node Name
          </label>
          <input
            type="text"
            id="node"
            value={node}
            onChange={(e) => setNode(e.target.value)}
            placeholder="Masukkan nama node"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="vmid"
          >
            VM ID
          </label>
          <input
            type="text"
            id="vmid"
            value={vmid}
            onChange={(e) => setVmid(e.target.value)}
            placeholder="Masukkan VM ID"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={handleConnect}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Connect to Console
          </button>
        </div>
      </div>

      {port && password && (
        <div className="w-full max-w-4xl mt-10">
          <iframe
            src={`http://192.168.1.237:${port}/vnc.html?password=${encodeURIComponent(
              password
            )}&autoconnect=true&resize=scale`}
            width="100%"
            height="600px"
            className="border border-gray-300 rounded"
            title="VM Console"
          ></iframe>
        </div>
      )}
    </div>
  );
}
