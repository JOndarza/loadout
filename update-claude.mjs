#!/usr/bin/env node
// update-claude.mjs
// Updates agents, commands, and skills from aitmpl.com (claude-code-templates).
// Run from the project root: node scripts/update-claude.mjs
//
// Source: https://github.com/davila7/claude-code-templates

import { readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { resolve, dirname, basename, join } from 'path'
import { execFileSync } from 'child_process'

// ── Paths ──────────────────────────────────────────────────────────────────────
const projectRoot = process.cwd()
const claudeDir   = join(projectRoot, '.claude')

// Resolve npx from the same node that is running this script (handles nvm environments
// where VS Code may not have nvm PATH when launched from Finder/Spotlight).
const NPX_BIN = resolve(dirname(process.execPath), 'npx')

const REGISTRY_URL = 'https://www.aitmpl.com/components.json'

// ── Custom components — project-specific, never overwrite ─────────────────────
// Items listed here are not from the aitmpl.com registry (hand-crafted or from
// other sources). They are skipped silently instead of reported as "not found".
const SKIP = {
  skills:   new Set(['publish', 'Shelfy-Design-System', 'docs-architect', 'toploader-system-design', 'web-qa-audit']),
  agents:   new Set(['doc-explorer']),
  commands: new Set(['docs-audit', 'docs-migrate', 'docs-sync']),
}

// ── Colors (ANSI) ─────────────────────────────────────────────────────────────
const c = {
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  blue:   '\x1b[34m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  reset:  '\x1b[0m',
}

// ── Counters & detail lists ────────────────────────────────────────────────────
const stats = { updated: 0, upToDate: 0, skipped: 0, notFound: 0 }
const detail = { updated: [], skipped: [], failed: [] }

// ── Logging ───────────────────────────────────────────────────────────────────
const log = {
  ok:      (msg) => console.log(`  ${c.green}✓${c.reset}  ${msg}`),
  skip:    (msg) => console.log(`  ${c.yellow}↷${c.reset}  ${c.dim}${msg}${c.reset}`),
  upToDate:(msg) => console.log(`  ${c.dim}–  ${msg}${c.reset}`),
  notFound:(msg) => console.log(`  ${c.red}✗${c.reset}  ${msg}`),
  info:    (msg) => console.log(`  ${c.blue}→${c.reset}  ${msg}`),
  header:  (msg) => console.log(`\n${c.bold}${msg}${c.reset}`),
}

// ── Fetch registry ────────────────────────────────────────────────────────────
async function fetchRegistry() {
  log.info(`Fetching registry from ${REGISTRY_URL} ...`)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const res = await fetch(REGISTRY_URL, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

// ── Build lookup: name → "category/name" for each component type ───────────────
// Registry entries have shape: { name, category, ... }
// The npx install arg is: "category/name"
function buildLookup(registry, type) {
  const map = new Map()
  const entries = registry[type] ?? []
  for (const entry of entries) {
    if (entry.name && entry.category) {
      map.set(entry.name, `${entry.category}/${entry.name}`)
    }
  }
  return map
}

// ── Install / update a component via npx ─────────────────────────────────────
// flag:     --agent | --command | --skill
// fullName: "category/name"  e.g. "development-tools/code-reviewer"
function installComponent(flag, fullName) {
  try {
    execFileSync(NPX_BIN, ['--yes', 'claude-code-templates@latest', flag, fullName, '--yes'],
      { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'] }
    )
  } catch (err) {
    const msg = err.stderr?.toString().trim() || err.stdout?.toString().trim() || err.message
    throw new Error(msg.split('\n').find(l => l.trim()) ?? 'unknown error')
  }
}

// ── Process one component type ────────────────────────────────────────────────
async function processType(type, flag, lookup) {
  const dir = join(claudeDir, type)

  if (!existsSync(dir)) {
    console.log(`  ${c.dim}No ${type} directory found.${c.reset}`)
    return
  }

  const entries = await readdir(dir, { withFileTypes: true })

  // Agents and commands are .md files; skills are directories.
  const names = type === 'skills'
    ? entries.filter(e => e.isDirectory()).map(e => e.name)
    : entries.filter(e => e.isFile() && e.name.endsWith('.md')).map(e => basename(e.name, '.md'))

  for (const name of names) {
    if (SKIP[type]?.has(name)) {
      log.skip(`${type}/${name} — custom, skipping`)
      stats.skipped++
      detail.skipped.push(`${type}/${name}`)
      continue
    }

    const fullName = lookup.get(name)

    if (!fullName) {
      log.notFound(`${type}/${name} — not in registry (custom or renamed)`)
      stats.notFound++
      detail.failed.push(`${type}/${name}  ${c.dim}(not in registry)${c.reset}`)
      continue
    }

    log.info(`${type}/${name} → npx ${flag} ${fullName}`)
    try {
      installComponent(flag, fullName)
      log.ok(`${type}/${name} — updated`)
      stats.updated++
      detail.updated.push(`${type}/${name}`)
    } catch (err) {
      log.notFound(`${type}/${name} — install failed: ${err.message}`)
      stats.notFound++
      detail.failed.push(`${type}/${name}  ${c.dim}(install failed)${c.reset}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log()
  console.log(`${c.bold}╔══════════════════════════════════════════════════════╗${c.reset}`)
  console.log(`${c.bold}║   Claude Code Components — Update                    ║${c.reset}`)
  console.log(`${c.bold}║   Source: github.com/davila7/claude-code-templates   ║${c.reset}`)
  console.log(`${c.bold}╚══════════════════════════════════════════════════════╝${c.reset}`)
  console.log()

  // Fetch registry once — contains category info for all components
  let registry
  try {
    registry = await fetchRegistry()
  } catch (err) {
    console.error(`\n${c.red}✗ Could not fetch registry:${c.reset} ${err.message}`)
    console.error(`  Check your internet connection and try again.\n`)
    process.exit(1)
  }

  const agentLookup  = buildLookup(registry, 'agents')
  const commandLookup = buildLookup(registry, 'commands')
  const skillLookup  = buildLookup(registry, 'skills')

  console.log(`  ${c.dim}Registry loaded — ${agentLookup.size} agents, ${commandLookup.size} commands, ${skillLookup.size} skills${c.reset}`)

  log.header('Agents')
  await processType('agents', '--agent', agentLookup)

  log.header('Commands')
  await processType('commands', '--command', commandLookup)

  log.header('Skills')
  await processType('skills', '--skill', skillLookup)

  // ── Summary ────────────────────────────────────────────────────────────────
  const total = stats.updated + stats.skipped + stats.notFound
  console.log()
  console.log(`${c.bold}╔══════════════════════════════════════════════════════╗${c.reset}`)
  console.log(`${c.bold}║   Summary — ${total} components processed             ║${c.reset}`)
  console.log(`${c.bold}╚══════════════════════════════════════════════════════╝${c.reset}`)

  if (detail.updated.length > 0) {
    console.log(`\n${c.green}${c.bold}✓ Updated (${detail.updated.length})${c.reset}`)
    for (const name of detail.updated) console.log(`    ${c.green}•${c.reset}  ${name}`)
  } else {
    console.log(`\n${c.dim}  Nothing was updated.${c.reset}`)
  }

  if (detail.skipped.length > 0) {
    console.log(`\n${c.yellow}${c.bold}↷ Skipped — custom, not overwritten (${detail.skipped.length})${c.reset}`)
    for (const name of detail.skipped) console.log(`    ${c.yellow}•${c.reset}  ${c.dim}${name}${c.reset}`)
  }

  if (detail.failed.length > 0) {
    console.log(`\n${c.red}${c.bold}✗ Not updated (${detail.failed.length})${c.reset}`)
    for (const name of detail.failed) console.log(`    ${c.red}•${c.reset}  ${name}`)
    console.log(`\n${c.dim}  Components not in registry are likely custom — safe to ignore.${c.reset}`)
  }

  console.log()
}

main().catch(err => {
  console.error(`\n${c.red}Error:${c.reset}`, err.message)
  process.exit(1)
})
