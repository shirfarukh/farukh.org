import * as admin from 'firebase-admin';

// Connect to emulator or real project
if (process.env.FIRESTORE_EMULATOR_HOST === undefined) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'demo-learning-app' });
}

const db = admin.firestore();
const auth = admin.auth();

async function seedData() {
  console.log('🌱 Starting database seeding process...');

  // 1. Seed Demo Users
  console.log('Creating demo users...');
  
  // Admin User
  let adminUid = '';
  try {
    const existingAdmin = await auth.getUserByEmail('admin@example.com');
    adminUid = existingAdmin.uid;
  } catch {
    const newAdmin = await auth.createUser({
      email: 'admin@example.com',
      password: 'Password123!',
      displayName: 'System Administrator',
    });
    adminUid = newAdmin.uid;
  }
  await auth.setCustomUserClaims(adminUid, { admin: true });
  await db.collection('users').doc(adminUid).set({
    uid: adminUid,
    email: 'admin@example.com',
    displayName: 'System Administrator',
    role: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    disabled: false,
  }, { merge: true });

  // Student User
  let studentUid = '';
  try {
    const existingStudent = await auth.getUserByEmail('student@example.com');
    studentUid = existingStudent.uid;
  } catch {
    const newStudent = await auth.createUser({
      email: 'student@example.com',
      password: 'Password123!',
      displayName: 'Demo Student',
    });
    studentUid = newStudent.uid;
  }
  await db.collection('users').doc(studentUid).set({
    uid: studentUid,
    email: 'student@example.com',
    displayName: 'Demo Student',
    role: 'student',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    disabled: false,
  }, { merge: true });

  // 2. Seed Course 1: Cryptocurrency Learning
  console.log('Seeding Cryptocurrency Learning course...');
  const cryptoRef = db.collection('courses').doc('crypto-101');
  await cryptoRef.set({
    title: 'Cryptocurrency & Blockchain Mastery',
    slug: 'crypto-101',
    description: 'Master the fundamentals of blockchain technology, wallets, decentralized finance, Bitcoin, Ethereum, and security risk management.',
    coverUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=800&auto=format&fit=crop',
    status: 'published',
    order: 1,
    passPercentage: 80,
    exam: {
      questionCount: 10,
      timeLimitMin: 30,
      maxAttempts: 3,
      cooldownHours: 24,
    },
    lessonCount: 6,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Crypto Modules
  const cryptoMod1 = cryptoRef.collection('modules').doc('mod-1');
  await cryptoMod1.set({ title: 'Module 1: Blockchain & Wallet Fundamentals', order: 1 });

  const cryptoMod2 = cryptoRef.collection('modules').doc('mod-2');
  await cryptoMod2.set({ title: 'Module 2: Ecosystem & Risk Management', order: 2 });

  // Crypto Lessons
  const cryptoLessons = [
    {
      id: 'les-1',
      moduleId: 'mod-1',
      title: '1. What is Blockchain Technology?',
      order: 1,
      introMarkdown: '# Blockchain Basics\n\nA blockchain is a **decentralized, distributed ledger** that records transactions across a network of computers.\n\n### Key Principles:\n- **Decentralization**: No single point of failure or central authority.\n- **Immutability**: Once recorded, data cannot be altered without consensus.\n- **Transparency**: Transactions are publicly verifiable.',
      youtubeVideoId: 'REPLACE_ME',
      durationSec: 420,
      quizPassPercentage: 70,
      status: 'published',
      questions: [
        {
          id: 'q1',
          text: 'What is the primary defining characteristic of a blockchain ledger?',
          options: [
            { id: 'opt-1', text: 'Centralized database control by a single entity' },
            { id: 'opt-2', text: 'Decentralized and immutable record keeping' },
            { id: 'opt-3', text: 'Private spreadsheet editable by administrators' },
          ],
          correctOptionId: 'opt-2',
          explanation: 'Blockchains distribute transaction records across nodes, making records immutable.',
        },
        {
          id: 'q2',
          text: 'What prevents historical transaction tampering on a blockchain?',
          options: [
            { id: 'opt-1', text: 'Cryptographic hash linking between consecutive blocks' },
            { id: 'opt-2', text: 'Manual review by government agencies' },
            { id: 'opt-3', text: 'Deleting previous transaction records periodically' },
          ],
          correctOptionId: 'opt-1',
          explanation: 'Each block contains the cryptographic hash of the previous block.',
        },
        {
          id: 'q3',
          text: 'What does "Immutability" mean in the context of cryptocurrencies?',
          options: [
            { id: 'opt-1', text: 'Data can be freely edited at any time' },
            { id: 'opt-2', text: 'Transactions cannot be altered or reversed once confirmed' },
            { id: 'opt-3', text: 'Prices never fluctuate' },
          ],
          correctOptionId: 'opt-2',
          explanation: 'Confirmed transactions are permanently written to the ledger.',
        },
      ],
    },
    {
      id: 'les-2',
      moduleId: 'mod-1',
      title: '2. Public Keys, Private Keys, and Wallets',
      order: 2,
      introMarkdown: '# Cryptographic Wallets\n\nYour crypto wallet does not store actual coins; it stores your **cryptographic keys**.\n\n- **Public Key**: Similar to your bank account IBAN/Email address. Safe to share.\n- **Private Key**: Similar to your secret PIN/Password. **NEVER SHARE IT.**',
      youtubeVideoId: 'REPLACE_ME',
      durationSec: 360,
      quizPassPercentage: 70,
      status: 'published',
      questions: [
        {
          id: 'q1',
          text: 'Which key can be safely shared with others to receive funds?',
          options: [
            { id: 'opt-1', text: 'Private Key' },
            { id: 'opt-2', text: 'Public Key / Address' },
            { id: 'opt-3', text: 'Seed Phrase' },
          ],
          correctOptionId: 'opt-2',
          explanation: 'Public keys or receiving addresses are safe to share publicly.',
        },
        {
          id: 'q2',
          text: 'What happens if you lose or leak your Private Key?',
          options: [
            { id: 'opt-1', text: 'You can reset it via customer support' },
            { id: 'opt-2', text: 'Anyone with the key gains total control of your funds' },
            { id: 'opt-3', text: 'The blockchain auto-locks your wallet for 30 days' },
          ],
          correctOptionId: 'opt-2',
          explanation: 'Private keys grant absolute signing authority over funds.',
        },
        {
          id: 'q3',
          text: 'What is a "Non-Custodial" wallet?',
          options: [
            { id: 'opt-1', text: 'A wallet where a centralized exchange holds your keys' },
            { id: 'opt-2', text: 'A wallet where only YOU hold and control the private keys' },
            { id: 'opt-3', text: 'A physical credit card' },
          ],
          correctOptionId: 'opt-2',
          explanation: 'Non-custodial wallets give users full ownership of private keys.',
        },
      ],
    },
    {
      id: 'les-3',
      moduleId: 'mod-1',
      title: '3. Exchanges and Security Best Practices',
      order: 3,
      introMarkdown: '# Exchange Security\n\nCentralized exchanges (CEX) allow buying crypto with fiat currency, but require strict security hygiene.\n\n### Essential Security Steps:\n1. Enable Hardware/Authenticator **Two-Factor Authentication (2FA)**.\n2. Beware of **Phishing Domains**.\n3. Withdraw long-term holdings to a cold hardware wallet.',
      youtubeVideoId: 'REPLACE_ME',
      durationSec: 480,
      quizPassPercentage: 70,
      status: 'published',
      questions: [
        {
          id: 'q1',
          text: 'Which 2FA method is most secure against SIM-swapping attacks?',
          options: [
            { id: 'opt-1', text: 'SMS Text Message' },
            { id: 'opt-2', text: 'Authenticator App or Hardware Security Key' },
            { id: 'opt-3', text: 'Email Verification' },
          ],
          correctOptionId: 'opt-2',
          explanation: 'App/Hardware 2FA cannot be intercepted via cellular SIM hijacking.',
        },
        {
          id: 'q2',
          text: 'What does the phrase "Not your keys, not your coins" highlight?',
          options: [
            { id: 'opt-1', text: 'Coins on centralized exchanges carry counterparty custody risk' },
            { id: 'opt-2', text: 'All coins are created by central banks' },
            { id: 'opt-3', text: 'Hardware wallets are obsolete' },
          ],
          correctOptionId: 'opt-1',
          explanation: 'If an exchange controls the keys, users rely on exchange solvency.',
        },
        {
          id: 'q3',
          text: 'What is a Phishing attack in crypto?',
          options: [
            { id: 'opt-1', text: 'Fake websites copying legitimate platforms to steal credentials' },
            { id: 'opt-2', text: 'High network transaction fees' },
            { id: 'opt-3', text: 'Mining crypto using water cooling' },
          ],
          correctOptionId: 'opt-1',
          explanation: 'Phishing tricks users into revealing keys or logging into fake sites.',
        },
      ],
    },
  ];

  for (const les of cryptoLessons) {
    const lesRef = cryptoRef.collection('lessons').doc(les.id);
    await lesRef.set({
      moduleId: les.moduleId,
      title: les.title,
      order: les.order,
      introMarkdown: les.introMarkdown,
      youtubeVideoId: les.youtubeVideoId,
      durationSec: les.durationSec,
      quizPassPercentage: les.quizPassPercentage,
      status: les.status,
    });

    for (const q of les.questions) {
      await lesRef.collection('questions').doc(q.id).set({
        text: q.text,
        options: q.options,
        order: Date.now(),
      });
      await lesRef.collection('answerKeys').doc(q.id).set({
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
      });
    }
  }

  // Crypto Exam Pool (20 Questions)
  console.log('Seeding Cryptocurrency exam pool...');
  for (let i = 1; i <= 20; i++) {
    const qId = `eq-${i}`;
    await cryptoRef.collection('examQuestions').doc(qId).set({
      text: `Crypto Exam Pool Question ${i}: What is a critical aspect of decentralized consensus mechanisms?`,
      options: [
        { id: 'opt-1', text: `Option A for exam question ${i}` },
        { id: 'opt-2', text: `Option B (Correct) for exam question ${i}` },
        { id: 'opt-3', text: `Option C for exam question ${i}` },
        { id: 'opt-4', text: `Option D for exam question ${i}` },
      ],
    });
    await cryptoRef.collection('examKeys').doc(qId).set({
      correctOptionId: 'opt-2',
      explanation: `Verification explanation for exam question ${i}. Consensus mechanisms ensure network agreement without trust.`,
    });
  }

  // 3. Seed Course 2: AI Learning
  console.log('Seeding AI Learning course...');
  const aiRef = db.collection('courses').doc('ai-101');
  await aiRef.set({
    title: 'Artificial Intelligence & Prompt Engineering',
    slug: 'ai-101',
    description: 'Learn modern Artificial Intelligence, Machine Learning fundamentals, Large Language Models (LLMs), prompt engineering, and ethical AI applications.',
    coverUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop',
    status: 'published',
    order: 2,
    passPercentage: 80,
    exam: {
      questionCount: 10,
      timeLimitMin: 30,
      maxAttempts: 3,
      cooldownHours: 24,
    },
    lessonCount: 6,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const aiMod1 = aiRef.collection('modules').doc('mod-1');
  await aiMod1.set({ title: 'Module 1: Foundations of AI & LLMs', order: 1 });

  const aiLessons = [
    {
      id: 'les-1',
      moduleId: 'mod-1',
      title: '1. Introduction to AI, ML, and Deep Learning',
      order: 1,
      introMarkdown: '# Understanding AI & Machine Learning\n\nArtificial Intelligence encompasses algorithms that enable computers to simulate human intelligence.\n\n- **Machine Learning (ML)**: Statistical models that learn patterns from data.\n- **Deep Learning**: Multi-layer neural networks capable of processing complex unstructured data.',
      youtubeVideoId: 'REPLACE_ME',
      durationSec: 300,
      quizPassPercentage: 70,
      status: 'published',
      questions: [
        {
          id: 'q1',
          text: 'What distinguishes Machine Learning from traditional rule-based software?',
          options: [
            { id: 'opt-1', text: 'ML learns statistical patterns from data rather than explicit hardcoded rules' },
            { id: 'opt-2', text: 'ML does not require computers' },
            { id: 'opt-3', text: 'Traditional software cannot run on servers' },
          ],
          correctOptionId: 'opt-1',
          explanation: 'ML models derive predictive rules automatically from training data.',
        },
        {
          id: 'q2',
          text: 'What is a Large Language Model (LLM)?',
          options: [
            { id: 'opt-1', text: 'A database storing images' },
            { id: 'opt-2', text: 'A deep neural network trained on vast text data to predict token sequences' },
            { id: 'opt-3', text: 'A physical robot' },
          ],
          correctOptionId: 'opt-2',
          explanation: 'LLMs predict word tokens based on context learned from massive corpora.',
        },
        {
          id: 'q3',
          text: 'What is "Prompt Engineering"?',
          options: [
            { id: 'opt-1', text: 'Crafting structured natural language inputs to guide AI outputs' },
            { id: 'opt-2', text: 'Writing computer hardware drivers' },
            { id: 'opt-3', text: 'Installing mechanical engines' },
          ],
          correctOptionId: 'opt-1',
          explanation: 'Prompt engineering optimizes prompts to obtain desired model responses.',
        },
      ],
    },
  ];

  for (const les of aiLessons) {
    const lesRef = aiRef.collection('lessons').doc(les.id);
    await lesRef.set({
      moduleId: les.moduleId,
      title: les.title,
      order: les.order,
      introMarkdown: les.introMarkdown,
      youtubeVideoId: les.youtubeVideoId,
      durationSec: les.durationSec,
      quizPassPercentage: les.quizPassPercentage,
      status: les.status,
    });

    for (const q of les.questions) {
      await lesRef.collection('questions').doc(q.id).set({
        text: q.text,
        options: q.options,
        order: Date.now(),
      });
      await lesRef.collection('answerKeys').doc(q.id).set({
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
      });
    }
  }

  // AI Exam Pool (20 Questions)
  console.log('Seeding AI Exam pool...');
  for (let i = 1; i <= 20; i++) {
    const qId = `eq-${i}`;
    await aiRef.collection('examQuestions').doc(qId).set({
      text: `AI Exam Pool Question ${i}: What is a core principle in ethical AI deployment?`,
      options: [
        { id: 'opt-1', text: `Option A for AI exam question ${i}` },
        { id: 'opt-2', text: `Option B (Correct) for AI exam question ${i}` },
        { id: 'opt-3', text: `Option C for AI exam question ${i}` },
        { id: 'opt-4', text: `Option D for AI exam question ${i}` },
      ],
    });
    await aiRef.collection('examKeys').doc(qId).set({
      correctOptionId: 'opt-2',
      explanation: `Verification explanation for AI exam question ${i}. Responsible AI requires transparency, fairness, and accountability.`,
    });
  }

  console.log('✅ Seeding completed successfully!');
}

seedData().catch((err) => console.error('Seeding error:', err));
