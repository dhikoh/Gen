import { describe, it, expect } from "vitest";
import {
  getSubscriptionStatusLabel,
  getSubscriptionStatusBadge,
  getPaymentStatusLabel,
  getPaymentStatusBadge,
  getRoleLabel,
  getRoleBadge,
  getRegistrationStatusLabel,
  getRegistrationStatusBadge,
  getTicketStatusBadge,
  getCsModeLabelKey,
} from "@/lib/enumMapping";

describe("enumMapping", () => {
  describe("SubscriptionStatus", () => {
    it("returns default Indonesian labels without translator", () => {
      expect(getSubscriptionStatusLabel("ACTIVE")).toBe("Aktif");
      expect(getSubscriptionStatusLabel("INACTIVE")).toBe("Tidak Aktif");
      expect(getSubscriptionStatusLabel("EXPIRED")).toBe("Kedaluwarsa");
      expect(getSubscriptionStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    });

    it("uses translator function if provided", () => {
      const mockT = (key: string) => `trans_${key}`;
      expect(getSubscriptionStatusLabel("ACTIVE", mockT)).toBe("trans_SubscriptionStatus.ACTIVE");
    });

    it("returns proper badge classes and colors", () => {
      const activeBadge = getSubscriptionStatusBadge("ACTIVE");
      expect(activeBadge.color).toBe("var(--pg-success)");
      expect(activeBadge.className).toContain("text-emerald-600");

      const expiredBadge = getSubscriptionStatusBadge("EXPIRED");
      expect(expiredBadge.color).toBe("var(--pg-danger)");
      expect(expiredBadge.className).toContain("text-rose-600");

      const inactiveBadge = getSubscriptionStatusBadge("INACTIVE");
      expect(inactiveBadge.color).toBe("var(--pg-text-muted)");
    });
  });

  describe("PaymentStatus", () => {
    it("returns default labels correctly", () => {
      expect(getPaymentStatusLabel("PENDING")).toBe("Menunggu Konfirmasi");
      expect(getPaymentStatusLabel("APPROVED")).toBe("Disetujui");
      expect(getPaymentStatusLabel("REJECTED")).toBe("Ditolak");
      expect(getPaymentStatusLabel("PAID")).toBe("Disetujui");
      expect(getPaymentStatusLabel("FAILED")).toBe("Ditolak");
    });

    it("returns badge styles for each status", () => {
      expect(getPaymentStatusBadge("APPROVED").color).toBe("var(--pg-success)");
      expect(getPaymentStatusBadge("REJECTED").color).toBe("var(--pg-danger)");
      expect(getPaymentStatusBadge("PENDING").color).toBe("var(--pg-warning)");
    });
  });

  describe("Role", () => {
    it("returns role labels and badges", () => {
      expect(getRoleLabel("SUPERADMIN")).toBe("Superadmin");
      expect(getRoleLabel("USER")).toBe("Pengguna");

      const superadminBadge = getRoleBadge("SUPERADMIN");
      expect(superadminBadge.className).toContain("text-purple-600");
    });
  });

  describe("RegistrationStatus", () => {
    it("returns registration status labels and badges", () => {
      expect(getRegistrationStatusLabel("APPROVED")).toBe("Disetujui");
      expect(getRegistrationStatusLabel("PENDING_APPROVAL")).toBe("Menunggu Persetujuan");
      expect(getRegistrationStatusLabel("REJECTED")).toBe("Ditolak");

      expect(getRegistrationStatusBadge("APPROVED").color).toBe("var(--pg-success)");
      expect(getRegistrationStatusBadge("PENDING_APPROVAL").color).toBe("var(--pg-warning)");
    });
  });

  describe("CS and Tickets", () => {
    it("returns correct CS mode keys", () => {
      expect(getCsModeLabelKey("DIRECT_WHATSAPP")).toBe("csModeDIRECT_WHATSAPP");
      expect(getCsModeLabelKey("DIRECT_EMAIL")).toBe("csModeDIRECT_EMAIL");
      expect(getCsModeLabelKey("TICKET")).toBe("csModeTICKET");
      expect(getCsModeLabelKey("CUSTOM")).toBe("CUSTOM");
    });

    it("returns ticket status badge", () => {
      expect(getTicketStatusBadge("OPEN").labelKey).toBe("statusOPEN");
      expect(getTicketStatusBadge("REPLIED").labelKey).toBe("statusREPLIED");
      expect(getTicketStatusBadge("CLOSED").labelKey).toBe("statusCLOSED");
    });
  });
});
