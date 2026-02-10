"use client";

import { useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import ResultCard from "@/components/ResultCard";
import { useHistory } from "@/hooks/useHistory";
import { History, Music, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

export default function Home() {
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // Track recording state
  const { history, addToHistory, removeFromHistory, clearHistory } = useHistory();

  const handleAudioCaptured = async (audioBlob) => {
    setIsAnalyzing(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");

    try {
      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.result);
        addToHistory(data.result);
      } else if (response.status === 404) {
        console.log("No match found by API");
        alert("No song identified. Please try getting closer to the speaker or recording longer.");
      } else {
        console.error("Server Error:", data);
        alert(`Server Error: ${data.details || data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Detection error:", error);
      alert(`Application Error: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-24 relative overflow-hidden transition-colors duration-1000">
      {/* Background Ambience - Dynamic based on state */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div
          className={clsx(
            "absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-all duration-1000",
            isRecording ? "bg-red-600/30 scale-125" : isAnalyzing ? "bg-amber-500/30 animate-pulse" : "bg-purple-600/20"
          )}
        />
        <div
          className={clsx(
            "absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-all duration-1000",
            isRecording ? "bg-orange-600/30 scale-125" : isAnalyzing ? "bg-yellow-500/30 animate-pulse" : "bg-blue-600/20"
          )}
        />
      </div>

      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/5">
            <Music className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest uppercase bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent font-sans">
            EchoRec
          </h1>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors backdrop-blur-md group"
        >
          <History className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
        </button>
      </header>

      {/* Main Content using AnimatePresence for smooth transitions */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative">
        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 h-[60vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Recent Scans
                </h2>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300">
                    Clear
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {history.length === 0 ? (
                  <p className="text-center text-muted-foreground mt-10">No history yet</p>
                ) : (
                  history.map((item, i) => (
                    <div key={i} className="flex gap-3 items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group/item">
                      <div className="h-10 w-10 relative rounded-lg overflow-hidden shrink-0">
                        <img src={item.coverArt} alt={item.title} className="object-cover w-full h-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.artist}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <a href={item.youtubeLink} target="_blank" className="p-2 hover:bg-white/10 rounded-full text-muted-foreground hover:text-white" title="Open in YouTube">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromHistory(i);
                          }}
                          className="p-2 hover:bg-red-500/20 rounded-full text-muted-foreground hover:text-red-400"
                          title="Remove from history"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowHistory(false)}
                className="w-full mt-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-medium transition-colors"
              >
                Back to Scanner
              </button>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center"
            >
              <ResultCard result={result} />
              <button
                onClick={() => setResult(null)}
                className="mt-8 px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all font-medium flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Scan Another
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="recorder"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <AudioRecorder
                onAudioCaptured={handleAudioCaptured}
                isAnalyzing={isAnalyzing}
                onRecordingStateChange={setIsRecording} // Pass state setter
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-12 text-center text-sm text-muted-foreground/50 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <p>Powered by Shazam & YouTube</p>
      </footer>
    </main>
  );
}

// Helper icons
function ExternalLink(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
