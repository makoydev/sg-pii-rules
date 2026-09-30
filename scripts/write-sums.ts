import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { root } from '../test/helpers.ts'
import { renderSums } from './sums.ts'

// Regenerates SHA256SUMS. Run with: npm run sums
writeFileSync(join(root, 'SHA256SUMS'), renderSums())
console.log('wrote SHA256SUMS')
