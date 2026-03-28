"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, X, Send } from "lucide-react";

interface ReportModalProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: (message: string) => void;
}

export function ReportModal({ isOpen, onClose, onConfirm }: ReportModalProps) {
   const [message, setMessage] = useState("");

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim()) return;
      onConfirm(message);
      setMessage("");
      onClose();
   };

   return (
      <AnimatePresence>
         {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               {/* Backdrop */}
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onClose}
                  className="absolute inset-0 bg-black/10 backdrop-blur-sm"
               />

               {/* Modal Content */}
               <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative w-full max-w-sm overflow-hidden rounded-[32px] border-2 border-black bg-white p-6 shadow-2xl space-y-4"
               >
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                           <Flag className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-black">Report Intel</h3>
                     </div>
                     <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
                     >
                        <X className="h-4 w-4 text-zinc-400" />
                     </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Why are you reporting this?</p>
                        <textarea
                           autoFocus
                           value={message}
                           onChange={(e) => setMessage(e.target.value)}
                           placeholder="Spam, inappropriate content, or misleading details..."
                           className="w-full min-h-[120px] rounded-xl border-2 border-black bg-white px-4 py-3 text-xs font-bold outline-none focus:bg-black focus:text-white transition-all resize-none shadow-sm"
                           required
                           minLength={5}
                           maxLength={1000}
                        />
                     </div>

                     <div className="flex gap-3">
                        <button
                           type="button"
                           onClick={onClose}
                           className="flex-1 rounded-xl border-2 border-black px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-black hover:bg-zinc-50 transition-all active:scale-95"
                        >
                           Cancel
                        </button>
                        <button
                           type="submit"
                           className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90 transition-all shadow-xl active:scale-95"
                        >
                           <Send className="h-3.5 w-3.5" />
                           Report
                        </button>
                     </div>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
   );
}
