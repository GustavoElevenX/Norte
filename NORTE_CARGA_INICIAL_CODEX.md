# NORTE — CARGA INICIAL REAL PARA CODEX

> **Objetivo:** popular o Norte com contexto profissional, empresas/frentes, clientes, projetos, demandas e **rotina recorrente de segunda a sexta**, sem exigir digitação manual no sistema.
>
> **Data de referência:** 15/10/2026 • **Idioma:** pt-BR • **Timezone:** `America/Fortaleza` • **Versão da carga:** `norte-inicial-2026-10-15-v1`.
>
> **Documento-base:** `CONTEXTO_CODEX_ASSISTENTE_EXECUTIVO.md` (leia-o se estiver presente no projeto). Este arquivo é complementar e não substitui as regras de produto, segurança, agenda e performance do documento-base.

## 1. Prompt de execução para o Codex

Você está trabalhando no repositório existente do aplicativo **Norte**, já com interface inicial para `Hoje`, `Inbox`, `Tarefas`, `Projetos`, `Empresas` e `Clientes`. A tarefa é **CARREGAR DADOS REAIS DE CONTEXTO E ROTINA** no workspace do usuário, usando persistência existente e componentes já implementados; **não** gerar uma segunda aplicação nem conteúdo de demonstração.

1. Inspecione o repositório, migrations, tipos, autenticação, ORM/query layer e modelo de `workspace_id`, `company_id`, `client_id`, `project_id`, `task_id` e calendários antes de alterar código. Adapte os nomes de campos e tipos ao esquema real.
2. Implemente **uma importação idempotente** (script CLI e/ou ação protegida de bootstrap do workspace) que leia os dados estruturados da seção 7 e crie os registros reais no banco do usuário autenticado; não usar arrays estáticos para fingir registros na UI.
3. Se não existirem entidades para `áreas estratégicas` ou `blocos recorrentes`, adicione a menor migração viável e segura. JFK deve ser área/tag, **não CNPJ fictício**. Preserve a relação `JFK → projetos CSM` e os demais projetos JFK sem empresa assumida.
4. Cadastre as 4 operações/frentes conhecidas (`CSM`, `Vértice`, `Sobi`, `Vetorne`), uma área `JFK`, três clientes vinculados à Vértice, 15 projetos com contexto, 32 demandas/contextos e 39 ocorrências-modelo de horário semanal (34 blocos de trabalho e 5 pausas). O formato interno pode usar 4 regras comuns + regras particulares, em vez de 39 regras diferentes, **desde que a renderização seja idêntica**.
5. **Não marque atividades como concluídas**; **não crie datas-limite inventadas**, negócios ganhos, valores de faturamento, lançamentos financeiros, metas quantitativas arbitrárias, números de telefone, leads fictícios ou eventos pessoais.
6. Demandas com `classification = routine_link` são **referências às rotinas já agendadas**, não tarefas pendentes repetidas diariamente. Demandas `historical_review` ou `candidate` devem ficar em seção de revisão/backlog contextual, não como tarefas vencidas. `recent_explicit`/`confirmed_topic` podem ser tarefas abertas **sem prazo**, com título, empresa/projeto e prioridade somente quando explicitamente indicada; não afirmar execução pendente/garantida quando a fonte é histórica. `on_demand` não ativa recorrências extras.
7. **Recorrência semanal real:** horário local 08:00–18:00, seg–sex, almoço 12:00–13:00 ocupado, de acordo com a seção 6. Respeitar fuso e horário de verão via zona IANA, não UTC fixo. Interpretar `effective_from = 2026-10-15` como início da vigência; não criar tarefas atrasadas por ocorrências passadas ou horários anteriores à importação.
8. A tela **Hoje** deve mostrar timeline do dia, próxima rotina/ação quando houver, prioridades e tarefas atribuídas. **Minha Semana** deve exibir as rotinas nas horas corretas. `Projetos`, `Empresas`, `Clientes`, `Tarefas` e filtros devem funcionar com os dados importados de verdade.
9. Manter agenda única, mas os projetos/clientes/indicadores por empresa; as iniciativas JFK relacionadas à CSM pertencem operacionalmente à CSM e carregam tag/área JFK. Não misturar cliente da Vértice com empresa própria nem leads comerciais da CSM.
10. No bloco **sexta 17h–18h**, cadastrar **um só slot recorrente**, de Sobi por padrão; quando houver demanda Vetorne, permitir substituição pontual ou mudança aprovada de associação. **Nunca criar dois eventos simultâneos nesse horário.**
11. Proteja dados atuais: somente inserir registros ausentes com `seed_key` estável e restrição única por workspace/tipo; não excluir, limpar, duplicar nem sobrescrever itens modificados pelo usuário. Ter log do import, rollback dos novos itens por `batch_id` somente quando seguro, e relatório de criações/ignorações/conflitos.
12. Não depender de IA ou APIs externas para importar. Ao terminar, executar migrações/testes/lint/build quando disponíveis e demonstrar contagens, consultas e capturas ou testes das telas. Se não houver banco configurado, entregar script e instruções de execução **sem afirmar que dados foram gravados**.

### Critérios de aceite obrigatórios

- O workspace autenticado tem **4 frentes/operações**, **1 área estratégica JFK**, **3 clientes Vértice** e **15 projetos**; não foi criada entidade CNPJ falsa.
- A agenda semanal tem **39 slots visíveis** (34 blocos de trabalho + 5 almoços), sem sobreposição; disponibilização de **45 horas de trabalho planejado/semana** e **5 horas de almoço/semana**. O sábado não ganha compromisso fixo.
- Ao reexecutar o import, a contagem **não aumenta** e edições posteriores feitas pelo usuário são preservadas.
- `Hoje`, `Minha Semana`, `Projetos`, `Empresas` e `Clientes` deixam de aparecer vazios quando o usuário correto acessa o workspace e a importação foi executada.
- Nenhum histórico ganha status `done`/`overdue` ou deadline fictício. Metas, finanças e CRM não exibem resultados fabricados.
- Sexta 17:00–18:00 é **uma** ocorrência com opção Sobi/Vetorne, não dois compromissos concorrentes.
- A aplicação continua funcionando com agenda e tarefas sem serviço de IA.

## 2. Interpretação correta de empresas, áreas e clientes

**CSM / Casa de Sucos Mix:** operação onde o usuário atua com planejamento comercial, vendas B2B/B2C, vendedores, rotas, marketing, tráfego, conteúdo e delivery. **Não pressupor titularidade jurídica.** Unidades mencionadas em trabalhos passados incluem Cohama, Cohatrac, Golden e Vinhais; são contexto de relatórios, **não** cadastrar como empresas, endereços ou clientes automaticamente.

**Vértice:** frente prestadora de serviços/tráfego; **Querido Pudim** (contato Cris), **Deusimar** (advocacia) e **Brasil Moto Peças** são **clientes dela**. Não criar esses três como negócios próprios do usuário.

**Sobi:** plataforma em desenvolvimento, ainda não lançada. Há demanda de desenvolvimento e suporte; não pressupor integração pronta ou operação comercial já ativa.

**Vetorne:** o usuário declarou ser sócio e atuar no comercial, porém prospecção ainda não foi iniciada. Há um bloco alternativo condicional às sextas, nunca um compromisso comercial automático paralelo à Sobi.

**JFK:** **área/frente estratégica de priorização**, status organizacional por validar. Possui P1 alavancagem B2B/B2C e delivery digital da CSM; P2 pesquisa de produtos derivados de frutas, delivery de frutas e estratégia em saúde; P3 implantação da prospecção de vendedores. **Não cadastrar JFK como CNPJ.** Se o banco exigir `company_id` em todos os projetos, corrigir schema para permitir projeto transversal ou criar entidade `area`/`portfolio`, sem falsificar empresa.

## 3. Metadados, prioridade e segurança de dados

Prioridades confirmadas: `P1 = alavancagem B2B/B2C da CSM e delivery digital`; `P2 = produtos com frutas, delivery de frutas e projeto de saúde`; `P3 = implantação comercial dos vendedores`. Para projetos e serviços sem prioridade explicitamente atribuída, usar `null` em vez de escolher P1/P2/P3 arbitrariamente.

Rastreamento recomendado por registro: `source = user_schedule | historical_conversation`, `import_batch`, `seed_key`, `confidence = explicit | known_context | to_review`, `created_by = system_seed`, `is_editable = true`. Preservar entrada original e permitir alterar tudo na interface; não usar seed para reverter alterações feitas pelo usuário.

**Fuso local:** `America/Fortaleza`. Semana de segunda a sexta; sábado sem bloco importado. O período de trabalho informado é 08h–18h com almoço 12h–13h. **Deadline é diferente de agendamento; compromisso é diferente de rotina; rotina é diferente de tarefa.**

**Situação das demandas históricas:** as conversas anteriores documentam assuntos e demandas, mas não provam o estado atual de cada entrega. Portanto não marcar como feito nem como vencido, e criar seção **A revisar** para hipóteses e ações antigas que precisam ser reconfirmadas.

## 4. Projetos e demandas: regras de exibição

- **Projetos**: exibir organização responsável, área JFK opcional, cliente Vértice opcional, prioridade (quando conhecida), objetivo e atividades relacionadas.
- **Tarefas**: ações confirmadas podem aparecer como abertas sem prazo; sugestão/histórico em **A revisar**. Não forçar todos os 32 itens como 32 tarefas críticas do dia.
- **Agenda**: blocos reservam tempo e mostram título/projeto/cliente; concluí-los exige registro explícito e é independente de “terminou o horário”.
- **Hoje**: mostrar conteúdo da data local; se o usuário abrir fora da jornada, mostrar o realizado/planejado e próxima agenda futura, em vez de “não tem nada”.
- **Clientes**: Querido Pudim, Deusimar e Brasil Moto Peças associados à Vértice. Sem e-mail, telefone, valor de contrato ou pipeline atribuído sem dados reais.
- **CRM**: se já implementado, criar pipeline vazio e separado por empresa apenas quando compatível e necessário; não criar oportunidades fictícias.
- **Metas/financeiro**: estruturas e contextos podem existir, mas valores reais só com lançamentos verificados. Sem score de produtividade calculado sobre rotinas não executadas.

## 5. Como tratar o planejamento semanal

São **blocos protegidos de rotina semanal**, não eventos pontuais de reunião nem 34 demandas em atraso. A grade abaixo reproduz integralmente a agenda fornecida pelo usuário. As descrições por dia refletem diferenças de atividades de anúncios, conteúdo, vendedores e clientes.

### SEGUNDA-FEIRA

| Horário | Bloco | Projeto/área | Proteção |
|---|---|---|---|
| 08:00–09:00 | CSM — Comercial — Pesquisar clientes, montar rotas e encaminhar aos vendedores | csm-comercial | protected |
| 09:00–10:00 | CSM — Digital — Publicar feed/Stories e gerenciar campanhas de tráfego | csm-marketing | protected |
| 10:00–12:00 | JFK — P1 — Alavancagem CSM: vendas B2B e B2C | jfk-alavancagem | protected |
| 12:00–13:00 | Almoço | Pausa | unavailable |
| 13:00–15:00 | JFK — P1 — Delivery digital da CSM | jfk-delivery-digital | protected |
| 15:00–16:00 | CSM — Comercial — Acompanhar Lauro, visitas, entregas e relatórios | csm-comercial | protected |
| 16:00–18:00 | Vértice — Querido Pudim — Demandas da Cris | vp-querido | protected |

### TERÇA-FEIRA

| Horário | Bloco | Projeto/área | Proteção |
|---|---|---|---|
| 08:00–09:00 | CSM — Comercial — Pesquisar clientes, montar rotas e encaminhar aos vendedores | csm-comercial | protected |
| 09:00–10:00 | CSM — Digital — Publicar feed/Stories e monitorar anúncios | csm-marketing | protected |
| 10:00–12:00 | CSM — Conteúdo — Gravar vídeos e produzir criativos | csm-conteudo | protected |
| 12:00–13:00 | Almoço | Pausa | unavailable |
| 13:00–15:00 | JFK — P1 — Alavancagem CSM: vendas B2B e B2C | jfk-alavancagem | protected |
| 15:00–16:00 | CSM — Comercial — Acompanhar Lauro, visitas, entregas e relatórios | csm-comercial | protected |
| 16:00–17:00 | Vértice — Deusimar — Gestão de tráfego e demandas | vp-deusimar | protected |
| 17:00–18:00 | Vértice — Brasil Moto Peças — Gestão de tráfego e demandas | vp-moto | protected |

### QUARTA-FEIRA

| Horário | Bloco | Projeto/área | Proteção |
|---|---|---|---|
| 08:00–09:00 | CSM — Comercial — Pesquisar clientes, montar rotas e encaminhar aos vendedores | csm-comercial | protected |
| 09:00–10:00 | CSM — Digital — Publicar feed/Stories e acompanhar campanhas | csm-marketing | protected |
| 10:00–12:00 | CSM — Conteúdo — Editar e programar feed e Stories até sábado | csm-conteudo | protected |
| 12:00–13:00 | Almoço | Pausa | unavailable |
| 13:00–15:00 | JFK — P2 — Pesquisa: o que vender com frutas | jfk-frutas-produtos | protected |
| 15:00–16:00 | CSM — Comercial — Acompanhar Lauro, visitas, entregas e relatórios | csm-comercial | protected |
| 16:00–18:00 | Sobi — Desenvolvimento e suporte da plataforma | sobi-platform | protected |

### QUINTA-FEIRA

| Horário | Bloco | Projeto/área | Proteção |
|---|---|---|---|
| 08:00–09:00 | CSM — Comercial — Pesquisar clientes, montar rotas e encaminhar aos vendedores | csm-comercial | protected |
| 09:00–10:00 | CSM — Digital — Publicar feed/Stories e otimizar anúncios | csm-marketing | protected |
| 10:00–12:00 | JFK — P1 — Delivery digital da CSM | jfk-delivery-digital | protected |
| 12:00–13:00 | Almoço | Pausa | unavailable |
| 13:00–15:00 | JFK — P2 — Projeto de delivery de frutas | jfk-delivery-frutas | protected |
| 15:00–16:00 | CSM — Comercial — Acompanhar Lauro, visitas, entregas e relatórios | csm-comercial | protected |
| 16:00–17:00 | Vértice — Deusimar — Gestão de tráfego e demandas | vp-deusimar | protected |
| 17:00–18:00 | Vértice — Brasil Moto Peças — Gestão de tráfego e demandas | vp-moto | protected |

### SEXTA-FEIRA

| Horário | Bloco | Projeto/área | Proteção |
|---|---|---|---|
| 08:00–09:00 | CSM — Comercial — Pesquisar clientes, montar rotas e encaminhar aos vendedores | csm-comercial | protected |
| 09:00–10:00 | CSM — Digital — Publicar feed/Stories e conferir anúncios | csm-marketing | protected |
| 10:00–12:00 | JFK — P2 — Projeto estratégico de saúde | jfk-saude | protected |
| 12:00–13:00 | Almoço | Pausa | unavailable |
| 13:00–14:00 | JFK — P3 — Implementação da prospecção comercial dos vendedores | jfk-prospeccao | protected |
| 14:00–15:00 | CSM — Comercial — Planejar rotas e oportunidades da próxima semana | csm-comercial | protected |
| 15:00–16:00 | CSM — Comercial — Acompanhar Lauro, visitas, entregas e relatórios | csm-comercial | protected |
| 16:00–17:00 | CSM — Resultados — Analisar vendas B2B/B2C, campanhas e conversões | csm-resultados | protected |
| 17:00–18:00 | Sobi / Vetorne — Sobi por padrão; Vetorne quando houver demanda comercial | sobi-platform | flexible |
## 6. Regras de recorrência e apresentação

- Dia da semana: `MO`, `TU`, `WE`, `TH`, `FR` (ISO/iCalendar). `effective_from = 2026-10-15` na vigência das regras. Não materializar dados históricos desnecessários.
- Cada início e fim é **hora civil local** em `America/Fortaleza`; renderizar de acordo com o fuso do usuário. Se a infraestrutura armazenar instantes UTC, converter cada ocorrência antes de salvar/mostrar.
- Bloco de almoço: tipo `unavailable`, sem `company_id`, não entra em produtividade e bloqueia 12h–13h.
- Atividades `protected` permanecem até edição do usuário. `flexible` admite substituição (Sobi/Vetorne), mas exige **um único bloco** e não entra em “tempo livre”.
- Rotinas de publicidade **não** implicam campanhas ativadas nem gasto. Rotinas de venda **não** implicam clientes fechados.
- Gerar exceções por data, edição/exclusão apenas de uma ocorrência ou série, e mover manualmente conforme autonomia. Se ainda não houver suporte a exceções, explicar limitação e priorizar a recorrência estável sem duplicatas.
- Para o usuário, mostrar `CSM`, `Vértice`, `Sobi` e `Vetorne` com cores distintas; `JFK` como tag/área visível sobre os blocos que representem seus projetos.

## 7. DADOS ESTRUTURADOS CANÔNICOS

O JSON abaixo é a fonte concreta para o import. As chaves `company_key`, `project_key`, `area_key` e `client_key` são **referências por slug**, a resolver para IDs reais e scoped por workspace. `null` denota informação não confirmada. O script deve mapear para o esquema existente.

```json
{
  "metadata": {
    "version": "norte-inicial-2026-10-15-v1",
    "reference_date": "2026-10-15",
    "timezone": "America/Fortaleza",
    "language": "pt-BR",
    "workspace_scope": "authenticated_user_current_workspace",
    "working_weekdays": [
      "MO",
      "TU",
      "WE",
      "TH",
      "FR"
    ],
    "workday_start": "08:00",
    "workday_end": "18:00",
    "lunch_start": "12:00",
    "lunch_end": "13:00",
    "effective_from": "2026-10-15",
    "import_mode": "idempotent_insert_missing_preserve_edits"
  },
  "operations": [
    {
      "key": "csm",
      "name": "Casa de Sucos Mix",
      "short_name": "CSM",
      "kind": "operation",
      "known_context": "Sucos, operação comercial B2B/B2C, marketing, vendedores, rotas e delivery.",
      "ownership": "nao_confirmada"
    },
    {
      "key": "vertice",
      "name": "Vértice",
      "short_name": "Vértice",
      "kind": "service_business",
      "known_context": "Gestão de marketing/tráfego e atendimento de clientes.",
      "ownership": "nao_confirmada"
    },
    {
      "key": "sobi",
      "name": "Sobi",
      "short_name": "Sobi",
      "kind": "project_or_business_front",
      "known_context": "Plataforma em desenvolvimento, ainda não lançada; usuário atua em desenvolvimento e suporte.",
      "ownership": "nao_confirmada"
    },
    {
      "key": "vetorne",
      "name": "Vetorne",
      "short_name": "Vetorne",
      "kind": "business_front",
      "known_context": "Usuário é sócio e atua no comercial; prospecção não iniciada, ativa somente sob demanda.",
      "ownership": "socio_informado"
    }
  ],
  "areas": [
    {
      "key": "jfk",
      "name": "JFK",
      "kind": "strategic_area",
      "known_context": "Frente de priorização P1/P2/P3; relação jurídica/organizacional com CSM não confirmada. Não criar CNPJ."
    }
  ],
  "clients": [
    {
      "key": "querido-pudim",
      "company_key": "vertice",
      "name": "Querido Pudim",
      "contact_name": "Cris",
      "type": "client",
      "notes": "Cliente de estratégia/marketing B2B de pudins; não assumir empresa própria."
    },
    {
      "key": "deusimar",
      "company_key": "vertice",
      "name": "Deusimar",
      "type": "client",
      "notes": "Cliente da área advocatícia com demanda de anúncios; campanha relacionada a INSS. Não inventar nome comercial nem dados do advogado."
    },
    {
      "key": "brasil-moto-pecas",
      "company_key": "vertice",
      "name": "Brasil Moto Peças",
      "type": "client",
      "notes": "Cliente de gestão de tráfego; kit de revisão com mão de obra A PARTIR DE R$ 499,90."
    }
  ],
  "projects": [
    {
      "key": "csm-comercial",
      "name": "CSM — Prospecção, rotas e vendedores",
      "company_key": "csm",
      "area_key": null,
      "client_key": null,
      "priority": null,
      "objective": "Encontrar clientes, organizar rotas e acompanhar execução comercial.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "csm-marketing",
      "name": "CSM — Marketing digital e tráfego",
      "company_key": "csm",
      "area_key": null,
      "client_key": null,
      "priority": null,
      "objective": "Publicações, Stories, criativos e campanhas de anúncios.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "csm-conteudo",
      "name": "CSM — Produção e programação de conteúdo",
      "company_key": "csm",
      "area_key": null,
      "client_key": null,
      "priority": null,
      "objective": "Gravar, editar e programar conteúdo ao longo da semana.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "csm-resultados",
      "name": "CSM — Auditoria de vendas e conversão",
      "company_key": "csm",
      "area_key": null,
      "client_key": null,
      "priority": null,
      "objective": "Conciliar Meta, WhatsApp, PDV e vendas; melhorar atendimento e conversão.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "jfk-alavancagem",
      "name": "JFK / CSM — Alavancagem B2B e B2C",
      "company_key": "csm",
      "area_key": "jfk",
      "client_key": null,
      "priority": "P1",
      "objective": "Ampliar vendas B2B e B2C da CSM, com acompanhamento comercial e conversão.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "jfk-delivery-digital",
      "name": "JFK / CSM — Delivery digital",
      "company_key": "csm",
      "area_key": "jfk",
      "client_key": null,
      "priority": "P1",
      "objective": "Estruturar e melhorar o canal digital de pedidos e operação de delivery da CSM.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "jfk-frutas-produtos",
      "name": "JFK — Produtos e negócios com frutas",
      "company_key": null,
      "area_key": "jfk",
      "client_key": null,
      "priority": "P2",
      "objective": "Pesquisar produtos e receitas derivados de frutas, mix premium, fornecimento B2B e identidade regional maranhense.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "jfk-delivery-frutas",
      "name": "JFK — Delivery de frutas e hortifruti",
      "company_key": null,
      "area_key": "jfk",
      "client_key": null,
      "priority": "P2",
      "objective": "Investigar e modelar oferta B2C/B2B de frutas, verduras, hortaliças e itens de hortifruti.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "jfk-saude",
      "name": "JFK — Estratégia em saúde",
      "company_key": null,
      "area_key": "jfk",
      "client_key": null,
      "priority": "P2",
      "objective": "Estudos exploratórios de clínicas populares, cartões assistenciais, hospitais e modelos de receita; não pressupor negócio ou contrato lançado.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "jfk-prospeccao",
      "name": "JFK / CSM — Implantação da prospecção comercial",
      "company_key": "csm",
      "area_key": "jfk",
      "client_key": null,
      "priority": "P3",
      "objective": "Estruturar abordagem, cadência e acompanhamento dos vendedores.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "vp-querido",
      "name": "Vértice — Querido Pudim",
      "company_key": "vertice",
      "area_key": null,
      "client_key": "querido-pudim",
      "priority": null,
      "objective": "Estratégia B2B, Instagram, produção de conteúdo, campanhas e parceiros. Cliente: Querido Pudim.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "vp-deusimar",
      "name": "Vértice — Deusimar",
      "company_key": "vertice",
      "area_key": null,
      "client_key": "deusimar",
      "priority": null,
      "objective": "Planejamento, criativos e gestão de tráfego para o cliente Deusimar.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "vp-moto",
      "name": "Vértice — Brasil Moto Peças",
      "company_key": "vertice",
      "area_key": null,
      "client_key": "brasil-moto-pecas",
      "priority": null,
      "objective": "Campanhas de kit de revisão e melhora da conversão de contatos em vendas.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "sobi-platform",
      "name": "Sobi — Plataforma, desenvolvimento e suporte",
      "company_key": "sobi",
      "area_key": null,
      "client_key": null,
      "priority": null,
      "objective": "Produto ainda em desenvolvimento, sem API ativa presumida.",
      "status": "active_context",
      "is_real_project_context": true
    },
    {
      "key": "vetorne-comercial",
      "name": "Vetorne — Estruturação comercial sob demanda",
      "company_key": "vetorne",
      "area_key": null,
      "client_key": null,
      "priority": null,
      "objective": "Atividades comerciais acionadas conforme necessidade; não indicar pipeline iniciado.",
      "status": "on_demand",
      "is_real_project_context": true
    }
  ],
  "demand_contexts": [
    {
      "key": "csm-prospectar-ribamar",
      "title": "Prospectar restaurantes e potenciais compradores em São José de Ribamar",
      "project_key": "csm-comercial",
      "classification": "confirmed_topic",
      "notes": "Identificar estabelecimentos exclusivamente em São José de Ribamar e organizar oportunidades em rota, sem criar contatos não verificados.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-encaminhar-rotas",
      "title": "Pesquisar clientes, montar rotas e encaminhar aos vendedores",
      "project_key": "csm-comercial",
      "classification": "routine_link",
      "notes": "Atividade já incluída no bloco diário 08h–09h; não criar duplicata diária como tarefa atrasada.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-lauro",
      "title": "Acompanhar Lauro: visitas, entregas e relatórios",
      "project_key": "csm-comercial",
      "classification": "routine_link",
      "notes": "Atividade já incluída no bloco diário 15h–16h.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-app-atendentes",
      "title": "Verificar com as atendentes o uso e a qualidade do aplicativo de relatórios",
      "project_key": "csm-resultados",
      "classification": "historical_review",
      "notes": "Confirmar se a verificação continua pendente; não presumir falha atual.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-atribuicao",
      "title": "Auditar atribuição de leads entre Meta, WhatsApp e registros das unidades",
      "project_key": "csm-resultados",
      "classification": "confirmed_topic",
      "notes": "Comparar conversas iniciadas, contatos registrados, compras e conversão; distinguir contato de venda e não chamar toda venda de recompra.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-conversao-atendimento",
      "title": "Revisar atendimento comercial B2C e criar follow-ups após envio do cardápio",
      "project_key": "csm-resultados",
      "classification": "confirmed_topic",
      "notes": "Atendentes aguardavam passivamente resposta do lead; desenhar condução e fechamento da conversa.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-volume-campanhas",
      "title": "Revisar o efeito de ativação/pausa das campanhas no volume da CSM",
      "project_key": "csm-marketing",
      "classification": "historical_review",
      "notes": "Em outubro/2026 campanhas ativas dias 1–5 e 9–11; inativas dias 6–8 e 12–13. Não carregar métricas sem planilha e validação.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-b2b",
      "title": "Aprimorar funil B2B da CSM: contato, qualificação, degustação, proposta e follow-up",
      "project_key": "jfk-alavancagem",
      "classification": "confirmed_topic",
      "notes": "Relacionar ações às rotas e aos vendedores; vendas reais somente com lançamento auditado.",
      "priority": "P1",
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-feed-stories",
      "title": "Publicar e programar feed e Stories da CSM",
      "project_key": "csm-conteudo",
      "classification": "routine_link",
      "notes": "Programar conteúdo até sábado no bloco de quarta, quando aplicável; não criar agenda de sábado sem autorização.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-criativos",
      "title": "Gravar e editar vídeos e criativos da CSM",
      "project_key": "csm-conteudo",
      "classification": "routine_link",
      "notes": "Atividade prevista na terça/quarta.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-ads",
      "title": "Gerir, monitorar e otimizar anúncios da CSM",
      "project_key": "csm-marketing",
      "classification": "routine_link",
      "notes": "Rotina diária de 09h–10h; não presumir campanhas ativas em todas as datas.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-fechamento-semanal",
      "title": "Analisar resultados semanais da CSM: B2B, B2C, tráfego e conversão",
      "project_key": "csm-resultados",
      "classification": "routine_link",
      "notes": "Bloco fixo sexta-feira 16h–17h; gerar relatório com dados apenas quando disponíveis.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "csm-delivery-modelo",
      "title": "Desenhar e revisar a jornada de delivery digital da CSM",
      "project_key": "jfk-delivery-digital",
      "classification": "confirmed_topic",
      "notes": "Estudar entrada por anúncio/WhatsApp, captação de pedidos, roteamento de unidade, rastreio de origem e conversão. Propostas anteriores não são sistemas implantados.",
      "priority": "P1",
      "deadline": null,
      "completion": null
    },
    {
      "key": "jfk-produtos-frutas",
      "title": "Mapear produtos derivados de frutas e linha premium regional",
      "project_key": "jfk-frutas-produtos",
      "classification": "confirmed_topic",
      "notes": "Estudar produtos, receitas, fornecedores B2B, posicionamento e nomes com referências maranhenses.",
      "priority": "P2",
      "deadline": null,
      "completion": null
    },
    {
      "key": "jfk-frutas-mercado",
      "title": "Pesquisar o mercado maranhense de delivery de hortifruti B2C/B2B",
      "project_key": "jfk-delivery-frutas",
      "classification": "confirmed_topic",
      "notes": "Comparar concorrentes, ofertas, logística, atendimento e mercado no norte do Maranhão.",
      "priority": "P2",
      "deadline": null,
      "completion": null
    },
    {
      "key": "jfk-delivery-validacao",
      "title": "Definir hipóteses para modelo operacional do delivery de frutas",
      "project_key": "jfk-delivery-frutas",
      "classification": "candidate",
      "notes": "Definir público, mix, pedido mínimo, logística e validações; não afirmar que a operação já existe.",
      "priority": "P2",
      "deadline": null,
      "completion": null
    },
    {
      "key": "jfk-saude-cartoes",
      "title": "Consolidar estudos de SuperClínica, MedClub e cartões de saúde",
      "project_key": "jfk-saude",
      "classification": "confirmed_topic",
      "notes": "Pesquisar modelos, posicionamento, carteira de serviços e relação com hospitais. Outros negócios são referências de pesquisa, não clientes.",
      "priority": "P2",
      "deadline": null,
      "completion": null
    },
    {
      "key": "jfk-saude-ecossistema",
      "title": "Mapear relação entre clínicas populares, hospitais públicos e privados",
      "project_key": "jfk-saude",
      "classification": "confirmed_topic",
      "notes": "Incluir São Luís e região; distinguir informação verificada de hipótese.",
      "priority": "P2",
      "deadline": null,
      "completion": null
    },
    {
      "key": "jfk-saude-hsd",
      "title": "Organizar hipóteses do estudo HSD e alternativas de receita",
      "project_key": "jfk-saude",
      "classification": "historical_review",
      "notes": "Pesquisa estratégica exploratória; não registrar projeções como faturamento, contratos ou caixa realizados.",
      "priority": "P2",
      "deadline": null,
      "completion": null
    },
    {
      "key": "jfk-vendedores",
      "title": "Estruturar implantação de prospecção comercial para os vendedores",
      "project_key": "jfk-prospeccao",
      "classification": "confirmed_topic",
      "notes": "Incluir roteiro, cadência, acompanhamento e relatório; P3.",
      "priority": "P3",
      "deadline": null,
      "completion": null
    },
    {
      "key": "qp-bio",
      "title": "Atualizar a bio do Instagram do Querido Pudim",
      "project_key": "vp-querido",
      "classification": "recent_explicit",
      "notes": "Demanda citada em outubro/2026 para preparar a operação antes do tráfego.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "qp-destaque",
      "title": "Criar destaque de parceiros/restaurantes do Querido Pudim",
      "project_key": "vp-querido",
      "classification": "recent_explicit",
      "notes": "Organizar parceiros atuais com validação; sem fabricar depoimentos/parcerias.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "qp-producao",
      "title": "Produzir fotos e vídeos dos pudins para conteúdo",
      "project_key": "vp-querido",
      "classification": "recent_explicit",
      "notes": "Usuário planejou produzir conteúdo presencialmente; checar status antes de marcar concluído ou vencido.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "qp-postagens",
      "title": "Preparar e publicar conteúdo inicial do Instagram do Querido Pudim",
      "project_key": "vp-querido",
      "classification": "recent_explicit",
      "notes": "Montar sequência de apresentação, produto e prova social real.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "qp-trafego",
      "title": "Conferir recebimento do saldo e autorização antes de ativar tráfego do Querido Pudim",
      "project_key": "vp-querido",
      "classification": "recent_explicit",
      "notes": "Histórico mencionou orçamento de R$ 300 para período curto; valores exatos e saldo atual devem ser confirmados, sem lançamentos financeiros automáticos.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "qp-outbound",
      "title": "Reavaliar prospecção fria e canal da comunidade SOS Restaurantes",
      "project_key": "vp-querido",
      "classification": "historical_review",
      "notes": "Prospecção fria teve resposta baixa; priorizar canais permitidos, sem assumir novo disparo agendado.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "deusimar-campanhas",
      "title": "Revisar criativos e campanhas de tráfego de Deusimar com foco nas dores do público do INSS",
      "project_key": "vp-deusimar",
      "classification": "confirmed_topic",
      "notes": "Evitar promessas jurídicas e de concessão de benefícios.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "moto-oferta",
      "title": "Criar e testar criativos do kit revisão da Brasil Moto Peças",
      "project_key": "vp-moto",
      "classification": "confirmed_topic",
      "notes": "Usar nome correto Brasil Moto Peças e comunicação 'kit de revisão + mão de obra A PARTIR DE R$ 499,90', sem inventar itens ou preço fixo.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "moto-conversao",
      "title": "Revisar qualificação de leads e conversão em vendas da Brasil Moto Peças",
      "project_key": "vp-moto",
      "classification": "confirmed_topic",
      "notes": "Campanhas geram muitos contatos, mas poucas vendas; criativos e atendimento devem qualificar quem precisa da revisão.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "sobi-dev",
      "title": "Desenvolvimento da plataforma Sobi",
      "project_key": "sobi-platform",
      "classification": "routine_link",
      "notes": "Bloco fixo quarta 16h–18h e sexta 17h–18h como padrão; não inferir funcionalidade já entregue.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "sobi-support",
      "title": "Suporte e revisão do backlog de desenvolvimento da Sobi",
      "project_key": "sobi-platform",
      "classification": "confirmed_topic",
      "notes": "Sem cadastros de chamados, releases ou clientes fictícios.",
      "priority": null,
      "deadline": null,
      "completion": null
    },
    {
      "key": "vetorne-comercial",
      "title": "Estruturar iniciativas de prospecção da Vetorne quando houver demanda",
      "project_key": "vetorne-comercial",
      "classification": "on_demand",
      "notes": "Não iniciar rotina ou gerar follow-ups automaticamente: prospecção ainda não começou.",
      "priority": null,
      "deadline": null,
      "completion": null
    }
  ],
  "weekly_schedule": [
    {
      "key": "routine-mo-0800",
      "day": "MO",
      "start": "08:00",
      "end": "09:00",
      "title": "CSM — Comercial — Pesquisar clientes, montar rotas e encaminhar aos vendedores",
      "project_key": "csm-comercial",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-mo-0900",
      "day": "MO",
      "start": "09:00",
      "end": "10:00",
      "title": "CSM — Digital — Publicar feed/Stories e gerenciar campanhas de tráfego",
      "project_key": "csm-marketing",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-mo-1000",
      "day": "MO",
      "start": "10:00",
      "end": "12:00",
      "title": "JFK — P1 — Alavancagem CSM: vendas B2B e B2C",
      "project_key": "jfk-alavancagem",
      "company_key": "csm",
      "priority": "P1",
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-mo-1200",
      "day": "MO",
      "start": "12:00",
      "end": "13:00",
      "title": "Almoço",
      "project_key": null,
      "company_key": null,
      "priority": null,
      "mode": "unavailable",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-mo-1300",
      "day": "MO",
      "start": "13:00",
      "end": "15:00",
      "title": "JFK — P1 — Delivery digital da CSM",
      "project_key": "jfk-delivery-digital",
      "company_key": "csm",
      "priority": "P1",
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-mo-1500",
      "day": "MO",
      "start": "15:00",
      "end": "16:00",
      "title": "CSM — Comercial — Acompanhar Lauro, visitas, entregas e relatórios",
      "project_key": "csm-comercial",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-mo-1600",
      "day": "MO",
      "start": "16:00",
      "end": "18:00",
      "title": "Vértice — Querido Pudim — Demandas da Cris",
      "project_key": "vp-querido",
      "company_key": "vertice",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-tu-0800",
      "day": "TU",
      "start": "08:00",
      "end": "09:00",
      "title": "CSM — Comercial — Pesquisar clientes, montar rotas e encaminhar aos vendedores",
      "project_key": "csm-comercial",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-tu-0900",
      "day": "TU",
      "start": "09:00",
      "end": "10:00",
      "title": "CSM — Digital — Publicar feed/Stories e monitorar anúncios",
      "project_key": "csm-marketing",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-tu-1000",
      "day": "TU",
      "start": "10:00",
      "end": "12:00",
      "title": "CSM — Conteúdo — Gravar vídeos e produzir criativos",
      "project_key": "csm-conteudo",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-tu-1200",
      "day": "TU",
      "start": "12:00",
      "end": "13:00",
      "title": "Almoço",
      "project_key": null,
      "company_key": null,
      "priority": null,
      "mode": "unavailable",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-tu-1300",
      "day": "TU",
      "start": "13:00",
      "end": "15:00",
      "title": "JFK — P1 — Alavancagem CSM: vendas B2B e B2C",
      "project_key": "jfk-alavancagem",
      "company_key": "csm",
      "priority": "P1",
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-tu-1500",
      "day": "TU",
      "start": "15:00",
      "end": "16:00",
      "title": "CSM — Comercial — Acompanhar Lauro, visitas, entregas e relatórios",
      "project_key": "csm-comercial",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-tu-1600",
      "day": "TU",
      "start": "16:00",
      "end": "17:00",
      "title": "Vértice — Deusimar — Gestão de tráfego e demandas",
      "project_key": "vp-deusimar",
      "company_key": "vertice",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-tu-1700",
      "day": "TU",
      "start": "17:00",
      "end": "18:00",
      "title": "Vértice — Brasil Moto Peças — Gestão de tráfego e demandas",
      "project_key": "vp-moto",
      "company_key": "vertice",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-we-0800",
      "day": "WE",
      "start": "08:00",
      "end": "09:00",
      "title": "CSM — Comercial — Pesquisar clientes, montar rotas e encaminhar aos vendedores",
      "project_key": "csm-comercial",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-we-0900",
      "day": "WE",
      "start": "09:00",
      "end": "10:00",
      "title": "CSM — Digital — Publicar feed/Stories e acompanhar campanhas",
      "project_key": "csm-marketing",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-we-1000",
      "day": "WE",
      "start": "10:00",
      "end": "12:00",
      "title": "CSM — Conteúdo — Editar e programar feed e Stories até sábado",
      "project_key": "csm-conteudo",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-we-1200",
      "day": "WE",
      "start": "12:00",
      "end": "13:00",
      "title": "Almoço",
      "project_key": null,
      "company_key": null,
      "priority": null,
      "mode": "unavailable",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-we-1300",
      "day": "WE",
      "start": "13:00",
      "end": "15:00",
      "title": "JFK — P2 — Pesquisa: o que vender com frutas",
      "project_key": "jfk-frutas-produtos",
      "company_key": null,
      "priority": "P2",
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-we-1500",
      "day": "WE",
      "start": "15:00",
      "end": "16:00",
      "title": "CSM — Comercial — Acompanhar Lauro, visitas, entregas e relatórios",
      "project_key": "csm-comercial",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-we-1600",
      "day": "WE",
      "start": "16:00",
      "end": "18:00",
      "title": "Sobi — Desenvolvimento e suporte da plataforma",
      "project_key": "sobi-platform",
      "company_key": "sobi",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-th-0800",
      "day": "TH",
      "start": "08:00",
      "end": "09:00",
      "title": "CSM — Comercial — Pesquisar clientes, montar rotas e encaminhar aos vendedores",
      "project_key": "csm-comercial",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-th-0900",
      "day": "TH",
      "start": "09:00",
      "end": "10:00",
      "title": "CSM — Digital — Publicar feed/Stories e otimizar anúncios",
      "project_key": "csm-marketing",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-th-1000",
      "day": "TH",
      "start": "10:00",
      "end": "12:00",
      "title": "JFK — P1 — Delivery digital da CSM",
      "project_key": "jfk-delivery-digital",
      "company_key": "csm",
      "priority": "P1",
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-th-1200",
      "day": "TH",
      "start": "12:00",
      "end": "13:00",
      "title": "Almoço",
      "project_key": null,
      "company_key": null,
      "priority": null,
      "mode": "unavailable",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-th-1300",
      "day": "TH",
      "start": "13:00",
      "end": "15:00",
      "title": "JFK — P2 — Projeto de delivery de frutas",
      "project_key": "jfk-delivery-frutas",
      "company_key": null,
      "priority": "P2",
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-th-1500",
      "day": "TH",
      "start": "15:00",
      "end": "16:00",
      "title": "CSM — Comercial — Acompanhar Lauro, visitas, entregas e relatórios",
      "project_key": "csm-comercial",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-th-1600",
      "day": "TH",
      "start": "16:00",
      "end": "17:00",
      "title": "Vértice — Deusimar — Gestão de tráfego e demandas",
      "project_key": "vp-deusimar",
      "company_key": "vertice",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-th-1700",
      "day": "TH",
      "start": "17:00",
      "end": "18:00",
      "title": "Vértice — Brasil Moto Peças — Gestão de tráfego e demandas",
      "project_key": "vp-moto",
      "company_key": "vertice",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-fr-0800",
      "day": "FR",
      "start": "08:00",
      "end": "09:00",
      "title": "CSM — Comercial — Pesquisar clientes, montar rotas e encaminhar aos vendedores",
      "project_key": "csm-comercial",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-fr-0900",
      "day": "FR",
      "start": "09:00",
      "end": "10:00",
      "title": "CSM — Digital — Publicar feed/Stories e conferir anúncios",
      "project_key": "csm-marketing",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-fr-1000",
      "day": "FR",
      "start": "10:00",
      "end": "12:00",
      "title": "JFK — P2 — Projeto estratégico de saúde",
      "project_key": "jfk-saude",
      "company_key": null,
      "priority": "P2",
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-fr-1200",
      "day": "FR",
      "start": "12:00",
      "end": "13:00",
      "title": "Almoço",
      "project_key": null,
      "company_key": null,
      "priority": null,
      "mode": "unavailable",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-fr-1300",
      "day": "FR",
      "start": "13:00",
      "end": "14:00",
      "title": "JFK — P3 — Implementação da prospecção comercial dos vendedores",
      "project_key": "jfk-prospeccao",
      "company_key": "csm",
      "priority": "P3",
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-fr-1400",
      "day": "FR",
      "start": "14:00",
      "end": "15:00",
      "title": "CSM — Comercial — Planejar rotas e oportunidades da próxima semana",
      "project_key": "csm-comercial",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-fr-1500",
      "day": "FR",
      "start": "15:00",
      "end": "16:00",
      "title": "CSM — Comercial — Acompanhar Lauro, visitas, entregas e relatórios",
      "project_key": "csm-comercial",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-fr-1600",
      "day": "FR",
      "start": "16:00",
      "end": "17:00",
      "title": "CSM — Resultados — Analisar vendas B2B/B2C, campanhas e conversões",
      "project_key": "csm-resultados",
      "company_key": "csm",
      "priority": null,
      "mode": "protected",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false
    },
    {
      "key": "routine-fr-1700",
      "day": "FR",
      "start": "17:00",
      "end": "18:00",
      "title": "Sobi / Vetorne — Sobi por padrão; Vetorne quando houver demanda comercial",
      "project_key": "sobi-platform",
      "company_key": "sobi",
      "priority": null,
      "mode": "flexible",
      "recurrence": "weekly",
      "timezone": "America/Fortaleza",
      "effective_from": "2026-10-15",
      "deadline": null,
      "completed": false,
      "default_project_key": "sobi-platform",
      "alternative_project_key": "vetorne-comercial",
      "alternation_policy": "single_slot_override_only_on_user_request"
    }
  ]
}
```

## 8. Estratégia técnica sugerida (adapte ao repositório, não reescreva a aplicação)

Criar serviço `importInitialNorteData(workspaceId, actorId, options)`; validar payload com schema (ex.: Zod), resolver IDs por `seed_key` estável e chaves estrangeiras, e executar em transação ou lotes atômicos com auditoria. Não usar role de serviço no navegador. Se a aplicação tiver apenas bootstrap no primeiro login, rodar **uma vez para o workspace real correto** e registrar `batch_id`; oferecer reexecução idempotente pelo backend/admin quando necessário.

Se o cronograma do app ainda não suportar recorrência nativa, implementar `weekly_recurrence_rules` em vez de pré-gerar 52 semanas de tarefas. Cada regra contém dia, horário local, timezone, tipo, associação e vigência; a agenda expande ocorrências por intervalo consultado. Exceções de datas são um conjunto separado associado à regra. Para o almoço usar tipo de indisponibilidade. Evitar duplicar registros toda vez que a home é carregada.

Exemplos de índices/constraints úteis (ajustar nomes): `(workspace_id, entity_type, seed_key)` único para import; `client.company_id` para Vértice; `project.area_id` opcional para JFK; `routine_rule.workspace_id` obrigatório; `routine_rule.project_id` opcional. Regras de autorização/RLS em todas as leituras e gravações. Auditar criação de registros.

**Execução:** implemente um comando `seed:norte` conforme o gerenciador de pacotes real e com `--dry-run` e `--apply`, configurando workspace autenticado ou identificador seguro do usuário. Documente comando exato em `README.md`; **não hardcode credenciais nem selecione workspace de outra pessoa**. Faça dry-run (contagens e conflitos); se houver acesso autorizado ao workspace correto e ambiente de desenvolvimento configurado, aplique a carga uma vez. Caso contrário, disponibilize um único comando de execução documentado. Nada no arquivo, isoladamente, significa que os dados já foram inseridos no banco.

### Testes essenciais

1. Parse do JSON e validação de `seed_key` único por entidade; FK/slug resolvidas e clientes vinculados à Vértice.
2. Um usuário vê só dados do próprio workspace; RLS e autorização no script.
3. Segunda execução idêntica não adiciona registros. Registros editados manualmente não são sobrescritos.
4. Todos os blocos estão corretos, com 9 horas de execução + 1 de almoço por dia; nenhum conflito; sexta 17–18 com uma só instância.
5. Quinta 15/10/2026 e sexta 16/10/2026 mostram apenas eventos ainda pertinentes à vigência; segunda 19/10/2026 exibe sua grade completa.
6. Sem prazos inventados nem feitos automáticos; `historical_review` não entra como tarefa atrasada.
7. O usuário filtra só CSM, só Vértice, só Sobi e só Vetorne sem quebrar os vínculos dos projetos JFK e clientes.
8. `Hoje` não mostra estado vazio após import aplicado e refresh, e exibe realidade do banco, não mock.

## 9. Resposta esperada do Codex

Entregue: resumo do que foi alterado; arquivos de seed/migração e páginas afetadas; contagens criadas e ignoradas; como executar; testes reais rodados; e **status inequívoco** se a importação foi aplicada no banco ou apenas preparada. Preserve interface Norte existente e mantenha a experiência minimalista.
