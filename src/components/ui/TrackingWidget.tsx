import { useState, useEffect } from 'react';
import { Search, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TrackingWidgetProps {
  onTrack: (containerId: string) => void;
}

export const TrackingWidget: React.FC<TrackingWidgetProps> = ({ onTrack }) => {
  const [searchQuery, setSearchQuery] = useState('IN-2026-61C2');
  const [typedMessage, setTypedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const fullMessage =
    '🚨 ACTIVE INCIDENT IN-2026-61C2: 75 m³ petroleum slick detected off Kandla Deepwater Fairway. Reverse drift correlated to MT OCEAN PRIDE (MMSI: 419000881, Attribution Compatibility: 91.4%).';

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onTrack(searchQuery.trim());
      triggerTyping();
    }
  };

  const triggerTyping = () => {
    setIsTyping(true);
    setTypedMessage('');
    let idx = 0;
    const interval = setInterval(() => {
      setTypedMessage(fullMessage.slice(0, idx));
      idx++;
      if (idx > fullMessage.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 18);
  };

  useEffect(() => {
    // Initial typing reveal on mount
    const timer = setTimeout(triggerTyping, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-xl w-full pointer-events-auto space-y-2">
      <form
        id="tracking-widget"
        onSubmit={handleTrack}
        className="p-1.5 sm:p-2 rounded-2xl flex items-center gap-2 w-full transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.09)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 20px 40px -15px rgba(5, 10, 30, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        }}
      >
        <div className="pl-3 text-slate-400">
          <Search className="w-4 h-4 text-[#FF9933]" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Vessel MMSI, IMO or Incident ID (e.g. IN-2026-61C2)..."
          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-300/60 focus:outline-none font-mono-code"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #FF9933 0%, #E67E22 100%)',
            boxShadow: '0 4px 14px -2px rgba(255, 153, 51, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
          }}
        >
          <span>Scan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Typing-Style Conversational Status Result */}
      {typedMessage && (
        <div
          className="px-4 py-2.5 rounded-xl border border-white/10 flex items-start gap-2.5 text-xs font-mono-code animate-fade-in"
          style={{
            background: 'rgba(5, 10, 30, 0.75)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-slate-200">
            {typedMessage}
            {isTyping && <span className="inline-block w-1.5 h-3 bg-[#FF9933] ml-1 animate-pulse" />}
          </p>
        </div>
      )}
    </div>
  );
};
