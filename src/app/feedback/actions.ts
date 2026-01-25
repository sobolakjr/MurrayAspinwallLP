'use server';

import { createUserFeedback, getUserFeedback, deleteUserFeedback } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import type { UserFeedbackCategory } from '@/types';

export async function submitFeedbackAction(data: {
  category: UserFeedbackCategory;
  message: string;
  user_email: string | null;
}) {
  const feedback = await createUserFeedback(data);
  revalidatePath('/feedback');
  return feedback;
}

export async function getFeedbackAction() {
  return getUserFeedback();
}

export async function deleteFeedbackAction(id: string) {
  const success = await deleteUserFeedback(id);
  revalidatePath('/feedback');
  return success;
}
