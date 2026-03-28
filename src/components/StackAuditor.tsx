'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { martechTools, type AuditResult, type ToolCategory } from '@/data/martech-tools'

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  crm: 'CRM',
  'email-marketing': 'Email Marketing',
  analytics: 'Analytics',
  advertising: 'Advertising',
  seo: 'SEO',
  social: 'Social Media',
  automation: 'Automation',
  cms: 'CMS',
  ecommerce: 'Ecommerce',
  'customer-support': 'Customer Support',
  video: 'Video',
  design: 'Design',
  infrastructure: 'Infrastructure',
  attribution: 'Attribution',
}

const CATEGORY_ORDER: ToolCategory[] = [
  'crm',
  'email-marketing',
  'analytics',
  'advertising',
  'seo',
  'social',
  'automation',
  'cms',
  'ecommerce',
  'customer-support',
  'attribution',
  'video',
  'design',
  'infrastructure',
]

const toolsByCategory = CATEGORY_ORDER.reduce<Record<string, typeof martechTools>>(
  (acc, cat) => {
    acc[cat] = martechTools.filter((t) => t.category === cat)
    return acc
  },
  {},
)

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-400/10 border-emerald-400/30'
  if (score >= 60) return 'bg-yellow-400/10 border-yellow-400/30'
  if (score >= 40) return 'bg-orange-400/10 border-orange-400/30'
  return 'bg-red-400/10 border-red-400/30'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Optimized'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Critical'
}

export default function StackAuditor() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<ToolCategory>('crm')
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const toggleTool = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAllInCategory = useCallback((cat: ToolCategory) => {
    const ids = toolsByCategory[cat].map((t) => t.id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
  }, [])

  const deselectAllInCategory = useCallback((cat: ToolCategory) => {
    const ids = new Set(toolsByCategory[cat].map((t) => t.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
  }, [])

  const allSelectedInCategory = useCallback(
    (cat: ToolCategory) => {
      return toolsByCategory[cat].every((t) => selectedIds.has(t.id))
    },
    [selectedIds],
  )

  const runAudit = async () => {
    if (selectedIds.size === 0) return
    setLoading(true)
    setError(null)
    setAuditResult(null)
    setEmailSent(false)

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTools: Array.from(selectedIds) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Request failed with status ${res.status}`)
      }
      const data: AuditResult = await res.json()
      setAuditResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const sendReport = async () => {
    if (!email || !auditResult) return
    setSendingEmail(true)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedTools: Array.from(selectedIds),
          email,
          companyName: companyName || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setEmailSent(true)
    } catch {
      setError('Failed to send report email. Please try again.')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <span className="font-semibold text-slate-100">MarTech Stack Auditor</span>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <span className="text-sm text-slate-400">
                <span className="text-indigo-400 font-semibold">{selectedIds.size}</span> tools selected
              </span>
            )}
            <button
              onClick={runAudit}
              disabled={selectedIds.size === 0 || loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Analysing…' : 'Run Audit'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            {"Paste your tools. See what's redundant,"}<br className="hidden sm:block" />
            {"what's missing, what's costing you."}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Select every tool in your MarTech stack below. Our audit engine detects overlaps,
            missing layers, and hidden cost waste — the same analysis agencies charge $5K–$25K for.
          </motion.p>
        </div>

        {/* Tool Selection */}
        <div className="mb-10">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORY_ORDER.map((cat) => {
              const count = toolsByCategory[cat].filter((t) => selectedIds.has(t.id)).length
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeTab === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                  {count > 0 && (
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === cat ? 'bg-white/20' : 'bg-indigo-500/30 text-indigo-300'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tool Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-100">
                    {CATEGORY_LABELS[activeTab]}
                    <span className="ml-2 text-sm text-slate-500 font-normal">
                      ({toolsByCategory[activeTab].length} tools)
                    </span>
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectAllInCategory(activeTab)}
                      className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Select all
                    </button>
                    <button
                      onClick={() => deselectAllInCategory(activeTab)}
                      disabled={!toolsByCategory[activeTab].some((t) => selectedIds.has(t.id))}
                      className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Deselect all
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {toolsByCategory[activeTab].map((tool) => {
                    const checked = selectedIds.has(tool.id)
                    return (
                      <label
                        key={tool.id}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                          checked
                            ? 'bg-indigo-600/20 border-indigo-500/50'
                            : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTool(tool.id)}
                          className="mt-0.5 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium leading-tight ${checked ? 'text-indigo-200' : 'text-slate-200'}`}>
                            {tool.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{tool.subcategory}</p>
                          {tool.avgMonthlyCost !== undefined && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {tool.avgMonthlyCost === 0 ? 'Free' : `$${tool.avgMonthlyCost}/mo`}
                            </p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Selected summary bar */}
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-wrap gap-2 items-center"
          >
            <span className="text-sm text-slate-400">{selectedIds.size} tools selected:</span>
            {Array.from(selectedIds).slice(0, 12).map((id) => {
              const t = martechTools.find((x) => x.id === id)
              return t ? (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                >
                  {t.name}
                  <button
                    onClick={() => toggleTool(id)}
                    className="hover:text-white ml-0.5"
                    aria-label={`Remove ${t.name}`}
                  >
                    ×
                  </button>
                </span>
              ) : null
            })}
            {selectedIds.size > 12 && (
              <span className="text-xs text-slate-500">+{selectedIds.size - 12} more</span>
            )}
          </motion.div>
        )}

        {/* Run Audit CTA (large, for middle of page) */}
        {!auditResult && (
          <div className="flex justify-center mb-16">
            <button
              onClick={runAudit}
              disabled={selectedIds.size === 0 || loading}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-lg font-semibold transition-all shadow-lg shadow-indigo-900/40"
            >
              {loading
                ? 'Analysing your stack…'
                : selectedIds.size === 0
                  ? 'Select tools above to start'
                  : `Run Audit (${selectedIds.size} tools)`}
            </button>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {auditResult && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Score + Cost Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stack Score */}
                <div className={`md:col-span-1 rounded-xl border p-8 flex flex-col items-center justify-center text-center ${scoreBg(auditResult.stackScore)}`}>
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Stack Score</p>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className={`text-8xl font-bold leading-none mb-3 ${scoreColor(auditResult.stackScore)}`}
                  >
                    {auditResult.stackScore}
                  </motion.div>
                  <p className={`text-xl font-semibold ${scoreColor(auditResult.stackScore)}`}>
                    {scoreLabel(auditResult.stackScore)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">out of 100</p>
                </div>

                {/* Cost Overview */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tools Audited</p>
                    <p className="text-3xl font-bold text-slate-100">{auditResult.selectedTools.length}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Monthly Spend</p>
                    <p className="text-3xl font-bold text-slate-100">
                      ${auditResult.totalMonthlyCost.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">est. cost</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estimated Waste</p>
                    <p className="text-3xl font-bold text-red-400">
                      ${auditResult.estimatedWaste.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">per month</p>
                  </div>
                </div>
              </div>

              {/* Overlaps */}
              {auditResult.overlaps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Overlapping Tools ({auditResult.overlaps.length})</span>
                  </h2>
                  <div className="space-y-4">
                    {auditResult.overlaps.map((o, i) => {
                      const toolNames = o.tools.map(
                        (id) => auditResult.selectedTools.find((t) => t.id === id)?.name ?? id,
                      )
                      return (
                        <div
                          key={i}
                          className="bg-slate-900 border border-orange-500/20 rounded-xl p-5"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {toolNames.map((name, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-sm font-medium">
                                {name}
                              </span>
                            ))}
                          </div>
                          <p className="text-slate-300 text-sm mb-1">{o.message}</p>
                          <p className="text-slate-400 text-sm mb-2">{o.recommendation}</p>
                          <p className="text-emerald-400 text-sm font-semibold">
                            💰 Potential savings: ${o.monthlySavings.toLocaleString()}/month
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Gaps */}
              {auditResult.gaps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                    <span>🚨</span>
                    <span>Stack Gaps ({auditResult.gaps.length})</span>
                  </h2>
                  <div className="space-y-4">
                    {auditResult.gaps.map((g, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 border border-red-500/20 rounded-xl p-5"
                      >
                        <p className="text-slate-100 font-semibold text-sm mb-1">{g.message}</p>
                        <p className="text-slate-400 text-sm mb-3">{g.recommendation}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-slate-500 flex items-center">Suggested tools:</span>
                          {g.suggestedTools.map((id) => {
                            const tool = martechTools.find((t) => t.id === id)
                            return tool ? (
                              <span key={id} className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">
                                {tool.name}
                              </span>
                            ) : null
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* No issues state */}
              {auditResult.overlaps.length === 0 && auditResult.gaps.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center"
                >
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-emerald-400 font-semibold text-lg">No overlaps or critical gaps found!</p>
                  <p className="text-slate-400 text-sm mt-1">Your stack looks well-optimized. Focus on driving deeper adoption of your existing tools.</p>
                </motion.div>
              )}

              {/* Recommendations */}
              {auditResult.recommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-xl font-bold text-indigo-400 mb-4 flex items-center gap-2">
                    <span>✅</span>
                    <span>Recommendations</span>
                  </h2>
                  <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-5">
                    <ol className="space-y-3">
                      {auditResult.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 text-xs flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          <span className="text-slate-300">{rec}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              )}

              {/* Email CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-slate-100 mb-1">📧 Get the Full Report</h2>
                <p className="text-slate-400 text-sm mb-5">
                  Receive a formatted PDF-style report with all findings, recommendations, and cost breakdown sent straight to your inbox.
                </p>
                {emailSent ? (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span>✓</span>
                    <span className="font-medium">Report sent! Check your inbox.</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Company name (optional)"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button
                      onClick={sendReport}
                      disabled={!email || sendingEmail}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      {sendingEmail ? 'Sending…' : 'Send Report'}
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Re-run */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={runAudit}
                  className="px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-sm transition-colors"
                >
                  Re-run Audit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>MarTech Stack Auditor · Free for everyone · No account required</p>
      </footer>
    </div>
  )
}
