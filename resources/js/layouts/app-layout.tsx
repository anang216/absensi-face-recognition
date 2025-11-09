import React from 'react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
}

export default function AppLayout({ children, breadcrumbs, title }: AppLayoutProps) {
  return (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} title={title}>
      {children}
    </AppLayoutTemplate>
  );
}
