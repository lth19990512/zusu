"use client";

import { useState } from "react";
import { use } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function CreatePostPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { teamId } = use(searchParams);
  const resolvedTeamId = typeof teamId === "string" ? teamId : undefined;

  const t = useTranslations("post");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          teamId: resolvedTeamId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || tCommon("error"));
        setLoading(false);
        return;
      }

      const newPost = await res.json();
      router.push(`/posts/${newPost.id}`);
    } catch {
      setError(tCommon("error"));
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1
        style={{ fontSize: "var(--text-h1)" }}
        className="font-bold mb-6"
      >
        {t("createPost")}
      </h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("title")}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  t("title") + "..."
                }
                required
                maxLength={300}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t("content")}</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder={
                  t("content") + "..."
                }
                required
                className="resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:brightness-110"
              disabled={loading}
            >
              {loading ? (
                tCommon("loading")
              ) : (
                <>
                  <Send className="size-4 mr-1" />
                  {tCommon("submit")}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
