'use server';

import { createScenario, updateScenario, deleteScenario, getAllScenarios, getScenario } from '@/lib/database';
import { revalidatePath } from 'next/cache';

export async function saveScenarioAction(data: {
  id?: string;
  prospect_id?: string | null;
  property_id?: string | null;
  name: string;
  rental_type: 'ltr' | 'str';
  scenario_data: Record<string, unknown>;
}) {
  try {
    let result;

    if (data.id) {
      // Update existing scenario
      result = await updateScenario(data.id, {
        name: data.name,
        rental_type: data.rental_type,
        scenario_data: data.scenario_data,
      });
    } else {
      // Create new scenario
      result = await createScenario({
        prospect_id: data.prospect_id,
        property_id: data.property_id,
        name: data.name,
        rental_type: data.rental_type,
        scenario_data: data.scenario_data,
      });
    }

    revalidatePath('/calculator');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving scenario:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save scenario' };
  }
}

export async function deleteScenarioAction(id: string) {
  try {
    const success = await deleteScenario(id);
    if (!success) {
      return { success: false, error: 'Failed to delete scenario' };
    }
    revalidatePath('/calculator');
    return { success: true };
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete scenario' };
  }
}

export async function getScenariosAction() {
  try {
    const scenarios = await getAllScenarios();
    return { success: true, data: scenarios };
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch scenarios' };
  }
}

export async function getScenarioAction(id: string) {
  try {
    const scenario = await getScenario(id);
    if (!scenario) {
      return { success: false, error: 'Scenario not found' };
    }
    return { success: true, data: scenario };
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch scenario' };
  }
}
