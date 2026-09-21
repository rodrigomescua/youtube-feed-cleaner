# YouTube Feed Cleaner

Userscript para cadastrar palavras e frases, destacar vídeos correspondentes no feed de inscrições e acionar a opção nativa “Não tenho interesse”.

## Instalação para desenvolvimento

1. Instale Tampermonkey ou Violentmonkey.
2. Atualize no cabeçalho do userscript `rodrigomescua` (ou atualize as URLs caso o repositório fique em outra conta/organização).
3. Publique o arquivo `youtube-feed-cleaner.user.js` no branch `main`.
4. Instale pelo endereço `https://raw.githubusercontent.com/rodrigomescua/youtube-feed-cleaner/main/youtube-feed-cleaner.user.js`.

Quando publicar uma nova versão, incremente `@version` no cabeçalho e envie o commit para GitHub. O gerenciador consulta `@updateURL` e baixa a atualização de `@downloadURL`.

## Greasy Fork e sincronização

O Greasy Fork reescreve os campos `@updateURL` e `@downloadURL` de scripts publicados para que apontem ao próprio Greasy Fork. Portanto, publicar como um script normal no Greasy Fork não mantém o GitHub como origem das atualizações.

Para sincronizar código hospedado no GitHub:

1. No Greasy Fork, crie uma **biblioteca** (não um script comum) e informe a URL raw do arquivo acima como fonte externa/sincronizada.
2. Use o fluxo de sincronização oferecido pelo Greasy Fork para buscar as novas versões do repositório.
3. Confira cada versão importada na página do Greasy Fork antes de publicá-la aos usuários.

Se a intenção for que os usuários instalem diretamente do Greasy Fork, publique um script comum lá e envie atualizações pelo editor do site; nesse modelo, o Greasy Fork é a fonte de atualização.

## Notas

- O modo de ocultação automática é experimental e vem desligado. A ação manual aparece nos vídeos correspondentes.
- O script depende dos seletores da interface web do YouTube e pode precisar de ajustes quando a página mudar.
