"use client";

import { useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, Send, Eye } from "lucide-react";
import { formatNumber, timeAgo } from "@/lib/mock-data";
import type { Comment } from "@/lib/mock-data";

interface PostInteractionsProps {
  readonly initialLikes: number;
  readonly initialCommentCount: number;
  readonly initialViewCount?: number;
  readonly initialComments: readonly Comment[];
  readonly isLocked: boolean;
  readonly postUrl: string;
}

export function PostInteractions({
  initialLikes,
  initialCommentCount,
  initialViewCount,
  initialComments,
  isLocked,
  postUrl,
}: PostInteractionsProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [comments, setComments] = useState<Comment[]>([...initialComments]);
  const [commentText, setCommentText] = useState("");
  const [shareFeedback, setShareFeedback] = useState(false);

  const handleToggleLike = useCallback(() => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  }, [liked]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${postUrl}`
      );
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    } catch {
      // Fallback
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

  const handleSubmitComment = useCallback(() => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    const newComment: Comment = {
      id: `local-${Date.now()}`,
      username: "you",
      displayName: "You",
      avatarUrl: "",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment]);
    setCommentText("");
  }, [commentText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmitComment();
      }
    },
    [handleSubmitComment]
  );

  return (
    <>
      {/* Actions Bar */}
      <div className="mb-6 flex items-center gap-6 border-b border-t border-gray-200 py-3">
        <button
          className={`flex items-center gap-2 transition-colors ${
            liked
              ? "text-red-500"
              : "text-gray-400 hover:text-[#00AFF0]"
          }`}
          aria-label={`Like this post. ${formatNumber(likeCount)} likes`}
          aria-pressed={liked}
          onClick={handleToggleLike}
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
          <span className="text-sm">{formatNumber(likeCount)}</span>
        </button>
        <div
          className="flex items-center gap-2 text-gray-400"
          aria-label={`${formatNumber(initialCommentCount + comments.length - initialComments.length)} comments`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">
            {formatNumber(
              initialCommentCount + comments.length - initialComments.length
            )}
          </span>
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
          Comments (
          {formatNumber(
            initialCommentCount + comments.length - initialComments.length
          )}
          )
        </h2>

        {/* Comment Input */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
              ?
            </div>
          </div>
          <div className="flex flex-1 items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              aria-label="Write a comment"
              disabled={isLocked}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="ml-2 text-[#00AFF0] transition-colors hover:text-[#33C1F5] disabled:text-gray-300"
              aria-label="Submit comment"
              disabled={isLocked || !commentText.trim()}
              onClick={handleSubmitComment}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Comment List */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-[#00AFF0]/20">
                  <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-600">
                    {comment.displayName.charAt(0)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {comment.displayName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {comment.text}
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
