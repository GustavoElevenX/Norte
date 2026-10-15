# Plano de implementação

Este plano segue a ordem do documento de contexto. O objetivo atual é uma aplicação pessoal funcional; módulos futuros não bloqueiam o núcleo.

## Entrega 0 — Fundação técnica

- [x] Next.js, TypeScript e interface base responsiva.
- [x] Supabase Auth com login, cadastro, sessão e rotas protegidas.
- [x] Migração PostgreSQL, workspace pessoal automático, RLS e vínculos por workspace.
- [x] README, `.env.example`, decisões e scripts de lint/build.
- [x] Aplicar as migrações no projeto Supabase real do usuário.
- [ ] Executar o teste de isolamento com duas contas confirmadas.

## Entrega 1 — Empresas, projetos e tarefas

- [x] Empresas: criar, consultar, editar e arquivar.
- [x] Clientes: criar, consultar e editar por empresa.
- [x] Projetos: criar, consultar, editar, pausar/concluir/arquivar, com contexto e objetivo.
- [x] Tarefas: criar, consultar, editar, concluir e cancelar, com P1–P3, prazo e duração.
- [x] Inbox: captura só com texto, conversão atômica em tarefa, dispensa.
- [x] Página Hoje baseada em registros persistidos e filtro global por empresa.
- [ ] Empresa padrão opcional, notas/marcos separados do projeto e detecção de demandas duplicadas.
- [x] Verificação das telas com Supabase configurado e sessão real.

## Carga inicial Norte

- [x] Extrair e validar o JSON canônico, preservar chaves estáveis por workspace.
- [x] Importar operações, JFK, clientes, projetos, contextos, tarefas confirmadas e agenda semanal no banco real.
- [x] Prévia, log por lote, reexecução sem duplicar e rollback condicionado à ausência de edições.
- [x] Mostrar os dados em Hoje, Minha Semana, Empresas, Clientes, Projetos e Tarefas.

## Entrega 2 — Agenda

- [x] Jornada, almoço e rotinas semanais persistidas, com exceções por data no banco.
- [ ] Interface para criar exceções e eventos pontuais, execução de blocos.
- [ ] Disponibilidade e sugestões determinísticas com proteção contra conflitos.
- [x] Visões diária e semanal no fuso America/Fortaleza.
- [ ] Aprovação manual para mover blocos e testes de fuso/recorrência mais amplos.

## Entrega 3 — IA

- [ ] Chat autenticado com contexto autorizado e provedor configurável.
- [ ] Rascunhos e ferramentas de domínio; autonomia N0/N1 e auditoria.
- [ ] Sugestões de agenda baseadas no motor da Entrega 2.

## Entrega 4 — Resumos, metas e performance

- [ ] Metas e check-ins, resumo diário/semanal, snapshots de planejamento.
- [ ] Fórmulas auditáveis e comparações por período e empresa.

## Entregas 5–7 — Expansão

- [ ] CRM B2B com pipeline por empresa.
- [ ] Métricas próprias e financeiro estritamente empresarial.
- [ ] Integrações reais somente quando houver APIs, credenciais e necessidade.
