"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Volume2, VolumeX } from "lucide-react";

type AudioState = "waiting" | "playing" | "finished";

interface AmbientAudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
}

const AmbientAudioContext = createContext<AmbientAudioContextType>({
  isMuted: true,
  toggleMute: () => {},
});

export function useAmbientAudio() {
  return useContext(AmbientAudioContext);
}

export function AmbientAudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>("waiting");
  const hasTriggered = useRef(false);

  // Autoplay strategy: start muted (browsers allow this), then unmute
  useEffect(() => {
    const alreadyPlayed = sessionStorage.getItem("max-nautica-sound-played");
    if (alreadyPlayed === "true") {
      setAudioState("finished");
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.2;

    const startUnmuted = () => {
      if (hasTriggered.current || !audioRef.current) return;
      hasTriggered.current = true;
      audioRef.current.muted = false;
      audioRef.current.volume = 0.2;
      audioRef.current.play().then(() => {
        setAudioState("playing");
        setIsMuted(false);
      }).catch(() => {});
      window.removeEventListener("click", startUnmuted);
      window.removeEventListener("scroll", startUnmuted);
      window.removeEventListener("touchstart", startUnmuted);
    };

    // Step 1: Start muted autoplay (always allowed by browsers)
    audio.muted = true;
    audio.play().then(() => {
      // Step 2: Try to unmute immediately
      audio.muted = false;
      audio.volume = 0.2;

      // Step 3: Check if browser paused it after unmuting
      setTimeout(() => {
        if (audio.paused) {
          // Browser caught us — restart muted, wait for interaction
          audio.muted = true;
          audio.currentTime = 0;
          audio.play().catch(() => {});
          window.addEventListener("click", startUnmuted, { once: true });
          window.addEventListener("scroll", startUnmuted, { once: true });
          window.addEventListener("touchstart", startUnmuted, { once: true });
        } else {
          // Unmuted autoplay worked!
          hasTriggered.current = true;
          setAudioState("playing");
          setIsMuted(false);
        }
      }, 100);
    }).catch(() => {
      // Autoplay completely blocked — wait for interaction
      window.addEventListener("click", startUnmuted, { once: true });
      window.addEventListener("scroll", startUnmuted, { once: true });
      window.addEventListener("touchstart", startUnmuted, { once: true });
    });

    return () => {
      window.removeEventListener("click", startUnmuted);
      window.removeEventListener("scroll", startUnmuted);
      window.removeEventListener("touchstart", startUnmuted);
    };
  }, []);

  // Handle audio ended — mark as finished
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setAudioState("finished");
      setIsMuted(true);
      sessionStorage.setItem("max-nautica-sound-played", "true");
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current || audioState !== "playing") return;
    const newMuted = !isMuted;
    audioRef.current.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted, audioState]);

  return (
    <AmbientAudioContext.Provider value={{ isMuted, toggleMute }}>
      <audio
        ref={audioRef}
        src="/videos/hero-sea.mp4"
        playsInline
        preload="auto"
        style={{ display: "none" }}
      />
      {children}
      {audioState === "playing" && (
        <button
          onClick={toggleMute}
          className="fixed bottom-4 left-4 sm:left-6 z-40 p-3 rounded-full shadow-lg transition-all hover:scale-105 bg-white/80 backdrop-blur-sm text-[hsl(215,50%,12%)] hover:bg-white"
          aria-label={isMuted ? "Unmute ambient sound" : "Mute ambient sound"}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>
      )}
    </AmbientAudioContext.Provider>
  );
}
