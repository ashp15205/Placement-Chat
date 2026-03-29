"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, type = "success", isVisible, onClose }: ToastProps) {
  const Icon = type === "success" ? CheckCircle2 : type === "error" ? XCircle : Info;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, x: 20, scale: 0.9 }}
          className={cn(
            "fixed top-6 right-6 z-[100] flex min-w-[280px] items-center gap-4 rounded-[20px] border-2 p-4 shadow-2xl backdrop-blur-xl transition-all",
            type === "success" && "border-emerald-500/20 bg-white/90 text-emerald-900",
            type === "error" && "border-rose-500/20 bg-white/90 text-rose-900",
            type === "info" && "border-slate-500/20 bg-white/90 text-slate-900"
          )}
        >
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-inner",
            type === "success" && "bg-emerald-500 text-white",
            type === "error" && "bg-rose-500 text-white",
            type === "info" && "bg-slate-900 text-white"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 pr-4">
            <p className="text-[11px] font-black uppercase tracking-widest opacity-40">Notification</p>
            <p className="text-sm font-bold tracking-tight">{message}</p>
          </div>

          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/50 text-slate-400 transition-all hover:bg-slate-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          
          {/* Progress Bar (Subtle) */}
          <motion.div 
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 3, ease: "linear" }}
            className={cn(
              "absolute bottom-0 left-4 right-4 h-0.5 origin-left rounded-full",
              type === "success" && "bg-emerald-500/30",
              type === "error" && "bg-rose-500/30",
              type === "info" && "bg-slate-900/10"
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
