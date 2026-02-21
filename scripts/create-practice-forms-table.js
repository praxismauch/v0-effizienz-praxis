import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Try to query the table first
  const { data: existingData, error: checkError } = await supabase
    .from("practice_forms")
    .select("id")
    .limit(1);

  if (checkError && checkError.code === "42P01") {
    // Table doesn't exist - use raw SQL via rpc or postgres 
    console.log("Table practice_forms does not exist. Creating via REST...");
    // We'll create via the API route instead
    console.log("Please create the table manually in Supabase Dashboard SQL Editor:");
    console.log(`
CREATE TABLE practice_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
    `);
  } else if (!checkError) {
    console.log("Table practice_forms already exists, checking for default data...");
  }

  // Insert default data (will be handled gracefully by API if table doesn't exist)
  const defaults = [
    { value: "einzelpraxis", label: "Einzelpraxis", display_order: 1, is_active: true },
    { value: "bag", label: "Berufsausübungsgemeinschaft (BAG)", display_order: 2, is_active: true },
    { value: "mvz", label: "Medizinisches Versorgungszentrum (MVZ)", display_order: 3, is_active: true },
    { value: "praxisgemeinschaft", label: "Praxisgemeinschaft", display_order: 4, is_active: true },
    { value: "facharzt", label: "Facharztpraxis", display_order: 5, is_active: true },
    { value: "zahnarzt", label: "Zahnarztpraxis", display_order: 6, is_active: true },
    { value: "other", label: "Sonstige", display_order: 7, is_active: true },
  ];

  const { data, error } = await supabase
    .from("practice_forms")
    .upsert(defaults, { onConflict: "value" })
    .select();

  if (error) {
    console.error("Error inserting defaults:", error.message);
    console.log("The API will fall back to hardcoded defaults until the table is created.");
  } else {
    console.log("Successfully inserted/updated", data?.length, "practice forms");
  }
}

run().catch(console.error);
