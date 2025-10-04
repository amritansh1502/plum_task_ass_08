const { z } = require('zod');

// Defines the structure for a single amount object
const amountSchema = z.object({
  type: z.string().min(1, 'Type cannot be empty'),
  value: z.number(),
  source: z.string().min(1, 'Source text cannot be empty'),
});

// Defines the structure for the final JSON output
const finalOutputSchema = z.object({
  currency: z.string().min(1, 'Currency cannot be empty'),
  amounts: z.array(amountSchema),
  confidence: z.number().min(0).max(1).optional(),
});

// Defines the structure for guardrail exit condition
const guardrailExitSchema = z.object({
  status: z.string(),
  reason: z.string(),
});

module.exports = { finalOutputSchema, guardrailExitSchema };
