import Link from "next/link";
import { signUp } from "@/app/actions";
import { Notice } from "@/components/ui";

export default async function Cadastro({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return <main className="auth-page"><div className="auth-card"><Link className="brand" href="/">Norte<span>.</span></Link><h1>Crie seu espaço</h1><p>Comece com uma conta pessoal para sua rotina profissional.</p>{!configured ? <Notice error="Configure as variáveis do Supabase em .env.local para habilitar o cadastro." /> : <Notice {...params} />}<form action={signUp} className="stack"><label className="field"><span>E-mail</span><input name="email" type="email" autoComplete="email" required disabled={!configured} /></label><label className="field"><span>Senha</span><input name="password" type="password" autoComplete="new-password" minLength={8} required disabled={!configured} /></label><button className="button primary full" type="submit" disabled={!configured}>Criar conta</button></form><p className="auth-foot">Já tem conta? <Link href="/login">Entrar</Link></p></div></main>;
}
