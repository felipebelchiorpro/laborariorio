'use server';
/**
 * @fileOverview Um agente de IA para sugerir o destino de um exame.
 *
 * - suggestDestination - Uma função que aciona o fluxo de sugestão de destino.
 * - SuggestDestinationInput - O tipo de entrada para a função.
 * - SuggestDestinationOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import { withdrawnByOptions } from '@/lib/data';
import {z} from 'zod';

const SuggestDestinationInputSchema = z.object({
  patientName: z.string().describe("O nome do paciente."),
  observations: z.string().optional().describe('As observações do exame.'),
});
export type SuggestDestinationInput = z.infer<typeof SuggestDestinationInputSchema>;

const SuggestDestinationOutputSchema = z.object({
  destination: z.string().describe("O destino sugerido para o exame."),
});
export type SuggestDestinationOutput = z.infer<typeof SuggestDestinationOutputSchema>;

export async function suggestDestination(input: SuggestDestinationInput): Promise<SuggestDestinationOutput> {
  return suggestDestinationFlow(input);
}

const destinationOptions = withdrawnByOptions.map(option => option.value).join(', ');

const prompt = ai.definePrompt({
  name: 'suggestDestinationPrompt',
  input: {schema: SuggestDestinationInputSchema},
  output: {schema: SuggestDestinationOutputSchema},
  prompt: `Você é um assistente de laboratório altamente eficiente. Sua tarefa é sugerir o destino de um exame com base no nome do paciente e nas observações.

Use as informações abaixo para determinar o destino mais provável.

Nome do Paciente: {{{patientName}}}
Observações: {{{observations}}}

Escolha um dos seguintes destinos: ${destinationOptions}.

Responda apenas com o nome do destino sugerido. Se as observações mencionarem "prefeitura" ou "municipal", sugira "Municipal". Se mencionarem uma UBS específica, use essa UBS. Se não tiver certeza, sugira "RETIRADO".`,
});

const suggestDestinationFlow = ai.defineFlow(
  {
    name: 'suggestDestinationFlow',
    inputSchema: SuggestDestinationInputSchema,
    outputSchema: SuggestDestinationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
