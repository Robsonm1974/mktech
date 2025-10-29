# Correção do Player do YouTube (Proposta)

Este documento contém uma proposta de implementação para tornar o player do YouTube responsivo (16:9) e reduzir elementos visuais do YouTube via parâmetros do iframe.

Use este snippet como referência; não é código executável direto.

```tsx
// Container responsivo 16:9
<div className="relative w-full pb-[56.25%] bg-black rounded-2xl overflow-hidden shadow-2xl">
  <iframe
    src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&modestbranding=1&rel=0&autohide=1&iv_load_policy=3&fs=1&origin=${encodeURIComponent(location.origin)}`}
    title="Vídeo da aula"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
    allowFullScreen
    className="absolute top-0 left-0 w-full h-full"
    style={{ border: 'none' }}
  />
</div>

// Dica para mobile (opcional)
<div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200 md:hidden">
  <p className="text-sm text-blue-800 font-medium text-center">
    💡 Dica: Toque no botão de tela cheia para melhor experiência
  </p>
</div>
```

Observações:
- Usa `playsinline`, `modestbranding`, `rel=0`, `iv_load_policy=3`, `autohide=1`, `fs=1`.
- Inclui `origin` para conformidade com a API do YouTube.
- A remoção completa de overlays/botão “Assistir no YouTube” não é garantida pelas ToS do YouTube; os parâmetros acima minimizam.


