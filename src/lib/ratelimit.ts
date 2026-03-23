import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// 5 posts per hour
export const postRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "ratelimit:post",
});

// 20 comments per hour
export const commentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "ratelimit:comment",
});

// 60 likes per hour
export const likeRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 h"),
  prefix: "ratelimit:like",
});

// 10 auth attempts per hour
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "ratelimit:auth",
});
