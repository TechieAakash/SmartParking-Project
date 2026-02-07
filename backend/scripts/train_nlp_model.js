const fs = require('fs');
const path = require('path');
const natural = require('natural');

// Paths
const DATASET_PATH = path.join(__dirname, '../data/kuro_dataset.jsonl');
const MODEL_PATH = path.join(__dirname, '../data/kuro_classifier.json');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const classifier = new natural.BayesClassifier();

async function trainModel() {
  console.log('🤖 Starting Kuro AI Training Pipeline...');

  if (!fs.existsSync(DATASET_PATH)) {
    console.error('❌ Dataset not found at:', DATASET_PATH);
    return;
  }

  // 1. Load and Inspect Data
  console.log('📂 Loading dataset...');
  const data = fs.readFileSync(DATASET_PATH, 'utf8');
  const lines = data.split('\n').filter(line => line.trim() !== '');
  
  console.log(`📊 Found ${lines.length} training examples.`);

  // 2. Preprocessing & Training
  console.log('🧠 Training Naive Bayes Classifier...');
  
  let validExamples = 0;
  
  lines.forEach((line, index) => {
    try {
      const entry = JSON.parse(line);
      let prompt = entry.prompt.replace('User: ', '').replace('\nAssistant:', '').trim();
      let completion = entry.completion.trim();

      if (prompt && completion) {
        // Add to classifier: INPUT -> LABEL
        // Using the completion text itself as the label/class
        classifier.addDocument(prompt, completion);
        validExamples++;
      }
    } catch (e) {
      console.warn(`⚠️ Skipping line ${index + 1}: Invalid JSON`);
    }
  });

  console.log(`✅ Processed ${validExamples} valid training pairs.`);

  // 3. Train
  classifier.train();
  console.log('🎓 Training complete.');

  // 4. Test Accuracy (Self-test on a few examples)
  console.log('\n🧪 Testing Model Accuracy (Sample):');
  const testPhrases = [
    "parking rate car janakpuri",
    "otp not received",
    "disabled parking available",
    "how to book slot"
  ];

  testPhrases.forEach(phrase => {
    const result = classifier.classify(phrase);
    console.log(`   Q: "${phrase}" => A: "${result.substring(0, 50)}..."`);
  });

  // 5. Save Model
  classifier.save(MODEL_PATH, (err, classifier) => {
    if (err) {
      console.error('❌ Failed to save model:', err);
    } else {
      console.log(`\n💾 Model saved successfully to: ${MODEL_PATH}`);
      console.log('🚀 Kuro AI is ready to use this ML model!');
    }
  });
}

trainModel();
