"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CsEscalationBanner } from "@/components/cs/CsEscalationBanner";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || "id";
  const t = useTranslations("Auth");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escalationData, setEscalationData] = useState<{
    status: string;
    isOverThreshold: boolean;
    elapsedHours: number;
    thresholdHours: number;
    waLink: string | null;
  } | null>(null);

  const rawCallbackUrl = searchParams.get("callbackUrl");

  const getSafeCallbackUrl = () => {
    if (rawCallbackUrl && rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//") && !rawCallbackUrl.startsWith("/\\")) {
      return rawCallbackUrl;
    }
    return "/dashboard";
  };

  // Form State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Register specific - Step 1
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Register specific - Step 2 (Channel)
  const [registerStep, setRegisterStep] = useState(1);
  const [channelName, setChannelName] = useState("");
  const [niche, setNiche] = useState("");
  const [description, setDescription] = useState("");
  const [cta1, setCta1] = useState("");
  const [cta2, setCta2] = useState("");
  const [visualAesthetic, setVisualAesthetic] = useState("");
  const [audioBGM, setAudioBGM] = useState(true);
  const [audioSFX, setAudioSFX] = useState(true);
  const [audioVO, setAudioVO] = useState(true);
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");

  const handleNextStep = () => {
    if (!name.trim()) {
      setError(t('fullName') + " " + t('fieldRequired'));
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setError(t('usernameMin'));
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      setError(t('usernameInvalid'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(t('emailInvalid'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passNotMatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('passMinLen'));
      return;
    }
    setError(null);
    setRegisterStep(2);
  };

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setEscalationData(null);

    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          redirect: false,
          identifier,
          password,
          rememberMe: rememberMe.toString(),
        });

        if (res?.error) {
          const knownCodes = ["RATE_LIMITED", "PENDING_APPROVAL", "REJECTED", "INVALID_CREDENTIALS"];
          const errMessage = knownCodes.includes(res.error) ? t(res.error as Parameters<typeof t>[0]) : res.error;
          setError(errMessage);
          try {
            const regRes = await fetch(`/api/auth/registration-status?identifier=${encodeURIComponent(identifier)}`);
            if (regRes.ok) {
              const regData = await regRes.json();
              if (regData.status === "PENDING_APPROVAL" || regData.status === "REJECTED") {
                setEscalationData({
                  status: regData.status,
                  isOverThreshold: regData.isOverThreshold,
                  elapsedHours: regData.elapsedHours,
                  thresholdHours: regData.registrationPendingAlertHours,
                  waLink: regData.waLink,
                });
              }
            }
          } catch {
            // Ignore fetch error
          }
        } else {
          router.push(getSafeCallbackUrl());
          router.refresh();
        }
      } else {
        // Register flow
        if (!channelName.trim()) {
          setError(t('channelName') + " " + t('channelRequired'));

          setLoading(false);
          return;
        }

        const parsedSocial = {
          tiktok: socialTiktok,
          instagram: socialInstagram,
          youtube: socialYoutube,
          facebook: socialFacebook,
          website: socialWebsite
        };

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            username,
            email,
            phoneNumber,
            dateOfBirth,
            password,
            channelName,
            niche,
            description,
            cta1,
            cta2,
            visualAesthetic,
            audioBGM,
            audioSFX,
            audioVO,
            socialLinks: parsedSocial
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t('regFailed'));
          setRegisterStep(1); // Go back if error is in basic fields
        } else {
          // Show pending approval notice and switch to login tab
          setSuccessMessage(data.message || t('accountPendingApproval'));
          setIsLogin(true);
          setRegisterStep(1);
          setPassword("");
          setConfirmPassword("");
        }
      }
    } catch (err) {
      setError(t('sysError'));
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input style ──
  const inputCls = "w-full px-4 py-2.5 text-sm font-medium outline-none transition-all neu-input";
  const labelCls = "block text-xs font-semibold mb-1.5";

  return (
    <div>
      {/* ── Tab Switcher ── */}
      <div className="flex mb-6 neu-pressed rounded-xl p-1">
        <button
          type="button"
          onClick={() => { setIsLogin(true); setError(null); setSuccessMessage(null); setRegisterStep(1); }}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={isLogin ? {
            background: 'var(--pg-brand)',
            color: '#fff',
            boxShadow: '0 2px 8px var(--pg-brand-glow)'
          } : { color: 'var(--pg-text-sub)', background: 'transparent' }}
        >
          {t('login')}
        </button>
        <button
          type="button"
          onClick={() => { setIsLogin(false); setError(null); setSuccessMessage(null); }}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={!isLogin ? {
            background: 'var(--pg-brand)',
            color: '#fff',
            boxShadow: '0 2px 8px var(--pg-brand-glow)'
          } : { color: 'var(--pg-text-sub)', background: 'transparent' }}
        >
          {t('register')}
        </button>
      </div>

      {successMessage && (
        <div className="mb-5 p-4 rounded-xl text-sm font-medium pg-fade-in"
          style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--pg-success)', boxShadow: 'var(--pg-neu-sm)' }}>
          ✅ {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-5 p-4 rounded-xl text-sm font-medium pg-shake pg-fade-in"
          style={{ background: 'rgba(225,112,85,0.12)', color: 'var(--pg-danger)', boxShadow: 'var(--pg-neu-sm)' }}>
          ⚠️ {error}
        </div>
      )}

      {escalationData && (
        <div className="mb-6">
          <CsEscalationBanner
            urgency={
              escalationData.status === "REJECTED"
                ? "error"
                : escalationData.isOverThreshold
                ? "warning"
                : "info"
            }
            title={
              escalationData.status === "REJECTED"
                ? t("rejectedBannerTitle")
                : t("pendingBannerTitle")
            }
            description={
              escalationData.status === "REJECTED"
                ? t("rejectedBannerDesc")
                : t("pendingBannerDesc")
            }
            badgeText={
              escalationData.status === "PENDING_APPROVAL"
                ? escalationData.isOverThreshold
                  ? t("pendingBadgeOver", { hours: escalationData.thresholdHours })
                  : t("pendingBadgeNormal")
                : undefined
            }
            waLink={escalationData.waLink}
            waButtonText={t("contactCsBtn")}
          />
        </div>
      )}

      <form autoComplete="off" onSubmit={isLogin || registerStep === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
        <fieldset disabled={loading} className="space-y-4">
          {isLogin ? (
            // LOGIN FIELDS
            <>
              <div>
                <label className={labelCls} style={{ color: 'var(--pg-text)' }}>
                  {t('emailLabel')}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                  className={inputCls}
                  placeholder={t('identifierPlaceholder')}
                />
              </div>
              
              <div>
                <label className={labelCls} style={{ color: 'var(--pg-text)' }}>
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                    style={{ color: 'var(--pg-brand)' }}>
                    {showPassword ? t('hide') : t('show')}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded"
                    style={{ accentColor: 'var(--pg-brand)' }}
                  />
                  <span className="text-xs font-medium" style={{ color: 'var(--pg-text-sub)' }}>{t('rememberMe')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/auth/forgot-password`)}
                  className="text-xs font-semibold"
                  style={{ color: 'var(--pg-brand)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {t('forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-white font-semibold flex items-center justify-center gap-2 mt-6 disabled:opacity-60 neu-btn-brand"
              >
                {loading ? <span className="pg-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : '✨'}
                {t('submitLogin')}
              </button>
            </>
          ) : registerStep === 1 ? (
            // REGISTER STEP 1
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                <label className={labelCls} style={{ color: 'var(--pg-text)' }}>{t('fullName')}</label>
                  <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
                </div>
                <div>
                <label className={labelCls} style={{ color: 'var(--pg-text)' }}>{t('username')}</label>
                  <input type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required className={inputCls} />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('email')}</label>
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                <label className={labelCls} style={{ color: 'var(--pg-text)' }}>{t('phone')}</label>
                  <input type="tel" autoComplete="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputCls} />
                </div>
                <div>
                <label className={labelCls} style={{ color: 'var(--pg-text)' }}>{t('dob')}</label>
                  <input type="date" autoComplete="bday" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                <label className={labelCls} style={{ color: 'var(--pg-text)' }}>{t('password')}</label>
                  <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={inputCls} />
                </div>
                <div>
                <label className={labelCls} style={{ color: 'var(--pg-text)' }}>{t('confirmPass')}</label>
                  <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className={inputCls} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 px-4 text-white font-semibold flex items-center justify-center gap-2 mt-4 disabled:opacity-60 neu-btn-brand">
                <span>{t('continueStep2')}</span>
              </button>
            </>
          ) : (
            // REGISTER STEP 2 (Channel Profile)
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="font-semibold text-sm border-b pb-2 mb-2" style={{ color: 'var(--pg-text)', borderColor: 'var(--pg-shadow-dark)' }}>{t('setupProfile')}</h3>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('channelName')}*</label>
                <input type="text" value={channelName} onChange={(e) => setChannelName(e.target.value)} required className={inputCls} />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('channelNiche')}</label>
                <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder={t('channelNichePlaceholder')} className={inputCls} />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('channelDesc')}</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                <label className={labelCls} style={{ color: 'var(--pg-text)' }}>{t('cta1')}</label>
                  <input type="text" value={cta1} onChange={(e) => setCta1(e.target.value)} className={inputCls} />
                </div>
                <div>
                <label className={labelCls} style={{ color: 'var(--pg-text)' }}>{t('cta2')}</label>
                  <input type="text" value={cta2} onChange={(e) => setCta2(e.target.value)} className={inputCls} />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('visualAesthetic')}</label>
                <input type="text" value={visualAesthetic} onChange={(e) => setVisualAesthetic(e.target.value)} className={inputCls} />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('audioUsage')}</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2"><input type="checkbox" checked={audioBGM} onChange={(e) => setAudioBGM(e.target.checked)} /> <span className="text-xs">BGM</span></label>
                  <label className="flex items-center space-x-2"><input type="checkbox" checked={audioSFX} onChange={(e) => setAudioSFX(e.target.checked)} /> <span className="text-xs">SFX</span></label>
                  <label className="flex items-center space-x-2"><input type="checkbox" checked={audioVO} onChange={(e) => setAudioVO(e.target.checked)} /> <span className="text-xs">Voice Over</span></label>
                </div>
              </div>
              
              <div className="pt-2 border-t" style={{ borderColor: 'var(--pg-shadow-dark)' }}>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('socialMedia')} (Opsional)</label>
                <div className="space-y-2">
                  <input type="text" value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} placeholder="TikTok Username/URL" className={inputCls} />
                  <input type="text" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="Instagram Username/URL" className={inputCls} />
                  <input type="text" value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} placeholder="YouTube Channel URL" className={inputCls} />
                  <input type="text" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="Facebook Page URL" className={inputCls} />
                  <input type="text" value={socialWebsite} onChange={(e) => setSocialWebsite(e.target.value)} placeholder="Website URL" className={inputCls} />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setRegisterStep(1)} className="px-4 py-2.5 text-sm font-semibold rounded-xl neu-btn" style={{ color: 'var(--pg-text-sub)' }}>{t('back')}</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-60 neu-btn-brand">
                  {loading ? <span className="pg-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" /> : '🚀'}
                  {t('submitRegister')}
                </button>
              </div>
            </div>
          )}
        </fieldset>
      </form>
    </div>
  );
}
