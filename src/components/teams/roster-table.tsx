"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface RosterPlayer {
  id: string;
  firstName: string;
  lastName: string;
  nameZh?: string | null;
  position: string | null;
  jerseyNumber: string | null;
  height?: string | null;
  weight?: string | null;
  photoUrl?: string | null;
}

function PlayerAvatar({
  player,
  locale,
}: {
  player: RosterPlayer;
  locale: string;
}) {
  const name =
    locale === "zh-TW" && player.nameZh
      ? player.nameZh
      : `${player.firstName} ${player.lastName}`;

  if (player.photoUrl) {
    return (
      <img
        src={player.photoUrl}
        alt={name}
        className="w-12 h-12 rounded-full object-cover bg-muted"
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
      {player.firstName[0]}
      {player.lastName[0]}
    </div>
  );
}

export function RosterTable({
  players,
  locale,
}: {
  players: RosterPlayer[];
  locale: string;
}) {
  const sorted = [...players].sort((a, b) => {
    const numA = parseInt(a.jerseyNumber ?? "999", 10);
    const numB = parseInt(b.jerseyNumber ?? "999", 10);
    return numA - numB;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sorted.map((player) => {
        const name =
          locale === "zh-TW" && player.nameZh
            ? player.nameZh
            : `${player.firstName} ${player.lastName}`;

        return (
          <Link key={player.id} href={`/players/${player.id}`}>
            <div className="rounded-lg border border-black/5 bg-card p-3 hover:bg-muted/30 transition-all duration-300 flex items-center gap-3 cursor-pointer hover:scale-[1.01]">
              <PlayerAvatar player={player} locale={locale} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>#{player.jerseyNumber ?? "-"}</span>
                  {player.position && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {player.position}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
