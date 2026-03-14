"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, Send, Eye, Trash2 } from "lucide-react";
import { formatNumber, timeAgo } from "@/lib/mock-data";

interface ApiComment {
  readonly id: number;
  readonly body: string;
  readonly created_at: string;
  readonly user_id: string;
  readonly username: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
}

interface PostInteractionsProps {
  readonly postId: number;
  readonly initialLikes: number;
  readonly initialCommentCount: number;
  readonly initialViewCount?: number;
  readonly isLocked: boolean;
  readonly postUrl: string;
  readonly currentUserId?: string | null;
}

export function PostInteractions({
  postId,
  initialLikes,
  initialCommentCount,
  initialViewCount,
  isLocked,
  postUrl,
  currentUserId,
}: PostInteractionsProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [commentText, setCommentText] = useState("");
  const [shareFeedback, setShareFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const hasFetchedRef = useRef(false);

  // Fetch initial like status and comments
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // Check if user has liked this post
    fetch(`/api/posts/${postId}/like`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.liked === "boolean") {
          setLiked(data.liked);
        }
      })
      .catch(() => {
        // Not logged in or error — default to not liked
      });

    // Fetch comments
    setLoadingComments(true);
    fetch(`/api/posts/${postId}/comments?limit=50`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setComments(data.data);
        }
      })
      .catch(() => {
        // Failed to load comments
      })
      .finally(() => setLoadingComments(false));
  }, [postId]);

  const handleToggleLike = useCallback(async () => {
    if (likeLoading) return;

    // Optimistic update
    const wasLiked = liked;
    const prevCount = likeCount;
    setLiked(!wasLiked);
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1);
    setLikeLoading(true);

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likes_count);
      } else {
        // Revert on error
        setLiked(wasLiked);
        setLikeCount(prevCount);
      }
    } catch {
      // Revert on network error
      setLiked(wasLiked);
      setLikeCount(prevCount);
    } finally {
      setLikeLoading(false);
    }
  }, [liked, likeCount, likeLoading, postId]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${postUrl}`,
      );
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = `${window.location.origin}${postUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    }
  }, [postUrl]);

  const handleSubmitComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });

      if (res.ok || res.status === 201) {
        const data = await res.json();
        if (data.data) {
          setComments((prev) => [data.data, ...prev]);
          setCommentCount((prev) => prev + 1);
          setCommentText("");
        }
      }
    } catch {
      // Failed to submit comment
    } finally {
      setSubmitting(false);
    }
  }, [commentText, submitting, postId]);

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      try {
        const res = await fetch(
          `/api/posts/${postId}/comments/${commentId}`,
          { method: "DELETE" },
        );

        if (res.ok) {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          setCommentCount((prev) => Math.max(prev - 1, 0));
        }
      } catch {
        // Failed to delete comment
      }
    },
    [postId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmitComment();
      }
    },
    [handleSubmitComment],
  );

  return (
    <>
      {/* Actions Bar */}
      <div className="mb-6 flex items-center gap-6 border-b border-t border-gray-200 py-3">
        <button
          className={`flex items-center gap-2 transition-colors ${
            liked
              ? "text-red-500"
              : "text-gray-400 hover:text-red-400"
          }`}
          aria-label={`Like this post. ${formatNumber(likeCount)} likes`}
          aria-pressed={liked}
          onClick={handleToggleLike}
          disabled={likeLoading}
        >
          <Heart
            className={`h-5 w-5 transition-transform ${liked ? "fill-current scale-110" : ""} ${likeLoading ? "opacity-50" : ""}`}
          />
          <span className="text-sm">{formatNumber(likeCount)}</span>
        </button>
        <div
          className="flex items-center gap-2 text-gray-400"
          aria-label={`${formatNumber(commentCount)} comments`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">{formatNumber(commentCount)}</span>
        </div>
        {initialViewCount != null && (
          <div
            className="flex items-center gap-2 text-gray-400"
            aria-label={`${formatNumber(initialViewCount)} views`}
          >
            <Eye className="h-5 w-5" />
            <span className="text-sm">{formatNumber(initialViewCount)}</span>
          </div>
        )}
        <button
          className="relative ml-auto text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Share this post"
          onClick={handleShare}
        >
          <Share2 className="h-5 w-5" />
          {shareFeedback && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-emerald-600 px-2 py-1 text-xs text-white">
              Link copied!
            </span>
          )}
        </button>
      </div>

      {/* Comments Section */}
      <section aria-label="Comments">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Comments ({formatNumber(commentCount)})
        </h2>

        {/* Comment Input */}
        {!isLocked && (
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                {currentUserId ? "Y" : "?"}
              </div>
            </div>
            <div className="flex flex-1 items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
              <input
                type="text"
                placeholder={currentUserId ? "Add a comment..." : "Log in to comment"}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                aria-label="Write a comment"
                disabled={!currentUserId || submitting}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={1000}
              />
              <button
                className="ml-2 text-[#00AFF0] transition-colors hover:text-[#33C1F5] disabled:text-gray-300"
                aria-label="Submit comment"
                disabled={!currentUserId || !commentText.trim() || submitting}
                onClick={handleSubmitComment}
              >
                <Send className={`h-4 w-4 ${submitting ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>
        )}

        {/* Comment List */}
        {loadingComments ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Loading comments...
          </p>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="group flex gap-3">
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-[#00AFF0]/20">
                  {comment.avatar_url ? (
                    <img
                      src={comment.avatar_url}
                      alt={comment.display_name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-600">
                      {comment.display_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {comment.display_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      @{comment.username}
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(comment.created_at)}
                    </span>
                    {currentUserId === comment.user_id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="ml-auto text-gray-300 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {comment.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">
            No comments yet. Be the first to comment.
          </p>
        )}
      </section>
    </>
  );
}
