# Decisões de implementação

1. **Stack:** Next.js App Router, TypeScript, Supabase PostgreSQL/Auth/RLS, Zod e CSS leve. O repositório estava vazio. Usamos o stack recomendado no contexto sem introduzir serviços extras.
2. **Nome provisório:** “Norte” identifica a interface enquanto a marca não é definida. Pode ser alterado sem migrar dados.
3. **Workspace:** uma conta gera um workspace pessoal via trigger de `auth.users`. Somente o proprietário opera nele nesta etapa. `company_id` classifica dados, mas nunca concede acesso.
4. **Projeto:** pode pertencer a uma empresa ou à área estratégica JFK. Projetos JFK associados à CSM continuam com `company_id` CSM; os demais podem ter `company_id` nulo e `area_id` JFK.
5. **Inbox:** captura bruta permanece separada de tarefas. Converter usa função SQL transacional que trava o item, cria uma tarefa e marca a conversão, evitando duplicatas concorrentes.
6. **Exclusão:** arquivamento, cancelamento e dispensa cobrem o fluxo inicial. Não há apagamento físico na interface, preservando histórico operacional.
7. **Prazos:** a interface recebe hora local de `America/Fortaleza`, converte para UTC no servidor e exibe no mesmo fuso. Prioridade estratégica não é inferida do prazo.
8. **Filtro global:** cookie apenas escolhe a visualização; RLS e escopo do servidor continuam definindo autorização.
9. **Auditoria:** triggers do banco registram ações de criação, edição, conclusão e conversão na mesma transação, sem copiar descrições empresariais para o log.
10. **Carga inicial:** o JSON canônico Norte é importado no workspace do usuário autenticado por uma função SQL transacional. Chaves `seed_key` tornam a importação idempotente e evitam sobrescrever edições. Demandas históricas permanecem em “A revisar”; links de rotina não viram tarefas repetidas.
11. **Agenda:** regras semanais guardam hora civil e `America/Fortaleza`, com vigência desde 15/10/2026. Ocorrências são calculadas na leitura; exceções por data têm tabela própria. Sexta 17h–18h é um único bloco flexível com Sobi padrão e Vetorne alternativa.
