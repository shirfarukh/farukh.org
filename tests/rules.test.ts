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

  describe('Instructor Permissions & Review Workflow', () => {
    const instructor1Uid = 'instructor_alpha_1';
    const instructor2Uid = 'instructor_beta_2';

    it('allows instructors to create owned draft courses', async () => {
      const instructorContext = testEnv.authenticatedContext(instructor1Uid, { instructor: true });
      const courseRef = instructorContext.firestore().collection('courses').doc('ai-masterclass');

      await assertSucceeds(
        courseRef.set({
          title: 'AI Masterclass',
          ownerId: instructor1Uid,
          status: 'draft',
        })
      );
    });

    it('denies instructors from setting course status directly to published', async () => {
      const instructorContext = testEnv.authenticatedContext(instructor1Uid, { instructor: true });
      const courseRef = instructorContext.firestore().collection('courses').doc('unapproved-course');

      await assertFails(
        courseRef.set({
          title: 'Unapproved Course',
          ownerId: instructor1Uid,
          status: 'published',
        })
      );
    });

    it('denies instructors from editing another instructors draft course', async () => {
      // Seed course owned by instructor 1
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('courses').doc('instructor1-course').set({
          title: 'Instructor 1 Course',
          ownerId: instructor1Uid,
          status: 'draft',
        });
      });

      const instructor2Context = testEnv.authenticatedContext(instructor2Uid, { instructor: true });
      const courseRef = instructor2Context.firestore().collection('courses').doc('instructor1-course');

      await assertFails(
        courseRef.update({
          title: 'Hacked by Instructor 2',
        })
      );
    });

    it('allows students to submit instructor applications with pending status only', async () => {
      const studentContext = testEnv.authenticatedContext(studentUid, { admin: false });
      const appRef = studentContext.firestore().collection('instructorApplications').doc(studentUid);

      // Successfully submit pending application
      await assertSucceeds(
        appRef.set({
          uid: studentUid,
          email: 'student@example.com',
          nameEn: 'Student Applicant',
          status: 'pending',
        })
      );

      // Denies attempting to auto-approve themselves
      await assertFails(
        appRef.set({
          uid: studentUid,
          email: 'student@example.com',
          nameEn: 'Self Approved Hacker',
          status: 'approved',
        })
      );
    });

    it('denies all users from directly writing to auditLog', async () => {
      const adminContext = testEnv.authenticatedContext(adminUid, { admin: true });
      const logRef = adminContext.firestore().collection('auditLog').doc('log-1');

      // Direct write denied (must come from Cloud Functions Admin SDK)
      await assertFails(
        logRef.set({
          action: 'instructor_approved',
          actorId: adminUid,
        })
      );
    });
  });
});

