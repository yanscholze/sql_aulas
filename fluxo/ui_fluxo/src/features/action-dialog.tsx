import { useState, type ReactNode, type FormEvent } from "react";
import { Button, Modal, Notice } from "../design-system/ui";
export function ActionDialog({
  title,
  description,
  children,
  onClose,
  onSubmit,
  submitLabel = "Confirmar",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<unknown>;
  submitLabel?: string;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await onSubmit(data);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      onClose={() => {
        if (!busy) onClose();
      }}
      title={title}
      description={description}
    >
      <form onSubmit={submit} className="stack">
        {children}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button busy={busy}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
