import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Norte | Organização profissional", description: "Organize empresas, projetos e demandas em um só lugar." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
