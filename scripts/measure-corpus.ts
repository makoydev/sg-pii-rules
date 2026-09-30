import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { compile, detect, loadDetectorsFile } from '../reference/detect.ts'
import { root } from '../test/helpers.ts'

// Runs every detector over real third-party JavaScript (this repo's own
// node_modules) and prints COUNTS ONLY. Matched values are never printed:
// third-party files can contain real maintainers' contact details.
// Usage: node scripts/measure-corpus.ts [maxMegabytes]

const maxBytes = Number(process.argv[2] ?? 20) * 1024 * 1024
const detectors = compile(loadDetectorsFile(join(root, 'detectors.json')))

function* jsFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) yield* jsFiles(path)
    else if (/\.(c|m)?js$/.test(name) && !name.endsWith('.min.js')) yield path
  }
}

const counts: Record<string, number> = {}
const phoneShapes = { bare: 0, separated: 0, countryCode: 0 }
const phoneValues = new Map<string, number>()
const emailKinds = { reservedExampleDomain: 0, fileNameLike: 0, other: 0 }
let bytes = 0
let files = 0
let lines = 0
let elapsed = 0

for (const path of jsFiles(join(root, 'node_modules'))) {
  const text = readFileSync(path, 'utf8')
  if (bytes + text.length > maxBytes) break
  bytes += text.length
  files++
  lines += text.split('\n').length
  const start = performance.now()
  const matches = detect(text, detectors)
  elapsed += performance.now() - start
  for (const m of matches) {
    counts[m.entity] = (counts[m.entity] ?? 0) + 1
    if (m.entity === 'PHONE') {
      phoneValues.set(m.value, (phoneValues.get(m.value) ?? 0) + 1)
      if (
        /^(\+|\(|0065|65)/.test(m.value) &&
        m.value.replace(/\D/g, '').length > 8
      )
        phoneShapes.countryCode++
      else if (/[ -]/.test(m.value)) phoneShapes.separated++
      else phoneShapes.bare++
    }
    if (m.entity === 'EMAIL') {
      const v = m.value.toLowerCase()
      if (/@(.*\.)?example\.(com|org|net)$|\.(test|invalid|localhost)$/.test(v))
        emailKinds.reservedExampleDomain++
      else if (/\.(png|jpe?g|gif|svg|webp|js|ts|json|css|map)$/.test(v))
        emailKinds.fileNameLike++
      else emailKinds.other++
    }
  }
}

const mb = bytes / 1024 / 1024
// Values repeated across the corpus are constants, not personal numbers.
const repeated = [...phoneValues.values()].filter((c) => c >= 3)
const phoneRepetition = {
  distinctValues: phoneValues.size,
  valuesSeenThreeOrMoreTimes: repeated.length,
  hitsFromThoseValues: repeated.reduce((sum, c) => sum + c, 0)
}
console.log(
  JSON.stringify(
    {
      corpus:
        'node_modules/**/*.{js,cjs,mjs} (excluding *.min.js), sorted path order',
      files,
      lines,
      megabytes: Number(mb.toFixed(2)),
      matches: counts,
      matchesPerMegabyte: Object.fromEntries(
        Object.entries(counts).map(([k, v]) => [k, Number((v / mb).toFixed(2))])
      ),
      phoneShapes,
      phoneRepetition,
      emailKinds,
      detectSecondsTotal: Number((elapsed / 1000).toFixed(2)),
      megabytesPerSecond: Number((mb / (elapsed / 1000)).toFixed(2))
    },
    null,
    2
  )
)
