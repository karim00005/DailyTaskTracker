import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-right">{title}</h1>
        {description && <p className="text-muted-foreground text-right">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}