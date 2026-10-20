# Norte — Assistente executivo profissional

Aplicação do produto descrito em `CONTEXTO_CODEX_ASSISTENTE_EXECUTIVO.md`: autenticação, workspace pessoal, empresas, clientes, projetos, tarefas, inbox, Hoje e Minha Semana. A carga inicial usa os dados canônicos de `NORTE_CARGA_INICIAL_CODEX.md` e grava registros reais, sem dados de demonstração.

## Requisitos

- Node.js compatível com Next.js 16.
- Um projeto Supabase com Auth por e-mail habilitado.

## Configuração

1. Execute `npm install`.
2. Copie `.env.example` para `.env.local` e preencha a URL e a chave pública/anon do Supabase. Não use service role key no navegador.
3. No Supabase SQL Editor, execute as migrações em ordem: `202610150001_initial.sql`, `202610150002_norte_seed.sql`, `202610150003_calendar.sql`, `202610150004_assistant.sql` e `202610150005_performance.sql`. A segunda migração cria área estratégica, contextos de demandas, agenda recorrente, log e função transacional de importação. As três seguintes habilitam reservas de agenda, assistente, metas e indicadores. Publicar o código na Vercel não executa essas migrações automaticamente.
   Para usar **Importar agenda operacional** e **Planejamento para aprovação**, aplique depois `202610200001_week_planning.sql`. Antes, confira as migrações já registradas e faça backup do banco. Essa migração é aditiva: cria as colunas `source_priority` e `parent_task_id`, a tabela isolada `operational_day_plans` e as RPCs transacionais de importação, aprovação e adiamento. Não reescreve tarefas, prazos, regras ou reservas existentes. Não a executei neste ambiente.

   Se aparecer `relation "public.calendar_events" does not exist`, a migração `202610150003_calendar.sql` ainda não foi aplicada integralmente nesse projeto Supabase (ou o SQL Editor está conectado a outro projeto). Confira sem alterar dados:

   ```sql
   select to_regclass('public.workspaces') as initial,
          to_regclass('public.weekly_recurrence_rules') as norte_seed,
          to_regclass('public.calendar_events') as calendar,
          to_regclass('public.user_preferences') as assistant,
          to_regclass('public.task_planning_snapshots') as performance,
          to_regclass('public.operational_day_plans') as week_planning;
   ```

   Cada coluna `NULL` identifica uma migração ausente ou incompleta. Se todas estiverem preenchidas, confirme que a consulta e a execução da migração usam o mesmo projeto Supabase. A mensagem de pré-verificação de `202610200001_week_planning.sql` também lista os objetos ausentes por arquivo.

   Aplique apenas as migrações ausentes, na ordem acima, e depois execute novamente `202610200001_week_planning.sql`. Confira antes se alguma migração anterior foi aplicada parcialmente; `202610150001` a `202610150005` não foram desenhadas para repetição cega. A migração nova verifica suas dependências antes de modificar o esquema e tolera uma segunda execução após uma tentativa parcial.
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

**Hoje** mostra os blocos da data local em `America/Fortaleza`, a próxima rotina e tarefas reais. **Minha Semana** expande as regras recorrentes sem materializar tarefas diárias e inclui sábado. Na semana inicial de vigência (15/10/2026), mostra a primeira semana completa a partir de 19/10. Ocorrências das regras históricas podem ser ajustadas por data; a programação operacional de 20–24/10 é guardada separadamente.

**Planejamento da semana:** a página agora inclui sábado e calcula uma prévia de reservas para tarefas abertas com duração. Prazo e prioridade de origem CSM determinam a ordem; prioridades antigas aparecem com aviso da escala. A prévia respeita janelas compatíveis, indisponibilidades e compromissos existentes, e informa tarefas sem estimativa ou sem capacidade. Nada é gravado até clicar em **Aprovar e gravar estes horários**. O servidor recalcula a proposta no momento da aprovação e a RPC grava o lote em uma transação, usando as validações e restrições de calendário atuais. Se a agenda mudou, é necessário revisar outra prévia. Tarefas concluídas e bloqueadas não são planejadas. Reservas antigas sem confirmação não contam como trabalho concluído.

O arquivo versionado [`data/norte-agenda-2026-10-20-v1.json`](./data/norte-agenda-2026-10-20-v1.json) contém 19 modelos recorrentes e 18 tarefas concretas para 20–24/10. Em **Minha Semana**, confira a prévia e clique em **Aplicar rotinas e tarefas após conferir**. A importação grava cinco dias operacionais e só as tarefas ausentes, identificadas por `source_key` ou título equivalente na mesma operação e projeto. Subtarefas são vinculadas a entregas existentes por chave quando disponíveis. Rotinas e intervalos protegidos substituem visualmente os blocos históricos apenas nessas cinco datas. Os horários de execução propostos pelo JSON ainda não são reservados nesse passo: após a importação, confira a distribuição recalculada e clique separadamente em **Aprovar e gravar estes horários**. Blocos passados permanecem pendentes de confirmação; tarefas incompletas entram na prévia futura. A ação **Adiar** cancela reservas futuras da tarefa e abre nova prévia sem apagar o histórico.

## Escopo pendente

Dependências detalhadas entre tarefas, edição visual dos blocos operacionais e integração com calendário externo ainda não estão disponíveis. A execução de SQL e o teste de RLS com duas contas exigem um ambiente Supabase de teste. CRM, financeiro e integrações permanecem planejados em [PLAN.md](./PLAN.md).
