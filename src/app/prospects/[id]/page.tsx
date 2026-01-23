import { notFound } from 'next/navigation';
import { getProspect } from '@/lib/database';
import { ProspectDetailClient } from './prospect-detail-client';

export const dynamic = 'force-dynamic';

interface ProspectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProspectDetailPage({ params }: ProspectDetailPageProps) {
  const { id } = await params;
  const prospect = await getProspect(id);

  if (!prospect) {
    notFound();
  }

  return <ProspectDetailClient prospect={prospect} />;
}
