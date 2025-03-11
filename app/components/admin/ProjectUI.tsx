"use client";
import React, { useEffect, useState } from "react";
import { Menu } from "@headlessui/react";
import { TfiHarddrive } from "react-icons/tfi";
import { BsCpu, BsMemory } from "react-icons/bs";
import { MdDeleteForever } from "react-icons/md";
import { VscDebugRestart } from "react-icons/vsc";
import { GoFilter } from "react-icons/go";

interface Member {
  name: string;
  node: string;
  status: string;
  maxdisk: number;
  maxmem: number;
  maxcpu: number;
  vmid: number;
  image: string;
}

const ProjectUI = () => {
  const [items, setItems] = useState<Member[]>([]);
  const [filteredItems, setFilteredItems] = useState<Member[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/projects/all");
        const result = await response.json();

        if (result && Array.isArray(result)) {
          const mappedItems = result.map((member: Member) => {
            const images = [
              "https://upload.wikimedia.org/wikipedia/commons/a/af/Tux.png",
              "https://upload.wikimedia.org/wikipedia/commons/4/48/Windows_logo_-_2012_%28dark_blue%29.svg",
            ];
            const randomImage =
              images[Math.floor(Math.random() * images.length)];

            return {
              name: member.name,
              node: member.node,
              status: member.status,
              maxdisk: member.maxdisk / (1024 * 1024 * 1024),
              maxmem: member.maxmem / (1024 * 1024 * 1024),
              maxcpu: member.maxcpu,
              vmid: member.vmid,
              image: randomImage,
            };
          });
          setItems(mappedItems);
        } else {
          console.error("Invalid API response format:", result);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = items;

    if (filter) {
      filtered = filtered.filter((item) => item.status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [filter, searchTerm, items]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="flex h-full w-full flex-col gap-3 px-[2%] transition-all duration-500 ease-in-out md:px-[4%] 1g:px-[10%]">
      <div className="flex-1 rounded-md bg-white p-4">
        <div className="flex flex-col items-center p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div
                className="spinner-border animate-spin inline-block w-16 h-16 border-4 rounded-full"
                role="status"
              ></div>
            </div>
          ) : (
            <>
              <div className="w-full max-w-full mb-4 flex justify-between items-center">
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      {/* Show text on larger screens, show icon on mobile */}
                      <span className="hidden md:inline">Filter by status</span>
                      <GoFilter className="md:hidden h-5 w-5" />{" "}
                    </Menu.Button>
                  </div>
                  <Menu.Items className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={() => setFilter(null)}
                            className={`${
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-700"
                            } block px-4 py-2 text-sm w-full text-left`}
                          >
                            All
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={() => setFilter("running")}
                            className={`${
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-700"
                            } block px-4 py-2 text-sm w-full text-left`}
                          >
                            Running
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={() => setFilter("stopped")}
                            className={`${
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-700"
                            } block px-4 py-2 text-sm w-full text-left`}
                          >
                            Stopped
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Menu>

                {/* Search Box */}
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-md  shadow-sm px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40 sm:w-40 md:w-52"
                />
              </div>

              {/* Cards Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 max-w-full w-full">
                {currentItems.map((item, index) => (
                  <div
                    key={index}
                    className="relative bg-white shadow rounded-lg p-4 flex flex-col items-center group overflow-hidden"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-full mb-4"
                    />
                    <div className="text-sm font-semibold mb-2">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      VM ID{" "}
                      <span className="bg-cyan-400 px-2 py-1 text-white rounded-xl">
                        {item.vmid}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      Node {item.node}
                    </div>

                    <table>
                      <tbody>
                        <tr>
                          <td>
                            <div
                              className={`text-xs text-white mb-2 px-2 py-1 rounded-full ${
                                item.status === "stopped"
                                  ? "bg-red-500"
                                  : "bg-green-500"
                              }`}
                            >
                              {item.status}
                            </div>
                          </td>
                          <td>
                            <div className="text-xs text-gray-600 mb-2 flex justify-start items-center">
                              <TfiHarddrive className="text-2xl mx-2" />
                              <span>{item.maxdisk.toFixed(2)}</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            {" "}
                            <div className="text-xs text-gray-600 mb-2 flex justify-start items-center">
                              <BsMemory className="text-2xl mx-2" />
                              {item.maxmem.toFixed(2)}
                            </div>
                          </td>
                          <td>
                            <div className="text-xs text-gray-600 mb-2 flex justify-start items-center">
                              <BsCpu className="text-2xl mx-2" />
                              {item.maxcpu}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="absolute bottom-0 w-full h-1/3 bg-black/10 flex justify-between transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-300 ease-in-out">
                      <button className="bg-red-400 text-white w-1/2 m-2 flex justify-center items-center rounded">
                        <MdDeleteForever className="text-2xl text-white" />
                      </button>
                      <button className="bg-cyan-400 text-white w-1/2 m-2 flex justify-center items-center rounded">
                        <VscDebugRestart className=" text-2xl text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white shadow-lg text-gray-600 rounded disabled:bg-white"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`px-3 py-1 rounded ${
                      currentPage === i + 1
                        ? "bg-cyan-400 text-white shadow-lg"
                        : "bg-white text-gray-600 shadow-lg"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white shadow-lg text-gray-600 rounded disabled:bg-white"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectUI;
