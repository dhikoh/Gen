/**
 * Localization and badge mapping helpers for domain enums.
 * Fully integrated with next-intl and Prompt Gen Design System tokens.
 */

// Legacy helper for CS Tickets (preserved for backward compatibility)
export function getTicketStatusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return {
        labelKey: "statusOPEN",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
      };
    case "REPLIED":
      return {
        labelKey: "statusREPLIED",
        className: "bg-[var(--pg-brand-light)] text-[var(--pg-brand)] border border-[var(--pg-brand)]/20",
      };
    case "CLOSED":
      return {
        labelKey: "statusCLOSED",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
      };
    default:
      return {
        labelKey: status,
        className: "pg-surface-dim pg-text-sub border pg-border",
      };
  }
}

/**
 * Returns an i18n-safe labelKey for CS mode.
 * Consumers can use t(labelKey) to get the localized string.
 */
export function getCsModeLabelKey(mode: string): string {
  switch (mode) {
    case "DIRECT_WHATSAPP":
      return "csModeDIRECT_WHATSAPP";
    case "DIRECT_EMAIL":
      return "csModeDIRECT_EMAIL";
    case "TICKET":
      return "csModeTICKET";
    default:
      return mode;
  }
}

// ── Generic Translation Helper ────────────────────────────────────
type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

// ── SubscriptionStatus ───────────────────────────────────────────
export function getSubscriptionStatusLabel(status: string, t?: TranslateFn): string {
  if (t) {
    try {
      return t(`SubscriptionStatus.${status}`);
    } catch {
      // fallback
    }
  }
  switch (status) {
    case "ACTIVE":
      return "Aktif";
    case "INACTIVE":
      return "Tidak Aktif";
    case "EXPIRED":
      return "Kedaluwarsa";
    default:
      return status;
  }
}

export function getSubscriptionStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return {
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        color: "var(--pg-success)",
      };
    case "EXPIRED":
      return {
        className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        color: "var(--pg-danger)",
      };
    case "INACTIVE":
    default:
      return {
        className: "pg-surface-dim pg-text-sub border pg-border",
        color: "var(--pg-text-muted)",
      };
  }
}

// ── PaymentStatus ────────────────────────────────────────────────
export function getPaymentStatusLabel(status: string, t?: TranslateFn): string {
  if (t) {
    try {
      return t(`PaymentStatus.${status}`);
    } catch {
      // fallback
    }
  }
  switch (status) {
    case "PENDING":
      return "Menunggu Konfirmasi";
    case "APPROVED":
    case "PAID":
      return "Disetujui";
    case "REJECTED":
    case "FAILED":
      return "Ditolak";
    default:
      return status;
  }
}

export function getPaymentStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
    case "PAID":
      return {
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        color: "var(--pg-success)",
      };
    case "PENDING":
      return {
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        color: "var(--pg-warning)",
      };
    case "REJECTED":
    case "FAILED":
      return {
        className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        color: "var(--pg-danger)",
      };
    default:
      return {
        className: "pg-surface-dim pg-text-sub border pg-border",
        color: "var(--pg-text-muted)",
      };
  }
}

// ── RegistrationStatus ───────────────────────────────────────────
export function getRegistrationStatusLabel(status: string, t?: TranslateFn): string {
  if (t) {
    try {
      return t(`RegistrationStatus.${status}`);
    } catch {
      // fallback
    }
  }
  switch (status) {
    case "PENDING_APPROVAL":
      return "Menunggu Persetujuan";
    case "APPROVED":
      return "Disetujui";
    case "REJECTED":
      return "Ditolak";
    default:
      return status;
  }
}

export function getRegistrationStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return {
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        color: "var(--pg-success)",
      };
    case "PENDING_APPROVAL":
      return {
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        color: "var(--pg-warning)",
      };
    case "REJECTED":
      return {
        className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        color: "var(--pg-danger)",
      };
    default:
      return {
        className: "pg-surface-dim pg-text-sub border pg-border",
        color: "var(--pg-text-muted)",
      };
  }
}

// ── PlanCode ─────────────────────────────────────────────────────
export function getPlanCodeLabel(code: string, t?: TranslateFn): string {
  if (t) {
    try {
      return t(`PlanCode.${code}`);
    } catch {
      // fallback
    }
  }
  return code;
}

export function getPlanBadge(code: string) {
  switch (code.toUpperCase()) {
    case "ULTRA":
    case "ENTERPRISE":
      return {
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
        color: "#8b5cf6",
      };
    case "PRO":
      return {
        className: "bg-[var(--pg-brand-light)] text-[var(--pg-brand)] border border-[var(--pg-brand)]/20",
        color: "var(--pg-brand)",
      };
    case "STANDARD":
    case "STARTER":
      return {
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
        color: "var(--pg-info)",
      };
    case "DEMO":
    case "FREE":
    default:
      return {
        className: "pg-surface-dim pg-text-sub border pg-border",
        color: "var(--pg-text-muted)",
      };
  }
}

// ── Role ─────────────────────────────────────────────────────────
export function getRoleLabel(role: string, t?: TranslateFn): string {
  if (t) {
    try {
      return t(`Role.${role}`);
    } catch {
      // fallback
    }
  }
  switch (role) {
    case "SUPERADMIN":
      return "Superadmin";
    case "USER":
      return "Pengguna";
    default:
      return role;
  }
}

export function getRoleBadge(role: string) {
  switch (role) {
    case "SUPERADMIN":
      return {
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold",
      };
    case "USER":
    default:
      return {
        className: "pg-surface-dim pg-text-sub border pg-border",
      };
  }
}

// ── PaymentMethod ────────────────────────────────────────────────
export function getPaymentMethodLabel(method: string, t?: TranslateFn): string {
  if (t) {
    try {
      return t(`PaymentMethod.${method}`);
    } catch {
      // fallback
    }
  }
  switch (method) {
    case "MANUAL_TRANSFER":
      return "Transfer Manual";
    case "AUTOMATIC_GATEWAY":
      return "Payment Gateway Otomatis";
    default:
      return method;
  }
}

// ── NotificationType ─────────────────────────────────────────────
export function getNotificationTypeLabel(type: string, t?: TranslateFn): string {
  if (t) {
    try {
      return t(`NotificationType.${type}`);
    } catch {
      // fallback
    }
  }
  return type;
}

// ── DraftType ────────────────────────────────────────────────────
export function getDraftTypeLabel(type: string, t?: TranslateFn): string {
  if (t) {
    try {
      return t(`DraftType.${type}`);
    } catch {
      // fallback
    }
  }
  switch (type) {
    case "VIDEO":
      return "Naskah Video";
    case "IMAGE":
      return "Prompt Gambar";
    default:
      return type;
  }
}

// ── NarrationMode ────────────────────────────────────────────────
export function getNarrationModeLabel(mode: string, t?: TranslateFn): string {
  if (t) {
    try {
      return t(`NarrationMode.${mode}`);
    } catch {
      // fallback
    }
  }
  switch (mode) {
    case "VOICE_OVER":
      return "Voice Over (Narator Suara)";
    case "DIEGETIC_ONLY":
      return "Diegetik Murni (Suara Adegan)";
    case "SILENT_TEXT_ONLY":
      return "Teks Layar Saja (Tanpa Suara)";
    case "HYBRID":
      return "Hybrid (VO + Diegetik)";
    default:
      return mode;
  }
}

export function getNarrationModeBadge(mode: string) {
  switch (mode) {
    case "VOICE_OVER":
      return {
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
        icon: "🎙️",
      };
    case "DIEGETIC_ONLY":
      return {
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        icon: "🔇",
      };
    case "SILENT_TEXT_ONLY":
      return {
        className: "pg-surface-dim pg-text-sub border pg-border",
        icon: "📄",
      };
    case "HYBRID":
    default:
      return {
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
        icon: "🔀",
      };
  }
}

// ── DurationCalcMode ─────────────────────────────────────────────
export function getDurationCalcModeLabel(mode: string, t?: TranslateFn): string {
  if (t) {
    try {
      return t(`DurationCalcMode.${mode}`);
    } catch {
      // fallback
    }
  }
  switch (mode) {
    case "NARRATION_WORDCOUNT":
      return "Hitung Kata Narasi (WPM)";
    case "SEGMENT_SELF_ESTIMATE":
      return "Estimasi Durasi per Segmen";
    case "HYBRID":
      return "Hybrid (Kata Narasi + Segmen)";
    default:
      return mode;
  }
}

export function getDurationCalcModeBadge(mode?: string) {
  switch (mode) {
    case "SEGMENT_SELF_ESTIMATE":
      return {
        className: "bg-sky-500/10 text-sky-500 border border-sky-500/20",
        icon: "🎬",
      };
    case "HYBRID":
      return {
        className: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
        icon: "🔀",
      };
    case "NARRATION_WORDCOUNT":
    default:
      return {
        className: "bg-[var(--pg-brand-light)] text-[var(--pg-brand)] border border-[var(--pg-brand)]/20",
        icon: "⏱️",
      };
  }
}

// ── SupportTicketStatus ──────────────────────────────────────────
export function getSupportTicketStatusLabel(status: string, t?: TranslateFn): string {
  if (t) {
    try {
      return t(`SupportTicketStatus.${status}`);
    } catch {
      // fallback
    }
  }
  switch (status) {
    case "OPEN":
      return "Buka (Pending)";
    case "REPLIED":
      return "Telah Dibalas";
    case "CLOSED":
      return "Selesai (Ditutup)";
    default:
      return status;
  }
}
