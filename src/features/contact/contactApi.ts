import { collection, addDoc, serverTimestamp } from '@firebase/firestore';
import { db } from '../../lib/firebase';

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string | null;
}

export async function submitContactMessage(input: ContactMessageInput): Promise<string> {
  const docRef = await addDoc(collection(db, 'contactMessages'), {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    userId: input.userId || null,
    status: 'unread',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
