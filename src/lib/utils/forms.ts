import { applyAction } from "$app/forms";
import { invalidateAll } from "$app/navigation";
import { toast } from "svelte-sonner";
import type { ActionResult } from "@sveltejs/kit";

export function handleAction(
  options: {
    onSuccess?: () => void;
    fallbackError?: string;
  } = {},
) {
  return () =>
    async ({ result }: { result: ActionResult }) => {
      await applyAction(result);

      if (result.type === "failure") {
        const message = result.data?.error;
        toast.error(
          typeof message === "string" && message
            ? message
            : (options.fallbackError ?? "Não foi possível concluir a ação."),
        );
        return;
      }

      if (result.type === "success") {
        options.onSuccess?.();
        await invalidateAll();
      }
    };
}
