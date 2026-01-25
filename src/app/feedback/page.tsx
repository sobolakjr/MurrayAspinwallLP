import { getUserFeedback } from '@/lib/database';
import { FeedbackClient } from './feedback-client';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  const feedback = await getUserFeedback();

  return <FeedbackClient initialFeedback={feedback} />;
}
