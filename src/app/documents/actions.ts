'use server';

import { createDocument, deleteDocument } from '@/lib/database';
import { revalidatePath } from 'next/cache';

interface CreateDocumentInput {
  property_id?: string | null;
  prospect_id?: string | null;
  name: string;
  type: string;
  file_url: string;
}

export async function createDocumentAction(
  input: CreateDocumentInput
): Promise<{ success: boolean; document?: any; error?: string }> {
  try {
    const document = await createDocument({
      property_id: input.property_id || null,
      prospect_id: input.prospect_id || null,
      name: input.name,
      type: input.type,
      file_url: input.file_url,
      file_size: null,
    });

    if (!document) {
      return { success: false, error: 'Failed to create document' };
    }

    revalidatePath('/documents');

    return { success: true, document };
  } catch (error) {
    console.error('Error creating document:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteDocumentAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await deleteDocument(id);

    if (!success) {
      return { success: false, error: 'Failed to delete document' };
    }

    revalidatePath('/documents');

    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
