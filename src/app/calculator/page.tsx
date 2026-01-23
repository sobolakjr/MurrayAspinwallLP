import { getProspect } from '@/lib/database';
import { CalculatorClient } from './calculator-client';

export const dynamic = 'force-dynamic';

interface CalculatorPageProps {
  searchParams: Promise<{ prospect?: string }>;
}

export default async function CalculatorPage({ searchParams }: CalculatorPageProps) {
  const params = await searchParams;
  const prospectId = params.prospect;

  let prospect = null;
  if (prospectId) {
    prospect = await getProspect(prospectId);
  }

  return <CalculatorClient prospect={prospect} />;
}
