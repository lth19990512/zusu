import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  content: z.string().min(10, "Content must be at least 10 characters").max(50000),
  teamId: z.string().uuid().optional(),
  gameId: z.string().uuid().optional(),
  type: z.enum(["discussion", "game_thread", "post_game_thread"]).default("discussion"),
  locale: z.enum(["zh-TW", "en"]).default("zh-TW"),
});

export const updatePostSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(10).max(50000).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000),
  parentId: z.string().uuid().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
