"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { FavoritableType } from "@/types";

interface FavoriteButtonProps {
  type: FavoritableType;
  id: string;
  initialFavorited?: boolean;
  variant?: "icon" | "button";
  className?: string;
}

export function FavoriteButton({
  type,
  id,
  initialFavorited = false,
  variant = "button",
  className,
}: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (status === "loading") return;

    if (!session) {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    setIsLoading(true);
    const previousState = isFavorited;
    setIsFavorited(!isFavorited);

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });

      if (!response.ok) {
        setIsFavorited(previousState);
      } else {
        const data = await response.json();
        setIsFavorited(data.isFavorited);
      }
    } catch {
      setIsFavorited(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg
      className={cn("h-5 w-5", filled ? "text-red-500" : "text-gray-400")}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50",
          className
        )}
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        <HeartIcon filled={isFavorited} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors disabled:opacity-50",
        isFavorited
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        className
      )}
    >
      <HeartIcon filled={isFavorited} />
      <span>{isFavorited ? "Saved" : "Save"}</span>
    </button>
  );
}
