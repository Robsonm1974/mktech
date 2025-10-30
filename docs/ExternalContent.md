Conteúdo Externo (iframe) — Guia de Integração

Como configurar no Admin
- Em Fábrica de Blocos → Mídia do bloco, selecione: "🧩 Conteúdo Externo (iframe)".
- Informe uma URL HTTPS do conteúdo (ex.: https://view.genially.com/...).
- O Preview do Admin não grava pontuação; apenas visualiza.

Como o Player trata o conteúdo
- O conteúdo abre em iframe seguro (sandbox, allow, referrerPolicy).
- O player escuta mensagens postMessage do iframe. Se nenhuma chegar em 30s, aparece um botão "Marcar como Concluído" (0 pontos).

Protocolo de Mensagens (Iframe → Player)
Envie para window.parent:
```js
window.parent?.postMessage({
  source: 'mktech',
  type: 'game:score',
  score: 0-100,
  completed: true,
  meta: { timeMs: 45000 }
}, '*')
```
Pontuação
- completed=true + score numérico → pontos = pontos_bloco * (score/100).
- completed=true sem score → 0 pontos (fallback manual).

Segurança
- event.origin é validado contra o host da URL configurada. Mensagens de outros domínios são ignoradas.

Boas práticas
- Publique em HTTPS.
- Evite navegações top-level no iframe.
- Envie o evento ao finalizar.
- Genially: incorporação por iframe (não script) + postMessage.

