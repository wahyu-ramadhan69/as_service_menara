import { useEffect, useRef, useState } from "react";
import RFB from "novnc-core";
import axios from "axios";

interface VncConsoleProps {
  node: string;
  vmid: string;
  width?: string;
  height?: string;
}

const VncConsole: React.FC<VncConsoleProps> = ({
  node,
  vmid,
  width = "100%",
  height = "600px",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const [websocketUrl, setWebsocketUrl] = useState<string | null>(null);

  // Fetch WebSocket URL from backend API
  useEffect(() => {
    const fetchWebsocketUrl = async () => {
      try {
        const response = await axios.post("/api/proxmox", { node, vmid });
        setWebsocketUrl(response.data.websocketUrl);
      } catch (error) {
        console.error("Failed to fetch WebSocket URL", error);
      }
    };

    fetchWebsocketUrl();
  }, [node, vmid]);

  // Initialize RFB connection when websocketUrl is available
  useEffect(() => {
    if (websocketUrl && canvasRef.current) {
      const rfb = new RFB({
        target: canvasRef.current, // Set the target as the canvas element
        view_only: true, // Optional configuration: view only
      });

      // Extract the host and port from websocketUrl
      const url = new URL(websocketUrl);
      const host = url.hostname;
      const port = parseInt(url.port, 10);

      // Now connect using the host and port
      rfb.connect(host, port);

      rfb.set_onFBResize((rfb, width, height) => {
        console.log(`Frame buffer resized to ${width}x${height}`);
      });

      rfbRef.current = rfb;

      return () => {
        if (rfbRef.current) {
          rfbRef.current.disconnect();
        }
      };
    }
  }, [websocketUrl]);

  return <canvas ref={canvasRef} style={{ width, height }} />;
};

export default VncConsole;
