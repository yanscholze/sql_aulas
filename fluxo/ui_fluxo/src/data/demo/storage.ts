import { openDB, type DBSchema } from "idb";
import type { Command, DemoState } from "../contracts/models";
import { applyCommand, DemoError } from "./commands";
import { seed } from "./seed";
interface DemoDB extends DBSchema {
  state: { key: string; value: DemoState };
}
// Browser-only persistence. No API, remote database, account or server.
const DATABASE = "fluxo-ui-demo";
let connection: ReturnType<typeof openDB<DemoDB>> | undefined;
function db() {
  return (connection ??= openDB<DemoDB>(DATABASE, 1, {
    upgrade(d) {
      d.createObjectStore("state");
    },
    blocking() {
      connection?.then((d) => d.close());
      connection = undefined;
    },
  }));
}
export async function loadDemo(): Promise<DemoState> {
  try {
    const d = await db();
    const tx = d.transaction("state", "readwrite");
    let value = await tx.store.get("main");
    if (!value) {
      value = seed();
      await tx.store.put(value, "main");
    }
    if (value.schemaVersion !== 1)
      throw new Error("Versão de demonstração incompatível.");
    await tx.done;
    return value;
  } catch (error) {
    throw new DemoError(
      error instanceof Error
        ? error.message
        : "Não foi possível abrir os dados locais.",
      "storage",
    );
  }
}
export async function dispatch(command: Command): Promise<DemoState> {
  const d = await db();
  const tx = d.transaction("state", "readwrite");
  try {
    const current = (await tx.store.get("main")) ?? seed();
    const next = applyCommand(current, command);
    await tx.store.put(next, "main");
    await tx.done;
    return next;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* transaction already ended */
    }
    await tx.done.catch(() => undefined);
    if (error instanceof Error) throw error;
    throw new DemoError("Não foi possível salvar no navegador.", "storage");
  }
}
