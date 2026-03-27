"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Plus } from "lucide-react";

interface AutocompleteInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function AutocompleteInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  id,
  disabled,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const normalized = value.toLowerCase().trim();
    if (!normalized) return suggestions.slice(0, 5);
    
    return suggestions
      .filter((s) => s.toLowerCase().includes(normalized) && s.toLowerCase() !== normalized)
      .slice(0, 5);
  }, [value, suggestions]);

  const exactMatchFound = useMemo(() => {
    return suggestions.some(s => s.toLowerCase().trim() === value.toLowerCase().trim());
  }, [value, suggestions]);

  const showAddYours = !exactMatchFound && value.trim().length > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    const totalCount = filtered.length + (showAddYours ? 1 : 0);

    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => (prev + 1) % totalCount);
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => (prev - 1 + totalCount) % totalCount);
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        e.preventDefault();
        onChange(filtered[highlightedIndex]);
        setIsOpen(false);
      } else if (highlightedIndex === filtered.length && showAddYours) {
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={containerRef}>
      <p className="text-[9px] font-black uppercase tracking-widest text-black ml-1">
        {label}
      </p>
      <div className="relative group">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-xs font-bold outline-none transition-all placeholder:text-zinc-400 focus:bg-black focus:text-white disabled:opacity-50"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
          <ChevronDown className="h-3.5 w-3.5" />
        </div>

        <AnimatePresence>
          {isOpen && (filtered.length > 0 || showAddYours) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute left-0 right-0 top-full mt-1.5 z-[100] overflow-hidden rounded-xl border-2 border-black bg-white shadow-2xl"
            >
              <div className="p-1">
                {filtered.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      onChange(suggestion);
                      setIsOpen(false);
                      setHighlightedIndex(-1);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold transition-all rounded-lg ${
                      index === highlightedIndex ? "bg-black text-white" : "hover:bg-zinc-50 text-black"
                    }`}
                  >
                    <Search className="h-3 w-3 opacity-30" />
                    {suggestion}
                  </button>
                ))}

                {showAddYours && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => setHighlightedIndex(filtered.length)}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold transition-all rounded-lg mt-0.5 border-t border-zinc-100 ${
                      highlightedIndex === filtered.length ? "bg-zinc-100 text-black" : "text-black opacity-60"
                    }`}
                  >
                    <Plus className="h-3 w-3" />
                    Use &ldquo;{value}&rdquo;
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
