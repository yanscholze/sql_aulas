import type { Account } from "@fluxo/core/domain/account/types.ts";
import type { Transaction } from "@fluxo/core/domain/ledger/types.ts";
import type { Recurrence } from "@fluxo/core/domain/recurrence/schedule.ts";
import type { PositionCard } from "@fluxo/core/domain/position/financial-position.ts";
import type { ProjectStatus } from "@fluxo/core/domain/work/status.ts";
export type { Account, Transaction, Recurrence, ProjectStatus };
export interface Card extends PositionCard {
  name: string;
  last4: string;
  color: string;
  limitCents: number;
  archived: boolean;
}
export interface Category {
  id: string;
  name: string;
  color: string;
  kind: "income" | "expense";
  essential: boolean;
  excluded: boolean;
}
export interface Entry extends Transaction {
  projectId?: string;
  fingerprint?: string;
}
export interface Budget {
  id: string;
  categoryId: string;
  limitCents: number;
  month: string;
}
export interface Goal {
  id: string;
  name: string;
  targetCents: number;
  accountId: string;
  dueOn: string;
}
export interface Trip {
  id: string;
  name: string;
  destination: string;
  startOn: string;
  endOn: string;
  budgetCents: number;
  currency: string;
  archived: boolean;
}
export interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  amountCents: number;
  dueOn: string;
  status: ProjectStatus;
  color: string;
}
export const TASK_STATUSES = [
  "todo",
  "doing",
  "blocked",
  "review",
  "done",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_LABELS: Record<TaskStatus, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  blocked: "Bloqueada",
  review: "Em revisão",
  done: "Concluída",
};
export interface Task {
  id: string;
  projectId: string;
  title: string;
  dueOn: string;
  status: TaskStatus;
  checklist: boolean;
}
export interface WorkSession {
  id: string;
  projectId: string;
  description: string;
  date: string;
  minutes: number;
}
export interface ProjectPayment {
  id: string;
  projectId: string;
  description: string;
  dueOn: string;
  amountCents: number;
  transactionId: string | null;
}
export interface Proposal {
  id: string;
  projectId: string;
  title: string;
  amountCents: number;
  status: "draft" | "sent" | "accepted";
}
export interface DocumentRecord {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
}
export interface Reward {
  id: string;
  cardId: string;
  description: string;
  points: number;
  date: string;
}
export interface Capture {
  id: string;
  description: string;
  amountCents: number;
  date: string;
  status: "review" | "accepted" | "ignored";
  accountId: string;
  categoryId: string;
}
export interface ImportRow {
  id: string;
  description: string;
  date: string;
  amountCents: number;
  fingerprint: string;
  duplicate: boolean;
  accepted: boolean;
  categoryId: string;
}
export interface ImportBatch {
  id: string;
  name: string;
  accountId: string;
  rows: ImportRow[];
  discarded: number;
  confirmed: boolean;
}
export interface Notification {
  id: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
}
export interface Conversation {
  id: string;
  title: string;
  messages: { id: string; role: "user" | "assistant"; text: string }[];
}
export interface Device {
  id: string;
  name: string;
  active: boolean;
}
export interface DemoState {
  schemaVersion: 1;
  revision: number;
  today: string;
  profile: { name: string; email: string };
  accounts: Account[];
  cards: Card[];
  categories: Category[];
  transactions: Entry[];
  recurrences: Recurrence[];
  budgets: Budget[];
  goals: Goal[];
  trips: Trip[];
  projects: Project[];
  tasks: Task[];
  sessions: WorkSession[];
  payments: ProjectPayment[];
  proposals: Proposal[];
  documents: DocumentRecord[];
  rewards: Reward[];
  captures: Capture[];
  imports: ImportBatch[];
  notifications: Notification[];
  conversations: Conversation[];
  devices: Device[];
  integrations: { github: boolean; ai: boolean };
  captureRules: { id: string; match: string; categoryId: string }[];
}
export type Values = Record<string, string>;
export type FormCommand =
  | "transaction.save"
  | "account.save"
  | "card.save"
  | "recurrence.save"
  | "budget.save"
  | "goal.save"
  | "trip.save"
  | "project.save"
  | "task.save"
  | "session.save"
  | "payment.save"
  | "proposal.save"
  | "category.save"
  | "reward.save"
  | "profile.save"
  | "capture.save"
  | "capture-rule.save";
export type Command =
  | { type: FormCommand; values: Values; id?: string }
  | { type: "transaction.delete"; id: string }
  | {
      type: "invoice.pay";
      cardId: string;
      competence: string;
      accountId: string;
      amountCents: number;
    }
  | {
      type:
        | "account.archive"
        | "card.archive"
        | "recurrence.toggle"
        | "trip.archive"
        | "notification.read"
        | "device.toggle";
      id: string;
    }
  | { type: "recurrence.confirm"; id: string; month: string }
  | { type: "task.move"; id: string; status: TaskStatus }
  | { type: "project.status"; id: string; status: ProjectStatus }
  | { type: "payment.receive"; id: string; accountId: string }
  | {
      type: "investment.transfer";
      accountId: string;
      investmentId: string;
      amountCents: number;
      redeem: boolean;
    }
  | { type: "account.reconcile"; id: string; balanceCents: number }
  | { type: "capture.resolve"; id: string; accept: boolean }
  | { type: "import.add"; batch: ImportBatch }
  | { type: "import.confirm"; id: string; selected: string[] }
  | { type: "document.add"; document: DocumentRecord }
  | { type: "document.delete"; id: string }
  | { type: "conversation.send"; id: string; text: string }
  | { type: "integration.toggle"; name: "github" | "ai" }
  | { type: "installment.anticipate"; planId: string; count: number }
  | { type: "demo.reset" };
