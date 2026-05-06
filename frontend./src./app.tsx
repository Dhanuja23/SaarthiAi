import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Send, 
  Phone, 
  PhoneOff, 
  LayoutDashboard, 
  MessageSquare, 
  UserPlus, 
  TrendingUp, 
  Settings,
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- Types ---
interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface LeadStatus {
  score: "HOT" | "WARM" | "COLD" | "PENDING";
  summary: string;
  objections: string[];
  handoff: boolean;
  nextAction: string;
}

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard">("chat");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [leadStatus, setLeadStatus] = useState<LeadStatus>({
    score: "PENDING",
    summary: "",
    objections: [],
    handoff: false,
    nextAction: ""
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Dark Mode Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem("saarthi-dark-mode");
    if (saved === "true") setIsDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("saarthi-dark-mode", isDarkMode.toString());
  }, [isDarkMode]);

  // --- Scroll to bottom ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Speech Recognition Setup ---
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Multilingual support

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        handleSendMessage(text);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!isListening) {
      recognitionRef.current?.start();
      setIsListening(true);
    } else {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a good Indian English or Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find(v => v.lang.includes("IN")) || voices[0];
    if (indVoice) utterance.voice = indVoice;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });

      const data = await response.json();
      
      const aiMsg: Message = { role: "ai", content: data.reply, timestamp: new Date() };
      setMessages([...newMessages, aiMsg]);
      speak(data.reply);

      setLeadStatus({
        score: data.lead_score,
        summary: data.summary,
        objections: data.objections_detected,
        handoff: data.handoff,
        nextAction: data.next_action
      });
    } catch (err) {
      console.error("Chat Error:", err);
    }
  };

  const startCall = () => {
    setIsCalling(true);
    setMessages([]);
    setLeadStatus({ score: "PENDING", summary: "", objections: [], handoff: false, nextAction: "" });
    handleSendMessage("Start Call Initiation Sequence"); // Trigger greeting
  };

  const endCall = () => {
    setIsCalling(false);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">Saarthi AI</h1>
            <p className="text-xs text-slate-500 font-medium">Partner Lead Conversion Agent</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mr-4">
            <button 
              onClick={() => setActiveTab("chat")}
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === "chat" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200")}
            >
              Live Agent
            </button>
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === "dashboard" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200")}
            >
              Dashboard
            </button>
          </nav>
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full border bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {activeTab === "chat" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Chat Window */}
            <section className="lg:col-span-5 flex flex-col h-[75vh] bg-[var(--card)] rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", isCalling ? "bg-red-500" : "bg-slate-300")} />
                  <span className="font-bold text-[10px] uppercase text-slate-600 dark:text-slate-400 tracking-widest leading-none">
                    {isCalling ? "Live Call: Connected" : "Agent: Standby"}
                  </span>
                </div>
                {!isCalling ? (
                  <button 
                    onClick={startCall}
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all"
                  >
                    <Phone size={14} /> Start Call
                  </button>
                ) : (
                  <button 
                    onClick={endCall}
                    className="flex items-center gap-2 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs transition-all"
                  >
                    <PhoneOff size={14} /> End Call
                  </button>
                )}
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-blue-600">
                      <UserPlus size={32} />
                    </div>
                    <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">Start a call to initiate the Rupeezy partner conversion flow.</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}
                    >
                      <div className={cn(
                        "max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed",
                        m.role === "user" 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none"
                      )}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-slate-50 border-t dark:border-slate-800">
                <div className="relative flex items-center bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30 transition-all shadow-inner">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={isListening ? "Listening..." : "Type or use Mic..."}
                    disabled={!isCalling}
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm px-4 py-3 disabled:opacity-50"
                  />
                  <div className="flex gap-1 pr-3">
                    <button 
                      disabled={!isCalling}
                      onClick={toggleListening}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        isListening ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400",
                        "disabled:opacity-50"
                      )}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button 
                      onClick={() => handleSendMessage()}
                      disabled={!inputText.trim()}
                      className="p-2 text-blue-600 disabled:opacity-30 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Sidebar Stats / Info */}
            <aside className="lg:col-span-7 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lead Intelligence Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 text-center w-full">Lead Intelligence</h3>
                  
                  <div className="relative w-28 h-28 flex items-center justify-center mb-4">
                    <svg className="w-full h-full -rotate-90">
                      <circle 
                        cx="56" cy="56" r="48" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        className="text-slate-50 dark:text-slate-800"
                      />
                      <motion.circle 
                        cx="56" cy="56" r="48" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        strokeDasharray={301.6}
                        initial={{ strokeDashoffset: 301.6 }}
                        animate={{ strokeDashoffset: 301.6 - (301.6 * (leadStatus.score === "HOT" ? 0.94 : leadStatus.score === "WARM" ? 0.5 : 0.2)) }}
                        className={cn(
                          leadStatus.score === "HOT" ? "text-green-500" : leadStatus.score === "WARM" ? "text-orange-500" : "text-slate-300"
                        )}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={cn(
                        "text-2xl font-black",
                        leadStatus.score === "HOT" ? "text-green-600" : leadStatus.score === "WARM" ? "text-orange-600" : "text-slate-400"
                      )}>
                        {leadStatus.score === "PENDING" ? "-" : leadStatus.score}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{leadStatus.score === "PENDING" ? "Analyzing" : "Score"}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-2">
                    {leadStatus.score === "HOT" ? "Strong Intent Detected" : leadStatus.score === "WARM" ? "Interest Identified" : "Analyzing Intent..."}
                  </p>
                </div>

                {/* Objections Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Objections Handled</h3>
                  <div className="space-y-2">
                    {leadStatus.objections.length > 0 ? (
                      leadStatus.objections.map((o, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                          <CheckCircle2 size={14} className="text-blue-500" /> {o.replace('_', ' ')}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-[10px] font-semibold text-slate-300 uppercase italic">No Objections Yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary & Handoff Card */}
              <div className="bg-white dark:bg-slate-900 flex-1 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6">Call Summary & Handoff</h3>
                
                <AnimatePresence mode="wait">
                  {leadStatus.score !== "PENDING" ? (
                    <motion.div 
                      key="summary-content"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6 flex-1 overflow-y-auto pr-1"
                    >
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
                        <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-2">AI Analysis</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                          {leadStatus.summary}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Next Action</h4>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{leadStatus.nextAction}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Handoff Status</h4>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{leadStatus.handoff ? "Ready" : "Follow-up Required"}</p>
                        </div>
                      </div>

                      {leadStatus.handoff ? (
                        <div className="flex items-center justify-between p-4 bg-green-600 rounded-2xl text-white shadow-lg shadow-green-200 dark:shadow-none">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                              <UserPlus size={20} />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Scheduled Meeting</p>
                              <p className="text-sm font-bold">Transfer to RM: Rajesh K.</p>
                            </div>
                          </div>
                          <button className="px-4 py-2 bg-white text-green-600 rounded-xl text-xs font-bold shadow-sm">Confirm</button>
                        </div>
                      ) : leadStatus.score === "WARM" && (
                        <button className="w-full flex items-center justify-between p-4 bg-slate-900 dark:bg-blue-600 rounded-2xl text-white">
                          <div className="flex items-center gap-3">
                             <MessageSquare size={18} />
                             <span className="text-xs font-bold uppercase tracking-widest">Send WhatsApp Link</span>
                          </div>
                          <ExternalLink size={16} />
                        </button>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                       <Clock size={40} className="mb-4" />
                       <p className="text-xs font-bold uppercase tracking-widest">Awaiting Analysis...</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </div>
        ) : (

          /* Dashboard View */
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Total Leads", value: "1,248", change: "+12%", icon: UserPlus, color: "text-blue-600" },
                { label: "Hot Candidates", value: "84", change: "+5%", icon: TrendingUp, color: "text-red-600" },
                { label: "Warm Leads", value: "432", change: "+18%", icon: Clock, color: "text-orange-600" },
                { label: "Success Rate", value: "8.4%", change: "+2%", icon: CheckCircle2, color: "text-green-600" },
              ].map((stat, i) => (
                <div key={i} className="bg-[var(--card)] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                  <div className={cn("p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 mb-4", stat.color)}>
                    <stat.icon size={24} />
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
                  <h4 className="text-2xl font-black mt-1">{stat.value}</h4>
                  <span className="text-[10px] font-black text-green-500 mt-1">{stat.change} vs LW</span>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[var(--card)] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-sm mb-6 uppercase tracking-wider text-slate-500">Weekly Performance</h3>
                <div className="h-64 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { name: 'Mon', hot: 12, warm: 40 },
                      { name: 'Tue', hot: 25, warm: 65 },
                      { name: 'Wed', hot: 18, warm: 45 },
                      { name: 'Thu', hot: 30, warm: 55 },
                      { name: 'Fri', hot: 45, warm: 70 },
                      { name: 'Sat', hot: 12, warm: 30 },
                      { name: 'Sun', hot: 8, warm: 20 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="hot" stroke="#2563eb" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="warm" stroke="#64748b" strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[var(--card)] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm mb-6 uppercase tracking-wider text-slate-500">Conversion Funnel</h3>
                  <div className="space-y-6">
                    {[
                      { label: "Phone Calls Initiated", count: 1248, percent: 100 },
                      { label: "Interest Detected", count: 850, percent: 68 },
                      { label: "Successfully Pitched", count: 420, percent: 33 },
                      { label: "RM Handoff (Hot)", count: 84, percent: 6 },
                    ].map((step, i) => (
                      <div key={i} className="relative">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="font-bold">{step.label}</span>
                          <span className="text-slate-400">{step.count}</span>
                        </div>
                        <div className="h-6 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden flex items-center px-4 relative">
                          <div 
                            className={cn("absolute left-0 h-full transition-all duration-1000", i === 0 ? "bg-blue-600" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-blue-400" : "bg-blue-300")} 
                            style={{ width: `${step.percent}%` }} 
                          />
                          <span className="relative z-10 text-[9px] text-white font-black uppercase">{step.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation Log Table (Partial/Mock) */}
            <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <div className="p-6 border-b dark:border-slate-800">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Recent Conversations</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <tr>
                       <th className="px-6 py-4">Lead Phone</th>
                       <th className="px-6 py-4">Language</th>
                       <th className="px-6 py-4">Top Objection</th>
                       <th className="px-6 py-4">Lead Score</th>
                       <th className="px-6 py-4">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y dark:divide-slate-800">
                     {[
                       { phone: "+91 98xx xxxx10", lang: "Hindi", obj: "Profit Sharing", score: "HOT", status: "Handed Over" },
                       { phone: "+91 88xx xxxx45", lang: "English", obj: "Trust/Safety", score: "WARM", status: "Follow up" },
                       { phone: "+91 99xx xxxx89", lang: "Hinglish", obj: "N/A", score: "HOT", status: "Handed Over" },
                       { phone: "+91 76xx xxxx23", lang: "Hindi", obj: "Already using", score: "COLD", status: "Closed" },
                     ].map((row, i) => (
                       <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="px-6 py-4 font-mono font-medium">{row.phone}</td>
                         <td className="px-6 py-4 uppercase text-[10px] font-black tracking-tighter text-blue-600">{row.lang}</td>
                         <td className="px-6 py-4 text-slate-500">{row.obj}</td>
                         <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                              row.score === "HOT" ? "bg-red-100 text-red-600" : row.score === "WARM" ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"
                            )}>
                              {row.score}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-xs font-semibold">{row.status}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-6 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-7xl mx-auto w-full px-8 pb-8">
        <div className="flex gap-6">
          <span>System v1.2.4</span>
          <span>Ready: Hindi, English, Hinglish</span>
        </div>
        <div> @2026 Rupeezy</div>
      </footer>
    </div>
  );
}
