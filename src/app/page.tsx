"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat, Search, Loader2, Music, Download } from "lucide-react";

export default function SpotifyPlayer() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- HANDLER SEARCH ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setIsSearching(true);
    setResults([]); 
    
    try {
      // Panggil API lokal kita
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data.status && data.result) {
        setResults(data.result);
      } else {
        setResults([]);
        // Optional: Tampilkan pesan error jika data.message ada
      }
    } catch (e) { 
      console.error(e); 
      setResults([]);
    } finally { 
      setIsSearching(false); 
    }
  };

  // --- HANDLER PLAY & DOWNLOAD ---
  const playTrack = async (track: any) => {
    // Reset state player
    setIsPlaying(false);
    if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }

    // Tampilkan info lagu dulu (loading state untuk audio)
    setCurrentTrack({
        title: track.title,
        artist: track.artist,
        image: track.thumbnail,
        url: "", // URL Audio kosong dulu
        originalUrl: track.track_url,
        isLoading: true
    });

    try {
        // Panggil API Download lokal
        const res = await fetch(`/api/download?url=${encodeURIComponent(track.track_url)}`);
        const data = await res.json();
        
        if(data.status && data.result?.download_url) {
            setCurrentTrack((prev: any) => ({
                ...prev,
                url: data.result.download_url,
                isLoading: false
            }));
            
            // Auto play setelah URL didapat
            setTimeout(() => { 
                if(audioRef.current) {
                    audioRef.current.load();
                    audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
                    setIsPlaying(true); 
                }
            }, 500);
        } else {
            alert("Gagal mengambil audio: " + (data.message || "Unknown error"));
            setCurrentTrack((prev: any) => ({ ...prev, isLoading: false }));
        }
    } catch(e) { 
        console.error(e);
        alert("Terjadi kesalahan jaringan."); 
        setCurrentTrack((prev: any) => ({ ...prev, isLoading: false }));
    }
  };

  const handleNext = () => {
    if (!currentTrack || results.length === 0) return;
    const currentIndex = results.findIndex(r => r.title === currentTrack.title);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % results.length;
    playTrack(results[nextIndex]);
  };

  const handlePrev = () => {
    if (!currentTrack || results.length === 0) return;
    const currentIndex = results.findIndex(r => r.title === currentTrack.title);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + results.length) % results.length;
    playTrack(results[prevIndex]);
  };

  const onTimeUpdate = () => {
    if(audioRef.current) {
        setProgress(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if(audioRef.current) { audioRef.current.currentTime = val; setProgress(val); }
  };

  const formatTime = (time: number) => {
    if(isNaN(time)) return "0:00";
    const m = Math.floor(time/60);
    const s = Math.floor(time%60);
    return `${m}:${s<10?'0':''}${s}`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-24 p-6 relative bg-gradient-to-br from-slate-100 to-slate-200 overflow-x-hidden">
      
      {/* Header */}
      <motion.div initial={{y:-50, opacity:0}} animate={{y:0, opacity:1}} className="text-center mb-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-800 drop-shadow-sm">
              SYLVA<span className="text-[#6495ED]">.</span>MUSIC
          </h1>
      </motion.div>

      {/* Search Section */}
      <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="w-full max-w-md relative mb-8 z-30">
          <form onSubmit={handleSearch} className="relative group z-30">
              <input 
                  type="text" 
                  value={query}
                  onChange={(e)=>setQuery(e.target.value)}
                  placeholder="Search song..." 
                  className="w-full bg-white/70 backdrop-blur-xl border border-white/60 text-slate-700 rounded-2xl py-4 pl-12 pr-12 focus:border-[#6495ED] transition-all outline-none shadow-xl placeholder-slate-400"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <button type="submit" disabled={isSearching} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#6495ED] rounded-xl text-white hover:bg-blue-500 transition disabled:opacity-50">
                  {isSearching ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>}
              </button>
          </form>

          {/* Search Results Dropdown */}
          <AnimatePresence>
              {results.length > 0 && (
                  <motion.div 
                    initial={{opacity:0, y:10}} 
                    animate={{opacity:1, y:0}} 
                    exit={{opacity:0}} 
                    className="absolute top-full mt-2 left-0 w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl max-h-80 overflow-y-auto shadow-2xl z-40 scrollbar-hide"
                  >
                      {results.map((track, i) => (
                          <div key={i} onClick={()=>playTrack(track)} className="flex items-center gap-4 p-3 hover:bg-[#6495ED]/10 cursor-pointer border-b border-slate-100 transition-colors last:border-0">
                              <img src={track.thumbnail} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt={track.title} />
                              <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-700 truncate text-sm">{track.title}</p>
                                  <p className="text-xs text-slate-500 truncate">{track.artist}</p>
                              </div>
                              <Play size={16} className="text-[#6495ED]" />
                          </div>
                      ))}
                  </motion.div>
              )}
          </AnimatePresence>
      </motion.div>

        {/* Player Section */}
      <AnimatePresence mode="wait">
          {currentTrack ? (
              <motion.div 
                  key="player"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-[350px] relative z-10"
              >
                  <div className="relative bg-white/40 backdrop-blur-md rounded-[32px] border border-white/50 p-6 flex flex-col gap-5 shadow-2xl">
                      {/* Album Art */}
                      <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/20 relative group">
                          <img 
                              src={currentTrack.image} 
                              alt="Cover"
                              className={`w-full h-full object-cover transition-transform duration-[10s] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`} 
                          />
                          {/* Loading Overlay */}
                          {currentTrack.isLoading && (
                             <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-sm gap-2">
                                <Loader2 className="animate-spin text-white" size={40} />
                                <span className="text-white text-xs font-mono">CONVERTING...</span>
                             </div>
                          )}
                      </div>

                      {/* Title & Artist */}
                      <div className="flex justify-between items-end">
                          <div className="flex-1 overflow-hidden mr-4">
                              <h2 className="font-bold text-xl text-slate-800 truncate">{currentTrack.title}</h2>
                              <p className="text-slate-500 text-sm truncate">{currentTrack.artist}</p>
                          </div>
                          <Heart className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer" />
                      </div>

                      {/* Progress Bar */}
                      <div className="group">
                          <input 
                              type="range" min="0" max={duration||0} value={progress} onChange={handleSeek}
                              disabled={!currentTrack.url}
                              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#6495ED] [&::-webkit-slider-thumb]:rounded-full disabled:opacity-50"
                          />
                          <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                              <span>{formatTime(progress)}</span>
                              <span>{formatTime(duration)}</span>
                          </div>
                      </div>

                      {/* Controls */}
                      <div className="flex justify-between items-center px-2">
                           <Shuffle size={20} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                           <div className="flex items-center gap-6">
                              <button onClick={handlePrev} className="text-slate-400 hover:text-slate-800 transition-colors">
                                  <SkipBack size={28} fill="currentColor" />
                              </button>
                              
                              <button 
                                onClick={() => {
                                  if(!currentTrack.url) return;
                                  if(isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
                                  else { audioRef.current?.play(); setIsPlaying(true); }
                                }} 
                                disabled={!currentTrack.url}
className="w-16 h-16 bg-[#6495ED] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl text-white disabled:bg-slate-300 disabled:scale-100"
                              >
                                  {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" className="ml-1"/>}
                              </button>

                              <button onClick={handleNext} className="text-slate-400 hover:text-slate-800 transition-colors">
                                  <SkipForward size={28} fill="currentColor" />
                              </button>
                           </div>
                           <Repeat size={20} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                      </div>
                      
                      {/* Download Button */}
                      {currentTrack.url && (
                        <a href={currentTrack.url} download target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full text-center py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-xs font-bold text-[#6495ED] cursor-pointer">
                            <Download size={16} /> DOWNLOAD MP3
                        </a>
                      )}
                  </div>
              </motion.div>
          ) : (
              // Empty State
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-slate-400 flex flex-col items-center gap-4 relative z-10 mt-10">
                  <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center border border-white/40">
                      <Music size={24} />
                  </div>
                  <p className="font-mono text-xs tracking-widest uppercase">Start by searching a song</p>
              </motion.div>
          )}
      </AnimatePresence>

      <audio ref={audioRef} src={currentTrack?.url} onTimeUpdate={onTimeUpdate} onEnded={handleNext} />
    </div>
  );
}                   
