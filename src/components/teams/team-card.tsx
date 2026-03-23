"use client";

import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import type { TeamBrief } from "@/types/api";

export function TeamCard({
  team,
  locale,
}: {
  team: TeamBrief;
  locale: string;
}) {
  return (
    <Link href={`/teams/${team.id}`}>
      <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer flex items-center gap-3">
        {team.logoUrl && (
          <img
            src={team.logoUrl}
            alt={team.abbreviation}
            className="w-10 h-10 object-contain"
          />
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">
            {locale === "zh-TW" ? team.nameZh : team.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {team.abbreviation}
          </p>
        </div>
      </Card>
    </Link>
  );
}
