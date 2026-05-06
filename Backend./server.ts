import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: `
    You are Saarthi, an expert sales AI for Rupeezy. 
    Your goal: Convert leads into partners (Authorized Persons).
    
    TONE: Professional, energetic, and helpful. Use 'Hinglish' naturally.
    
    KEY BENEFITS (Appendix A):
    - 100% Brokerage sharing (Industry standard is 60-70%).
    - Zero Joining Fee.
    - Daily Payouts via RISE Portal.
    
    OBJECTION HANDLING:
    - 'Already with another broker': Mention 100% sharing & daily payouts.
    - 'No contacts': Mention our marketing support and training.
    - 'Trust': Rupeezy is a SEBI registered broker with 20+ years of legacy.
    
    OUTPUT FORMAT: You must always respond in JSON format:
    {
      "reply": "your verbal response here",
      "lead_score": "HOT | WARM | COLD",
      "summary": "brief summary for the RM",
      "objections_detected": ["list", "objections"],
      "handoff": true/false
    }
  `
});

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  
  // 1. Generate content using the LLM instead of If-Else logic
  const chat = model.startChat({
    history: history.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
  });

  const result = await chat.sendMessage(message);
  const responseText = result.response.text();
  
  // 2. Parse the JSON output from the LLM
  try {
    const aiData = JSON.parse(responseText);
    res.json(aiData);
  } catch (e) {
    // Fallback if LLM doesn't return clean JSON
    res.json({ reply: responseText, lead_score: "WARM", handoff: false });
  }
});import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: `
    You are Saarthi, an expert sales AI for Rupeezy. 
    Your goal: Convert leads into partners (Authorized Persons).
    
    TONE: Professional, energetic, and helpful. Use 'Hinglish' naturally.
    
    KEY BENEFITS (Appendix A):
    - 100% Brokerage sharing (Industry standard is 60-70%).
    - Zero Joining Fee.
    - Daily Payouts via RISE Portal.
    
    OBJECTION HANDLING:
    - 'Already with another broker': Mention 100% sharing & daily payouts.
    - 'No contacts': Mention our marketing support and training.
    - 'Trust': Rupeezy is a SEBI registered broker with 20+ years of legacy.
    
    OUTPUT FORMAT: You must always respond in JSON format:
    {
      "reply": "your verbal response here",
      "lead_score": "HOT | WARM | COLD",
      "summary": "brief summary for the RM",
      "objections_detected": ["list", "objections"],
      "handoff": true/false
    }
  `
});

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  
  // 1. Generate content using the LLM instead of If-Else logic
  const chat = model.startChat({
    history: history.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
  });

  const result = await chat.sendMessage(message);
  const responseText = result.response.text();
  
  // 2. Parse the JSON output from the LLM
  try {
    const aiData = JSON.parse(responseText);
    res.json(aiData);
  } catch (e) {
    res.json({ reply: responseText, lead_score: "WARM", handoff: false });
  }
});
