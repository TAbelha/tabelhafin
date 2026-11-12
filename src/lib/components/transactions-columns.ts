import type { ColumnDef } from "@tanstack/svelte-table";
import { formatCurrency } from "$lib/utils/format";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string | null;
  accountName: string | null;
}

export const transactionColumns: ColumnDef<Transaction, any>[] = [
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => {
      return new Date(row.getValue("date")).toLocaleDateString("pt-BR");
    },
    sortingFn: "datetime",
  },
  {
    accessorKey: "description",
    header: "Descrição",
  },
  {
    accessorKey: "category",
    header: "Categoria",
  },
  {
    accessorKey: "accountName",
    header: "Conta",
    cell: ({ row }) => row.getValue("accountName") ?? "—",
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return formatCurrency(amount);
    },
    sortingFn: "basic",
    meta: {
      className: "text-right font-mono",
    },
  },
];
