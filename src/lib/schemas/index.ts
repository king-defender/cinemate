import { z } from "zod";
import { PLATFORM_IDS } from "@/lib/platforms";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscore only"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const completeProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(280).optional(),
  favoriteGenres: z.array(z.string()).max(8).optional(),
  country: z.string().max(56).optional(),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  bio: z.string().max(280).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  favoriteGenres: z.array(z.string()).max(8).optional(),
  country: z.string().max(56).nullable().optional(),
});

export const createRoomSchema = z.object({
  title: z.string().max(120).optional(),
  platform: z.enum(PLATFORM_IDS).optional(),
});

export const platformSchema = z.object({
  platform: z.enum(PLATFORM_IDS),
});

export const buddyRequestSchema = z.object({
  tags: z.array(z.string().max(32)).max(6).default([]),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const playbackSyncSchema = z.object({
  positionSeconds: z.number().min(0),
  isPlaying: z.boolean(),
  speed: z.number().min(0.25).max(2),
});
