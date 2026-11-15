import { describe, it, expect } from "vitest";
import { hasFeature, KNOWN_PLAN_FEATURES } from "@/lib/planFeatures";
import { MOCK_SUPERADMIN, MOCK_PRO_USER, MOCK_FREE_USER } from "./testHarness";

describe("E2E Skenario 3: Admin Plan Gating, Superadmin Bypass & Bidirectional Fallback", () => {
  describe("Policy 1: Strict Fail-Closed for Premium Studios (User Level)", () => {
    it("denies Free Tier user access to Web Motion Studio and Camera Movement Pro", () => {
      const freeFeatures = MOCK_FREE_USER.plan?.features;

      expect(hasFeature(freeFeatures, "webMotionStudio", false)).toBe(false);
      expect(hasFeature(freeFeatures, "cameraMovementPro", false)).toBe(false);
      expect(hasFeature(freeFeatures, "htmlBlogExport", false)).toBe(false);

      // Fitur standar tetap diizinkan
      expect(hasFeature(freeFeatures, "imagePromptStudio", false)).toBe(true);
    });

    it("grants Pro Tier user full access to all studio capabilities", () => {
      const proFeatures = MOCK_PRO_USER.plan?.features;

      expect(hasFeature(proFeatures, "webMotionStudio", false)).toBe(true);
      expect(hasFeature(proFeatures, "cameraMovementPro", false)).toBe(true);
      expect(hasFeature(proFeatures, "htmlBlogExport", false)).toBe(true);
      expect(hasFeature(proFeatures, "imagePromptStudio", false)).toBe(true);
    });
  });

  describe("Policy 2: Absolute Superadmin Bypass", () => {
    it("grants Superadmin unrestricted access regardless of feature dictionary or null plan", () => {
      // 1. Plan kosong / null -> Tetap lolos
      expect(hasFeature(null, "webMotionStudio", true)).toBe(true);
      expect(hasFeature(undefined, "cameraMovementPro", true)).toBe(true);

      // 2. Feature secara eksplisit diset false di database -> Superadmin tetap bypass
      const restrictedFeatures = { webMotionStudio: false, cameraMovementPro: false };
      expect(hasFeature(restrictedFeatures, "webMotionStudio", true)).toBe(true);
      expect(hasFeature(restrictedFeatures, "cameraMovementPro", true)).toBe(true);
    });
  });

  describe("Policy 3: Bidirectional Backward-Compatibility Alias", () => {
    it("transparently activates webMotionStudio when an existing plan only has remotionStudio: true", () => {
      const legacyPlanFeatures = { remotionStudio: true }; // Belum pernah dimigrasi ke webMotionStudio
      expect(hasFeature(legacyPlanFeatures, "webMotionStudio", false)).toBe(true);
    });

    it("transparently activates remotionStudio when a new plan has webMotionStudio: true", () => {
      const newPlanFeatures = { webMotionStudio: true };
      expect(hasFeature(newPlanFeatures, "remotionStudio", false)).toBe(true);
    });
  });

  describe("Simulasi Gate Alur Server API (/api/generate)", () => {
    function simulateGenerateRouteGate(
      userSession: typeof MOCK_PRO_USER | typeof MOCK_FREE_USER | typeof MOCK_SUPERADMIN,
      requestType: "VIDEO" | "IMAGE" | "MOTION",
      clientOptedInProCamera: boolean = false
    ): { allowed: boolean; status: number; error?: string; cameraMovementProEnabled: boolean } {
      const isSuperadmin = userSession.user.role === "SUPERADMIN";
      const rawFeatures = userSession.plan?.features ?? {};

      // 1. Validasi Web Motion
      if (requestType === "MOTION") {
        const hasMotionAccess = hasFeature(rawFeatures, "webMotionStudio", isSuperadmin);
        if (!hasMotionAccess) {
          return {
            allowed: false,
            status: 403,
            error: "Fitur Web Motion memerlukan paket PRO",
            cameraMovementProEnabled: false,
          };
        }
      }

      // 2. Resolusi Camera Movement Pro Entitlement
      const serverHasProEntitlement = hasFeature(rawFeatures, "cameraMovementPro", isSuperadmin);
      const cameraMovementProEnabled = serverHasProEntitlement && clientOptedInProCamera;

      return {
        allowed: true,
        status: 200,
        cameraMovementProEnabled,
      };
    }

    it("rejects Free User request for MOTION with HTTP 403 and localized error message", () => {
      const response = simulateGenerateRouteGate(MOCK_FREE_USER, "MOTION");
      expect(response.allowed).toBe(false);
      expect(response.status).toBe(403);
      expect(response.error).toContain("Web Motion");
    });

    it("allows Pro User request for MOTION with HTTP 200", () => {
      const response = simulateGenerateRouteGate(MOCK_PRO_USER, "MOTION");
      expect(response.allowed).toBe(true);
      expect(response.status).toBe(200);
      expect(response.error).toBeUndefined();
    });

    it("allows Superadmin request for MOTION even if simulated plan is empty", () => {
      const response = simulateGenerateRouteGate(MOCK_SUPERADMIN, "MOTION");
      expect(response.allowed).toBe(true);
      expect(response.status).toBe(200);
    });

    it("honors Camera Movement Pro only when both server entitlement and user opt-in exist", () => {
      // Kasus A: Free user coba paksa opt-in PRO camera -> server menolak mode pro
      const freeAttempt = simulateGenerateRouteGate(MOCK_FREE_USER, "VIDEO", true);
      expect(freeAttempt.cameraMovementProEnabled).toBe(false);

      // Kasus B: Pro user opt-in PRO camera -> server mengaktifkan mode pro
      const proEnabled = simulateGenerateRouteGate(MOCK_PRO_USER, "VIDEO", true);
      expect(proEnabled.cameraMovementProEnabled).toBe(true);

      // Kasus C: Pro user tidak opt-in PRO camera -> server tidak mengaktifkan
      const proDisabled = simulateGenerateRouteGate(MOCK_PRO_USER, "VIDEO", false);
      expect(proDisabled.cameraMovementProEnabled).toBe(false);

      // Kasus D: Superadmin opt-in -> selalu aktif
      const adminEnabled = simulateGenerateRouteGate(MOCK_SUPERADMIN, "VIDEO", true);
      expect(adminEnabled.cameraMovementProEnabled).toBe(true);
    });
  });
});

