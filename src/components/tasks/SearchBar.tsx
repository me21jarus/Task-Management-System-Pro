import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface SearchBarProps {
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onSearch, placeholder = "Search tasks..." }: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value);

  // Sync internal value with external prop (e.g. when filters are cleared)
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced search update handled in PersonalDashboard or hook, 
  // but we can also debounce here if needed. 
  // For now, we'll pass the value up immediately to feel "instant" 
  // as per requirement "Typing in search bar feels instant".
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInternalValue(newVal);
    onSearch(newVal);
  };

  const handleClear = () => {
    setInternalValue("");
    onSearch("");
  };

  return (
    <div className="relative flex-1 group">
      <Search
        size={18}
        className={cn(
          "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200",
          internalValue ? "text-primary" : "text-text-muted/60"
        )}
      />
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "w-full pl-11 pr-11 py-3 rounded-xl text-sm font-medium",
          "bg-surface border border-border shadow-sm",
          "text-text placeholder:text-text-muted/50",
          "transition-all duration-300",
          "focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30",
          "group-hover:border-border/80"
        )}
      />
      {internalValue && (
        <button
          onClick={handleClear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-muted/40 hover:text-text hover:bg-surface-elevated transition-all"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
