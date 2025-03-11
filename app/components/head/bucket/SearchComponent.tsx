import React from "react";

interface SearchComponentProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <>
      <input
        type="text"
        placeholder="Search by application name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm mr-2"
      />
    </>
  );
};

export default SearchComponent;
