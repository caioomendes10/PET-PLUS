# PET+ — HTML, CSS e JavaScript

Reprodução das telas observadas em https://pet-plus-link.base44.app/ em 22/10/2026.
A conta usada para a inspeção não tinha pets, perfil, histórico ou pedidos cadastrados.
O pacote inicia com os dados em branco, como nessa conta. Nenhuma credencial ou dado
pessoal da conta usada para a inspeção foi incluído nos arquivos.

## Abrir

1. Extraia o ZIP e mantenha os arquivos e a pasta `assets` juntos.
2. Abra a pasta em um servidor estático, por exemplo com a extensão Live Server do VS Code.
3. Outra opção, se tiver Python instalado: execute `python -m http.server 8080` na pasta extraída.
4. Acesse `http://localhost:8080/index.html` para a tela de login ou `http://localhost:8080/inicio.html` para entrar diretamente na interface.

Os arquivos HTML também contêm o conteúdo inicial completo das telas. Um servidor
local é recomendado para navegação, persistência e recursos que dependem do navegador.

## Arquivos

- `index.html` e `login.html`: entrada.
- `inicio.html`: painel inicial.
- `meu-pet.html`: pets e cadastro.
- `saude.html`: histórico de saúde.
- `medicamentos.html`: medicamentos e registro de doses.
- `agenda.html`: calendário e eventos.
- `gps.html`: mapa e cadastro de coleiras.
- `ia.html`: tela da NINA.
- `ajuda.html`: perguntas frequentes e chamados locais.
- `shop.html`: catálogo e carrinho demonstrativo.
- `responsavel.html`: perfil e contatos.
- `configuracoes.html`: configurações.
- `sos.html`: emergência.
- `register.html`, `forgot-password.html`, `reset-password.html`: interfaces de conta.
- `styles.css`: cores, dimensões, fontes declaradas, componentes e regras responsivas.
- `interface.js`: conteúdo das telas, componentes visuais e lógica dos registros locais.
- `runtime.js`: manipulação do DOM, eventos, navegação e estado, sem React ou SDK Base44.
- `app.js`: rotas e inicialização.
- `assets`: imagens locais e a biblioteca Leaflet 1.9.4 (mapas).

Não é necessário Node, npm, React, compilação ou conta no Base44 para executar o pacote.
A interface ativa é produzida pelos componentes de `interface.js`; altere esses
componentes ao mudar conteúdo que deve continuar aparecendo após a navegação.
Os HTMLs contêm também a versão estática inicial de cada tela.

## Funcionamento e limites

Os registros de pets, perfil, medicamentos, doses, saúde, agenda, coleiras, chamados,
carrinho e preferências ficam no armazenamento local do navegador. Os dados de teste
usados na validação não fazem parte deste pacote. O checkout é demonstrativo e não cobra.

O login reproduz a interface e permite navegação demonstrativa; não autentica usuários.
Senhas digitadas na demonstração não são salvas nem transmitidas. O cadastro, login
Google, recuperação de senha e verificação de e-mail exigem implementação de backend,
OAuth e envio de e-mails próprios. As páginas internas não têm controle de acesso real.

A NINA tem a interface e os atalhos originais, mas as respostas online exigem uma função
ou API própria: o código não usa a função privada do Base44. Sem essa integração,
mostra a resposta de indisponibilidade de conexão prevista na interface original.

O mapa usa Leaflet e os mapas públicos OpenStreetMap; precisa de internet. A posição do
navegador depende de permissão do usuário e de HTTPS ou localhost. Cadastrar uma coleira
não cria rastreamento GPS real. Os serviços de mapas e busca de locais mantêm suas próprias
condições de acesso. O envio de informações de emergência usa as opções do navegador ou
aplicativo do usuário; não foi acionado durante a validação.

## Fidelidade

Foram mantidos os textos, categorias, 24 produtos, imagens, preços demonstrativos,
cores, espaçamentos, formulários, menus e recursos de acessibilidade disponíveis nas
páginas observadas. O comportamento visual das páginas sem cadastro, inclusive campos
vazios e idade “NaN” apresentados pelo original, foi preservado.

As animações de entrada e saída do mecanismo do Base44 não foram transportadas;
hover, transições CSS e a pulsação do SOS foram mantidos. A biblioteca de mapas é a
Leaflet pública. O conteúdo e o código são independentes da conta Base44 original.

## Validação realizada

Comparação visual das telas de login, início e mapa no navegador de desktop;
cadastro de pet, persistência após recarregar, evento de agenda, adição ao carrinho,
leitura de total e ativação/desativação de acessibilidade. Conferência dos HTMLs,
referências a arquivos locais e sintaxe JavaScript. Não foram testados envio de emergência,
chamadas telefônicas, pagamentos ou autenticação externa.
