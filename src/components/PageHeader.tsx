
import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default PageHeader;
