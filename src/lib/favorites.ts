import prisma from "@/lib/prisma";
import type { FavoritableType } from "@/types";

export async function isFavorited(
  userId: string,
  favoritableType: FavoritableType,
  favoritableId: string
): Promise<boolean> {
  const favorite = await prisma.userFavorite.findUnique({
    where: {
      userId_favoritableType_favoritableId: {
        userId,
        favoritableType,
        favoritableId,
      },
    },
  });
  return !!favorite;
}

export async function toggleFavorite(
  userId: string,
  favoritableType: FavoritableType,
  favoritableId: string
): Promise<{ isFavorited: boolean }> {
  const existing = await prisma.userFavorite.findUnique({
    where: {
      userId_favoritableType_favoritableId: {
        userId,
        favoritableType,
        favoritableId,
      },
    },
  });

  if (existing) {
    await prisma.userFavorite.delete({ where: { id: existing.id } });
    return { isFavorited: false };
  } else {
    await prisma.userFavorite.create({
      data: { userId, favoritableType, favoritableId },
    });
    return { isFavorited: true };
  }
}
