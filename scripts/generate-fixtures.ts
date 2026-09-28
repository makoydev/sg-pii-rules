import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { root } from '../test/helpers.ts'
import { generators } from './generators.ts'

// Regenerates every fixture file. Run with: npm run generate
for (const [name, build] of Object.entries(generators)) {
  const file = { $schema: '../schema/fixtures.schema.json', ...build() }
  writeFileSync(
    join(root, 'fixtures', name),
    JSON.stringify(file, null, 2) + '\n'
  )
  console.log(`wrote fixtures/${name} (${file.cases.length} cases)`)
}
