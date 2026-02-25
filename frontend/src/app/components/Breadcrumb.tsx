import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            )}
            {isLast ? (
              <span className="text-neutral-900 font-medium">
                {item.label}
              </span>
            ) : item.path ? (
              <Link
                to={item.path}
                className="text-neutral-600 hover:text-neutral-900 transition"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-neutral-600">{item.label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
};