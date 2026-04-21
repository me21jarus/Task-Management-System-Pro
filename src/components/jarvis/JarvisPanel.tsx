import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Trash2,
  MessageSquare,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { cn } from "../../lib/utils";
import { TypewriterEffect } from "../ui/TypewriterEffect";
import { useJarvis } from "../../hooks/useJarvis";

export function JarvisPanel() {
  const { messages, status, error, cooldownSeconds, sendMessage, clearHistory } = useJarvis();
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const isBusy = status === "thinking" || status === "cooldown";

  const handleSend = async () => {
    if (!inputText.trim() || isBusy) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="bg-surface border border-border rounded-xl flex flex-col h-full min-h-0 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-surface/50 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
              <MessageSquare size={16} className="text-primary" />
            </div>
            {/* Status Indicator */}
            <div className={cn(
              "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-surface",
              status === "idle" && "bg-success",
              status === "thinking" && "bg-warning animate-pulse",
              status === "speaking" && "bg-info animate-pulse",
              status === "error" && "bg-danger",
              status === "cooldown" && "bg-accent animate-pulse"
            )} />
          </div>
          <div>
            <p className="text-sm font-bold text-text flex items-center gap-2">
              Jarvis
              <span className="text-[9px] font-normal px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted border border-border" title="Jarvis is currently in text-only mode">Text-only</span>
            </p>
            <p className="text-[10px] text-text-muted font-medium capitalize">
              {status === "thinking" ? "Thinking..." : status === "cooldown" ? `Ready in ${cooldownSeconds}s` : status}
            </p>
          </div>
        </div>
        
        <button
          onClick={clearHistory}
          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          title="Clear chat"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center text-primary mb-2">
              <Sparkles size={24} />
            </div>
            <p className="text-sm font-semibold text-text">How can I help you today?</p>
            
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                "What's pending today?",
                "Add a high priority task",
                "Sort by due date",
                "Clear all filters"
              ].map(chip => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  className="px-3 py-1.5 text-xs bg-surface-elevated border border-border rounded-full text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary-soft transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex w-full",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm flex flex-col gap-1",
                msg.role === "user" 
                  ? "bg-primary text-white rounded-tr-none" 
                  : "bg-surface-elevated border border-border text-text rounded-tl-none"
              )}>
                {msg.role === "assistant" ? (
                  <TypewriterEffect words={msg.content} className="leading-relaxed" />
                ) : (
                  <p className="leading-relaxed">{msg.content}</p>
                )}
                <p className={cn(
                  "text-[9px] opacity-50",
                  msg.role === "user" ? "text-right" : "text-left"
                )}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
          
          {status === "thinking" && (
            <motion.div
              key="__jarvis_thinking__"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-start"
            >
              <div className="bg-surface-elevated border border-border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 h-[38px]">
                <motion.div
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="__jarvis_error__"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <div className="px-3 py-1 bg-danger/10 border border-danger/20 rounded-full flex items-center gap-2">
                <AlertCircle size={12} className="text-danger" />
                <span className="text-[10px] text-danger font-semibold">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border bg-bg/50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isBusy}
              placeholder={status === "cooldown" ? `Please wait ${cooldownSeconds}s…` : "Ask Jarvis anything…"}
              className={cn(
                "w-full pl-4 pr-10 py-2.5 rounded-xl text-sm transition-all",
                "bg-surface border border-border",
                "text-text placeholder:text-text-muted/40",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isBusy}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary-soft rounded-lg transition-colors disabled:opacity-0 disabled:scale-95 duration-200"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
