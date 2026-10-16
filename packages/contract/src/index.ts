// Single source of truth. Both apps import from here; neither invents its own shape.
// Times are ISO strings in UTC. Format them only at the edge of the screen.
import { z } from "zod";

export const RoleSchema = z.enum(["desk", "admin"]);
export const ItemStatusSchema = z.enum(["available", "out", "maintenance"]);
export const ConditionSchema = z.enum(["good", "marked", "damaged"]);

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  role: RoleSchema,
  fullName: z.string(),
});

export const ItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  category: z.string().min(1),
  qrCode: z.string().min(1),
  status: ItemStatusSchema,
  notes: z.string().nullable(),
});

export const BorrowerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().nullable(), // staff-only (enforced by RLS)
  organisation: z.string().nullable(),
  idVerified: z.boolean(),
});

export const LoanSchema = z.object({
  id: z.string().uuid(), // generated ON THE PHONE so retries never duplicate
  itemId: z.string().uuid(),
  borrowerId: z.string().uuid(),
  outAt: z.string().datetime({ offset: true }),
  dueAt: z.string().datetime({ offset: true }),
  returnedAt: z.string().datetime({ offset: true }).nullable(),
  conditionOut: ConditionSchema,
  conditionIn: ConditionSchema.nullable(),
  photoOutPath: z.string().nullable(),
  photoInPath: z.string().nullable(),
  staffOut: z.string().uuid(),
  staffIn: z.string().uuid().nullable(),
});

// Shown when the database rejects a loan because the item is already out.
export const LoanConflictSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  attemptedLoanId: z.string().uuid(),
  attemptedBy: z.string().uuid(),
  winningLoanId: z.string().uuid().nullable(),
  createdAt: z.string().datetime({ offset: true }),
});

// Dashboard views
export const OpenLoanSchema = z.object({
  id: z.string().uuid(),
  itemName: z.string(),
  borrowerName: z.string(),
  dueAt: z.string().datetime({ offset: true }),
});

export const UtilisationRowSchema = z.object({
  itemId: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  loans30d: z.number(),
});

export type Role = z.infer<typeof RoleSchema>;
export type ItemStatus = z.infer<typeof ItemStatusSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Borrower = z.infer<typeof BorrowerSchema>;
export type Loan = z.infer<typeof LoanSchema>;
export type LoanConflict = z.infer<typeof LoanConflictSchema>;
export type OpenLoan = z.infer<typeof OpenLoanSchema>;
export type UtilisationRow = z.infer<typeof UtilisationRowSchema>;