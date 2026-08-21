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
          bg: { background: 'rgba(225,112,85,0.12)', borderColor: 'rgba(225,112,85,0.3)' },
          badgeStyle: { background: 'rgba(225,112,85,0.2)', color: 'var(--pg-danger)', borderColor: 'rgba(225,112,85,0.3)' },
          iconColor: 'var(--pg-danger)',
          icon: <span style={{ color: 'var(--pg-danger)', display:'contents' }}><IconAlertTriangle className="w-5 h-5 shrink-0" /></span>,
        }
      case 'warning':
        return {
          bg: { background: 'rgba(253,177,29,0.10)', borderColor: 'rgba(253,177,29,0.3)' },
          badgeStyle: { background: 'rgba(253,177,29,0.2)', color: 'var(--pg-warn)', borderColor: 'rgba(253,177,29,0.3)' },
          iconColor: 'var(--pg-warn)',
          icon: <span style={{ color: 'var(--pg-warn)', display:'contents' }}><IconAlertTriangle className="w-5 h-5 shrink-0" /></span>,
        }
      case 'info':
      default:
        return {
          bg: { background: 'rgba(99,102,241,0.10)', borderColor: 'rgba(99,102,241,0.3)' },
          badgeStyle: { background: 'rgba(99,102,241,0.2)', color: 'var(--pg-brand)', borderColor: 'rgba(99,102,241,0.3)' },
          iconColor: 'var(--pg-brand)',
          icon: <span style={{ color: 'var(--pg-brand)', display:'contents' }}><IconInfo className="w-5 h-5 shrink-0" /></span>,
        }
    }
  }

  const s = getUrgencyStyles()

  return (
    <div
      className="relative w-full p-4 rounded-xl border transition-all"
      style={{ ...s.bg, boxShadow: 'var(--pg-neu-sm)' }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {s.icon}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-sm sm:text-base" style={{ color: 'var(--pg-text)' }}>
                {title}
              </h4>
              {badgeText && (
                <span className="text-xs px-2 py-0.5 rounded-full border font-medium" style={s.badgeStyle}>
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--pg-text-sub)' }}>
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
              className="neu-btn-brand inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg text-white transition-all"
            >
              <IconMessageSquare className="w-4 h-4" />
              <span>{displayButtonText}</span>
            </a>
          )}

          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--pg-text-muted)' }}
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
