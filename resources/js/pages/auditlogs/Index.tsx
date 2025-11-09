import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';

interface Activity {
  id: number;
  description: string;
  created_at: string;
  causer: { name: string } | null;
  properties: Record<string, any>;
  subject_type: string | null;
}

interface Props {
  logs: {
    data: Activity[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Audit Log',
    href: '/audit-logs',
  },
];

export default function AuditLogIndex({ logs }: Props) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Audit Log" />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold">Audit Log</CardTitle>
            <p className="text-muted-foreground text-sm">
              User activity history in the system
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-4">
            {/* List Logs */}
            {logs.data.length === 0 ? (
              <p className="text-muted-foreground text-center">No activity logs.</p>
            ) : (
              logs.data.map((log) => (
                <div
                  key={log.id}
                  className="border px-4 py-3 rounded-md bg-muted/50 hover:bg-muted/70 transition"
                >
                  <div className="font-medium text-sm text-foreground">
                    {log.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {log.causer?.name ?? 'System'} • {new Date(log.created_at).toLocaleString()}
                    {log.subject_type ? ` • ${log.subject_type.split('\\').pop()}` : ''}
                  </div>
                  {log.properties && Object.keys(log.properties).length > 0 && (
                    <pre className="mt-2 rounded bg-muted p-2 text-xs overflow-auto max-h-48">
                      {JSON.stringify(log.properties, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}

            {/* Pagination */}
            {logs.links.length > 1 && (
              <div className="flex justify-center pt-6 flex-wrap gap-2">
                {logs.links.map((link, i) => (
                  <Button
                    key={i}
                    disabled={!link.url}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => router.visit(link.url || '', { preserveScroll: true })}
                  >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
