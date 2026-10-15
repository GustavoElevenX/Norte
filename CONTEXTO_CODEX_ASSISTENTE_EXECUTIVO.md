# CONTEXTO DO PROJETO — ASSISTENTE EXECUTIVO COM IA

> Documento de contexto e especificação para desenvolvimento assistido por Codex.
>
> **Versão:** 1.0 — 15/10/2026  
> **Idioma do produto:** Português do Brasil (`pt-BR`)  
> **Fuso padrão:** `America/Fortaleza`  
> **Fase:** MVP pessoal, com arquitetura preparada para evolução a SaaS  
> **Natureza:** software de gestão **profissional e empresarial**, não financeira pessoal/familiar.

---

## 0. COMO O CODEX DEVE USAR ESTE ARQUIVO

Você é o agente de engenharia encarregado de implementar, evoluir e testar este produto. Leia este documento antes de propor telas, tabelas, fluxos ou implementações. Ele é a referência de **produto e negócio**, não uma afirmação de que já existe código.

**Instruções de trabalho:**

1. Inspecione o repositório antes de gerar arquivos. Preserve código, convenções, credenciais e decisões já existentes; não sobrescreva trabalho do usuário.
2. Se o repositório estiver vazio, siga o stack recomendado na seção 11. Se já houver stack compatível, adapte a implementação em vez de reescrever tudo.
3. Implemente por entregas pequenas, funcionais e testáveis, na ordem da seção 15. **Não tente implementar todos os módulos simultaneamente.**
4. Priorize a jornada essencial: **capturar uma demanda → entender sua empresa/projeto → priorizar → encontrar disponibilidade → confirmar/agendar → acompanhar → medir desempenho**.
5. Regras determinísticas de agenda, conflitos, permissões e cálculos financeiros devem ser executadas por código; nunca delegadas exclusivamente ao modelo de IA.
6. Não invente integrações, dados reais de negócio, métricas, eventos, compromissos ou conclusões de IA. Estados vazios são preferíveis a dados falsos. Seeds de demonstração devem ficar claramente identificados.
7. Ao final de cada entrega: explique o que foi construído, os arquivos relevantes, como executar/testar, as migrações e o que ainda falta. Rode testes/lint/build disponíveis.
8. Quando faltarem detalhes não bloqueantes, faça escolhas simples e documente em `DECISIONS.md`. Só interrompa para perguntar sobre decisões verdadeiramente impeditivas.
9. Mantenha **isolamento por workspace/empresa**, segurança e trilha de auditoria nas operações de IA, mesmo que o único usuário inicial seja o dono do sistema.
10. **Não confunda objetivo futuro com escopo imediato**: WhatsApp, integrações Sobi, cobranças de SaaS e gestão de equipes não são bloqueadores do MVP.

### Legenda de certeza

- **[DECIDIDO]**: explicitamente solicitado ou confirmado pelo usuário.
- **[PROPOSTO]**: desenho de produto/tecnologia recomendado, ajustável após implementação/testes.
- **[FUTURO]**: previsto na arquitetura, fora da entrega inicial.
- **[A VALIDAR]**: detalhe que não foi confirmado; não apresente como fato.

---

## 1. VISÃO E FALAS DO USUÁRIO

### 1.1. O problema verdadeiro

O usuário atua em vários negócios, acumula projetos, compromissos, demandas espontâneas, atividades comerciais e indicadores. Seu principal objetivo **não** é possuir um repositório de tarefas: é **não perder o controle da própria rotina e saber o que executar, em qual negócio e quando**.

Trechos representativos do pedido original, preservando o sentido e, quando possível, a formulação do usuário:

> “Eu tô precisando criar um assistente de vida profissional.”

> “Ele cuidaria da minha agenda, das minhas demandas, de um CRM de vendas [...] Hoje eu tenho vários negócios, eu tenho negócios B2B.”

> “Eu quero ter tudo num sistema integrado.”

> “Talvez puxar dados via API da Sobi [...] Lembrando, a Sobi ainda não tá no ar.”

> “Poder colocar algumas métricas de todas as minhas empresas, do que eu quiser lá dentro [...] E um dashboard financeiro [...] empresarial. Isso aqui não tem nada a ver com CPF, é tudo CNPJ.”

> “Se eu quiser criar um projeto lá dentro, colocar um contexto, eu quero ter uma IA rodando por trás [...] via API, alguma IAzinha barata.”

> “O principal ponto é organizar minha vida.”

> “Também que eu não me perca nas coisas que eu tenho pra fazer que vão aparecendo.”

> “Tem que ter alguma metodologia rápida [...] mandar pra ele, ele já colocar e já organizar no meio da agenda, procurar uma vaga.”

> “O principal ponto agora é comigo mesmo.”

### 1.2. Respostas explícitas de descoberta de produto [DECIDIDO]

1. **Entrada de demandas:** usar **todas** as formas — chat interno com IA, WhatsApp (texto/áudio), botão/formulário rápido.
2. **Autonomia da IA:** níveis configuráveis, e não um único comportamento rígido.
3. **Usuários iniciais:** **somente o próprio usuário**, para sua rotina profissional.
4. **CRM:** **pipeline separado para cada empresa**.
5. **Financeiro e métricas:** **lançamento manual inicialmente**.
6. **Execução técnica:** o próprio usuário programará, **com apoio de IA/Codex**.
7. **Necessidades adicionais:** **resumo diário**, **acompanhamento de metas**, **performance semanal e mensal** e **comparação entre períodos**. Observação: o usuário escreveu “comprar por período”, entendido no contexto como “comparar por período”.
8. **Futuro:** potencial SaaS comercial, **mas não otimizar o MVP primariamente para isso**.

### 1.3. Definição de produto

**[PROPOSTO]** Nome conceitual: **Assistente Executivo / Sistema Operacional Profissional**. Ainda não há marca comercial aprovada.

**Promessa do produto:** “Capturo qualquer demanda em segundos e meu assistente organiza, planeja e acompanha a execução dentro da minha disponibilidade e das prioridades de cada empresa.”

**Diferencial:** integrar **agenda + demandas + projetos + CRM + metas + financeiro empresarial + IA**, com **visão executiva consolidada** e **dados segregados por negócio**.

**Não é:** um ERP completo, uma rede social, um chatbot sem acesso a dados, uma agenda sem prioridades, um CRM isolado ou um dashboard estético sem dados verificáveis.

---

## 2. CONTEXTO OPERACIONAL DO USUÁRIO

### 2.1. Empresas/frentes de trabalho conhecidas

| Nome | Contexto conhecido | Atenção para implementação |
|---|---|---|
| **Casa de Sucos Mix (CSM)** | Operação envolvendo B2C, B2B, marketing/tráfego, vendedores, rotas comerciais, produtos, delivery digital e de frutas. | Deve ter projetos, agenda, indicadores e pipeline comercial próprios. |
| **Vértice** | Operação de serviços/marketing e gestão de clientes, como **Querido Pudim** (cliente Cris), **Deusimar** e **Brasil Moto Peças**. | Diferenciar **empresa do usuário** de **clientes da empresa**. Tarefas/projetos podem ser vinculados a clientes da Vértice. |
| **Vetorne** | Frente comercial/negócio em que o usuário participa; há demanda potencial de prospecção. | Cadastrar como empresa/frente editável; não pressupor pipeline ativo já configurado. |
| **Sobi** | Plataforma/projeto em desenvolvimento, ainda não lançada. Usuário considera futura integração de dados de gestão via API. | Cadastrar projeto/empresa conforme configuração do usuário, mas **não depender de API ativa**. |
| **JFK** | Termo citado como frente de priorização no planejamento semanal anterior. | **[A VALIDAR]** Não assumir que é um CNPJ ou empresa separada; pode ser etiqueta, área ou conjunto de projetos. |

**Regra:** nada é codificado rigidamente com esses nomes. O usuário deve poder criar, renomear, arquivar e configurar empresas, clientes, áreas e projetos. Os exemplos acima podem ser oferecidos em um seed **opcional e editável**, não como dados oficiais ou métricas reais.

### 2.2. Agenda semanal previamente descrita

O usuário já montou uma organização de **segunda a sexta**, com referência de jornada **08:00–18:00** e almoço **12:00–13:00**.

Blocos conhecidos da CSM no planejamento anterior:

- **08:00–09:00:** rotas, clientes e vendedores.
- **09:00–10:00:** posts, Stories e tráfego.
- **15:00–16:00:** acompanhamento de Lauro.

**Importante:** esses são blocos de referência provenientes de um planejamento anterior. O sistema deve **permitir importar/editá-los**; não assumir que todos permanecem fixos ou que o restante do dia está livre. Solicitar confirmação da agenda vigente na interface de onboarding/importação, não inventar os blocos ausentes.

### 2.3. Prioridades mencionadas pelo usuário

- **P1:** alavancagem CSM (vendas B2C/B2B) e delivery digital.
- **P2:** atividades estratégicas; estudo sobre o que vender com frutas; delivery de frutas.
- **P3:** implementação de prospecção comercial para vendedores.

A classificação acima é uma referência inicial. Prioridades devem ser **editáveis**, e o sistema não deve confundir **prioridade estratégica** com **prazo/urgência**.

---

## 3. PRINCÍPIOS DE PRODUTO E REGRAS GERAIS

1. **Captura em segundos:** uma demanda pode ser criada somente com texto. Campos secundários podem ser inferidos/sugeridos depois.
2. **Agenda única, empresas separadas:** há **uma capacidade de tempo pessoal**, distribuída entre várias operações. Os projetos, funis, métricas e lançamentos financeiros permanecem associados à empresa adequada.
3. **IA integrada, não decorativa:** o chat deve consultar registros reais e preparar ações estruturadas; não produzir apenas recomendações genéricas.
4. **Controle humano:** alterações relevantes seguem o nível de autonomia configurado e são auditáveis/reversíveis.
5. **Confiabilidade:** não duplicar compromissos, não prometer vaga inexistente, não declarar tarefa concluída sem registro.
6. **Contexto persistente:** projetos possuem descrição, objetivo, notas, decisões e histórico; a IA consulta somente contexto autorizado.
7. **Performance auditável:** métricas definidas por fórmulas explícitas e com dados de origem; nunca números fabricados.
8. **Primeiro uso pessoal:** sem fluxo complexo de equipe, papéis ou billing no MVP; contudo, manter `workspace_id` nos dados para evolução futura.
9. **100% empresarial no financeiro:** não criar orçamento familiar, despesas de CPF, contas domésticas ou mistura de CNPJ com finanças pessoais.
10. **Mobile rápido e desktop completo:** captura por celular; execução, planejamento e dashboards confortáveis no computador.
11. **Privacidade operacional:** segredos/API keys apenas no servidor; isolamento e autorização aplicados no banco/backend.
12. **Interface em português brasileiro:** datas `dd/MM/yyyy`, moeda BRL, fuso `America/Fortaleza` com armazenamento de instantes em UTC.

---

## 4. MÓDULOS — FUNCIONALIDADES

### M0 — Onboarding e empresas [P0]

Permitir criar workspace pessoal, cadastrar empresas/negócios, escolher empresa padrão (opcional), informar segmento, descrição, cor de identificação e estado (ativa/arquivada). Criar **clientes** vinculados às empresas prestadoras de serviço, especialmente Vértice. Permitir anotar contexto/objetivos sem exigir cadastro detalhado.

**Entrega mínima:** lista de empresas, criação/edição, seleção global de empresa, uma visão “Todas as empresas”.

### M1 — Inbox universal / captura rápida [P0]

Três pontos de entrada previstos: (a) chat IA interno, (b) campo/botão “Nova demanda” sempre visível, (c) **[FUTURO]** WhatsApp texto/áudio. Uma captura pode conter somente texto.

Exemplos:

- “Revisar campanha da Cris ainda esta semana. Uns 40 minutos.”
- “Preciso falar com o Lauro amanhã de manhã.”
- “Criar um projeto de lançamento do delivery de frutas.”
- “A proposta desse restaurante precisa de follow-up na sexta.”

Campos sugeridos pela IA: tipo de item, empresa, cliente, projeto, prioridade, duração estimada, prazo, data/hora explícita, recorrência, próximo passo. A IA devolve um **rascunho estruturado** e uma mensagem clara. Se a entidade ou o horário forem ambíguos, fica em **inbox/sem classificação**, sem inventar associações.

**Critérios de aceite:** capturar em uma interação, listar imediatamente, editar, classificar, converter em tarefa/evento/projeto/lead quando apropriado, detectar duplicatas óbvias com confirmação.

### M2 — Agenda inteligente [P0]

Uma agenda semanal e diária, com:

- Blocos recorrentes da rotina, marcados como **protegidos** ou **flexíveis**.
- Compromissos com início/fim explícitos.
- Blocos de execução criados a partir de tarefas (time blocking).
- Visão livre/ocupado e capacidade por dia/semana.
- Identificação por empresa/projeto.
- Movimentação manual de blocos; sugestões pela IA.
- Buffers configuráveis (p.ex., 10 minutos entre reuniões).
- Bloqueio de almoço/indisponibilidades.
- Recorrência semanal e tratamento de exceções para datas individuais.
- Planejamento de tarefas maiores em mais de um bloco quando permitido.

**Regras não negociáveis:**

1. Eventos confirmados e blocos protegidos não podem ser sobrepostos automaticamente.
2. Duração estimada deve caber em intervalos de disponibilidade; não inventar encaixes.
3. Prazo (deadline) e data/hora de execução são entidades diferentes.
4. Horário com fuso; evitar erros de data ao salvar/reabrir.
5. Se não couber, exibir conflito e opções de reagendamento/postergação, não confirmar falsamente.
6. Agenda manual continua utilizável se a IA/API estiver indisponível.

**Algoritmo inicial sugerido:** gerar intervalos livres a partir de jornada, pausas, rotinas e eventos; ordenar tarefas candidatas por prazo, prioridade, importância/meta e duração; recomendar o primeiro intervalo adequado respeitando limites e preferências. Não usar LLM como algoritmo de calendário.

### M3 — Demandas, tarefas e projetos [P0]

Tipos:

- **Demanda/inbox:** item recém-capturado, ainda não classificado ou agendado.
- **Tarefa:** unidade executável com status, responsável (usuário), empresa, prioridade, prazo, duração e projeto opcional.
- **Compromisso:** compromisso que ocupa um intervalo definido.
- **Rotina:** bloco recorrente da agenda, não necessariamente uma tarefa concluível.
- **Projeto:** container com objetivo, contexto, datas, etapas, entregáveis, notas, metas e tarefas.

Status propostos para tarefa: `inbox`, `todo`, `scheduled`, `in_progress`, `blocked`, `done`, `cancelled`.

Atribuições claras: `company_id` pode ficar `NULL` enquanto item estiver sem classificação; projeto tem uma empresa ou uma categoria transversal explícita. Não forçar criação de projeto para toda tarefa.

### M4 — Assistente IA [P0]

O assistente precisa:

- Compreender comandos em português natural.
- Identificar intenção: consultar, criar, editar, planejar, resumir ou comparar.
- Consultar dados reais e contexto do projeto.
- Interpretar prazo relativo (“amanhã”, “esta semana”) usando a data atual e `America/Fortaleza`.
- Sugerir empresa/projeto sem inventar certeza.
- Propor agendamento respeitando nível de autonomia.
- Explicar por que priorizou determinada demanda.
- Responder “o que fazer agora?” usando agenda atual + P1/P2/P3 + prazos + capacidade.
- Produzir resumos com links para itens reais.
- Ter mensagens de erro úteis quando não houver dados ou conexão.

**A IA nunca deve executar SQL arbitrário com privilégios totais a partir de linguagem natural.** Deve usar funções/ferramentas de domínio autorizadas, validadas no backend.

### M5 — Resumo diário e semanal [P0]

**Resumo diário (dashboard, gerado sob demanda no MVP):**

- Compromissos e blocos do dia.
- Top 3 prioridades recomendadas.
- Tarefas em atraso e com prazo próximo.
- Pendências bloqueadas.
- Capacidade disponível e sobrecarga.
- O que foi concluído (quando houver dados).
- Alertas objetivos, sem linguagem motivacional genérica.

**Resumo semanal:** executado x planejado, P1 concluídas, prazos respeitados, carga prevista versus blocos executados quando houver registro, progresso das metas e prioridades da semana seguinte.

**[FUTURO]** Envio proativo por WhatsApp; no MVP, permitir gerar/consultar manualmente. Automação por job agendado pode ser introduzida depois.

### M6 — Metas e performance [P0]

O usuário explicitamente precisa acompanhar **metas**, **performance por semana/mês** e **comparar períodos**.

Metas possíveis:

- Quantitativas: número de propostas, leads qualificados, faturamento, reuniões, entregas.
- Percentuais/taxas: conversão, atingimento de meta.
- Marcos: lançar projeto, entregar funcionalidade (progresso por marcos, não fingir equivalência com receitas).

As metas podem ser atribuídas a empresa, projeto ou visão transversal; ter período, valor-alvo, unidade, fonte do valor realizado (manual ou, no futuro, integração) e histórico de atualizações.

**Performance operacional [PROPOSTO]:** fornecer indicadores independentes antes de criar um “score” agregado:

1. **Taxa de conclusão do planejado:** tarefas planejadas para o período que foram concluídas / total de tarefas planejadas elegíveis. Exibir denominador e regra de inclusão.
2. **Cumprimento de prazos:** tarefas concluídas dentro do prazo / tarefas concluídas no período que tinham prazo.
3. **Execução de prioridades P1:** P1 concluídas / P1 planejadas para o período.
4. **Progresso de metas:** realizado / alvo, com unidade, período e limites próprios.
5. **Volume de demandas novas e pendentes**, **tarefas vencidas**, **tempo estimado planejado**, **tempo executado** somente se o sistema registrar execução real.

**Comparações:** semana atual vs semana anterior; mês atual vs mês anterior; períodos customizados (datas inicial/final); por empresa, por projeto ou consolidado. Em comparativos de períodos em andamento, sinalizar que são parciais e, se adequado, comparar dias equivalentes.

**Importante:** não equiparar quantidade de tarefas à produtividade real. Não inventar “horas trabalhadas” baseando-se apenas em duração prevista. Se a amostra for insuficiente, indicar “dados insuficientes”. Um score único 0–100 é opcional e **não deve ser a única métrica**, precisa expor fórmula e pesos configuráveis se implementado.

### M7 — CRM B2B por empresa [P1: após núcleo de produtividade]

Cada empresa possui seu **próprio pipeline**. O usuário pode criar etapas, negócios/oportunidades, clientes/contatos, valores, probabilidade (opcional), origem, previsão de fechamento, próxima ação e histórico de interações.

Pipeline padrão **configurável**: `Novo lead → Contato iniciado → Qualificação → Proposta enviada → Negociação → Ganho / Perdido`.

Não usar o pipeline padrão como regra fixa para todo negócio. Um lead/negócio pertence a **uma empresa**. Um cliente da Vértice (ex.: Querido Pudim) não é automaticamente um lead comercial da CSM.

Integrar CRM com agenda/tarefas: follow-up comercial vira tarefa e pode receber bloco de execução. Indicadores básicos: oportunidades por etapa, valor aberto, ganhos/perdas, follow-ups vencidos, conversão por etapa (se houver histórico suficiente).

### M8 — Métricas personalizadas e dashboard por empresa [P1]

Permitir criar métricas próprias sem código, por exemplo:

- Nome, descrição, unidade (`BRL`, número, %, horas), direção desejada (maior/menor), empresa, periodicidade e forma de agregação.
- Lançamentos manuais de valores com data, observação e origem.
- Séries históricas e gráficos por período.
- Comparação entre períodos e evolução da meta quando associada.

**Regra:** percentuais não devem ser somados como se fossem valores absolutos. Distinguir `sum`, `last`, `avg` e taxas calculadas por numerador/denominador; validar unidades.

### M9 — Financeiro empresarial [P1: segunda onda]

Somente **CNPJ / operações empresariais**. Lançamento manual inicialmente, com estrutura preparada para importar CSV ou integrar APIs depois.

**Escopo inicial:**

- Empresa, contas/caixas empresariais (opcionais), categorias, lançamentos de **receita** e **despesa**, data de movimentação, descrição, valor, competência opcional, status (previsto/realizado), comprovante opcional no futuro.
- Visão por empresa e consolidada, filtros por datas, total de entradas, total de saídas, saldo do período e evolução mensal.
- Comparação de períodos; meta de faturamento e despesas por categoria.
- Distinguir **saldo do período**, **saldo em conta**, **resultado em regime de caixa** e **lucro líquido contábil**. O MVP NÃO deve rotular diferença simples entre entradas/saídas como lucro líquido contábil.
- Não inserir controles de cartão pessoal, CPF, orçamento doméstico ou despesas familiares.

Segurança: dados financeiros nunca expostos em logs de prompts sem necessidade; entrada sempre validada no backend. Exclusão de registros requer confirmação e trilha de auditoria.

### M10 — Integrações [FUTURO]

- **Sobi:** conector por API quando a plataforma estiver disponível, com mapeamento de eventos/métricas da sua área de gestão, autenticação, sincronização e registro de falhas.
- **Google Calendar:** importar/espelhar eventos, respeitar calendário principal e evitar duplicatas.
- **WhatsApp Business Cloud API:** entrada de mensagens/áudios e notificações autorizadas; requer configuração oficial, consentimento e cuidados com envio de templates/mensagens.
- **Outras APIs:** adapters independentes por provedor, sem acoplamento ao banco central.

**Importante:** não implementar integração simulada como se fosse real. Deixar contratos/interfaces e feature flags; exibir “não conectado” na interface.

---

## 5. TELAS E EXPERIÊNCIA

### 5.1. Navegação sugerida [PROPOSTO]

Desktop: barra lateral com `Hoje`, `Minha Semana`, `Inbox`, `Demandas`, `Projetos`, `Empresas`, `CRM`, `Metas e Performance`, `Indicadores`, `Financeiro`, `Assistente`, `Configurações`.

Mobile: navegação condensada; botão global `+`/captura rápida; chat acessível em 1 toque; componentes responsivos.

**Nota:** CRM, Indicadores e Financeiro podem surgir desabilitados/ocultos até sua respectiva entrega, mas evite itens de navegação que aparentem funcionar e não funcionem.

### 5.2. Especificação das telas

#### A. Hoje (home / cockpit executivo) [P0]

Ordem de leitura:

1. Data, empresa filtrada (`Todas` como padrão), comando global “Adicionar demanda”.
2. **Próxima ação sugerida**, fundamentada no que está disponível.
3. Linha do tempo com blocos do dia.
4. Três prioridades críticas e tarefas vencidas.
5. Resumo do dia e progresso de metas pertinentes.
6. Atalho para conversar com o assistente.

Estados vazios devem orientar cadastro inicial, não exibir gráficos fictícios.

#### B. Minha Semana [P0]

Calendário semanal (seg–sex em destaque, com opção de ver outros dias), grade de horas, blocos por empresa, diferenciação entre compromisso, rotina e execução. Clique em horário livre cria compromisso/tarefa; clique em bloco permite editar/mover; botão “Planejar semana” pede sugestões de encaixe com explicação.

**Necessário:** indicar conflitos, disponibilidade e tarefas sem agendamento; não reordenar tudo sem confirmação se autonomia não permitir.

#### C. Inbox e Demandas [P0]

`Inbox` para capturas brutas e itens não classificados. `Demandas` com filtros por empresa, prioridade, projeto, status, prazo e agendamento. Possibilitar ações rápidas: concluir, adiar, editar, colocar na agenda, associar projeto.

#### D. Projetos [P0]

Lista agrupável por empresa + página de detalhe com resumo, contexto, objetivo, notas, marcos, tarefas, status, progresso e histórico. Projeto deve preservar contexto utilizável pela IA; usuário pode editar o texto a qualquer momento.

#### E. Empresas [P0]

Diretório das empresas e visão individual: perfil, tarefas, projetos, agenda filtrada, metas e (mais tarde) CRM/financeiro.

#### F. Assistente IA [P0]

Chat com histórico persistente por workspace. Permitir escolher contexto `Todas as empresas`, empresa específica ou projeto. Respostas com referências clicáveis para registros internos quando possível. Quando houver ação, mostrar **prévia** (criar tarefa, editar, sugerir agenda etc.) e solicitar aprovação segundo política de autonomia.

#### G. Metas e Performance [P0]

Filtros por período (`semana`, `mês`, `personalizado`) e empresa; cards de indicadores com valor, base de cálculo e comparação; gráficos históricos; tabela de metas (alvo, realizado, diferença, tendência); seção de pontos de atenção e conquistas com origem rastreável.

#### H. CRM [P1]

Quadro kanban por pipeline da empresa selecionada, detalhe da oportunidade com histórico, próximas atividades, contatos e valor; filtros por período/etapa/responsável.

#### I. Indicadores personalizados [P1]

Catálogo de métricas, lançamento rápido, séries e comparação entre períodos.

#### J. Financeiro empresarial [P1]

Resumo de entradas/saídas por empresa, lista de lançamentos, gráficos por categoria/período, formulário de lançamento manual. Sempre rotular o regime financeiro utilizado.

#### K. Configurações [P0]

Perfil, fuso, jornada, almoço/pausas, horário de preferência, níveis de autonomia, limites de agendamento, integrações, preferências de resumo, gerenciamento de dados/privacidade.

### 5.3. Direção visual [PROPOSTO]

Design **premium, minimalista e funcional**: espaços generosos, tipografia legível, cards discretos, poucas cores, consistência entre desktop/mobile, foco em hierarquia e rapidez. Empresas podem ter cores sutis, mas jamais depender apenas da cor para distinguir status. Usabilidade importa mais que dashboards excessivamente ornamentados.

---

## 6. MOTOR DE AGENDA — MODELO DE DECISÃO

### 6.1. Definições

- **Horário de trabalho:** janelas recorrentes do usuário (não confundir com blocos já ocupados).
- **Indisponibilidade:** almoço, folgas ou eventos pessoais de bloqueio, sem guardar informações financeiras/familiares.
- **Bloco protegido:** nunca mover sem autorização explícita.
- **Bloco flexível:** pode mover conforme regras e autonomia.
- **Compromisso:** horário obrigatório/confirmado.
- **Bloco de execução:** reserva para realizar uma tarefa; pode ser concluído/cancelado sem necessariamente completar toda a tarefa.
- **Duração estimada:** planejamento, não comprovação de horas trabalhadas.

### 6.2. Fluxo de encaixe de nova demanda

1. Receber texto/ação manual.
2. Interpretar e sugerir `tipo`, `empresa`, `projeto`, `duração`, `deadline`, `priority`.
3. Validar campos e localizar data no fuso do usuário.
4. Salvar na inbox ou gerar rascunho aguardando aprovação, conforme autonomia.
5. Calcular intervalos realmente livres em horizonte configurado.
6. Classificar candidatos por: compromisso com prazo, prioridade, relação com metas, duração, blocos preferenciais e buffers.
7. Exibir sugestões com **motivo** e impacto; caso impossível, explicitar conflito.
8. Após autorização, gravar evento/bloco de maneira transacional e revalidar conflitos imediatamente antes de salvar.
9. Registrar quem executou (`user`/`assistant`) e ação para reversão.

### 6.3. Exemplo de caso de uso

**Entrada:** “Preciso revisar a campanha da Cris esta semana, 40 minutos.”

**Interpretação esperada:** tarefa; empresa candidata Vértice; cliente candidato Querido Pudim/Cris; duração 40 min; vencimento nesta semana; prioridade não definida, portanto **não presumir P1**.

**Resultado:** registrar tarefa ou apresentar rascunho, localizar horários livres no período e sugerir bloco. Se não houver confirmação de associação cliente/empresa, pedir confirmação **apenas se necessária**. Não confirmar horário inexistente.

### 6.4. Autonomia configurável [DECIDIDO — níveis são PROPOSTOS]

- **N0 — Consultivo:** IA lê/análise e sugere; não grava mudanças.
- **N1 — Assistido (padrão inicial):** pode preparar rascunhos, mas toda criação/edição e agendamento requerem confirmação.
- **N2 — Semiautônomo:** pode criar inbox/tarefas simples e ocupar espaços livres/flexíveis segundo limites; alterações em compromissos confirmados e blocos protegidos exigem aprovação.
- **N3 — Autônomo delimitado:** pode reorganizar rotinas flexíveis dentro de janelas e limites estabelecidos, notificando o usuário e permitindo desfazer; mantém proteção para eventos e operações sensíveis.

**Limites globais:** IA nunca executa movimentação financeira, envia mensagens externas, apaga dados em massa ou altera compromissos protegidos apenas por estar em N3. Essas operações sempre demandam aprovação específica.

---

## 7. ARQUITETURA DA IA E FERRAMENTAS

### 7.1. Modelo operacional

**Entrada do usuário → normalização e identificação de intenção → recuperação de contexto autorizado → geração de proposta de ação estruturada → validação no backend → aplicação da política de autonomia → confirmação (quando necessária) → operação transacional → auditoria → resposta.**

A IA é uma **camada de interpretação e orquestração**, não a fonte da verdade. O banco é a fonte da verdade.

### 7.2. Ferramentas do assistente (contratos conceituais)

Criar ferramentas bem tipadas e com escopo de permissão:

- `list_companies`, `get_company_context`
- `list_projects`, `get_project_context`
- `list_tasks`, `create_task_draft`, `update_task_draft`, `complete_task`
- `get_calendar_availability`, `propose_schedule_slots`, `create_schedule_block`, `move_schedule_block`
- `get_daily_briefing`, `get_weekly_summary`
- `list_goals`, `get_goal_progress`, `compare_performance_periods`
- **P1:** `list_crm_opportunities`, `create_followup_task`, `list_business_metrics`, `get_business_financial_summary`

Cada ferramenta deve: (a) operar somente no `workspace_id` autenticado e empresa autorizada; (b) validar argumentos via schema; (c) registrar ações relevantes; (d) retornar erro tratável; (e) respeitar autonomia e idempotência.

### 7.3. Memória e contexto

Separar:

1. **Dados estruturados:** tarefas, empresas, agenda, metas, negócios, finanças.
2. **Contexto explícito do projeto:** descrição, estratégia, histórico e notas fornecidos pelo usuário.
3. **Preferências do assistente:** priorização, jornada, tom e autonomia.
4. **Histórico de conversas:** registro consultável, com limites de retenção.
5. **Memórias/sínteses:** somente contexto útil rastreável, editável e associado ao seu escopo.

Não colocar todas as tarefas e documentos brutos em cada prompt. Consultar somente registros relevantes, resumir o contexto e reduzir tokens/custo. Se não houver dado suficiente, explicitar limitação.

### 7.4. Provedor e custo

**[PROPOSTO]** Criar interface `AIProvider` e selecionar modelo por variável de ambiente. Suportar inicialmente um provedor econômico (modelo pequeno/flash da OpenAI ou Gemini), com troca futura sem reescrever domínios de negócio. Nunca codificar versão, preço ou disponibilidade de modelo como constante de negócio sem checagem.

Salvar métricas técnicas de uso por requisição (tokens/estimativa de custo, quando disponíveis), latência e falhas **sem registrar desnecessariamente informações empresariais sensíveis**. Usar saída estruturada validada (Zod/JSON Schema) e retries limitados para falhas transitórias; se a IA cair, CRUD, agenda e métricas continuam funcionando.

### 7.5. Casos a testar

- “Quais são minhas P1 de hoje?”
- “O que está atrasado na Vértice?”
- “Tenho 45 minutos livres agora. Qual tarefa devo priorizar?”
- “Adiciona uma tarefa para revisar as campanhas da CSM até sexta.”
- “Encaixe uma reunião de 1 hora, mas não mexa nas minhas rotinas fixas.”
- “O que mudou na minha performance em relação à semana passada?”
- “Compare minhas metas do mês atual com o mês anterior.”
- “Mostre o pipeline B2B da CSM.” (**P1**, somente quando CRM existir.)
- “Quanto entrou e saiu da Vértice neste mês?” (**P1**, só se houver lançamentos.)

---

## 8. MODELO DE DADOS — ENTIDADES E RELACIONAMENTOS

### 8.1. Convenções

- PostgreSQL/Supabase, UUID como chave primária.
- Campos padrão para dados de negócio: `id`, `workspace_id`, `created_at`, `updated_at`; `created_by`/`updated_by` quando relevante.
- `workspace_id` isola o proprietário; `company_id` classifica por empresa. **Não usar `company_id` como substituto de autorização**.
- Datas sem horário em `DATE`; instantes em `TIMESTAMPTZ` armazenados em UTC; exibição no fuso configurado.
- Valores monetários em `NUMERIC(14,2)` ou inteiros em centavos; não usar `float` para dinheiro.
- Enums ou CHECK constraints para estados e prioridades conhecidas.
- Integridade referencial e índices por `workspace_id`, `company_id`, datas e status.
- `deleted_at` opcional para exclusão lógica em itens sensíveis; evitar exclusão silenciosa em cascata sem planejamento.
- Identificadores de CNPJ são opcionais, com validação quando preenchidos; **nunca solicitar CPF como campo padrão**.
- Operações do backend devem validar que empresas/projetos/clientes relacionados pertencem ao mesmo workspace; reforçar via FKs/índices/constraints e RLS.

### 8.2. Tabelas principais — MVP P0

| Tabela | Campos essenciais | Relações/observações |
|---|---|---|
| `workspaces` | `id`, `name`, `owner_user_id`, `timezone`, `settings_json` | 1 workspace pessoal inicialmente; base multi-tenant. |
| `workspace_members` | `workspace_id`, `user_id`, `role` | No MVP apenas `owner`; prepara futuro sem interface de equipe. |
| `companies` | `workspace_id`, `name`, `slug`, `description`, `cnpj_nullable`, `color`, `status` | Isolamento por workspace. |
| `clients` | `workspace_id`, `company_id`, `name`, `notes`, `email_nullable`, `phone_nullable` | Clientes atendidos por uma empresa como a Vértice; não confundir com oportunidades CRM. |
| `projects` | `workspace_id`, `company_id_nullable`, `client_id_nullable`, `name`, `description`, `goal_text`, `status`, `starts_on`, `due_on` | Contexto do projeto e escopo empresarial. |
| `project_notes` | `workspace_id`, `project_id`, `body`, `kind`, `created_at` | Notas, decisões, contexto adicional. |
| `tasks` | `workspace_id`, `company_id_nullable`, `project_id_nullable`, `client_id_nullable`, `title`, `description`, `status`, `priority`, `due_at_nullable`, `estimated_minutes_nullable`, `completed_at_nullable`, `source` | Deadline separado do bloco de execução. |
| `inbox_items` | `workspace_id`, `raw_text`, `source`, `capture_metadata_json`, `status`, `resolved_entity_type_nullable`, `resolved_entity_id_nullable` | Captura bruta e posterior classificação. |
| `working_hours` | `workspace_id`, `weekday`, `start_time`, `end_time`, `enabled` | Jornada recorrente, horário local. |
| `availability_blocks` | `workspace_id`, `weekday_nullable`, `starts_at_nullable`, `ends_at_nullable`, `local_start_nullable`, `local_end_nullable`, `recurrence_rule_nullable`, `type`, `is_protected`, `name`, `company_id_nullable` | Rotinas e indisponibilidades, com recorrência. Implementar um modelo consistente para eventos recorrentes e exceções. |
| `calendar_events` | `workspace_id`, `company_id_nullable`, `project_id_nullable`, `task_id_nullable`, `title`, `event_type`, `starts_at`, `ends_at`, `is_protected`, `status` | Compromissos e blocos de execução, com validação de conflitos. |
| `calendar_event_exceptions` | `workspace_id`, `recurring_block_id`, `occurrence_date`, `action`, `override_json` | Exceções a blocos recorrentes; somente se adotado modelo de recorrência por regras. |
| `goals` | `workspace_id`, `company_id_nullable`, `project_id_nullable`, `name`, `goal_type`, `unit`, `target_value_nullable`, `starts_on`, `ends_on`, `status` | Metas semanais, mensais ou customizadas. |
| `goal_checkins` | `workspace_id`, `goal_id`, `date`, `actual_value_nullable`, `note`, `source` | Histórico de realizado; não sobrescrever o passado sem auditoria. |
| `assistant_conversations` | `workspace_id`, `title`, `company_id_nullable`, `project_id_nullable` | Conversa contextual. |
| `assistant_messages` | `workspace_id`, `conversation_id`, `role`, `content`, `tool_info_json_nullable`, `created_at` | Histórico do chat e das propostas. |
| `assistant_action_requests` | `workspace_id`, `conversation_id_nullable`, `action_type`, `arguments_json`, `preview_json`, `status`, `autonomy_level`, `approved_at_nullable`, `executed_at_nullable`, `idempotency_key` | Prévia, confirmação, auditoria e execução segura. |
| `activity_log` | `workspace_id`, `entity_type`, `entity_id`, `action`, `actor_type`, `before_json_nullable`, `after_json_nullable`, `created_at` | Auditoria/reversibilidade quando viável. |
| `user_preferences` | `workspace_id`, `autonomy_level`, `daily_briefing_preferences_json`, `planning_preferences_json` | Preferências e proteção de blocos. |

**Nota de modelagem:** a tabela de blocos recorrentes acima é um contrato conceitual, não uma exigência de usar simultaneamente `TIMESTAMPTZ` e hora local em todos os registros. Antes de migrar, escolher uma modelagem de recorrência inequívoca (RRULE ou dias da semana + exceções) e documentar a decisão.

### 8.3. Tabelas previstas — P1

| Tabela | Campos essenciais | Observações |
|---|---|---|
| `crm_pipelines` | `workspace_id`, `company_id`, `name`, `is_default` | Pipeline separado por empresa. |
| `crm_stages` | `workspace_id`, `pipeline_id`, `name`, `sort_order`, `stage_type` | Etapas customizáveis, `open/won/lost`. |
| `crm_contacts` | `workspace_id`, `company_id`, `name`, `organization_name`, `email`, `phone`, `notes` | Pessoas/contatos comerciais. Sem CPF obrigatório. |
| `crm_deals` | `workspace_id`, `company_id`, `pipeline_id`, `stage_id`, `contact_id_nullable`, `title`, `value`, `expected_close_on`, `status`, `next_follow_up_at` | Oportunidades por empresa. |
| `crm_activities` | `workspace_id`, `deal_id`, `activity_type`, `occurred_at`, `notes`, `linked_task_id_nullable` | Atividades e follow-ups. |
| `metric_definitions` | `workspace_id`, `company_id_nullable`, `name`, `unit`, `aggregation`, `direction`, `description` | Métricas configuráveis. |
| `metric_entries` | `workspace_id`, `metric_id`, `recorded_on`, `value`, `notes`, `source` | Série histórica manual. |
| `finance_accounts` | `workspace_id`, `company_id`, `name`, `opening_balance`, `opening_balance_on`, `status` | Conta/caixa empresarial opcional. |
| `finance_categories` | `workspace_id`, `company_id`, `name`, `kind`, `parent_id_nullable` | Receita/despesa, hierarquia opcional. |
| `finance_transactions` | `workspace_id`, `company_id`, `account_id_nullable`, `category_id_nullable`, `kind`, `amount`, `occurred_on`, `competence_month_nullable`, `status`, `description` | Lançamentos financeiros empresariais. |
| `integration_connections` | `workspace_id`, `provider`, `state`, `config_reference`, `last_sync_at` | No MVP usar `not_connected`. Não armazenar credenciais em claro. |
| `integration_sync_runs` | `workspace_id`, `connection_id`, `started_at`, `ended_at`, `status`, `summary_json` | Integrações futuras. |

### 8.4. Relações críticas

- `workspace 1:N companies`, `workspace 1:N tasks`, `workspace 1:N events`.
- `company 1:N projects`, `company 1:N crm_pipelines`, `company 1:N crm_deals`, `company 1:N finance_transactions`.
- `project 1:N tasks`, `project 1:N project_notes`.
- `task 0:N calendar_events` (uma tarefa pode ter vários blocos de execução).
- `goal 1:N goal_checkins`.
- `pipeline 1:N stages`, `stage 1:N deals`.
- `assistant_action_requests` referencia operação proposta e seu resultado de forma auditável.

---

## 9. FLUXOS DE INTERAÇÃO E CRITÉRIOS DE ACEITE

### FL-01 — Capturar e classificar em segundos

**Dado** usuário autenticado na tela Hoje, **quando** registra “Ajustar o anúncio da Brasil Moto Peças até sexta”, **então** um item aparece imediatamente na inbox/tarefas, com título preservado, texto original recuperável, associação sugerida à Vértice/cliente e prazo relativo resolvido; campos incertos aguardam confirmação. Não pode desaparecer se o modelo falhar.

### FL-02 — Agendar respeitando blocos

**Dado** almoço e rotina protegida na agenda, **quando** usuário solicita encaixar tarefa de 40 minutos, **então** a sugestão não pode sobrepor bloqueios/compromissos. Ao aprovar, evento e vínculo com tarefa são persistidos. Segunda tentativa idêntica não cria evento duplicado.

### FL-03 — Falta de vaga

**Dado** dia sem intervalo compatível, **quando** usuário tenta agendar 1h, **então** o sistema mostra “sem vaga no horizonte consultado” com alternativas honestas. Não registra horário artificial.

### FL-04 — Prioridades separadas de urgência

**Dado** uma P1 estratégica sem prazo e uma P3 que vence hoje, **quando** IA planeja o dia, **então** sinaliza a urgência da P3 sem mudar automaticamente sua classificação estratégica.

### FL-05 — Projeto com contexto

**Dado** projeto “Delivery digital CSM” com objetivo e notas, **quando** o usuário pergunta “o que falta nesse projeto?”, **então** a IA consulta status/atividades reais e diferencia pendências registradas de recomendações não cadastradas.

### FL-06 — Autonomia

**Dado** N1 ativo, **quando** a IA sugere criar/mover agenda, **então** nenhuma gravação ocorre antes da confirmação. **Dado** N2, pode realizar somente operações explicitamente permitidas e deve reportá-las, sem tocar em blocos protegidos.

### FL-07 — Resumo diário

**Dado** registros do dia, **quando** o usuário abre “Hoje” ou solicita resumo, **então** aparece agenda real, pendências, prioridades e disponibilidade. Sem metas cadastradas, exibir ausência de dados, não progresso fictício.

### FL-08 — Performance por período

**Dado** tarefas/metas em dois períodos, **quando** o usuário seleciona semana anterior e semana atual, **então** compara mesma métrica, mesma empresa e critérios definidos; mostra quantidade de registros, período exato e alerta de comparação parcial.

### FL-09 — CRM separado por empresa [P1]

**Dado** pipelines de CSM e Vértice, **quando** seleciona CSM, **então** não exibir deals da Vértice nem misturar somas. Follow-up pode ser criado como tarefa na empresa correta.

### FL-10 — Financeiro empresarial [P1]

**Dado** receitas/despesas manuais de empresas distintas, **quando** visualiza uma empresa, **então** somas pertencem somente a ela. Consolidado deve rotular filtros/períodos, excluir transações pessoais e não afirmar lucro contábil sem dados adequados.

---

## 10. INDICADORES, FÓRMULAS E COMPARAÇÕES

Definir um serviço de métricas único usado por UI e IA, com testes unitários e fórmulas documentadas.

### 10.1. Indicadores de execução

- `planned_tasks`: tarefas elegíveis explicitamente planejadas para período (documentar regra: bloco agendado, `planned_for` ou snapshot de planejamento; **não inferir do mero `created_at`**).
- `completed_planned_tasks`: subconjunto concluído conforme janela/regras.
- `execution_rate = completed_planned_tasks / planned_tasks * 100`, se denominador > 0.
- `on_time_rate = completed_with_deadline_on_time / completed_with_deadline * 100`, se denominador > 0.
- `p1_completion_rate = completed_p1_planned / planned_p1 * 100`, se denominador > 0.
- `overdue_open_tasks`: tarefas abertas com prazo anterior ao instante consultado.
- `goal_attainment = actual / target * 100`, somente quando objetivo é quantitativo, alvo válido e direção `higher_is_better`; para métricas em que “menor é melhor”, definir fórmula específica e exibir valor bruto.

**Decisão de dados necessária na implementação:** capturar evento/snapshot de planejamento (`task_planning_snapshots` ou campo `planned_for`) para evitar que alterar uma tarefa hoje reescreva artificialmente histórico de períodos anteriores.

### 10.2. Comparação entre períodos

- Presets: `esta semana`, `semana passada`, `este mês`, `mês passado`, `últimos 30 dias` e intervalo customizado.
- Mostrar `período A`, `período B`, valor absoluto, variação absoluta e relativa quando matematicamente aplicável.
- Evitar porcentagem de crescimento quando base = 0; usar rótulo apropriado.
- Ao comparar mês em andamento, oferecer “mesmo número de dias decorridos” e marcar diferença entre visão parcial e período fechado.
- Filtros sempre consistentes: `workspace`, `company`, `project`, `metric`, `date_range`.
- Para números consolidados, não somar proporções e percentuais de empresas com denominadores diferentes.

### 10.3. Dashboard executivo — exemplos de cards

`Demandas em aberto`, `P1 pendentes`, `Tarefas vencidas`, `Execução planejada na semana`, `Cumprimento de prazos`, `Metas no ritmo`, `Próximos compromissos`; P1 acrescenta `Pipeline total`, `Follow-ups vencidos`, `Receitas`, `Despesas`, `Saldo do período`.

Cada card deve ter modo de inspecionar **origem de dados e critério de cálculo**.

---

## 11. STACK TÉCNICO RECOMENDADO [PROPOSTO]

Prioridade: simples de desenvolver com Codex, barato de operar para 1 usuário, evolutivo.

| Camada | Escolha sugerida | Justificativa |
|---|---|---|
| Frontend/fullstack | **Next.js (App Router) + TypeScript** | UI e backend da aplicação em mesmo projeto. |
| Estilo/componentes | **Tailwind CSS + shadcn/ui** | Design premium, componentes acessíveis, consistência. |
| Backend e banco | **Supabase: PostgreSQL, Auth e RLS** | Dados relacionais, autenticação, políticas de acesso. |
| Validação | **Zod** | Contratos entre chat, formulários e ações. |
| Formulários | React Hook Form ou equivalente | Formulários rápidos e validados. |
| IA | Adaptador para API econômica de LLM | Liberdade de escolher/trocar modelo. |
| Calendário | Biblioteca de calendário React madura compatível com stack | Grade semanal, drag/drop e recorrência com lógica de domínio própria. |
| Gráficos | Recharts ou equivalente | Evolução de metas e comparativos. |
| Testes | Vitest + Playwright | Regras de domínio e fluxos de ponta a ponta. |
| Automações futuras | Jobs programados/n8n conforme necessidade | Resumos e integrações sem complexo motor próprio prematuro. |
| Integrações futuras | Adapters internos | Sobi, WhatsApp oficial e Google Calendar sem acoplamento. |

Use versões estáveis compatíveis disponíveis no projeto no momento da instalação; **não fixar versões desatualizadas copiadas de exemplo**. Evitar dependências excessivas.

### 11.1. Estrutura inicial de pastas sugerida

```text
src/
  app/
    (auth)/
    (app)/
      hoje/
      semana/
      inbox/
      demandas/
      projetos/
      empresas/
      assistente/
      performance/
      crm/           # P1
      indicadores/   # P1
      financeiro/    # P1
      configuracoes/
    api/
      ai/
      integrations/  # FUTURO
  components/
    ui/
    navigation/
    calendar/
    tasks/
    metrics/
    assistant/
  features/
    companies/
    projects/
    tasks/
    scheduling/
    goals/
    performance/
    assistant/
    crm/             # P1
    finance/         # P1
  lib/
    auth/
    db/
    validators/
    dates/
    ai/
      providers/
      tools/
      prompts/
    audit/
supabase/
  migrations/
  seed.sql           # opcional; sinalizar claramente dados demo
  tests/
    unit/
    integration/
    e2e/
.env.example
README.md
DECISIONS.md
CONTEXTO_CODEX_ASSISTENTE_EXECUTIVO.md
```

Estrutura ilustrativa; adaptar ao padrão do repositório e ao gerenciador de migrations adotado. Não criar diretórios vazios sem benefício.

### 11.2. Arquitetura em camadas

```text
UI (Web responsiva)
    |
    v
Casos de uso / validações / autorização
    |                 |
    v                 v
Serviços de domínio  Serviço de IA
(agenda, tarefas,    (intenção, contexto,
metas, performance)   ferramentas seguras)
    |                 |
    +--------+--------+
             |
             v
  PostgreSQL / Supabase Auth + RLS
             |
             v
  Adapters externos (somente quando habilitados)
```

### 11.3. Variáveis de ambiente (nomes sugeridos)

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # servidor; nunca expor no browser
AI_PROVIDER=
AI_MODEL=
AI_API_KEY=              # servidor
APP_TIMEZONE=America/Fortaleza
```

`SUPABASE_SERVICE_ROLE_KEY` é opcional conforme arquitetura escolhida; evitar seu uso em operações comuns de usuários se políticas RLS/clientes autenticados forem suficientes. Manter `.env` fora do Git, com `.env.example` sem segredos.

---

## 12. SEGURANÇA, PRIVACIDADE E RESILIÊNCIA

- Login obrigatório e autorização por `workspace_id` (membro/owner). Aplicar **RLS** a tabelas acessadas do cliente e autorização adicional no servidor.
- No MVP, um usuário proprietário; não há compartilhamento entre empresas ou equipes ainda.
- Segredos de IA, Supabase privilegiado e APIs **somente no servidor**, com armazenamento seguro de credenciais de integração.
- Validar parâmetros, tamanho de textos e ids no backend; sanitizar exibição e prevenir prompt injection (notas/projetos são **dados**, não instruções privilegiadas).
- Registrar ações da IA e usuário e permitir desfazer quando razoável; exclusões sensíveis exigem confirmação.
- Executar mutações críticas em transações, com proteção contra duplicidade/concorrência no agendamento.
- Datas e duração: testes para virada de mês/ano, timezone, eventos cruzando meia-noite e horas inválidas.
- Logs sem dados sensíveis desnecessários; tratar consentimento de comunicação externa e requisitos legais aplicáveis.
- Finanças empresariais não devem se misturar com perfis pessoais ou com transações de outras empresas.
- Em falha da IA, permanecer possível capturar, editar, planejar manualmente e consultar dados.

---

## 13. PROPOSTA DE UX DE CAPTURA E RESPOSTA DA IA

### 13.1. Captura via texto

**Usuário:** “Semana que vem preciso montar a estratégia de delivery de frutas. Coloca 2 horas para isso.”

**Assistente:**

> Encontrei uma nova tarefa estratégica da CSM: “Montar estratégia de delivery de frutas” (2h). Prioridade sugerida: P2, com base nas suas prioridades atuais. Posso procurar um intervalo disponível na próxima semana, sem alterar seus blocos protegidos?

A interface deve mostrar empresa, título, duração, prioridade, horizonte e botões `Confirmar`/`Editar`/`Cancelar` no nível N1. Não atribuir horário antes de consultar a agenda.

### 13.2. Consulta de performance

**Usuário:** “Como foi minha performance na CSM esta semana comparada com a passada?”

**Assistente:** retorna indicadores calculados de tarefas/metas da CSM, com datas e denominadores, aponta tendências e limitações. Se não houver histórico suficiente, responde “não há dados suficientes para comparação” e explica o que precisaria ser registrado.

### 13.3. Resumo diário

Exibir formato compacto:

- **Hoje:** compromissos fixos e execução planejada, com horários reais.
- **Principal prioridade:** tarefa recomendada com justificativa.
- **Atenção:** vencimentos, conflitos, bloqueios e metas fora do ritmo, somente quando dados sustentarem.
- **Janela livre:** somente intervalos calculados pelo serviço de agenda.

---

## 14. FORA DE ESCOPO DA PRIMEIRA ENTREGA

Evitar consumir tempo no MVP com:

- App nativo Android/iOS (web responsiva primeiro).
- Multiusuário complexo, equipes, permissões granulares e cobrança SaaS.
- Integração real com **Sobi**, pois ela ainda não está lançada.
- WhatsApp bidirecional/áudio/notificações reais antes do núcleo funcionar (preparar o design, não bloquear entrega).
- Sincronização bidirecional com calendários externos antes de estabilizar o calendário interno.
- Conciliação bancária, contabilidade ou ERP financeiro completo.
- Forecast financeiro avançado sem lançamentos confiáveis.
- Sistema de agentes autônomos que façam alterações irreversíveis sem aprovação.
- Score de performance “mágico” sem fórmula transparente.
- Módulos pessoais/familiares de dinheiro ou CPF.

---

## 15. ORDEM DE DESENVOLVIMENTO — VERTICAL SLICES

A ordem abaixo é **mais importante** do que implementar todas as telas de uma vez.

### Entrega 0 — Fundação técnica

- Inicializar/revisar repositório, Next.js/TypeScript e UI base.
- Configurar Supabase Auth, banco, migrations e RLS.
- Criar layout autenticado, navegação e tema responsivo.
- Criar `README.md`, `.env.example`, `DECISIONS.md` e scripts de build/testes.
- Resultado: login funcional + shell da aplicação + persistência segura.

**Aceite:** usuário autenticado vê workspace pessoal; usuário não autenticado não acessa dados; RLS testado.

### Entrega 1 — Núcleo de empresas, projetos e tarefas

- Empresas (CRUD), clientes básicos (CRUD), projetos (CRUD + contexto), tarefas (CRUD/status/P1-P3) e inbox.
- Captura rápida textual **sem depender de IA**.
- Página Hoje inicial com tarefas e pendências reais.

**Aceite:** registrar demanda em segundos; associar a empresa/projeto; consultar, editar e concluir sem perder dados.

### Entrega 2 — Agenda funcional e motor determinístico

- Jornada, almoço/pausas, blocos recorrentes fixos/flexíveis, eventos e execução de tarefas.
- Visão diária/semanal.
- Consultas de disponibilidade e sugestão de horários.
- Conflitos e proteção; aprovação manual.

**Aceite:** encaixar tarefas sem sobreposições; preservar blocos protegidos; mostrar impossibilidade honesta de agendar.

### Entrega 3 — IA útil de verdade

- Chat autenticado, contexto por empresa/projeto, provider econômico configurável.
- Ferramentas para consultar tarefas e disponibilidade, gerar rascunhos, sugerir ações.
- Política de autonomia N0/N1 inicialmente (N2/N3 depois de testes).
- Confirmação de ações e logs.

**Aceite:** interpretar comando natural e concluir o fluxo até criação/agendamento **com aprovação**, sem alucinar horários.

### Entrega 4 — Resumos, metas e performance

- Metas com check-ins manuais; resumo diário e semanal.
- Métricas com fórmulas testadas; comparação semanal/mensal/customizada.
- Dashboard por empresa/consolidado e explicação de origem dos números.
- Refinar autonomia N2 e N3 somente após auditoria/conflitos robustos.

**Aceite:** comparar períodos com valores reais; sem dados, UI indica insuficiência; IA consegue narrar resultados sem inventar números.

> **MARCO: MVP pessoal completo.** A partir daqui, o usuário já consegue organizar sua semana, alimentar demandas e acompanhar sua performance com IA.

### Entrega 5 — CRM comercial B2B [P1]

- Pipelines independentes por empresa, etapas, contatos, oportunidades e atividades.
- Follow-up integrado a tarefas/agenda.
- Relatórios básicos por empresa e período.

### Entrega 6 — Métricas customizadas e financeiro empresarial [P1]

- Criação de métricas + lançamento manual.
- Lançamentos financeiros por empresa/CNPJ.
- Dashboards, comparação de períodos e consolidados confiáveis.

### Entrega 7 — Integrações e expansão [FUTURO]

- Google Calendar (quando desejado); WhatsApp Business Cloud (texto/áudio/notificações, com credenciais e consentimento); API da Sobi após disponibilização.
- Sincronização confiável, retries e idempotência.
- Equipes/multiusuário, planos e billing apenas quando existir intenção real de SaaS.

---

## 16. TESTES ESSENCIAIS

### Unitários

- Prioridade P1/P2/P3 independente de urgência/prazo.
- Algoritmo de disponibilidade (intervalos, buffers, bloqueios, recorrência, virada de dia).
- Cálculo de métricas, percentuais e períodos parciais.
- Conversão de fuso e datas relativas.
- Validação de lançamentos BRL sem ponto flutuante.
- Política de autonomia por tipo de ação.

### Integração

- CRUD com RLS (impedir leitura/escrita em outro workspace).
- Vínculo de tarefa/projeto/empresa coerente.
- Idempotência de agendamento e ações IA.
- Transações concorrentes não geram sobreposição.
- Relatórios por empresa não vazam dados de outra.

### E2E

1. Criar empresa → criar projeto → capturar tarefa → priorizar → agendar → concluir → refletir no resumo.
2. Cadastrar rotina protegida → tentar sobrepor → impedir → oferecer janela livre.
3. Registrar meta/check-ins → mostrar progresso e comparação de períodos.
4. Pedir IA para sugerir agenda → visualizar prévia → negar/aceitar → validar resultado no banco.
5. Sem chave API da IA: aplicativo continua útil e falha é informada de modo claro.

---

## 17. DEFINIÇÃO DE PRONTO DO MVP

O MVP é considerado utilizável **somente se**:

- [ ] Usuário consegue entrar em sua conta e os dados persistem entre sessões.
- [ ] Consegue cadastrar várias empresas com dados separados e visualização geral.
- [ ] Cria projetos com contexto e tarefas associadas.
- [ ] Adiciona demanda rapidamente, sem formulário obrigatório extenso.
- [ ] Visualiza agenda semanal com rotina fixa/flexível e intervalos disponíveis reais.
- [ ] Pode encaixar tarefa sem colidir com compromisso ou bloco protegido.
- [ ] Consulta com IA suas tarefas, projetos e agenda reais.
- [ ] Pode usar ao menos N0 e N1, com confirmação explícita para mutações em N1.
- [ ] Tem resumo diário e semanal baseado em dados persistidos.
- [ ] Cadastra metas e acompanha performance semanal/mensal com comparações entre períodos.
- [ ] Todas as métricas deixam claro sua fórmula e base; sem dados falsos.
- [ ] Funciona bem no desktop e permite capturar tarefas confortavelmente no celular.
- [ ] Há migrations, instruções de setup, segurança mínima e testes de fluxos críticos.

**Não exigir para este marco:** WhatsApp real, integração Sobi, CRM completo, financeiro completo ou plataforma comercial SaaS.

---

## 18. INSTRUÇÃO PARA A PRIMEIRA EXECUÇÃO DO CODEX

Ao receber este arquivo em um repositório:

1. Faça um diagnóstico da estrutura existente e das dependências disponíveis.
2. Resuma em poucas linhas a arquitetura a adotar e eventuais conflitos com este contexto.
3. Crie ou atualize um plano de implementação por entregas da seção 15, com checkboxes rastreáveis.
4. **Execute imediatamente a Entrega 0**, e, quando viável na mesma sessão, comece a Entrega 1, deixando um caminho funcional de login → empresa → projeto → demanda.
5. Gere migrations e políticas de acesso antes de expor CRUD; teste autorização.
6. Forneça uma UI visualmente consistente, minimalista e responsiva, não apenas endpoints sem interface.
7. Não implemente placeholders enganosos fingindo integração/IA conectada. Use feature flag e explicação honesta se faltar API key.
8. Ao concluir, documente os comandos de execução, variáveis de ambiente e próximos passos, com lista explícita do que está pronto e o que não está.

### Prompt curto recomendado para acompanhar este arquivo no Codex

> Leia integralmente `CONTEXTO_CODEX_ASSISTENTE_EXECUTIVO.md`. Este é o contexto de negócio e o escopo do produto. Inspecione o repositório, crie um plano curto de implementação e desenvolva primeiro a Entrega 0 e o núcleo funcional da Entrega 1, com migrations, RLS, validações, UI responsiva, testes e README. Preserve decisões já existentes, não invente dados ou integrações, e mantenha os módulos futuros fora do caminho crítico. Ao final, informe o que funciona e como rodar localmente.

---

## 19. QUESTÕES EM ABERTO QUE NÃO DEVEM BLOQUEAR O DESENVOLVIMENTO

- Marca/nome definitivo do sistema: ainda não escolhido.
- Regras exatas de duração/buffers e horários disponíveis fora dos blocos já conhecidos: configuráveis.
- Jornada semanal oficial: confirmar/importar a agenda atual; valores anteriores apenas referência.
- Taxonomia JFK: não presumir empresa sem configuração.
- Provedor/modelo de IA: selecionável por configuração; preferência por baixo custo.
- Modelo de envio WhatsApp e custos: decidir quando a integração entrar no escopo.
- Modelo futuro de SaaS: preservar workspace e isolamento, mas não implementar planos/assinaturas antes de validar uso pessoal.

**Regra final:** o produto deve fazer o usuário gastar **menos tempo administrando tarefas** e **mais tempo executando as atividades prioritárias de cada negócio**. Todas as escolhas de UX e arquitetura devem ser avaliadas contra esse objetivo.
