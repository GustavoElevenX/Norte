import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "TEST_USER_A_EMAIL", "TEST_USER_A_PASSWORD", "TEST_USER_B_EMAIL", "TEST_USER_B_PASSWORD"];
const available = required.every((key) => Boolean(process.env[key]));

test("RLS impede leitura e escrita em outro workspace", { skip: available ? false : "Configure duas contas de teste e as variáveis de ambiente." }, async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const a = createClient(url, key, { auth: { persistSession: false } });
  const b = createClient(url, key, { auth: { persistSession: false } });
  const [authA, authB] = await Promise.all([
    a.auth.signInWithPassword({ email: process.env.TEST_USER_A_EMAIL, password: process.env.TEST_USER_A_PASSWORD }),
    b.auth.signInWithPassword({ email: process.env.TEST_USER_B_EMAIL, password: process.env.TEST_USER_B_PASSWORD }),
  ]);
  assert.equal(authA.error, null);
  assert.equal(authB.error, null);
  const [{ data: workspaceA, error: errorA }, { data: workspaceB, error: errorB }] = await Promise.all([
    a.from("workspaces").select("id").single(),
    b.from("workspaces").select("id").single(),
  ]);
  assert.equal(errorA, null);
  assert.equal(errorB, null);
  assert.notEqual(workspaceA.id, workspaceB.id);
  const { data: leaked, error: readError } = await b.from("workspaces").select("id").eq("id", workspaceA.id);
  assert.equal(readError, null);
  assert.deepEqual(leaked, []);
  const { error: writeError } = await b.from("companies").insert({ workspace_id: workspaceA.id, name: "Tentativa não autorizada" });
  assert.ok(writeError, "Inserção em workspace de outro usuário deve falhar");
});
