import React, { ReactNode } from "react";

interface TitleProps {
  children: ReactNode;
}

const Title: React.FC<TitleProps> = ({ children }) => {
  return (
    <div className="mb-4 inline-block">
      <h1 className="translate-all cursor-default border-b-2 border-sla-300 pb-3 text-2xl font-semibold text-slate-700 ease-in-out hover:border-blue-400 duration-700">
        {children}
      </h1>
    </div>
  );
};

export default Title;
