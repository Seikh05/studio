'use server';

/**
 * @fileOverview AI flow to validate the consistency of item descriptions.
 *
 * - validateDescriptionConsistency - A function that validates item description consistency.
 * - ValidateDescriptionConsistencyInput - The input type for the validateDescriptionConsistency function.
 * - ValidateDescriptionConsistencyOutput - The return type for the validateDescriptionConsistency function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateDescriptionConsistencyInputSchema = z.object({
  itemDescription: z
    .string()
    .describe('The description of the item to validate.'),
  category: z.string().describe('The category of the item.'),
  itemDetails: z.string().describe('Other details about the item'),
});
export type ValidateDescriptionConsistencyInput = z.infer<
  typeof ValidateDescriptionConsistencyInputSchema
>;

const ValidateDescriptionConsistencyOutputSchema = z.object({
  isConsistent: z
    .boolean()
    .describe(
      'Whether the item description is consistent with the item category and details.'
    ),
  reason: z.string().describe('The reason for the inconsistency, if any.'),
});
export type ValidateDescriptionConsistencyOutput = z.infer<
  typeof ValidateDescriptionConsistencyOutputSchema
>;

export async function validateDescriptionConsistency(
  input: ValidateDescriptionConsistencyInput
): Promise<ValidateDescriptionConsistencyOutput> {
  return validateDescriptionConsistencyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateDescriptionConsistencyPrompt',
  input: {schema: ValidateDescriptionConsistencyInputSchema},
  output: {schema: ValidateDescriptionConsistencyOutputSchema},
  prompt: `You are an AI assistant that validates the consistency of item descriptions based on the item category and other details.

  Determine if the provided item description is consistent with the item's category and details.

  Item Description: {{{itemDescription}}}
  Category: {{{category}}}
  Item Details: {{{itemDetails}}}

  Based on your analysis, determine whether the description is consistent with the category and item details. Set the isConsistent field to true if consistent, and false otherwise. Provide a reason for your determination in the reason field.

  Respond in JSON format.`,
});

const validateDescriptionConsistencyFlow = ai.defineFlow(
  {
    name: 'validateDescriptionConsistencyFlow',
    inputSchema: ValidateDescriptionConsistencyInputSchema,
    outputSchema: ValidateDescriptionConsistencyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
