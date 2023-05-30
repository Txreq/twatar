import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../api/trpc";
import { TWAT_INCLUDES, selfInteractions } from "@/common/server/utils";
import { TRPCError } from "@trpc/server";

import type { UploadResponse } from "imagekit/dist/libs/interfaces";

export default createTRPCRouter({
  /**
   * Retrieves a twat by its ID.
   * @returns {Promise<object|null>} - A promise that resolves to the twat object if found, or `null` if not found.
   */
  get: protectedProcedure
    .input(
      z.object({
        tid: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const data = await ctx.prisma.twat.findUnique({
        where: {
          id: input.tid,
        },
        include: TWAT_INCLUDES,
      });

      if (data) {
        const { selfLike, selfRetwat } = selfInteractions(
          ctx.session.user.id ?? "",
          {
            likes: data?.likes,
            retwats: data.retwats,
          }
        );

        return { ...data, selfLike, selfRetwat };
      }

      return null;
    }),
  /**
   * @description Creates a new Twat with the provided content and optional attachment. The `input` object should contain the `content` property representing the text content of the twat. An optional `attachment` object can be included, specifying the `name`, `url`, and `type` properties for the attachment. The `type` should be either "image" or "gif".
   *
   * If the attachment is an image with a valid file extension (e.g., ".png" or ".jpg") and has a URL provided, it will be uploaded. The URL of the uploaded image will replace the original attachment URL.
   *
   * The promise resolves to the created twat object on successful creation. If an error occurs during the twat creation process, a `TRPCError` is thrown with the corresponding error message and code.
   * Requires user authentication to create a twat on behalf of the authenticated user.
   */
  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        attachment: z
          .object({
            name: z.string(),
            url: z.string().optional(),
            type: z.enum(["image", "gif"]),
          })
          .nullish(),
      })
    )
    .mutation(async ({ ctx, input: { content, attachment } }) => {
      if (content.length === 0) return;
      try {
        if (
          attachment &&
          attachment.type === "image" &&
          (attachment.name.endsWith(".png") ||
            attachment.name.endsWith(".jpg")) &&
          attachment.url
        ) {
          const uploadedImage: UploadResponse = await ctx.image.upload({
            file: attachment.url,
            fileName: attachment.name,
          });

          attachment.url = uploadedImage.url;
        }

        const data = await ctx.prisma.twat.create({
          data: {
            authorId: ctx.session.user.id,
            content,
            attachment: attachment?.url,
          },
          include: TWAT_INCLUDES,
        });
        return { ...data, selfLike: false, selfRetwat: false };
      } catch {
        throw new TRPCError({
          message: "Something Went Wrong",
          code: "BAD_REQUEST",
        });
      }
    }),

  retwat: protectedProcedure
    .input(
      z.object({
        tid: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const twat = await ctx.prisma.twat.findUnique({
        where: {
          id: input.tid,
        },
        include: {
          retwats: true,
        },
      });

      const userAlreadyRetwated = twat?.retwats.find(
        (retwat) => retwat.authorId === userId
      );
      if (userAlreadyRetwated) return;

      if (twat) {
        return await ctx.prisma.twat.create({
          data: {
            content: input.content,
            author: {
              connect: {
                id: userId as string,
              },
            },
            embeddedTwat: {
              connect: {
                id: twat.id,
              },
            },
          },
        });
      }
    }),
  like: protectedProcedure
    .input(
      z.object({
        tid: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId_twatId = {
        userId: ctx.session.user.id,
        twatId: input.tid,
      };

      const like = await ctx.prisma.like.findUnique({
        where: {
          userId_twatId,
        },
      });

      if (like) {
        await ctx.prisma.like.delete({
          where: {
            userId_twatId,
          },
        });
        return -1;
      } else {
        await ctx.prisma.like.create({
          data: {
            ...userId_twatId,
          },
        });
        return 1;
      }
    }),
});
