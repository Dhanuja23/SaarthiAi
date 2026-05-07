import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, Activity, Moon, Sun, Shield, Globe, 
  ChevronRight, AlertCircle, FileText, Share2, 
  Wind, Zap, HeartPulse, Stethoscope, Languages, CloudOff,
  Database, ZapOff, CheckCircle2, Quote, MessageSquare, Send, X, Bot
} from 'lucide-react';
// Change GiBrainShield to GiBrain or GiArtificialIntelligence
import { GiBrain, GiArtificialIntelligence } from 'react-icons/gi';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { GoogleGenerativeAI } from "@google/generative-ai";

// This links your secret key to the AI "brain"
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [step, setStep] = useState('idle'); // idle, recording, form, analyzing, report
  const [report, setReport] = useState(null);
  const [progress, setProgress] = useState(0);
  const [lang, setLang] = useState("EN");
  const [formData, setFormData] = useState({
    gender: "",
    symptoms: []
  });

  // CHATBOT STATES
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: 'Hello! I am your Swaas Assistant. How can I help with your health today?' }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const analysisRef = useRef(null);
  const featuresRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // FULL TRANSLATION DICTIONARY
  const t = {
    EN: {
      home: "Home",
      features: "Features",
      about: "About",
      start: "Start Analysis",
      heroTitle: <>Early Detection <br /> <span className="text-blue-600">Saves Lives!</span></>,
      heroDesc: "Swaas AI provides instant, accessible respiratory screening by analyzing lung sounds and symptoms to deliver personalized risk reports and precautions.",
      scanBtn: "SCAN LUNGS NOW",
      diagHeader: "Health Diagnostics",
      micText: "Tap the mic to start recording",
      processing: "AI Processing",
      procDesc: "Analyzing lung frequencies and symptom data...",
      aboutHeader: "Bridging Healthcare Access Gaps",
      aboutSub: "SWAAS AI uses acoustic biomarkers and deep learning to identify respiratory distress before it becomes critical.",
      mission: "Our mission is to democratize early-stage lung diagnostics for every rural community through offline-first AI technology."
    },
    KN: {
      home: "ಮನೆ",
      features: "ವೈಶಿಷ್ಟ್ಯಗಳು",
      about: "ಬಗ್ಗೆ",
      start: "ವಿಶ್ಲೇಷಣೆ ಪ್ರಾರಂಭಿಸಿ",
      heroTitle: "ತ್ವರಿತ ಪತ್ತೆ ಜೀವಗಳನ್ನು ಉಳಿಸುತ್ತದೆ",
      heroDesc: "Swaas AI ಶ್ವಾಸಕೋಶದ ಶಬ್ದಗಳು ಮತ್ತು ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಸುಧಾರಿತ ಯಂತ್ರ ಕಲಿಕೆಯನ್ನು ಬಳಸುತ್ತದೆ, ಕಡಿಮೆ-ಸಂಪನ್ಮೂಲ ಪರಿಸರದಲ್ಲಿ ಸುಲಭವಾಗಿ ತಪಾಸಣೆ ನೀಡುತ್ತದೆ.",
      scanBtn: "ಈಗ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
      diagHeader: "ಆರೋಗ್ಯ ರೋಗನಿರ್ಣಯ",
      micText: "ರೆಕಾರ್ಡಿಂಗ್ ಪ್ರಾರಂಭಿಸಲು ಮೈಕ್ ಒತ್ತಿರಿ",
      processing: "AI ಪ್ರಕ್ರಿಯೆ ನಡೆಯುತ್ತಿದೆ",
      procDesc: "ಶ್ವಾಸಕೋಶದ ಆವರ್ತನಗಳು ಮತ್ತು ರೋಗಲಕ್ಷಣದ ಡೇಟಾವನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
      aboutHeader: "ಆರೋಗ್ಯ ರಕ್ಷಣೆಯ ಅಂತರವನ್ನು ಕಡಿಮೆ ಮಾಡುವುದು",
      aboutSub: "SWAAS AI ಉಸಿರಾಟದ ತೊಂದರೆಯನ್ನು ಗುರುತಿಸಲು ಅಕೌಸ್ಟಿಕ್ ಬಯೋಮಾರ್ಕರ್‌ಗಳು ಮತ್ತು ಆಳವಾದ ಕಲಿಕೆಯನ್ನು ಬಳಸುತ್ತದೆ.",
      mission: "ನಮ್ಮ ಮಿಷನ್ ಆಫ್‌ಲೈನ್-ಫಸ್ಟ್ AI ತಂತ್ರಜ್ಞಾನದ ಮೂಲಕ ಪ್ರತಿ ಗ್ರಾಮೀಣ ಸಮುದಾಯಕ್ಕೂ ಆರಂಭಿಕ ಹಂತದ ಶ್ವಾಸಕೋಶದ ರೋಗನಿರ್ಣಯವನ್ನು ಒದಗಿಸುವುದು."
    }
  };

  const symptomsList = [
    "Dry Cough", "Wet Cough", "Fever", "Shortness of Breath",
    "Chest Pain", "Fatigue", "Wheezing", "Sore Throat",
    "Runny Nose", "Headache", "Loss of Appetite",
    "Rapid Breathing", "Chills", "Body Ache", "Nasal Congestion"
  ];

  const scrollToAnalysis = () => {
    analysisRef.current?.scrollIntoView({ behavior: 'smooth' });
    if(step === 'idle') startSimulation();
  };

  const handleShare = async () => {
    const shareData = {
      title: 'SWAAS AI Health Report',
      text: `Diagnostic Result: ${report.condition}\nRisk Level: ${report.risk}\nConfidence: ${report.confidence}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\nShared via SWAAS AI`);
        alert("Report details copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const startSimulation = () => {
    setStep('recording');
    setTimeout(() => {
      setStep('form'); 
    }, 4000);
  };

  const startAnalysisProgress = () => {
    let val = 0;
    setProgress(0);
    const interval = setInterval(() => {
      val += Math.floor(Math.random() * 10);
      if(val >= 100){
        val = 100;
        clearInterval(interval);
        setTimeout(() => {
          setReport({
            condition: "Early Stage Pneumonia Patterns",
            risk: "High Risk",
            confidence: "94.7%",
            precautions: ["Maintain warm body temperature", "Avoid smoke/dust", "Use a humidifier"],
            diet: ["Increase fluid intake (warm)", "Vitamin C rich fruits", "Light, easy-to-digest meals"],
            advice: "Consult a doctor immediately. Early intervention is key to recovery."
          });
          setStep('report');
        }, 1000);
      }
      setProgress(val);
    }, 200);
  };

  

  // CHATBOT LOGIC
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const userMsg = { role: 'user', text: userInput };
    setChatMessages(prev => [...prev, userMsg]);
    setUserInput("");
    setIsTyping(true);

    // This simulates the Gemini API Response
    setTimeout(() => {
      const botResponse = { 
        role: 'bot', 
        text: "I've analyzed your query. Regarding health, it's important to monitor respiratory symptoms like wheezing or persistent cough. Based on Swaas AI's current data, I recommend completing the lung scan for a more detailed analysis." 
      };
      setChatMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className={`${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} min-h-screen transition-colors duration-500 font-sans selection:bg-blue-500 selection:text-white`}>
      
      {/* NAVIGATION */}
      <nav className="fixed w-full z-50 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
              <Wind className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter">SWAAS<span className="text-blue-500">AI</span></span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-bold opacity-60">
            <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-blue-500 transition-colors">{t[lang].home}</button>
            <button onClick={() => featuresRef.current?.scrollIntoView({behavior: 'smooth'})} className="hover:text-blue-500 transition-colors">{t[lang].features}</button>
            <button onClick={() => analysisRef.current?.scrollIntoView({behavior: 'smooth'})} className="hover:text-blue-500 transition-colors">{t[lang].about}</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* MASCOT CHAT TRIGGER */}
          <button 
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 px-4 py-2 rounded-full transition-all group"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot size={18} className="text-white" />
            </div>
            <span className="text-xs font-bold hidden md:block">SWAAS BOT</span>
          </button>

          <button onClick={() => setLang(lang === "EN" ? "KN" : "EN")} className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/20 transition-all">
            {lang === "EN" ? "EN / ಕನ್ನಡ" : "ಕನ್ನಡ / EN"}
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10">
            {darkMode ? <Sun className="text-yellow-400" size={20} /> : <Moon className="text-blue-600" size={20} />}
          </button>
          <button onClick={scrollToAnalysis} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-blue-600/30 transition-all">
            {t[lang].start}
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative min-h-screen flex items-center pt-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center z-10">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-6">
              <Zap size={16} className="text-blue-500" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Intelligent Health Assistant</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8">
              {t[lang].heroTitle}
            </h1>
            <p className="text-xl opacity-60 mb-10 leading-relaxed">
              {t[lang].heroDesc}
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToAnalysis} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 shadow-2xl shadow-blue-600/40 transition-all group"
              >
                🚀 {t[lang].scanBtn} <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="relative">
            <img 
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800" 
              alt="Medical AI Interface" 
              className="rounded-[4rem] shadow-2xl border border-white/10"
            />
            <div className="absolute -bottom-10 -left-10 bg-blue-600 p-8 rounded-3xl shadow-2xl animate-bounce">
              <HeartPulse size={40} className="text-white" />
            </div>
          </motion.div>
        </div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
      </header>

      {/* CORE FEATURES SECTION */}
      <section ref={featuresRef} className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter">Powerful Features for Real Impact</h2>
          <p className="opacity-50 max-w-xl mx-auto italic">Every feature is designed with accessibility, accuray and real-world usability in mind, especially for underserved communities.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-10">
          <FeatureCard 
            img="https://thumbs.dreamstime.com/b/illustration-human-cardiovascular-system-detailed-anatomy-showing-lungs-heart-blood-vessels-d-medical-graphic-displays-347338833.jpg?w=1400"
            icon={<Stethoscope size={30}/>}
            title="Lung Sound Analysis" 
            desc="Our ML model analyzes acoustic frequencies from recorded lung sounds to identify patterns indicative of asthma, pneumonia, bronchitis or any other."
          />
          <FeatureCard 
            img="https://png.pngtree.com/thumb_back/fw800/background/20230702/pngtree-d-composite-image-of-doctor-s-torso-with-stethoscope-in-hand-image_3741736.jpg"
            icon={<GiArtificialIntelligence size={42} />}
            title="AI Risk Assessment" 
            desc="Our AI-powered risk assessment tool evaluates patient data to provide preliminary insights into potential health risks."
          />
          <FeatureCard 
            img="https://futurehealthcaretoday.com/wp-content/uploads/2022/11/shutterstock_2166833375.jpg"
            icon={<HiOutlineDocumentReport size={38}/>}
            title="Clinical Health Report" 
            desc="Generate comprehensive clinical health reports based on AI analysis, including detected conditions, risk levels, and personalized recommendations for precautions and dietary measures."
          />
        </div>
      </section>

      {/* ABOUT THE PROJECT SECTION */}
      <section className="py-32 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20 items-start">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg mb-6">
                <Database size={16} className="text-blue-500" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">About SwaasAi</span>
              </div>
              <h2 className="text-5xl font-black mb-8 leading-tight tracking-tighter">
                {t[lang].aboutHeader}
              </h2>
              <p className="text-lg opacity-60 leading-relaxed mb-10">
                {t[lang].aboutSub}
              </p>
              <div className="flex gap-4 mb-12">
                <span className="px-5 py-2 bg-blue-600/20 rounded-full border border-blue-500/30 text-xs font-bold text-blue-400"># Lung Sound AI</span>
                <span className="px-5 py-2 bg-blue-600/20 rounded-full border border-blue-500/30 text-xs font-bold text-blue-400"># Voice NLP Engine</span>
              </div>
              <div className="p-8 border-l-4 border-blue-600 bg-white/5 rounded-r-3xl italic">
                <Quote className="text-blue-600 mb-4" size={32} />
                <p className="text-lg font-medium opacity-80">
                  {t[lang].mission}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { val: "8+", label: "Respiratory Diseases", desc: "Detectable conditions", icon: <Activity className="text-blue-400" /> },
                { val: "94.7%", label: "Model Accuracy", desc: "On test datasets", icon: <CheckCircle2 className="text-emerald-400" /> },
                { val: "<30s", label: "Analysis Time", desc: "End-to-end pipeline", icon: <Zap className="text-yellow-400" /> },
                { val: "2", label: "Languages", desc: "English & Kannada", icon: <Globe className="text-blue-400" /> }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all">
                  <div className="mb-6">{stat.icon}</div>
                  <h4 className="text-4xl font-black mb-2">{stat.val}</h4>
                  <p className="font-bold text-sm uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className="text-xs opacity-40 font-medium">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ANALYSIS INTERFACE */}
      <section ref={analysisRef} className="py-32 px-6 bg-blue-600/5 min-h-screen flex flex-col justify-center items-center relative">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            {step === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <h2 className="text-4xl font-black mb-12 uppercase tracking-tighter">{t[lang].diagHeader}</h2>
                <div className="bg-slate-800/50 backdrop-blur-md p-16 rounded-[4rem] border border-white/10 shadow-2xl">
                  <button onClick={startSimulation} className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-blue-600/40 mx-auto group">
                    <Mic size={48} className="text-white group-hover:animate-pulse" />
                  </button>
                  <p className="mt-10 font-bold text-lg opacity-60 uppercase tracking-widest">{t[lang].micText}</p>
                </div>
              </motion.div>
            )}

            {step === 'recording' && (
              <motion.div key="rec" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="w-56 h-56 bg-blue-600 rounded-full mx-auto flex items-center justify-center relative">
                   <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute inset-0 bg-blue-600 rounded-full" />
                   <Mic size={80} className="text-white z-10" />
                </div>
                <h2 className="text-4xl font-black mt-12 tracking-widest animate-pulse uppercase">Recording...</h2>
                <div className="flex gap-2 justify-center mt-8">
                   {[1,2,3,4,5,6,7].map(i => <motion.div key={i} animate={{ height: [20, 60, 20] }} transition={{ repeat: Infinity, delay: i*0.1 }} className="w-3 bg-blue-500 rounded-full" />)}
                </div>
              </motion.div>
            )}

            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-slate-800 p-10 rounded-[3rem] border border-white/10 shadow-2xl">
                  <h2 className="text-3xl font-black mb-8 uppercase tracking-tight text-blue-500">Patient Symptoms Form</h2>
                  <div className="mb-8">
                    <p className="mb-4 font-bold text-lg">Gender</p>
                    <div className="flex gap-4">
                      {["Male","Female","Other"].map(g => (
                        <button
                          key={g}
                          onClick={() => setFormData({...formData, gender:g})}
                          className={`px-8 py-3 rounded-xl font-bold transition-all ${formData.gender === g ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'bg-white/5 border border-white/10'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-10">
                    <p className="mb-4 font-bold text-lg">Select Symptoms</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {symptomsList.map(sym => (
                        <label key={sym} className={`flex gap-3 items-center p-3 rounded-xl border transition-all cursor-pointer ${formData.symptoms.includes(sym) ? 'bg-blue-600/20 border-blue-600' : 'bg-white/5 border-white/10'}`}>
                          <input
                            type="checkbox"
                            className="accent-blue-600"
                            onChange={(e) => {
                              if(e.target.checked){
                                setFormData({...formData, symptoms:[...formData.symptoms, sym]});
                              } else {
                                setFormData({...formData, symptoms: formData.symptoms.filter(s => s !== sym)});
                              }
                            }}
                          />
                          <span className="text-sm font-medium">{sym}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => { setStep('analyzing'); startAnalysisProgress(); }}
                    className="w-full bg-blue-600 py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all uppercase tracking-widest"
                  >
                    Submit & Analyze
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'analyzing' && (
              <motion.div key="ana" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <div className="relative w-48 h-48 mx-auto mb-10">
                  <svg className="transform -rotate-90 w-full h-full">
                    <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                    <circle 
                      cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray={502} strokeDashoffset={502 - (502 * progress) / 100}
                      className="text-blue-600 transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-3xl font-black">
                    {progress}%
                  </div>
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter">{t[lang].processing}</h2>
                <p className="text-xl opacity-50 mt-4">{t[lang].procDesc}</p>
              </motion.div>
            )}

            {step === 'report' && report && (
              <motion.div key="rep" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/10`}>
                  <div className="bg-red-600 p-10 text-white flex justify-between items-center">
                    <div>
                      <h2 className="text-4xl font-black uppercase tracking-tighter">{report.condition}</h2>
                      <div className="flex gap-4 mt-2 font-bold text-sm opacity-90">
                        <span>CONFIDENCE: {report.confidence}</span>
                        <span>|</span>
                        <span>SEVERITY: {report.risk}</span>
                      </div>
                    </div>
                    <AlertCircle size={60} />
                  </div>
                  <div className="p-12 space-y-12">
                    <div className="grid md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <h3 className="font-black text-xl flex items-center gap-2 text-blue-500 uppercase tracking-tight">
                          <Shield size={22} /> Precautions
                        </h3>
                        <ul className="space-y-3 opacity-70 font-medium">
                          {report.precautions.map((p, i) => <li key={i} className="flex gap-3"><span>•</span> {p}</li>)}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-black text-xl flex items-center gap-2 text-blue-500 uppercase tracking-tight">
                          <Activity size={22} /> Dietary Measures
                        </h3>
                        <ul className="space-y-3 opacity-70 font-medium">
                          {report.diet.map((d, i) => <li key={i} className="flex gap-3"><span>•</span> {d}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="p-8 bg-red-600/10 rounded-3xl border-2 border-red-600/20 text-center">
                      <p className="font-black text-red-500 text-lg uppercase tracking-wider">{report.advice}</p>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setStep('idle')} className="flex-1 py-5 rounded-2xl bg-white/5 font-bold hover:bg-white/10 transition-all border border-white/10">Back to Dashboard</button>
                      <button 
                        onClick={handleShare}
                        className="flex-1 py-5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30"
                      >
                        <Share2 size={20} /> Share Health Report
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 border-t border-white/5 bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><Wind size={18} className="text-white" /></div>
              <span className="text-xl font-black italic">SWAAS<span className="text-blue-500">AI</span></span>
            </div>
            <p className="opacity-40 text-sm font-medium leading-relaxed">
              Intelligent Respiratory Health Assistant. Designed for early detection and accessibility in rural environments.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm font-bold">
            <div className="flex flex-col gap-4">
              <span className="text-blue-500 text-xs tracking-widest uppercase">Platform</span>
              <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">Diagnostic AI</a>
              <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">Rural Outreach</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-blue-500 text-xs tracking-widest uppercase">Legal</span>
              <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">Privacy Policy</a>
              <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">Terms</a>
            </div>
          </div>
          <div className="flex flex-col justify-between items-end">
            <div className="flex gap-4">
               <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 transition-all cursor-pointer"><Globe size={18}/></div>
               <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 transition-all cursor-pointer"><FileText size={18}/></div>
            </div>
            <p className="text-[10px] opacity-30 font-black uppercase tracking-[0.2em] mt-12">© 2026 SWAASAI LABS. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

      {/* CHAT INTERFACE OVERLAY */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 w-[400px] h-[600px] z-[100] flex flex-col bg-slate-800 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 bg-blue-600 flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Bot /></div>
                <div><h4 className="font-black text-sm">SWAAS ASSISTANT</h4><p className="text-[10px] text-blue-200 font-bold uppercase">Gemini AI Engine</p></div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/60 hover:text-white"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-none'}`}>{msg.text}</div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" /><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" /></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-6 bg-slate-900/50 border-t border-white/5">
              <div className="relative">
                <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask about symptoms..." className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-blue-600 transition-colors" />
                <button onClick={handleSendMessage} className="absolute right-2 top-2 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"><Send size={18} className="text-white" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// FEATURE CARD COMPONENT (Updated with Blue Theme)
const FeatureCard = ({ img, title, desc, icon }) => (
  <div className="group h-[450px] [perspective:1000px]">
    <div className="relative h-full w-full rounded-[2.5rem] transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-2xl">
      <div className="absolute inset-0 h-full w-full [backface-visibility:hidden]">
        <img src={img} className="h-full w-full rounded-[2.5rem] object-cover border border-white/10" alt={title} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent rounded-[2.5rem] flex flex-col justify-end p-10">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg text-white">{icon}</div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{title}</h3>
        </div>
      </div>
      <div className="absolute inset-0 h-full w-full rounded-[2.5rem] bg-blue-600 px-10 flex flex-col justify-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden] text-white">
        <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">Module Overview</h3>
        <p className="text-lg font-medium leading-relaxed opacity-90">{desc}</p>
        <div className="mt-10 flex justify-center"><Activity className="animate-pulse w-10 h-10" /></div>
      </div>
    </div>
  </div>
)

export default App;
