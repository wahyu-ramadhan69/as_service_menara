"use client";

import { useState } from "react";

export default function VncPreview() {
  const [vmID, setVmID] = useState("");
  const [nodeid, setNodeid] = useState("");
  const [iframeSrc, setIframeSrc] = useState("");

  const handlePreview = async () => {
    try {
      const response = await fetch("/api/vnc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vmID, nodeid }),
      });

      const data = await response.json();

      if (data.iframeSrc) {
        setIframeSrc(data.iframeSrc);
      } else {
        alert("Failed to generate VNC preview.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while generating VNC preview.");
    }
  };

  return (
    <div>
      <h1>VNC Preview</h1>
      <div>
        <label>VM ID:</label>
        <input
          type="text"
          value={vmID}
          onChange={(e) => setVmID(e.target.value)}
        />
      </div>
      <div>
        <label>Node ID:</label>
        <input
          type="text"
          value={nodeid}
          onChange={(e) => setNodeid(e.target.value)}
        />
      </div>
      <button onClick={handlePreview}>Preview VNC</button>
      {iframeSrc && (
        <div>
          <h2>VNC Console</h2>
          <iframe
            src={iframeSrc}
            frameBorder="0"
            scrolling="no"
            width="100%"
            height="600px"
          ></iframe>
        </div>
      )}
    </div>
  );
}
