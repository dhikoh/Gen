export function getTicketStatusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return {
        labelKey: "statusOPEN",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
      };
    case "REPLIED":
      return {
        labelKey: "statusREPLIED",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
      };
    case "CLOSED":
      return {
        labelKey: "statusCLOSED",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
      };
    default:
      return {
        labelKey: status,
        className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
      };
  }
}

export function getCsModeLabel(mode: string) {
  switch (mode) {
    case "DIRECT_WHATSAPP":
      return "Direct WhatsApp";
    case "DIRECT_EMAIL":
      return "Direct Email";
    case "TICKET":
      return "Sistem Tiket Internal";
    default:
      return mode;
  }
}
