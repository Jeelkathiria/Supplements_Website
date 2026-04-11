import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-xs md:text-sm mb-6 text-neutral-500 font-medium overflow-x-auto no-scrollbar whitespace-nowrap">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-neutral-300 mx-1">/</span>
            )}
            
            {isLast ? (
              <span className="text-neutral-900 font-bold">
                {item.label}
              </span>
            ) : item.path ? (
              <Link
                to={item.path}
                className="flex items-center gap-1.5 hover:text-teal-700 transition-colors group"
              >
                {isFirst && <Home className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform" />}
                {item.label}
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 cursor-default">
                {isFirst && <Home className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};