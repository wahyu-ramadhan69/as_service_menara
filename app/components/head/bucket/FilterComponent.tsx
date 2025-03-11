import React from "react";
import { Menu } from "@headlessui/react";

interface FilterComponentProps {
  setFilter: (filter: string | null) => void;
}

const FilterComponent: React.FC<FilterComponentProps> = ({ setFilter }) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
          Filter by Status
        </Menu.Button>
      </div>
      <Menu.Items className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => setFilter(null)}
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm w-full text-left`}
              >
                All
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => setFilter("New")}
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm w-full text-left`}
              >
                New
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => setFilter("Existing")}
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm w-full text-left`}
              >
                Existing
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => setFilter("Perubahan")}
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm w-full text-left`}
              >
                Perubahan
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => setFilter("Delete")}
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm w-full text-left`}
              >
                Delete
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  );
};

export default FilterComponent;
