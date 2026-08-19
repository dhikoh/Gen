"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CsEscalationBanner } from "@/components/cs/CsEscalationBanner";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
          setError(res.error);
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

  return (
    <div className="w-full max-w-md mx-auto p-6 glass-panel rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex justify-center mb-8">
        <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg inline-flex neu-pressed">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); setSuccessMessage(null); setRegisterStep(1); }}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${isLogin ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            {t('login')}
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); setSuccessMessage(null); }}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${!isLogin ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            {t('register')}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm leading-relaxed">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t('emailLabel')}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white neu-flat"
                  placeholder={t('identifierPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white pr-10 neu-flat"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
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
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-zinc-600 dark:text-zinc-400">{t('rememberMe')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => router.push(`/${document.documentElement.lang || 'id'}/auth/forgot-password`)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  {t('forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 flex items-center justify-center mt-6 neu-flat"
              >
                {loading ? <span className="inline-block animate-spin mr-2 border-2 border-white/20 border-t-white rounded-full w-5 h-5" /> : null}
                {t('submitLogin')}
              </button>
            </>
          ) : registerStep === 1 ? (
            // REGISTER STEP 1
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('fullName')}</label>
                  <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('username')}</label>
                  <input type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('email')}</label>
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('phone')}</label>
                  <input type="tel" autoComplete="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('dob')}</label>
                  <input type="date" autoComplete="bday" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('password')}</label>
                  <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('confirmPass')}</label>
                  <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                </div>
              </div>

              <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all mt-4 neu-flat">
                <span>{t('continueStep2').replace('&rarr;', '→')}</span>
              </button>
            </>
          ) : (
            // REGISTER STEP 2 (Channel Profile)
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm border-b pb-2 mb-2">{t('setupProfile')}</h3>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('channelName')}*</label>
                <input type="text" value={channelName} onChange={(e) => setChannelName(e.target.value)} required className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('channelNiche')}</label>
                <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder={t('channelNichePlaceholder')} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('channelDesc')}</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('cta1')}</label>
                  <input type="text" value={cta1} onChange={(e) => setCta1(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('cta2')}</label>
                  <input type="text" value={cta2} onChange={(e) => setCta2(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('visualAesthetic')}</label>
                <input type="text" value={visualAesthetic} onChange={(e) => setVisualAesthetic(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('audioUsage')}</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2"><input type="checkbox" checked={audioBGM} onChange={(e) => setAudioBGM(e.target.checked)} /> <span className="text-xs">BGM</span></label>
                  <label className="flex items-center space-x-2"><input type="checkbox" checked={audioSFX} onChange={(e) => setAudioSFX(e.target.checked)} /> <span className="text-xs">SFX</span></label>
                  <label className="flex items-center space-x-2"><input type="checkbox" checked={audioVO} onChange={(e) => setAudioVO(e.target.checked)} /> <span className="text-xs">Voice Over</span></label>
                </div>
              </div>
              
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('socialMedia')} (Opsional)</label>
                <div className="space-y-2">
                  <input type="text" value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} placeholder="TikTok Username/URL" className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                  <input type="text" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="Instagram Username/URL" className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                  <input type="text" value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} placeholder="YouTube Channel URL" className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                  <input type="text" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="Facebook Page URL" className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                  <input type="text" value={socialWebsite} onChange={(e) => setSocialWebsite(e.target.value)} placeholder="Website URL" className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none neu-flat" />
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button type="button" onClick={() => setRegisterStep(1)} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm neu-flat">{t('back')}</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm flex items-center justify-center text-sm neu-flat">
                  {loading ? <span className="inline-block animate-spin mr-2 border-2 border-white/20 border-t-white rounded-full w-4 h-4" /> : null}
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
