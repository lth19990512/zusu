import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { teams } from "./teams";
import { games } from "./games";

export const postTypeEnum = pgEnum("post_type", [
  "discussion",
  "game_thread",
  "post_game_thread",
]);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    teamId: uuid("team_id").references(() => teams.id),
    gameId: uuid("game_id").references(() => games.id),
    type: postTypeEnum("type").notNull().default("discussion"),
    title: varchar("title", { length: 300 }).notNull(),
    content: text("content").notNull(),
    locale: varchar("locale", { length: 10 }).notNull().default("zh-TW"),
    isPinned: boolean("is_pinned").notNull().default(false),
    isLocked: boolean("is_locked").notNull().default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    viewCount: integer("view_count").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("posts_team_id_idx").on(table.teamId),
    index("posts_game_id_idx").on(table.gameId),
    index("posts_author_id_idx").on(table.authorId),
    index("posts_created_at_idx").on(table.createdAt),
    index("posts_team_created_idx").on(table.teamId, table.createdAt),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    parentId: uuid("parent_id"),
    content: text("content").notNull(),
    likeCount: integer("like_count").notNull().default(0),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("comments_post_id_idx").on(table.postId),
    index("comments_author_id_idx").on(table.authorId),
    index("comments_parent_id_idx").on(table.parentId),
  ]
);

export const likeTargetTypeEnum = pgEnum("like_target_type", [
  "post",
  "comment",
]);

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    targetType: likeTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("likes_user_target_unique").on(
      table.userId,
      table.targetType,
      table.targetId
    ),
    index("likes_target_idx").on(table.targetType, table.targetId),
  ]
);

export const userFavoriteTeams = pgTable(
  "user_favorite_teams",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    {
      pk: unique("user_favorite_teams_pk").on(table.userId, table.teamId),
    },
    index("user_favorite_teams_user_idx").on(table.userId),
  ]
);
