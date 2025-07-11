'use client';

import { BreadcrumbItem, Breadcrumbs } from "@heroui/react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BreadcrumbNav() {
  const pathname = usePathname();
  
  // Создаем массив сегментов пути
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return null; // Не показываем хлебные крошки на главной странице
  }

  return (
    <div className="container mx-auto px-4 py-2">
      <Breadcrumbs
        itemClasses={{
          item: "px-2 text-sm",
          separator: "px-1 text-gray-500",
        }}
        separator="/"
      >
        <BreadcrumbItem>
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>
        </BreadcrumbItem>
        
        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/');
          const isLast = index === segments.length - 1;
          const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
          
          return (
            <BreadcrumbItem key={href}>
              {isLast ? (
                <span className="text-gray-900 font-medium">{title}</span>
              ) : (
                <Link href={href} className="text-gray-600 hover:text-gray-900">
                  {title}
                </Link>
              )}
            </BreadcrumbItem>
          );
        })}
      </Breadcrumbs>
    </div>
  );
}