import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pb-4 border-b mb-6">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-6 w-6 text-primary" />}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          {actions.map((action, i) => {
            if (action.href) {
              return (
                <Button 
                  key={i} 
                  variant={action.variant || "default"} 
                  asChild
                >
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              );
            }
            return (
              <Button 
                key={i} 
                variant={action.variant || "default"} 
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PageHeader;