const OpenAI = require("openai");
const config = require('../config/env');
const natural = require('natural');
const path = require('path');
const fs = require('fs');

class KuroEngine {
  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.context = new Map(); // Store conversation context
    this.classifier = null;
    
    // Load ML Model
    this.loadMLModel();

    // Initialize OpenAI AI
    if (config.openai.apiKey) {
      console.log('🔑 Initializing OpenAI AI...');
      try {
        this.openai = new OpenAI({
          apiKey: config.openai.apiKey
        });
        this.systemPrompt = `You are "Kuro AI: Smart Parking Assistant," an expert AI chatbot specialized in **Delhi MCD parking rules, Smart Parking system functionality, OTP/login flows, slot booking, digital payments, complaints, and policy guidance**.

Follow these guidelines when responding to user queries:

1. **Accuracy first:** Always provide answers based on official MCD parking rates, Smart Parking app workflows, and government parking policies. Avoid guessing or making up details.
2. **Answer formats:** Provide concise, polite, and professional answers. Use short, actionable sentences when guiding users.
3. **Areas of expertise:**
   - **Parking rates:** Cars and two-wheelers, hourly and daily maximum charges.
   - **Slot availability & booking:** Real-time availability, booking process, cancellations, extensions.
   - **OTP/login flows:** Email/SMS OTP, verification, common issues, resends.
   - **Payments:** QR codes, UPI apps, cards, and handling failed transactions.
   - **Complaints & overcharging:** Steps for reporting, official channels, receipts.
   - **Facilities:** Multi-level parking, puzzle lots, reserved spots for disabled and women drivers.
   - **Policies:** Tender allotments, license rules, fines, illegal parking rules.
4. **If the user query is outside this domain:** Respond politely with:
   "I can only provide information related to MCD parking and the Smart Parking system in Delhi."
5. **Tone:** Helpful, professional, courteous, and concise. Avoid technical jargon unless necessary.
6. **Formatting:** Respond as if guiding a human user directly, e.g., "To book a slot, open the Smart Parking app, select your location, and confirm your booking. Payment is available via QR code, UPI, or card."

**Example queries and responses:**
User: "How much does it cost to park a car in Janakpuri?"
Assistant: "MCD charges ₹20 per hour for cars, with a 24-hour maximum of ₹100. You can pay via QR code, UPI, or card using the MyParkings app."

User: "I didn't receive my OTP, what should I do?"
Assistant: "Check your registered email or phone number. If the OTP hasn't arrived, request a resend through the Smart Parking app or contact support."

User: "Are there reserved parking spots for disabled persons?"
Assistant: "Yes, 3% of parking spaces are reserved for persons with disabilities, and 5% for women drivers."

Use context from the provided dataset where applicable.`;
        console.log('✅ OpenAI AI initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize OpenAI AI:', error.message);
        this.openai = null;
      }
    } else {
      console.warn('⚠️ OPENAI_API_KEY not found - OpenAI features will be disabled');
    }
  }

  /**
   * Load trained NLP model
   */
  loadMLModel() {
    const modelPath = path.join(__dirname, '../../data/kuro_classifier.json');
    if (fs.existsSync(modelPath)) {
      natural.BayesClassifier.load(modelPath, null, (err, classifier) => {
        if (err) {
          console.error('❌ Failed to load ML Model:', err);
        } else {
          this.classifier = classifier;
          console.log('✅ Kuro ML Model loaded successfully');
        }
      });
    } else {
      console.warn('⚠️ ML Model not found. Run `node backend/scripts/train_nlp_model.js`');
    }
  }

  /**
   * Predict response using ML Model
   */
  predictWithML(message) {
    if (!this.classifier) return null;
    
    // Get classifications
    const classifications = this.classifier.getClassifications(message);
    if (classifications.length > 0) {
      const topMatch = classifications[0];
      // Confidence threshold (arbitrary for Bayes, distinct from probability)
      // Natural's Bayes returns raw probability or log probability depending on version.
      // Usually the top match is the best guess.
      // We'll trust it if the score is significantly higher than others or just return it.
      
      // For robust chatbot, we can return if confidence > X, but Bayes scores are tricky.
      // We will assume top match is good if the training data covered it.
      return {
        intent: 'ml_prediction',
        response: topMatch.label,
        confidence: 0.85 // Synthetic confidence for ML match
      };
    }
    return null;
  }

  /**
   * Initialize comprehensive knowledge base
   */
  initializeKnowledgeBase() {
    return {
      // --- (existing knowledge base entries remain same) ---
      registration_help: {
        keywords: ['register', 'registration', 'sign up', 'create account', 'new user', 'join', 'how to join', 'start account'],
        responses: {
          en: "To register:\n1. Click 'Login/Register' on the top right.\n2. Select 'Create new account'.\n3. Choose your role (Citizen/Driver).\n4. Fill in your details (Name, Phone, Email).\n5. Verify your phone via OTP.\nOnce registered, you can add vehicles and start booking!",
          hi: "पंजीकरण करने के लिए:\n1. ऊपर दाईं ओर 'Login/Register' पर क्लिक करें।\n2. 'Create new account' चुनें।\n3. अपना विवरण भरें और OTP सत्यापित करें। इसके बाद आप वाहन जोड़ सकते हैं!"
        }
      },

      login_help: {
        keywords: ['login', 'sign in', 'cant login', 'password', 'forgot', 'reset', 'locked'],
        responses: {
          en: "Login issues?\n• **Forgot Password**: Click 'Forgot Password' on the login screen to reset via Email/SMS.\n• **Locked**: Accounts lock after 5 failed attempts. Wait 15 mins or contact support.\n• **OTP**: Ensure you have network coverage for SMS delivery.",
          hi: "लॉगिन समस्या?\n• 'Forgot Password' का उपयोग करके पासवर्ड रीसेट करें।\n• 5 गलत प्रयासों के बाद खाता लॉक हो जाता है। 15 मिनट प्रतीक्षा करें।"
        }
      },

      // --- VEHICLE MANAGEMENT ---
      vehicle_management: {
        keywords: ['add vehicle', 'remove vehicle', 'delete car', 'update car', 'rc', 'registration certificate', 'my car'],
        responses: {
          en: "Manage Vehicles:\n1. Go to your **Profile Dashboard**.\n2. In the 'My Vehicles' section, click '+ Add'.\n3. Enter License Plate & Model.\n4. To remove, click the 'Trash' icon next to the vehicle.\nNote: Active bookings restrict vehicle removal.",
          hi: "वाहन प्रबंधन:\nप्रोफाइल में जाएं -> 'My Vehicles' -> '+ Add' पर क्लिक करें। वाहन हटाने के लिए 'Trash' आइकन का उपयोग करें।"
        }
      },

      // --- CORE PARKING RULES ---
      parking_rules: {
        keywords: ['parking', 'rules', 'hours', 'timings', 'when', 'operate', 'weekend', 'night', 'overnight'],
        responses: {
          en: "MCD Parking rules are straightforward:\n• **Timings**: Standard zones operate 6:00 AM - 10:00 PM.\n• **Overnight**: Only allowed in 'Resident Zones' or with a specific Night Pass.\n• **Weekends**: Standard rates apply unless it's a designated Premium Event Zone.\n• **Grace Period**: 15 minutes for check-in after booking.",
          hi: "पार्किंग नियम:\n• **समय**: सुबह 6:00 से रात 10:00 बजे तक।\n• **रात की पार्किंग**: केवल रेसिडेंट ज़ोन में मान्य।\n• **वीकेंड**: सामान्य दरें ही लागू होती हैं।"
        }
      },

      // --- BOOKING SYSTEM ---
      booking_info: {
        keywords: ['book', 'booking', 'reserve', 'reservation', 'slot', 'advance', 'how to book'],
        responses: {
          en: "To book a slot:\n1. Open 'Determine Parking' on your dashboard.\n2. Select your preferred Zone on the map.\n3. Click the 'Book Now' button.\n4. Select your vehicle and duration.\n5. Confirm payment via Wallet.",
          hi: "बुकिंग कैसे करें:\n1. डैशबोर्ड पर 'Determine Parking' खोलें।\n2. मैप पर ज़ोन चुनें।\n3. 'Book Now' बटन दबाएं।\n4. वाहन और समय चुनें और भुगतान करें।"
        }
      },

      cancellation_policy: {
        keywords: ['cancel', 'cancellation', 'refund', 'money back', 'cancel booking', 'wrong booking'],
        responses: {
          en: "Cancellation & Refund Policy:\n• **> 1 Hour Before**: 100% Refund to your App Wallet.\n• **< 1 Hour Before**: Small fee of ₹10 deducted, rest refunded.\n• **After Start Time**: No refund possible.\nTo cancel: Go to 'My Bookings' -> Select Booking -> Click 'Cancel Booking'.",
          hi: "रद्दीकरण और रिफंड:\n• **1 घंटे पहले**: 100% रिफंड।\n• **1 घंटे के भीतर**: ₹10 शुल्क कटेगा।\n• **समय शुरू होने के बाद**: कोई रिफंड नहीं।\n'My Bookings' में जाकर रद्द करें।"
        }
      },

      // --- SUBSCRIPTION PLANS ---
      subscriptions: {
        keywords: ['subscription', 'monthly', 'pass', 'plan', 'membership', 'long term', 'gold', 'silver', 'basic', 'premium', 'weekly'],
        responses: {
          en: "Save more with MCD Subscriptions:\n• **Basic (₹1500/mo)**: Ideal for daily office commuters in standard zones.\n• **Premium (₹3000/mo)**: Reserved spots in CP, South Ex + Priority Valet.\n• **Corporate**: Contact support for bulk fleet discounts.\n• **Weekly**: Short-term passes available for tourists.",
          hi: "सब्सक्रिप्शन प्लान:\n• **Basic (₹1500/मा)**: सामान्य ज़ोन के लिए।\n• **Premium (₹3000/मा)**: प्राइम ज़ोन और रिजर्व स्पॉट के लिए।"
        }
      },

      // --- WALLET & PAYMENTS ---
      wallet_help: {
        keywords: ['wallet', 'money', 'balance', 'topup', 'add money', 'recharge', 'payment failed', 'transaction', 'upi', 'credit', 'debit'],
        responses: {
          en: "Your MCD Wallet is your primary payment tool. You can top-up via UPI, Cards, or Net Banking.\n• **To Top Up**: Go to Profile -> My Wallet -> Click 'Top Up'.\n• **Refunds**: Failed transaction amounts revert within 24-48 hours.",
          hi: "वॉलेट से भुगतान आसान है। प्रोफाइल में जाकर 'Top Up' करें। यदि ट्रांजेक्शन फेल हो जाए, तो 24-48 घंटों में रिफंड मिल जाता है।"
        }
      },

      payment_methods: {
        keywords: ['cash', 'card', 'online', 'paytm', 'gpay', 'phonepe', 'bhim'],
        responses: {
          en: "We accept digital payments only for transparency.\n• **Wallet**: Fastest method.\n• **UPI**: GPay, PhonePe, Paytm, BHIM.\n• **Cards**: Visa, Mastercard, RuPay.\nCash payments are accepted *only* at designated kiosks.",
          hi: "हम केवल डिजिटल भुगतान स्वीकार करते हैं (UPI, कार्ड, वॉलेट)। नकद भुगतान केवल कियोस्क पर स्वीकार किया जाता है।"
        }
      },

      penalty_logic: {
         keywords: ['penalty', 'fine', 'charge', 'cost', 'calculation', 'calc', 'challan', 'violation', 'ticket', 'towed'],
         responses: {
           en: "Automated Penalty Structure:\n• **Overstay < 1hr**: ₹50\n• **Overstay > 1hr**: ₹200\n• **No Parking Zone**: ₹500 + Towing charges (actuals).\n• **Wrong Way**: ₹1000\nAlways ensure your vehicle is checked out via the app.",
           hi: "जुर्माना सूची:\n• **अतिरिक्त समय (< 1घंटा)**: ₹50\n• **> 1घंटा**: ₹200\n• **नो पार्किंग**: ₹500 + टोइंग का खर्च।"
         }
      },

      zone_capacity: {
        keywords: ['capacity', 'space', 'slots', 'available', 'full', 'empty', 'how many', 'zone status'],
        responses: {
          en: "Zone Capacity details:\n• **Check Live Map**: The dashboard map shows real-time availability.\n• **Color Codes**: Green = Available, Red = Full, Orange = Filling Fast.\n• **Total Slots**: 15,000+ slots across Delhi.",
          hi: "ज़ोन क्षमता:\n• **लाइव मैप**: डैशबोर्ड पर रीयल-टाइम उपलब्धता देखें।\n• **हरा**: उपलब्ध, **लाल**: पूर्ण।\n• **कुल स्लॉट**: दिल्ली भर में 15,000+।"
        }
      },

      // --- DELHI SPECIFIC LOCATIONS ---
      delhi_regions: {
        keywords: ['delhi', 'connaught', 'cp', 'south ex', 'dwarka', 'rohini', 'location', 'karol bagh', 'noida', 'gurgaon', 'hauz khas', 'lajpat', 'janakpuri'],
        responses: {
          en: "We have smart parking active in:\n• **North**: Rohini (Sec 10, 15), North Campus.\n• **Central**: Connaught Place (Inner/Outer), Karol Bagh.\n• **South**: South Ex, Hauz Khas, Saket, Lajpat Nagar.\n• **West**: Dwarka (Sec 6, 12, 21), Janakpuri.\nCheck the live map for real-time slot availability.",
          hi: "हमारी सेवाएं इन क्षेत्रों में उपलब्ध हैं: कनॉट प्लेस, रोहिणी, द्वारका, साउथ एक्स और करोल बाग। लाइव मैप देखें।"
        }
      },

      // --- SUPPORT & TROUBLESHOOTING ---
      app_issues: {
        keywords: ['not working', 'error', 'login problem', 'app crash', 'slow', 'loading', 'bug', 'glitch'],
        responses: {
          en: "Having trouble? Try these steps:\n1. Clear your browser cache.\n2. Ensure you have the latest update.\n3. For passwords: Use 'Forgot Password'.\n4. If the map doesn't load, check your GPS permissions.\nStill stuck? Email mcd-ithelpdesk@mcd.nic.in",
          hi: "क्या ऐप में समस्या है? ब्राउज़र कैश साफ़ करें या पासवर्ड रीसेट करें। यदि समस्या बनी रहती है, तो हमें ईमेल करें।"
        }
      },

      contact_support: {
        keywords: ['call', 'phone', 'email', 'contact', 'support', 'customer care', 'helpdesk', 'number', 'contractor'],
        responses: {
          en: "MCD Support & Contractor Contact:\n• **Helpline**: 155305 (Toll Free)\n• **Email**: mcd-ithelpdesk@mcd.nic.in\n• **Contractor Liaison**: +91-11-2322-1234\nWe are available 24/7.",
          hi: "सम्पर्क करें:\n• हेल्पलाइन: 155305\n• ईमेल: mcd-ithelpdesk@mcd.nic.in\n• ठेकेदार संपर्क: +91-11-2322-1234"
        }
      },

      language_switch: {
        keywords: ['hindi', 'english', 'hinglish', 'language', 'bhasha', 'हिंदी', 'speak in hindi', 'speak english'],
        responses: {
            en: "Language preference updated! I will now communicate in English.",
            hi: "भाषा बदल दी गई है! अब मैं हिंदी में बात करूंगा।"
        }
      },

      greeting: {
        keywords: ['hi', 'hello', 'hey', 'namaste', 'good morning', 'start', 'kuro', 'hello kuro', 'morning', 'evening'],
        responses: {
          en: "Namaste! 🙏 I'm Kuro, your AI assistant for the Smart Parking System. I've been trained on the latest MCD guidelines to help you with bookings, payments, and rules. How can I help you today?",
          hi: "नमस्ते! 🙏 मैं कुरो हूं। मैं बुकिंग, भुगतान और नियमों में आपकी मदद कर सकता हूं। आज मैं आपकी क्या सेवा कर सकता हूं?"
        }
      },

      thank_you: {
        keywords: ['thank', 'thanks', 'cool', 'great', 'awesome', 'bye', 'goodbye', 'ok', 'nice'],
        responses: {
          en: "You're welcome! 🚗 Drive safely and remember to wear your seatbelt. Have a fantastic day!",
          hi: "आपका स्वागत है! 🚗 सुरक्षित ड्राइव करें और आपका दिन शुभ हो!"
        }
      }
    };
  }

  /**
   * Detect language from message
   */
  detectLanguage(message) {
    const hindiPattern = /[ऀ-ॿ]/;
    const hindiKeywords = ['नमस्ते', 'धन्यवाद', 'मदद', 'कैसे', 'क्या', 'हिंदी'];
    if (hindiPattern.test(message) || hindiKeywords.some(w => message.toLowerCase().includes(w))) {
        return 'hi';
    }
    return 'en';
  }

  /**
   * Call OpenAI AI for responses
   */
  async callOpenAI(message, chatHistory = []) {
    try {
      if (!this.openai) {
        console.warn('⚠️ OpenAI client not initialized');
        return null;
      }

      // Convert Gemini-style history to OpenAI-style
      const messages = [
        { role: "system", content: this.systemPrompt },
        ...chatHistory.map(item => ({
          role: item.role === "model" ? "assistant" : "user",
          content: item.parts[0].text
        })),
        { role: "user", content: message }
      ];

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Fast and cost-effective
        messages: messages,
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('❌ OpenAI API error:', error.message);
      return null;
    }
  }

  /**
   * Detect intent and find best response
   */
  async detectIntent(message, language = 'en') {
    const lowerMessage = message.toLowerCase();
    
    // Explicit Language Switch Check
    if (lowerMessage.includes('hindi') || lowerMessage.includes('हिंदी')) return { intent: 'language_switch', response: null, confidence: 1, forceLanguage: 'hi' };
    if (lowerMessage.includes('english')) return { intent: 'language_switch', response: null, confidence: 1, forceLanguage: 'en' };

    // 1. Try ML Model First
    const mlPrediction = this.predictWithML(message);
    if (mlPrediction) {
      if (mlPrediction.response === 'OUT_OF_SCOPE') {
        console.log(`🤖 ML Model Identified Out-of-Scope Query`);
        return {
          intent: 'out_of_scope',
          response: "I can only provide information related to MCD parking and the Smart Parking system in Delhi.",
          confidence: 1.0
        };
      }
      console.log(`🤖 ML Model Match: "${mlPrediction.response.substring(0, 30)}..."`);
      return mlPrediction;
    }

    let bestMatch = null;
    let highestScore = 0;

    for (const [intent, data] of Object.entries(this.knowledgeBase)) {
      let score = 0;
      
      // Count keyword matches
      for (const keyword of data.keywords) {
        const keywordLower = keyword.toLowerCase();
        
        // Exact substring match (e.g., "parking" in "parking rules")
        if (lowerMessage.includes(keywordLower)) {
          score += 2;
        }
        
        // Word boundary match (whole word only, minimum 3 chars)
        if (keywordLower.length >= 3) {
          const words = lowerMessage.split(/\s+/);
          if (words.includes(keywordLower)) {
            score += 1;
          }
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = { intent, response: data.responses[language], confidence: Math.min(score / 4, 1) };
      }
    }

    // Return best match or null if not confident (to trigger Gemini)
    // Increased threshold to reduce false positives
    if (bestMatch && bestMatch.confidence >= 0.5) {
      return bestMatch;
    }

    return null;
  }

  /**
   * Generate quick reply suggestions based on context
   */
  getQuickReplies(intent, language = 'en') {
    const replies = {
      en: {
        greeting: ['Show parking zones', 'Help with registration', 'Wallet Top-Up', 'Contact Support'],
        registration_help: ['Login help', 'Add Vehicle', 'Contact Support'],
        login_help: ['Forgot Password', 'Register New Account', 'Contact Support'],
        vehicle_management: ['Add Vehicle', 'My Bookings', 'Wallet Balance'],
        parking_rules: ['Penalty info', 'Appeal violation', 'Zone capacity', 'Day Pass'],
        violation_appeal: ['Payment methods', 'View my violations', 'Talk to agent'],
        wallet_help: ['Top Up Now', 'Transaction History', 'Booking Help'],
        contact_support: ['Email Support', 'Call Helpline', 'Office Address'],
        language_switch: ['Help', 'Parking Rules', 'My Wallet'],
        openai_response: ['Parking rules', 'Violations', 'Register', 'Payment help'],
        unknown: ['Parking rules', 'Violations', 'Register', 'Payment help']
      },
      hi: {
        greeting: ['पार्किंग ज़ोन दिखाएं', 'पंजीकरण मदद', 'वॉलेट रिचार्ज', 'संपर्क करें'],
        registration_help: ['लॉगिन सहायता', 'वाहन जोड़ें', 'संपर्क करें'],
        login_help: ['पासवर्ड भूल गया', 'नया खाता', 'संपर्क करें'],
        vehicle_management: ['वाहन जोड़ें', 'मेरी बुकिंग', 'वॉलेट बैलेंस'],
        parking_rules: ['जुर्माना जानकारी', 'अपील', 'क्षमता', 'डे पास'],
        violation_appeal: ['भुगतान', 'उल्लंघन देखें', 'एजेंट'],
        wallet_help: ['रिचार्ज करें', 'लेनदेन इतिहास', 'बुकिंग मदद'],
        contact_support: ['ईमेल', 'हेल्पलाइन', 'पता'],
        language_switch: ['मदद', 'पार्किंग नियम', 'मेरा वॉलेट'],
        openai_response: ['पार्किंग नियम', 'उल्लंघन', 'रजिस्टर', 'भुगतान सहायता'],
        unknown: ['पार्किंग नियम', 'उल्लंघन', 'रजिस्टर', 'भुगतान सहायता']
      }
    };

    return replies[language][intent] || replies[language].unknown;
  }

  /**
   * Process user message and generate response
   */
  async processMessage(sessionId, userId, message) {
    try {
      // 1. Recover Context
      let context = this.context.get(sessionId) || {};
      let language = context.language || this.detectLanguage(message);
      let history = context.history || [];

      // 2. Detect Intent from Knowledge Base
      let detection = await this.detectIntent(message, language);
      
      // 3. Handle Explicit Language Switch
      if (detection && detection.forceLanguage) {
          language = detection.forceLanguage;
          // Re-fetch response in new language
          detection.response = this.knowledgeBase.language_switch.responses[language];
      }
      
      let finalResponse;
      let finalIntent;
      let finalConfidence;

      if (detection) {
        finalResponse = detection.response;
        finalIntent = detection.intent;
        finalConfidence = detection.confidence;
      } else {
        // 4. Fallback to OpenAI AI
        console.log(`🤖 Consulting OpenAI for: "${message}"`);
        const openAIResponse = await this.callOpenAI(message, history);
        
        if (openAIResponse) {
          finalResponse = openAIResponse;
          finalIntent = 'openai_response';
          finalConfidence = 0.9; // OpenAI is usually confident
        } else {
          // Absolute fallback
          finalResponse = language === 'hi' 
            ? "क्षमा करें, मुझे यकीन नहीं है कि मैं इसमें कैसे मदद कर सकता हूं। क्या आप अधिक विशिष्ट हो सकते हैं? आप 'मदद' टाइप कर सकते हैं।"
            : "I'm not sure how I can help with that. Could you be more specific? You can type 'help' to see what I can assist with.";
          finalIntent = 'unknown';
          finalConfidence = 0.1;
        }
      }

      const quickReplies = this.getQuickReplies(finalIntent, language);

      // 5. Update Context and History
      history.push({ role: "user", parts: [{ text: message }] });
      history.push({ role: "model", parts: [{ text: finalResponse }] });
      
      // Keep history manageable (last 10 messages)
      if (history.length > 10) history = history.slice(-10);

      this.context.set(sessionId, {
        lastIntent: finalIntent,
        language,
        history,
        messageCount: (context.messageCount || 0) + 1,
        timestamp: new Date()
      });

      return {
        response: finalResponse,
        intent: finalIntent,
        confidence: finalConfidence,
        language,
        quickReplies,
        metadata: {
          sessionContext: this.context.get(sessionId)
        }
      };
    } catch (error) {
      console.error('Kuro processing error:', error);
      return {
        response: "I encountered an error. Please try again or contact support.",
        intent: 'error',
        confidence: 0,
        language: 'en'
      };
    }
  }

  /**
   * Clear old context (cleanup for memory management)
   */
  cleanupOldContext() {
    const now = new Date();
    for (const [sessionId, context] of this.context.entries()) {
      const age = now - context.timestamp;
      if (age > 30 * 60 * 1000) { // 30 minutes
        this.context.delete(sessionId);
      }
    }
  }
}

// Singleton instance
const kuroEngine = new KuroEngine();

// Periodic cleanup
setInterval(() => kuroEngine.cleanupOldContext(), 10 * 60 * 1000); // Every 10 minutes

module.exports = kuroEngine;

