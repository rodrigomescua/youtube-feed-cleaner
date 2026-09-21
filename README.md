# YouTube Feed Cleaner

Userscript para cadastrar palavras e frases, destacar vídeos correspondentes no feed de inscrições e acionar a opção nativa “Ocultar” no menu do vídeo.

## Instalação para desenvolvimento

1. Instale Tampermonkey ou Violentmonkey.
2. Atualize no cabeçalho do userscript `rodrigomescua` (ou atualize as URLs caso o repositório fique em outra conta/organização).
3. Publique o arquivo `youtube-feed-cleaner.user.js` no branch `main`.
4. Instale pelo endereço `https://raw.githubusercontent.com/rodrigomescua/youtube-feed-cleaner/main/youtube-feed-cleaner.user.js`.

Quando publicar uma nova versão, incremente `@version` no cabeçalho e envie o commit para GitHub. O gerenciador consulta `@updateURL` e baixa a atualização de `@downloadURL`.

## Greasy Fork e sincronização

O Greasy Fork pode importar um userscript completo a partir de uma URL externa e sincronizar as mudanças dessa origem. Para este repositório:

1. Importe `https://raw.githubusercontent.com/rodrigomescua/youtube-feed-cleaner/main/youtube-feed-cleaner.user.js` pela opção **Importar scripts** do Greasy Fork.
2. Configure a sincronização automática ou acione a sincronização manual na página de edição do script.
3. Incremente `@version` a cada release e envie as alterações para o GitHub. Confirme no Greasy Fork que a sincronização criou a versão esperada.

O Greasy Fork fornece o endereço de instalação e as atualizações aos usuários. A importação sincroniza o código do script completo; não é necessário publicar uma biblioteca separada.

## Notas

- A interface do painel usa APIs seguras do DOM e funciona com Trusted Types estrito.
- O modo de ocultação automática é experimental e vem desligado. A ação manual aparece nos vídeos correspondentes.
- O painel mantém um histórico local dos últimos 100 vídeos ocultados automaticamente; ações manuais não entram nesse histórico.
- É possível ocultar visualmente as seções Shorts e Mais relevantes no feed de inscrições; essa opção não aciona a opção nativa “Ocultar”.
- O painel mostra avisos para alterações nos termos, opções, histórico e resultado das ações de ocultação.
- O script depende dos seletores da interface web do YouTube e pode precisar de ajustes quando a página mudar.
