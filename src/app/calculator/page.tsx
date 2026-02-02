import { getProspect, getProspects, getAllScenarios, getScenariosByProspect } from '@/lib/database';
import { CalculatorClient } from './calculator-client';

export const dynamic = 'force-dynamic';

interface CalculatorPageProps {
  searchParams: Promise<{ prospect?: string; scenario?: string }>;
}

export default async function CalculatorPage({ searchParams }: CalculatorPageProps) {
  const params = await searchParams;
  const prospectId = params.prospect;
  const scenarioId = params.scenario;

  // Fetch all prospects for the dropdown
  const allProspects = await getProspects();

  let initialProspect = null;
  if (prospectId) {
    initialProspect = await getProspect(prospectId);
  }

  // Fetch scenarios - if on a prospect page, get scenarios for that prospect
  // Otherwise get all scenarios
  const scenarios = prospectId
    ? await getScenariosByProspect(prospectId)
    : await getAllScenarios();

  return (
    <CalculatorClient
      prospects={allProspects}
      initialProspect={initialProspect}
      savedScenarios={scenarios}
      initialScenarioId={scenarioId}
    />
  );
}
