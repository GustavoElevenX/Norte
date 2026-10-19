# Norte — Assistente executivo profissional

Aplicação do produto descrito em `CONTEXTO_CODEX_ASSISTENTE_EXECUTIVO.md`: autenticação, workspace pessoal, empresas, clientes, projetos, tarefas, inbox, Hoje e Minha Semana. A carga inicial usa os dados canônicos de `NORTE_CARGA_INICIAL_CODEX.md` e grava registros reais, sem dados de demonstração.

## Requisitos

- Node.js compatível com Next.js 16.
- Um projeto Supabase com Auth por e-mail habilitado.

## Configuração

1. Execute `npm install`.
2. Copie `.env.example` para `.env.local` e preencha a URL e a chave pública/anon do Supabase. Não use service role key no navegador.
3. No Supabase SQL Editor, execute as migrações em ordem: `202610150001_initial.sql`, `202610150002_norte_seed.sql`, `202610150003_calendar.sql`, `202610150004_assistant.sql` e `202610150005_performance.sql`. A segunda migração cria área estratégica, contextos de demandas, agenda recorrente, log e função transacional de importação. As três seguintes habilitam reservas de agenda, assistente, metas e indicadores. Publicar o código na Vercel não executa essas migrações automaticamente.
4. Configure a URL local `http://localhost:3000` nas URLs permitidas do Supabase Auth. Se a confirmação de e-mail estiver ativa, confirme a conta antes de entrar.
5. Execute `npm run dev` e abra `http://localhost:3000`.

O cadastro cria automaticamente um workspace pessoal. Contas criadas antes desta migração exigem criação manual de workspace/membership ou novo cadastro após a migração.

## Carga inicial Norte

Depois de entrar na conta correta, abra **Carga inicial** no rodapé da navegação ou `http://localhost:3000/configuracoes/carga-inicial`. Use **Conferir carga** para ver quantos registros faltam e possíveis conflitos de nome. Em seguida, use **Aplicar carga neste workspace**. O servidor usa a sessão autenticada; não é necessária chave de serviço nem senha no script. Para repetir, use a mesma ação: chaves `seed_key` por workspace impedem duplicatas e os itens já existentes não são atualizados.

A fonte é [`data/norte-inicial-2026-10-15-v1.json`](./data/norte-inicial-2026-10-15-v1.json). A carga cria 4 operações, 1 área JFK, 3 clientes da Vértice, 15 projetos, 32 contextos de demandas e 39 regras de agenda (34 blocos de trabalho, 5 almoços). Dos contextos, 19 viram tarefas abertas sem prazo; os demais permanecem como referência de rotina ou em **A revisar**. O bloco de sexta 17h–18h é único, flexível, com Sobi como padrão e Vetorne como alternativa.

A função `rollback_norte_batch(batch_id)` reverte apenas itens criados naquele lote e recusa a operação se algum foi editado ou se uma exceção de agenda foi criada. Use o `batch_id` exibido no resultado; a reversão deve ser feita por sessão autenticada via RPC. Repetições sem inserções também ficam registradas no histórico de lotes.

## Comandos

```bash
npm run dev
npm run lint
npm test
npm run build
```

## Fluxo disponível

1. Criar conta ou entrar.
2. Cadastrar empresa em **Empresas**.
3. Cadastrar cliente e/ou projeto vinculado à empresa.
4. Capturar uma demanda em **Hoje** ou **Inbox** usando apenas texto.
5. Converter a demanda em tarefa e, se necessário, associar empresa/projeto, prioridade e prazo.
6. Consultar tarefas em **Hoje** ou **Tarefas** e concluí-las.

O filtro de empresa permite visualizar uma operação ou todas. Relações inconsistentes entre empresa, cliente e projeto são recusadas pelo banco. As operações usam a sessão do usuário e RLS; não usam chave privilegiada.

## Segurança e validação

As políticas RLS estão na migração. Para validá-las em um projeto de teste, crie duas contas, entre com a conta A e crie uma empresa. Entre com B e confirme que a empresa A não aparece. Tente usar o UUID do workspace A em uma inserção da conta B: o banco deve recusá-la. Tente vincular uma tarefa da empresa B a um projeto da empresa A: a chave estrangeira composta deve recusar. Use `npm run lint` e `npm run build` para verificar o código.

Há um teste automatizado para o primeiro caso: configure `TEST_USER_A_EMAIL`, `TEST_USER_A_PASSWORD`, `TEST_USER_B_EMAIL` e `TEST_USER_B_PASSWORD` com duas contas já confirmadas em um projeto de teste, carregue também as variáveis públicas do Supabase e execute `npm run test:rls`. Sem essas credenciais, o teste é ignorado.

## Agenda

**Hoje** mostra os blocos da data local em `America/Fortaleza`, a próxima rotina e tarefas reais. **Minha Semana** expande as regras recorrentes sem materializar tarefas diárias. Na semana inicial de vigência (15/10/2026), mostra a primeira semana completa a partir de 19/10 para apresentar todos os 39 blocos. A tabela de exceções por ocorrência existe no banco; edição de ocorrência e rearranjo por interface ainda não foram implementados.

## Escopo pendente

Motor de disponibilidade e reagendamento visual, IA, resumos, metas, performance, CRM, indicadores, financeiro e integrações estão planejados em [PLAN.md](./PLAN.md). Nenhuma dessas capacidades é simulada na interface atual.
