import { useState, useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, MessageSquare, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { subscribeToComments, addComment } from "../../lib/firestore";
import { logger } from "../../lib/logger";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import type { Comment } from "../../types/team";
import { formatDistanceToNow } from "date-fns";

interface CommentThreadProps {
  teamId: string;
  taskId: string;
}

const CommentItem = memo(({ comment, isCurrentUser, index }: { comment: Comment, isCurrentUser: boolean, index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar placeholder */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center overflow-hidden">
          <User size={16} className="text-text-muted" />
        </div>
      </div>

      <div className={`max-w-[80%] flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            {comment.authorName}
          </span>
          <span className="text-[10px] text-text-muted font-mono">
            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
          </span>
        </div>
        
        <div 
          className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
            isCurrentUser 
            ? 'bg-primary text-white rounded-tr-none' 
            : 'bg-surface-elevated text-text border border-border rounded-tl-none'
          }`}
        >
          {comment.text}
        </div>
      </div>
    </motion.div>
  );
});

export function CommentThread({ teamId, taskId }: CommentThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToComments(teamId, taskId, (fetchedComments) => {
      setComments(fetchedComments);
      setLoading(false);
      // Scroll to bottom on new message
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [teamId, taskId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSending(true);
    try {
      await addComment(teamId, taskId, {
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        text: newComment.trim(),
        attachments: [], // TODO: support attachments
      });
      setNewComment("");
    } catch (err) {
      logger.error("Failed to send comment:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 mb-4 pr-2 custom-scrollbar">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-bg flex items-center justify-center rounded-full mb-4">
              <MessageSquare size={24} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">No comments yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              isCurrentUser={comment.authorId === user?.uid} 
              index={index} 
            />
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="relative mt-auto pt-4 border-t border-border">
        {/* Aceternity-inspired subtle cards/illustrations accent would be better as an overlay or bg, 
            but for now let's keep it clean and functional */}
        <div className="flex items-end gap-2 bg-surface p-2 rounded-xl border-2 border-border focus-within:border-primary/30 transition-all">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="p-2 text-text-muted hover:text-primary h-auto"
          >
            <Paperclip size={18} />
          </Button>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none py-2 max-h-32 min-h-[40px] custom-scrollbar"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={!newComment.trim() || isSending}
            className="rounded-lg h-10 w-10 p-0"
          >
            <Send size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
}
