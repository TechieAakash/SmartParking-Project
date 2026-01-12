/**
 * Internationalization (i18n) Engine
 * Handles client-side translation for Hindi, Punjabi, and Urdu
 */

const translations = {
    hi: {
        "MCD Smart Parking System": "MCD स्मार्ट पार्किंग सिस्टम",
        "Real-time Monitoring & Enforcement": "वास्तविक समय निगरानी और प्रवर्तन",
        "Home": "होम",
        "Dashboard": "डैशबोर्ड",
        "Zones": "क्षेत्र",
        "Violations": "उल्लंघन",
        "Refresh": "ताज़ा करें",
        "MCD Officer": "MCD अधिकारी",
        "Digital Parking Infrastructure for": "डिजिटल पार्किंग इन्फ्रास्ट्रक्चर",
        "Empowering Delhi with smart, automated, and efficient parking management solutions.": "दिल्ली को स्मार्ट, स्वचालित और कुशल पार्किंग प्रबंधन समाधानों के साथ सशक्त बनाना।",
        "Open Dashboard": "डैशबोर्ड खोलें",
        "Learn More": "अधिक जानें",
        "Total Parking Slots": "कुल पार्किंग स्लॉट",
        "Daily Users": "दैनिक उपयोगकर्ता",
        "Monitored Zones": "निगरानी क्षेत्र",
        "Uptime Reliability": "अपटाइम विश्वसनीयता",
        "Service Portals": "सेवा पोर्टल",
        "Zone Management": "जोन प्रबंधन",
        "Violation Control": "उल्लंघन नियंत्रण",
        "Officer Admin": "अधिकारी प्रशासन",
        "Get to Know Us": "हमारे बारे में जानें",
        "Connect with Us": "हमसे जुड़ें",
        "Make Money with Us": "हमारे साथ पैसे कमाएं",
        "Let Us Help You": "हमें आपकी मदद करने दें",
        "Office Address": "कार्यालय का पता",
        "Mobile Apps": "मोबाइल ऐप्स",
        "Email Support": "ईमेल समर्थन",
        "Helpline Number": "हेल्पलाइन नंबर",
        "English": "अंग्रेज़ी",
        "Hindi": "हिन्दी",
        "Punjabi": "ਪੰਜਾਬੀ",
        "Urdu": "اردو"
    },
    pa: {
        "MCD Smart Parking System": "MCD ਸਮਾਰਟ ਪਾਰਕਿੰਗ ਸਿਸਟਮ",
        "Real-time Monitoring & Enforcement": "ਰੀਅਲ-ਟਾਈਮ ਨਿਗਰਾਨੀ ਅਤੇ ਲਾਗੂ ਕਰਨਾ",
        "Home": "ਹੋਮ",
        "Dashboard": "ਡੈਸ਼ਬੋਰਡ",
        "Zones": "ਜ਼ੋਨ",
        "Violations": "ਉਲੰਘਣਾਵਾਂ",
        "Refresh": "ਤਾਜ਼ਾ ਕਰੋ",
        "MCD Officer": "MCD ਅਧਿਕਾਰੀ",
        "Digital Parking Infrastructure for": "ਡਿਜੀਟਲ ਪਾਰਕਿੰਗ ਬੁਨਿਆਦੀ ਢਾਂਚਾ",
        "Empowering Delhi with smart, automated, and efficient parking management solutions.": "ਦਿੱਲੀ ਨੂੰ ਸਮਾਰਟ, ਆਟੋਮੇਟਿਡ ਅਤੇ ਕੁਸ਼ਲ ਪਾਰਕਿੰਗ ਪ੍ਰਬੰਧਨ ਹੱਲਾਂ ਨਾਲ ਸ਼ਕਤੀਸ਼ਾਲੀ ਬਣਾਉਣਾ।",
        "Open Dashboard": "ਡੈਸ਼ਬੋਰਡ ਖੋਲ੍ਹੋ",
        "Learn More": "ਹੋਰ ਜਾਣੋ",
        "Total Parking Slots": "ਕੁੱਲ ਪਾਰਕਿੰਗ ਸਲਾਟ",
        "Daily Users": "ਰੋਜ਼ਾਨਾ ਉਪਭੋਗਤਾ",
        "Monitored Zones": "ਨਿਗਰਾਨੀ ਵਾਲੇ ਜ਼ੋਨ",
        "Uptime Reliability": "ਅਪਟਾਈਮ ਭਰੋਸੇਯੋਗਤਾ",
        "Service Portals": "ਸੇਵਾ ਪੋਰਟਲ",
        "Zone Management": "ਜ਼ੋਨ ਪ੍ਰਬੰਧਨ",
        "Violation Control": "ਉਲੰਘਣਾ ਕੰਟਰੋਲ",
        "Officer Admin": "ਅਧਿਕਾਰੀ ਐਡਮਿਨ",
        "Get to Know Us": "ਸਾਡੇ ਬਾਰੇ ਜਾਣੋ",
        "Connect with Us": "ਸਾਡੇ ਨਾਲ ਜੁੜੋ",
        "Make Money with Us": "ਸਾਡੇ ਨਾਲ ਪੈਸੇ ਕਮਾਓ",
        "Let Us Help You": "ਸਾਨੂੰ ਤੁਹਾਡੀ ਮਦਦ ਕਰਨ ਦਿਓ",
        "Office Address": "ਦਫਤਰ ਦਾ ਪਤਾ",
        "Mobile Apps": "ਮੋਬਾਈਲ ਐਪਸ",
        "Email Support": "ਈਮੇਲ ਸਹਾਇਤਾ",
        "Helpline Number": "ਹੈਲਪਲਾਈਨ ਨੰਬਰ",
        "English": "ਅੰਗਰੇਜ਼ੀ",
        "Hindi": "ਹਿੰਦੀ",
        "Punjabi": "ਪੰਜਾਬੀ",
        "Urdu": "ਉਰਦੂ"
    },
    ur: {
        "MCD Smart Parking System": "ایم سی ڈی اسمارٹ پارکنگ سسٹم",
        "Real-time Monitoring & Enforcement": "ریئل ٹائم مانیٹرنگ اور نفاذ",
        "Home": "ہوم",
        "Dashboard": "ڈیش بورڈ",
        "Zones": "زون",
        "Violations": "خلاف ورزیاں",
        "Refresh": "ریفریش",
        "MCD Officer": "ایم سی ڈی آفیسر",
        "Digital Parking Infrastructure for": "ڈیجیٹل پارکنگ انفراسٹرکچر",
        "Empowering Delhi with smart, automated, and efficient parking management solutions.": "دہلی کو اسمارٹ، خودکار اور موثر پارکنگ مینجمنٹ سلوشنز کے ساتھ بااختیار بنانا۔",
        "Open Dashboard": "ڈیش بورڈ کھولیں",
        "Learn More": "مزید جانیں",
        "Total Parking Slots": "کل پارکنگ سلاٹ",
        "Daily Users": "روزانہ صارفین",
        "Monitored Zones": "مانیٹر شدہ زون",
        "Uptime Reliability": "اپ ٹائم وشوسنییتا",
        "Service Portals": "سروس پورٹلز",
        "Zone Management": "زون مینجمنٹ",
        "Violation Control": "خلاف ورزی کنٹرول",
        "Officer Admin": "آفیسر ایڈمن",
        "Get to Know Us": "ہمارے بارے میں جانیں",
        "Connect with Us": "ہم سے رابطہ کریں",
        "Make Money with Us": "ہمارے ساتھ پیسہ کمائیں",
        "Let Us Help You": "ہمیں آپ کی مدد کرنے دیں",
        "Office Address": "دفتر کا پتہ",
        "Mobile Apps": "موبائل ایپس",
        "Email Support": "ای میل سپورٹ",
        "Helpline Number": "ہیلپ لائن نمبر",
        "English": "انگریزی",
        "Hindi": "ہندی",
        "Punjabi": "پنجابی",
        "Urdu": "اردو"
    }
};

function changeLanguage(lang) {
    localStorage.setItem('mcd_lang', lang);
    if (lang === 'en') {
        location.reload(); // Revert to base HTML
        return;
    }

    const dict = translations[lang];
    if (!dict) return;

    // Translation Logic
    const elementsToTranslate = [
        'h1', 'h2', 'h3', 'p', 'span', 'button', 'a'
    ];

    elementsToTranslate.forEach(tag => {
        document.querySelectorAll(tag).forEach(el => {
            const originalText = el.getAttribute('data-origin') || el.innerText.trim();
            if (!el.getAttribute('data-origin')) {
                el.setAttribute('data-origin', originalText);
            }
            
            if (dict[originalText]) {
                // If it contains icons, preserve them
                const icon = el.querySelector('i');
                if (icon) {
                    el.innerHTML = '';
                    el.appendChild(icon);
                    el.insertAdjacentText('beforeend', ' ' + dict[originalText]);
                } else {
                    el.innerText = dict[originalText];
                }
            }
        });
    });

    // Update Dropdown Display
    const currentLangText = document.getElementById('current-lang-text');
    if (currentLangText) {
        const langMap = { en: 'English', hi: 'Hindi', pa: 'Punjabi', ur: 'Urdu' };
        currentLangText.innerText = langMap[lang];
    }
    
    // Set RTL for Urdu
    document.body.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.body.style.textAlign = lang === 'ur' ? 'right' : 'left';
}

// Auto-load saved language
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('mcd_lang');
    if (savedLang && savedLang !== 'en') {
        setTimeout(() => changeLanguage(savedLang), 500);
    }
});
