# Capturas do diagnóstico Prumo (2026-11-09)

Capturas de tela da build de produção (`npm run build` + `vite preview`), tiradas pelo Head com Chromium headless (Playwright) em 2026-11-09, no modo "Usar sem conta", numa cópia de trabalho com a correção de uma linha do defeito Bloqueador B1 (sem ela o modo sem conta congela). A correção não altera o visual.

- `mobile-*`: 390×844, reduzidas de escala 2 para escala 1 e com paleta reduzida para caber no repositório.
- `desktop-*`: 1280×800 (só as citadas nos pareceres).
- Sequência: 01 login · 02 onboarding (4 passos) · 03 lista vazia (03b tema escuro, forçado por código) · 04 lista com 6 itens digitados na entrada rápida · 05 item marcado · 06 editar item · 07 modo compra (07b com campo de adicionar) · 08 finalizar com pendentes · 09 checkout · 10 após finalizar · 11 preços · 12 insights · 13 histórico · 14 ler cupom · 15 nova lista · 16 conta.
- Dados fictícios: itens "2kg tomate", "leite 2 un", "arroz 5kg", "detergente", "pão francês 500g", "frango 1,2kg 18,90"; compra de R$ 85,40 no "Extra Savassi".
- Os pareceres em `docs/*/` citam estas capturas pelo nome (`mobile-04`, `desktop-03b` etc.).
