"use client";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Eye } from "lucide-react";

interface PostCardProps {
  id: string;
  title: string;
  content?: string;
  type: "discussion" | "game_thread" | "post_game_thread";
  author: { displayName: string; userNumber: number };
  team: { abbreviation: string; logoUrl: string | null; nameZh: string; name: string } | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  isPinned?: boolean;
  locale: string;
}

function timeAgo(date: string, locale: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return locale === "zh-TW" ? "剛剛" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return locale === "zh-TW" ? `${minutes} 分鐘前` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === "zh-TW" ? `${hours} 小時前` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return locale === "zh-TW" ? `${days} 天前` : `${days}d ago`;
  const months = Math.floor(days / 30);
  return locale === "zh-TW" ? `${months} 個月前` : `${months}mo ago`;
}

const TYPE_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  discussion: { zh: "討論", en: "Discussion", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  game_thread: { zh: "比賽討論", en: "Game Thread", color: "bg-green-500/15 text-green-400 border-green-500/20" },
  post_game_thread: { zh: "賽後分析", en: "Post Game", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
};

export function PostCard({
  id, title, content, type, author, team,
  likeCount, commentCount, viewCount,
  createdAt, isPinned, locale,
}: PostCardProps) {
  const isZh = locale === "zh-TW";
  const typeInfo = TYPE_LABELS[type] || TYPE_LABELS.discussion;
  const preview = content ? content.slice(0, 120) + (content.length > 120 ? "..." : "") : "";

  return (
    <Link href={`/posts/${id}`}>
      <article className="group relative p-4 rounded-xl border border-black/5 bg-card card-hover">
        {/* Pinned indicator */}
        {isPinned && (
          <div className="absolute top-2 right-3 text-xs text-amber-400">📌</div>
        )}

        {/* Top row: team logo + type badge + time */}
        <div className="flex items-center gap-2 mb-2">
          {team?.logoUrl && (
            <img src={team.logoUrl} alt="" className="w-5 h-5 object-contain" />
          )}
          {team && (
            <span className="text-xs text-muted-foreground">
              {isZh ? team.nameZh : team.abbreviation}
            </span>
          )}
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeInfo.color}`}>
            {isZh ? typeInfo.zh : typeInfo.en}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {timeAgo(createdAt, locale)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Preview */}
        {preview && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {preview}
          </p>
        )}

        {/* Bottom row: author + stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>
            {author.displayName}
            <span className="opacity-50">#{String(author.userNumber).padStart(4, "0")}</span>
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <span className="flex items-center gap-1">
              <Heart className="size-3" /> {likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3" /> {commentCount}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3" /> {viewCount}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
