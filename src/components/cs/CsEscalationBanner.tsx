'use client'

import React, { useState } from 'react'
function IconAlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function IconInfo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

function IconMessageSquare({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

interface CsEscalationBannerProps {
  title: string
  message?: string
  description?: string
  waLink: string | null
  buttonText?: string
  waButtonText?: string
  badgeText?: string
  urgency?: 'info' | 'warning' | 'error'
  dismissible?: boolean
}

export function CsEscalationBanner({
  title,
  message,
  description,
  waLink,
  buttonText,
  waButtonText,
  badgeText,
  urgency = 'warning',
  dismissible = true,
}: CsEscalationBannerProps) {
  const displayMessage = message || description || ""
  const displayButtonText = buttonText || waButtonText || "Hubungi CS"
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const getUrgencyStyles = () => {
    switch (urgency) {
      case 'error':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          button: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20',
          icon: <IconAlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />,
        }
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          button: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20',
          icon: <IconAlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
        }
      case 'info':
      default:
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          button: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20',
          icon: <IconInfo className="w-5 h-5 text-cyan-400 shrink-0" />,
        }
    }
  }

  const style = getUrgencyStyles()

  return (
    <div
      className={`relative w-full p-4 rounded-xl border backdrop-blur-md transition-all shadow-lg ${style.bg}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {style.icon}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-sm sm:text-base text-white">
                {title}
              </h4>
              {badgeText && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${style.badge}`}
                >
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed text-slate-300">
              {displayMessage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg shadow-md transition-all ${style.button}`}
            >
              <IconMessageSquare className="w-4 h-4" />
              <span>{displayButtonText}</span>
            </a>
          )}

          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Tutup"
            >
              <IconX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
