# Scripts exploratórios do parecer de QA (2026-11-09)

Scripts Playwright usados pelo qa-engineer no diagnóstico da v5.0.0, com os registros (`*.log`) das execuções. São exploratórios, não uma suíte E2E: dependem de um `vite preview` local (porta 4173 = build original; 4174 = cópia com a correção do Bloqueador D-01), de `axe-core` instalado na pasta de trabalho e do Chromium do Playwright. Caminhos temporários foram substituídos por `<pasta-de-trabalho-do-qa>` e `<scratchpad>`. Servem de ponto de partida para a suíte `tests/e2e/` proposta no parecer (10 casos em Dado/Quando/Então).
