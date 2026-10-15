import Link from "next/link";
import { signIn } from "@/app/actions";
import { Notice } from "@/components/ui";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return <main className="auth-page"><div className="auth-card"><Link className="brand" href="/">Norte<span>.</span></Link><h1>Entre no seu espaço</h1><p>Suas empresas, projetos e demandas em um só lugar.</p>{!configured ? <Notice error="Configure as variáveis do Supabase em .env.local para habilitar o acesso." /> : <Notice {...params} />}<form action={signIn} className="stack"><label className="field"><span>E-mail</span><input name="email" type="email" autoComplete="email" required disabled={!configured} /></label><label className="field"><span>Senha</span><input name="password" type="password" autoComplete="current-password" required disabled={!configured} /></label><button className="button primary full" type="submit" disabled={!configured}>Entrar</button></form><p className="auth-foot">Ainda não tem conta? <Link href="/cadastro">Criar conta</Link></p></div></main>;
}
