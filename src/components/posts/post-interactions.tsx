"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Send } from "lucide-react";

function timeAgo(date: Date | string, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return locale === "zh-TW" ? "剛剛" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return locale === "zh-TW" ? `${minutes} 分鐘前` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return locale === "zh-TW" ? `${hours} 小時前` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === "zh-TW" ? `${days} 天前` : `${days}d ago`;
}

interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  authorDisplayName: string;
  authorUserNumber: number;
  likeCount: number;
}

interface PostInteractionsProps {
  postId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  comments: Comment[];
  locale: string;
}

export function PostInteractions({
  postId,
  initialLiked,
  initialLikeCount,
  comments: initialComments,
  locale,
}: PostInteractionsProps) {
  const t = useTranslations("post");
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLiking, setIsLiking] = useState(false);

  async function handleLike() {
    setIsLiking(true);
    // Optimistic update
    const wasLiked = liked;
    setLiked(!liked);
    setLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      if (!res.ok) {
        // Revert on failure
        setLiked(wasLiked);
        setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    } finally {
      setIsLiking(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: commentText }),
        });

        if (res.ok) {
          const newComment = await res.json();
          setComments((prev) => [newComment, ...prev]);
          setCommentText("");
        }
      } catch {
        // Silently fail — user can retry
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={isLiking}
        className="flex items-center gap-2 text-sm transition-colors hover:text-primary"
      >
        <Heart
          className={`size-5 transition-all ${liked ? "fill-red-500 text-red-500 heart-pop" : "text-muted-foreground"}`}
        />
        <span className={liked ? "text-red-500" : "text-muted-foreground"}>
          {likeCount} {locale === "zh-TW" ? "讚" : "likes"}
        </span>
      </button>

      <Separator />

      {/* Comment Form */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="size-5 text-muted-foreground" />
          <h3 className="font-medium">
            {comments.length} {locale === "zh-TW" ? "則留言" : "comments"}
          </h3>
        </div>

        <form onSubmit={handleSubmitComment} className="space-y-3 mb-6">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={t("writeComment")}
            rows={3}
            className="resize-none"
          />
          <Button
            type="submit"
            disabled={isPending || !commentText.trim()}
            className="bg-gradient-to-r from-primary to-primary/80 hover:brightness-110"
          >
            <Send className="size-4 mr-1" />
            {t("reply")}
          </Button>
        </form>
      </div>

      {/* Comment List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`rounded-lg border border-black/5 bg-card p-4 ${
              comment.parentId ? "ml-6 border-l-2 border-l-primary/20" : ""
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium">
                {comment.authorDisplayName}#
                {String(comment.authorUserNumber).padStart(4, "0")}
              </span>
              <span className="text-xs text-muted-foreground">
                {timeAgo(comment.createdAt, locale)}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
