'use server';

/**
 * @fileOverview AI flow to suggest optimal action sequences based on past administrator actions.
 *
 * - suggestOptimalActions - Function that suggests optimal actions for new patients or exam types.
 * - SuggestOptimalActionsInput - The input type for the suggestOptimalActions function.
 * - SuggestOptimalActionsOutput - The return type for the suggestOptimalActions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalActionsInputSchema = z.object({
  patientName: z.string().describe('The name of the patient.'),
  examType: z.string().describe('The type of exam.'),
  pastActions: z.array(z.string()).describe('An array of past actions performed by the administrator for similar patients or exam types.'),
});
export type SuggestOptimalActionsInput = z.infer<typeof SuggestOptimalActionsInputSchema>;

const SuggestOptimalActionsOutputSchema = z.object({
  suggestedActions: z.array(z.string()).describe('An array of suggested optimal actions for the given patient and exam type.'),
});
export type SuggestOptimalActionsOutput = z.infer<typeof SuggestOptimalActionsOutputSchema>;

export async function suggestOptimalActions(input: SuggestOptimalActionsInput): Promise<SuggestOptimalActionsOutput> {
  return suggestOptimalActionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalActionsPrompt',
  input: {schema: SuggestOptimalActionsInputSchema},
  output: {schema: SuggestOptimalActionsOutputSchema},
  prompt: `You are an AI assistant designed to suggest optimal sequences of actions for a laboratory administrator.

  Based on the past actions performed for similar patients or exam types, suggest an optimal sequence of actions for the new patient and exam type.

  Patient Name: {{{patientName}}}
  Exam Type: {{{examType}}}
  Past Actions: {{#each pastActions}}{{{this}}}, {{/each}}

  Suggest an optimal sequence of actions that the administrator should take.
  Actions can include: Register Patient, Schedule Exam, Analyze Sample, Review Results, Deliver Results, Upload Results.
  Return the suggested actions as a JSON array of strings.
  `,
});

const suggestOptimalActionsFlow = ai.defineFlow(
  {
    name: 'suggestOptimalActionsFlow',
    inputSchema: SuggestOptimalActionsInputSchema,
    outputSchema: SuggestOptimalActionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
