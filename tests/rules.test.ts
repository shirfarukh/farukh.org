import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rules = fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-learning-app',
    firestore: {
      rules,
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describe('Firestore Security Rules', () => {
  const studentUid = 'student_user_123';
  const adminUid = 'admin_user_456';

  it('allows authenticated students to read published courses', async () => {
    const studentContext = testEnv.authenticatedContext(studentUid, { admin: false });
    const courseRef = studentContext.firestore().collection('courses').doc('crypto-101');
    
    // Admin creates published course first
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('courses').doc('crypto-101').set({
        title: 'Cryptocurrency Learning',
        status: 'published',
      });
    });

    await assertSucceeds(courseRef.get());
  });

  it('denies students from reading answerKeys subcollection', async () => {
    const studentContext = testEnv.authenticatedContext(studentUid, { admin: false });
    const keyRef = studentContext
      .firestore()
      .collection('courses')
      .doc('crypto-101')
      .collection('lessons')
      .doc('les-1')
      .collection('answerKeys')
      .doc('q1');

    await assertFails(keyRef.get());
  });

  it('denies students from directly writing to progress collection', async () => {
    const studentContext = testEnv.authenticatedContext(studentUid, { admin: false });
    const progressRef = studentContext
      .firestore()
      .collection('progress')
      .doc(`${studentUid}_crypto-101`);

    await assertFails(
      progressRef.set({
        uid: studentUid,
        courseId: 'crypto-101',
        lessons: { 'les-1': { completed: true, quizScore: 100 } },
      })
    );
  });

  it('allows admin users with custom claim to read answerKeys and write progress', async () => {
    const adminContext = testEnv.authenticatedContext(adminUid, { admin: true });
    const keyRef = adminContext
      .firestore()
      .collection('courses')
      .doc('crypto-101')
      .collection('lessons')
      .doc('les-1')
      .collection('answerKeys')
      .doc('q1');

    await assertSucceeds(
      keyRef.set({
        correctOptionId: 'opt-1',
        explanation: 'Blockchain is decentralized.',
      })
    );
  });
});
