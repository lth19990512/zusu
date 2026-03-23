"use client";

import { Trophy, Newspaper, MessageCircle } from "lucide-react";

interface EmptyStateProps {
  icon?: "basketball" | "trophy" | "newspaper" | "chat";
  title: string;
  description?: string;
}

function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2c2.5 4 2.5 16 0 20" />
      <path d="M12 2c-2.5 4-2.5 16 0 20" />
    </svg>
  );
}

const iconMap = {
  basketball: BasketballIcon,
  trophy: Trophy,
  newspaper: Newspaper,
  chat: MessageCircle,
} as const;

export function EmptyState({
  icon = "basketball",
  title,
  description,
}: EmptyStateProps) {
  const IconComponent = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-b from-muted/30 to-transparent rounded-xl">
      <IconComponent className="size-16 text-muted-foreground/20" />
      <h3 className="text-lg font-medium text-muted-foreground mt-4">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground/70 mt-2 max-w-md text-center">
          {description}
        </p>
      )}
    </div>
  );
}
