import { a, col } from "framer-motion/client";

// src/knowledgeBase.js
export const knowledgeBase = {
  greetings: {
    keywords: ["hi", "hello", "hey", "namaste"],
    response: "Hello! I am SwaasAI. How can I help you with your respiratory health today?"
  },
  asthma: {
    keywords: ["asthma", "wheezing", "breathless", "shortness of breath"],
    response: "It sounds like you're experiencing symptoms related to asthma. Please ensure you are in a well-ventilated area. Would you like me to generate a clinical report based on these symptoms?"
  },
  fever:{
    keywords: ["fever", "high temperature", "chills"],
    response: "A fever can be a sign of an infection. If you have a persistent fever, it may be important to consult a healthcare provider. I can help you create a report of your symptoms if you'd like."

  },
  cold: {
    keywords: ["cold", "runny nose", "sore throat", "sneezing"],
    response: "These symptoms are commonly associated with a cold. Make sure to rest and stay hydrated. If symptoms worsen, consider seeking medical advice. I can also generate a report of your symptoms for you."
  },
  cough: {
    keywords: ["cough", "persistent cough", "dry cough", "productive cough"],
    response: "A persistent cough can be a sign of various respiratory conditions. If it's been lasting for more than a week, it might be a good idea to consult a healthcare provider. I can help you create a report of your symptoms if you'd like."
  },
 appetite: {
    keywords: ["loss of appetite", "not feeling hungry", "reduced appetite"],
    response: "Loss of appetite can be a symptom of many conditions, including infections. If this persists, it may be important to consult a healthcare provider. I can help you create a report of your symptoms if you'd like."
  },   
  drycough: {
    keywords: ["dry cough", "non-productive cough", "tickling cough"],
    response: "A dry cough can be caused by various factors, including viral infections or allergies. If it persists for more than a week, consider consulting a healthcare provider. I can help you create a report of your symptoms if you'd like."
  },
  sweat: {
    keywords: ["sweat", "excessive sweating", "night sweats"],
    response: "Excessive sweating can be a symptom of various conditions, including infections. If this persists, it may be important to consult a healthcare provider. I can help you create a report of your symptoms if you'd like."
  },    
  sleeplessness: {
    keywords: ["sleeplessness", "insomnia", "difficulty sleeping"],
    response: "Difficulty sleeping can be a symptom of various conditions, including stress or infections. If this persists, it may be important to consult a healthcare provider. I can help you create a report of your symptoms if you'd like."
  },
   

  pneumonia: {
    keywords: ["pneumonia", "fever", "chest pain", "coughing blood"],
    response: "Warning: These symptoms could indicate a high-risk condition like Pneumonia. I recommend immediate consultation with a healthcare provider. I can generate a preliminary risk report for you now."
  },
  kannada_toggle: {
    keywords: ["kannada", "language", "change language"],
    response: "You can switch to Kannada using the toggle button at the top of the screen for localized assistance."
  },
  default: "I'm sorry, I didn't quite catch that. Could you describe your symptoms more specifically, like 'persistent cough' or 'chest pain'?"
};