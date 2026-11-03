import { z } from "zod";
import { prisma } from "./prisma";

export const leadSchema = z.object({
  type: z.enum(["SPONSOR", "CREATOR"]),
  name: z.string().trim().min(1).max(80),
  contact: z.string().trim().min(1).max(120),
  organization: z.string().trim().max(120).optional(),
  message: z.string().trim().min(1).max(1000),
  website: z.string().max(500).optional(), // honeypot
});

export type LeadInput = z.input<typeof leadSchema>;

/** Stores a lead; a filled honeypot is silently dropped. */
export async function createLead(input: LeadInput): Promise<void> {
  const d = leadSchema.parse(input);
  if (d.website) return;
  await prisma.lead.create({
    data: { type: d.type, name: d.name, contact: d.contact, organization: d.organization || null, message: d.message },
  });
}
