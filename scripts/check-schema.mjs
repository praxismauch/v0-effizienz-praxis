import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing env vars")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Check time_stamps columns
const { data: cols } = await supabase.rpc('', {}).catch(() => ({ data: null }))

// Use raw SQL via the REST API
const res1 = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
}).catch(() => null)

// Alternative: query the table directly to see what columns exist
const { data: sample, error: sampleErr } = await supabase
  .from('time_stamps')
  .select('*')
  .limit(1)

console.log("=== time_stamps sample columns ===")
if (sample && sample.length > 0) {
  console.log("Columns:", Object.keys(sample[0]).join(', '))
} else {
  console.log("No rows found. Error:", sampleErr?.message || "none")
  // Try inserting to see column names from error
  const { data: d2, error: e2 } = await supabase
    .from('time_stamps')
    .select('id, work_location, location_type')
    .limit(0)
  console.log("Select with work_location:", e2?.message || "OK")
}

// Check workflow tables
const { data: wf, error: wfErr } = await supabase
  .from('workflows')
  .select('id')
  .limit(1)
console.log("\n=== workflows table ===")
console.log("Exists:", !wfErr, wfErr?.message || "OK")

const { data: wfs, error: wfsErr } = await supabase
  .from('workflow_steps')
  .select('id')
  .limit(1)
console.log("\n=== workflow_steps table ===")
console.log("Exists:", !wfsErr, wfsErr?.message || "Not found")

// Check if workflows has a steps column (JSONB)
const { data: wfSample } = await supabase
  .from('workflows')
  .select('*')
  .limit(1)
console.log("\n=== workflows sample columns ===")
if (wfSample && wfSample.length > 0) {
  console.log("Columns:", Object.keys(wfSample[0]).join(', '))
} else {
  console.log("No workflow rows")
}

// Check role_permissions table
const { data: rp, error: rpErr } = await supabase
  .from('role_permissions')
  .select('*')
  .limit(1)
console.log("\n=== role_permissions table ===")
console.log("Exists:", !rpErr, rpErr?.message || "OK")
if (rp && rp.length > 0) {
  console.log("Columns:", Object.keys(rp[0]).join(', '))
}
