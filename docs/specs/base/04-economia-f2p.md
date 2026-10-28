# Arquitetura Econômica, Retenção Integrada e Estratégia de Go-To-Market a Custo Zero para Jogos Competitivos Hybrid-Casual

## 1. Arquitetura de Retenção e Ciclos de Engajamento (D1, D7, D30)

A sustentabilidade financeira e operacional de um jogo competitivo *hybrid-casual* no segmento de jogos de tabuleiro reside na capacidade de converter partidas assíncronas de curta duração em hábitos diários consolidados. Enquanto a retenção de primeiro dia (D1) atua como o indicador primário de clareza do *Core Loop* e atratividade da mecânica principal, as métricas de sétimo (D7) e trigésimo dia (D30) mensuram a eficiência do *Meta Loop* na mitigação da fadiga e no acúmulo de capital social e psicológico por parte do jogador.

### Articulação entre Core Loop e Meta Loop
O *Core Loop* é projetado para sessões rápidas com duração média de 3 minutos, promovendo decisões táticas contínuas, feedback visual imediato e uma resolução conclusiva por partida. A transição e a conexão desse ciclo fundamental com o *Meta Loop* ocorrem por meio da conversão do desempenho individual em progresso acumulável em múltiplos horizontes temporais.

No curto prazo de uma única sessão de jogo, a conclusão de uma partida concede Moeda Suave (*Ouro*), proporcional ao resultado da partida, juntamente com Pontos de Experiência (XP) e ajustes na pontuação de habilidade (MMR ou Troféus). Essa recompensa imediata valida o esforço do jogador e encerra o ciclo de ação-recompensa imediato.

No médio prazo do ciclo diário, a atividade nas partidas alimenta o progresso das Missões Diárias e viabiliza a participação no Desafio Diário de *Seed* Global. O engajamento diário contínuo protege a Ofensiva Diária (*Daily Streak*), transformando o hábito em uma rotina previsível de consumo do aplicativo.

No longo prazo dos ciclos semanal e mensal, a pontuação acumulada determina a posição do jogador dentro de uma divisão restrita de Liga Semanal composta por 30 participantes. Paralelamente, o acúmulo contínuo de XP avança a progressão nos patamares do Passe de Temporada de 30 dias, garantindo que mesmo sessões com alta taxa de derrota contribuam para a percepção de avanço sistêmico.

### Engenharia Comportamental e Mecânicas de Hábito
Para sustentar altos índices de retenção sem recorrer a custos operacionais de aquisição ou notificações intrusivas, adota-se um ecossistema de mecânicas comportamentais alinhado às diretrizes de aprendizado e retenção do modelo Duolingo.

O Sistema de Ofensiva Diária (*Daily Streak*) estabelece um contrato comportamental com o usuário. Ao concluir uma partida ou resolver o desafio diário, o registro da sequência é incrementado. O valor acumulado da sequência cria uma âncora psicológica em que o custo percebido de abandonar o jogo escala exponencialmente a cada dia consecutivo registrado, alavancando o princípio comportamental da aversão à perda.

Para evitar que a quebra involuntária de uma sequência resulte no abandono definitivo do aplicativo (*churn* catastrófico), introduz-se a mecânica de Congelamento de Ofensiva (*Streak Freeze*). Este item funciona como um escudo preventivo, podendo ser adquirido por meio da Moeda Suave ou conquistado em marcos intermediários do Passe de Temporada. A existência do congelamento cria um ralo econômico recorrente e reduz a ansiedade do usuário sem diminuir o valor percebido da ofensiva.

O Desafio Diário com *Seed* Global baseia-se na geração determinística de um tabuleiro ou enigma tático derivado do carimbo de data UTC. Todos os jogadores mundialmente enfrentam rigorosamente a mesma configuração espacial e tática no mesmo dia. Essa padronização viabiliza a criação de tabelas de classificação estritamente equitativas e estimula o compartilhamento orgânico de soluções em comunidades virtuais e redes sociais, eliminando a necessidade de infraestrutura de servidor para pareamento (*matchmaking*) síncrono nesse modo específico.

As Ligas Semanais de Promoção e Rebaixamento organizam a base de usuários em grupos competitivos fechados de 30 jogadores, redefinidos a cada ciclo de sete dias. Ao contrário de *rankings* globais compostos por milhões de participantes — que geram desestimulo pela sensação de inatingibilidade —, o grupo de 30 participantes garante um ambiente competitivo palpável. Os cinco primeiros colocados sobem para divisões superiores, os vinte intermediários mantêm-se na divisão atual, e os cinco últimos são rebaixados, criando uma dinâmica de flutuação semanal que renova o engajamento na proximidade do fechamento da rodada.

### Mapeamento Estrutural do Compulsion Loop

| Horizonte Temporal | Gatilho (*Trigger*) | Ação do Jogador (*Action*) | Recompensa Variável (*Variable Reward*) | Investimento do Jogador (*Investment*) |
| :--- | :--- | :--- | :--- | :--- |
| **Sessão (3 min)** | Tempo ocioso ou notificação de turno pendente. | Execução de partida rápida de 3 minutos. | Vitória tática, variação de Troféus e ganho estocástico de Ouro. | Alocação de tempo e evolução no algoritmo de pareamento (MMR). |
| **Diário (24 h)** | Renovação da *Seed* Global no horário UTC. | Resolução do Desafio Diário e conclusão das missões. | Incremento na Ofensiva Diária e baú de cosméticos procedurais. | Consumo de Ouro na aquisição prévia de *Streak Freeze*. |
| **Semanal (7 d)** | Proximidade do encerramento da Liga Semanal. | Participação em partidas ranqueadas para atingir o Top 5. | Promoção de Divisão, molduras procedurais exclusivas e Gemas. | Consolidação do status social perante o grupo de 30 jogadores. |

---

## 2. Modelagem Econômica F2P Ética: Fontes, Ralos e Cosméticos Procedurais

A sustentabilidade do modelo econômico repousa sobre a ética *Fair-to-Play* (F2P Ético), na qual todo o conteúdo comercializado consiste exclusivamente em itens cosméticos e conveniências de qualidade de vida. Elimina-se rigorosamente qualquer mecânica que altere atributos competitivos, alinhando a monetização à expressão de identidade e à validação de status dentro do ecossistema do jogo.

### Formulação Matemática da Economia Interna
A arquitetura monetária opera sob um sistema de duas moedas. A Moeda Suave (*Ouro*) é obtida organicamente por meio do desempenho em partidas e cumprimento de objetivos, enquanto a Moeda Premium (*Gemas*) possui circulação restrita, sendo concedida em quantidades limitadas na trilha gratuita do Passe de Temporada ou adquirida via compras diretas em plataformas digitais [cite: 1, 2].

A taxa de geração diária esperada de Moeda Suave ($G_{\text{diário}}$) para um jogador com padrão de engajamento mediano (três partidas diárias, taxa de vitória de 50% e cumprimento das missões) é calculada pela seguinte formulação:

$$G_{\text{diário}} = \left(N_{\text{partidas}} \cdot \left[P_{\text{vitória}} \cdot V + (1 - P_{\text{vitória}}) \cdot D\right]\right) + Q_{\text{diária}} + S_{\text{global}}$$

Onde as variáveis são parametrizadas da seguinte forma:
*   $N_{\text{partidas}} = 3$ representa o volume médio de partidas diárias por jogador ativo.
*   $P_{\text{vitória}} = 0,50$ indica a taxa de vitória esperada mantida pelo sistema de *matchmaking*.
*   $V = 20$ Ouro constitui a recompensa base atribuída a uma vitória.
*   $D = 5$ Ouro constitui a recompensa base atribuída a uma derrota.
*   $Q_{\text{diária}} = 100$ Ouro equivale ao somatório obtido pela conclusão do conjunto de Missões Diárias.
*   $S_{\text{global}} = 150$ Ouro corresponde à recompensa atribuída pela resolução bem-sucedida do Desafio Diário de *Seed* Global.

Substituindo os parâmetros na equação, obtém-se o fluxo de entrada médio:

$$G_{\text{diário}} = (3 \cdot [0,5 \cdot 20 + 0,5 \cdot 5]) + 100 + 150 = 287,5\text{ Ouro/dia}$$

Para neutralizar a inflação monetária e manter a utilidade contínua da Moeda Suave, a precificação dos ralos de consumo é desenhada para absorver a renda gerada, exigindo escolhas conscientes de alocação por parte do usuário.

### Tabela Estrutural de Balanceamento Econômico

| Categoria do Item | Denominação do Item | Tipo de Moeda | Preço Unitário | Renda Diária Média (Jogador Ativo) | Esforço Exigido (Dias de Engajamento) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Utilitário** | Congelamento de Ofensiva (*Streak Freeze*) | Suave (Ouro) | 300 Ouro | 287,5 Ouro/dia | 1,04 Dias |
| **Cosmético Básico** | Skin de Peça / Símbolo Vectorial SVG | Suave (Ouro) | 1.500 Ouro | 287,5 Ouro/dia | 5,21 Dias |
| **Cosmético Intermediário** | Tabuleiro Procedural em Shader Radial | Suave (Ouro) | 4.000 Ouro | 287,5 Ouro/dia | 13,91 Dias |
| **Cosmético Avançado** | Efeito de Quadrante (Partículas GPU) | Suave (Ouro) | 8.500 Ouro | 287,5 Ouro/dia | 29,56 Dias |
| **Cosmético Premium** | Shader de Tabuleiro Holográfico Sci-Fi | Premium (Gemas) | 250 Gemas | 2,5 Gemas/dia (Trilha Grátis do Passe) | 100,00 Dias (ou IAP Direto) |
| **Passe de Temporada** | Acesso ao Passe Premium (30 Dias) | Premium (Gemas) | 500 Gemas | N/A | Transação IAP ($4,99) ou Acúmulo |

### Catálogo de Cosméticos Procedurais sem Custo de Produção Artística
A eliminação de custos com produção de arte externa é viabilizada pela construção de um catálogo cosmético gerado puramente por código em tempo de execução, utilizando tecnologias nativas como WebGL Fragment Shaders, manipulação vetorial em SVG e estilização via CSS3 avançado [cite: 3].

A geração de Tabuleiros Procedurais ocorre por meio de compiladores GLSL (*OpenGL Shading Language*) executados diretamente na GPU do cliente. O padrão *Grid Tron Neon* calcula linhas de grade dinâmicas via equações de distância euclidiana, alternando a frequência e a intensidade de emissão de cor conforme o histórico de jogadas na partida. De modo análogo, o padrão *Voronoi Dinâmico* emprega algoritmos de decomposição espacial por código para simular superfícies de mármore ou formações orgânicas, alterando os vetores da superfície a cada nova partida a partir de um valor de *seed* numérico.

A customização de Peças e Símbolos é realizada via renderização vetorial descritiva em SVG. A aplicação das propriedades `stroke-dasharray` e `stroke-dashoffset` animadas por código CSS permite que as peças sejam desenhadas na tela de forma gradual e fluida no instante exato da jogada. O acabamento estético é enriquecido por filtros SVG integrados com primitivas de iluminação especular (`feSpecularLighting`) e ruído de turbulência (`feTurbulence`), conferindo aspectos visuais metálicos, cromados ou de vidro fosco sem a necessidade de carregar arquivos de imagem bitmap de alta densidade.

Os Efeitos de Conquista de Quadrante utilizam sistemas de partículas leves controlados por código JavaScript e WebGL. O efeito de *Explosão de Vórtice* emite partículas radiais com atrito e aceleração calculados matematicamente ao validar uma vitória em determinado setor do tabuleiro. Complementarmente, o efeito de *Onda de Choque de Distorção* aplica um shader de pós-processamento de refração esférica temporária sobre a malha do tabuleiro, gerando um impacto visual de alta fidelidade sem comprometer o consumo de memória do dispositivo.

A customização do perfil social do jogador inclui Títulos e Emotes Procedurais. Os títulos exibidos nos *leaderboards* utilizam recortes de gradiente em CSS (`background-clip: text`) combinados com rotações contínuas de matiz, atribuindo brilho dinâmico a conquistas avançadas (como "Estrategista Cósmico"). Os emotes de reação rápida consistem em uma composição de símbolos Unicode e elementos SVG leves animados via regras CSS `@keyframes`, oferecendo um canal expressivo durante a partida sem exigir o desenvolvimento de animações tradicionais quadro a quadro.

---

## 3. Estratégia de Anúncios (Ad Tech) e IAP (In-App Purchases)

A monetização em jogos competitivos *hybrid-casual* exige a articulação harmônica entre publicidade programática e compras integradas. O objetivo é assegurar que a exibição de anúncios não deteriore as taxas de retenção e sirva como uma rampa de conversão para o consumo de produtos dentro do aplicativo.

### Implementação Estratégica de Anúncios em Vídeo Recompensados
Os anúncios em vídeo recompensados (*Rewarded Video Ads*) representam a principal fonte de eCPM em jogos casuais e aplicações web por serem ativados voluntariamente pelo usuário em troca de benefícios claros e imediatos no jogo [cite: 1, 4].

Para maximizar o valor de vida útil do cliente (LTV) sem provocar o abandono do aplicativo, os pontos de contato para exibição de anúncios recompensados são alocados estrategicamente em momentos de alta satisfação ou de amortecimento de frustração:

O Multiplicador de Recompensa de Partida surge na tela de encerramento de uma partida vitoriosa, permitindo que o jogador assista a um vídeo de 30 segundos para dobrar os ganhos em Moeda Suave gerados naquele confronto.

A Segunda Chance no Desafio Global é disponibilizada exclusivamente quando o jogador falha na primeira tentativa de resolução do Desafio Diário de *Seed* Global, permitindo uma nova tentativa imediata para resguardar a manutenção da sua Ofensiva Diária.

A Concessão de Desconto Temporário na Loja possibilita a redução voluntária do custo em Moeda Suave de determinado cosmético procedural mediante a visualização de um anúncio em vídeo.

A integração de publicidade nos portais web e plataformas parceiras exige conformidade estrita com os requisitos técnicos impostos pelas redes de distribuição, como Poki e CrazyGames [cite: 1, 4]:

O botão de ação primária sem recompensa (ex.: "Coletar Recompensa Padrão") deve permanecer visível e acessível em posição prioritária, garantindo que o usuário nunca se sinta forçado a consumir publicidade para prosseguir [cite: 1, 4].

É vetada a inclusão de chamadas publicitárias em transições de menus de navegação ou durante o estado ativo de jogo, limitando os anúncios exclusivamente a pausas naturais da experiência [cite: 4].

Todos os elementos interativos associados a anúncios devem adotar o ícone padrão da indústria (símbolo de reprodução/vídeo) e apresentar estado de carregamento assíncrono transparente para evitar cliques acidentais [cite: 1, 4].

### Arquitetura do Passe de Temporada e Pacote de Boas-Vindas
A estrutura de compras diretas no aplicativo é dividida entre um modelo de receita recorrente de baixo valor e uma oferta única de alta conversão.

O Passe de Temporada possui ciclo de renovação fixo em 30 dias e divide-se em duas trilhas paralelas de progressão por experiência:

A Trilha Gratuita disponibiliza quantias moderadas de Moeda Suave, um item de Congelamento de Ofensiva e pequenas frações de Moeda Premium distribuídas ao longo de 30 patamares, assegurando que a base total de usuários permaneça engajada no ecossistema competitivo.

A Trilha Premium, precificada no patamar de $4,99 (ou equivalente em Moeda Premium acumulada), libera recompensas multiplicadas em Ouro, o dobro de itens utilitários e cosméticos procedurais temáticos e exclusivos daquela temporada, além de conceder um espaço adicional permanente no inventário de congelamento de ofensivas.

O Pacote Fundador (Oferta "Sem Anúncios") consiste em uma transação única de valor fixo ($2,99 a $9,99 dependendo do mercado de distribuição), desenhada para converter usuários engajados no início do seu ciclo de vida. A oferta remove permanentemente todos os anúncios intersticiais não voluntários da aplicação, mantendo os vídeos recompensados como escolha opcional do jogador. Adicionalmente, concede um montante inicial de Moeda Premium, acesso ao título procedural exclusivo "Fundador" em texto reluzente e um slot adicional de congelamento de ofensiva.

---

## 4. Distribuição Orgânica e Monetização Web Imediata (Custo Zero)

A submissão direta de um novo título competitivo às lojas de aplicativos nativas (Google Play e Apple App Store) sem orçamento alocado para aquisição paga de usuários frequentemente resulta em invisibilidade algorítmica. A estratégia de custo zero baseia-se na validação prévia de métricas, geração imediata de caixa e construção comunitária através de portais de jogos HTML5 e da plataforma Discord, utilizando esses canais como alavanca de distribuição inicial.

### Estudo Comparativo de Plataformas de Distribuição Web e Discord

| Atributo de Avaliação | Poki | CrazyGames | Discord Activities (Embedded App SDK) |
| :--- | :--- | :--- | :--- |
| **Modelo Contratual e Termos de Licenciamento** | Exclusividade restrita ao ambiente Web aberto (3 a 5 anos) [cite: 5, 6]. Mantém liberdade para App Stores e Steam [cite: 5, 7, 8]. | Licenciamento não exclusivo por padrão. Processo de aprovação em dois estágios (*Basic* e *Full Launch*) [cite: 4, 8, 9]. | Não exclusivo. Acesso ao diretório e ecossistema de servidores do Discord [cite: 10, 11]. |
| **Divisão de Receitas (*Revenue Share*)** | 50/50 em tráfego originado pelo portal; 100% para o desenvolvedor em tráfego direto de comunidade [cite: 7]. | Repasse dinâmico baseado em impressões de anúncios do SDK após aprovação no *Full Launch* [cite: 8, 9]. | Receita de anúncios/IAP via Discord SDK; o desenvolvedor retém a maior parte da receita do SKU [cite: 10, 12]. |
| **Requisitos Técnicos e de Aprovação** | Processo de curadoria seletiva [cite: 7, 8]. Carregamento <10s [cite: 8]. Silenciamento de áudio em anúncios [cite: 8]. Economia simplificada [cite: 1]. | Pacote inicial <50 MB (<20 MB para mobile) [cite: 8]. Período de avaliação de 7 a 21 dias sem monetização [cite: 4, 8, 9]. | Execução em `iframe` [cite: 11, 13]. Mapeamento obrigatório de URLs via Proxy [cite: 14, 15]. Suporte a *safe areas* CSS móveis [cite: 11]. |
| **Mecanismos Monetários Suportados** | Anúncios Intersticiais e Recompensados via Poki SDK [cite: 1]. | Anúncios (SDK) [cite: 2, 4] e Compras In-App via integração Xsolla para títulos selecionados [cite: 2]. | Compras In-App nativas (SKUs de consumo, assinatura e compra única) via Embedded App SDK [cite: 10, 12]. |
| **Diferencial de Distribuição** | Escala global (100M+ usuários) com suporte direto de marketing e QA do portal [cite: 5, 7]. | Validação rápida de métricas e altos valores de eCPM em países de alta renda (Tier-1) [cite: 16]. | Viralidade multiplayer orgânica em canais de voz com entrada direta via convites [cite: 10, 16]. |

### Requisitos Técnicos e Integração no Discord Activities
A publicação de um jogo como uma *Discord Activity* requer a utilização do ecossistema `@discord/embedded-app-sdk`, operando a aplicação web dentro de uma estrutura enquadrada em `iframe` sob o domínio `discordsays.com` [cite: 10, 13, 17].

A comunicação com servidores externos deve obrigatoriamente utilizar o recurso de Mapeamento de URLs (*URL Mappings*) no painel do desenvolvedor. Esse mecanismo redireciona requisições feitas a caminhos relativos (como `/api`) através do proxy do Discord para o domínio real da aplicação, preservando o anonimato de IP dos usuários e mitigando riscos de segurança [cite: 14, 15].

Em termos de interface móvel, a aplicação deve se adaptar dinamicamente às áreas de corte de tela (*safe areas*) e estados térmicos dos dispositivos móveis iOS e Android, consumindo as variáveis CSS disponibilizadas pelo cliente e reduzindo a complexidade gráfica caso a temperatura do hardware atinja níveis críticos [cite: 11].

### Roteiro Estratégico de Distribuição Orgânica em Três Estágios

#### Estágio 1: Validação, Validação de Métricas e Geração de Caixa Web (Meses 1 a 3)
O desenvolvimento inicial é executado em HTML5/WebGL utilizando motores otimizados para a web (como Godot exportado em *single-threaded* ou bibliotecas leves em JavaScript), visando um pacote de inicialização reduzido e carregamento inicial em menos de 10 segundos em conexões moderadas [cite: 8].

A submissão inicial é direcionada ao portal CrazyGames na fase de *Basic Launch*, operando durante um período de 7 a 21 dias sem monetização ativa para coletar dados reais de engajamento, retenção e progressão através de ferramentas analíticas integradas [cite: 2, 4, 8, 9].

Atingidas as métricas de validação (retenção D1 superior a 40% e D7 superior a 15%), solicita-se a transição para o *Full Launch* no CrazyGames para iniciar a monetização via publicidade [cite: 8, 9]. Simultaneamente, submete-se a aplicação ao processo de curadoria do Poki e faz-se a integração com o *Discord Embedded App SDK* para habilitar a distribuição em canais de voz [cite: 7, 10, 13].

A receita acumulada com a partilha de publicidade web e vendas no Discord é direcionada para custear a abertura das contas oficiais de desenvolvedor nas plataformas nativas (taxa única da Google Play, anuidade da Apple e taxa de submissão do Steam Direct).

#### Estágio 2: Soft Launch Móvel e Otimização Orgânica na Google Play (Meses 4 a 6)
A base de código HTML5 validada é convertida em um formato nativo Android (*Android App Bundle*), utilizando tecnologias de envelopamento otimizadas.

A tração inicial de downloads na loja da Google é gerada organicamente via direcionamento da base de usuários web e membros de servidores do Discord. Oferece-se uma recompensa em Moeda Suave para usuários que realizarem a vinculação de suas contas na versão mobile, impulsionando a contagem primária de instalações e avaliações positivas sem custos de marketing pago.

A otimização para motores de busca da loja (*App Store Optimization* - ASO) é executada por meio de testes A/B contínuos na iconografia, capturas de tela demonstrando partidas dinâmicas e inclusão estratégica de palavras-chave focadas em termos de cauda longa relacionados a jogos de tabuleiro e desafios táticos diários.

#### Estágio 3: Lançamento Global Multiplataforma no iOS e Steam (Meses 7 a 9)
Com os sistemas estabilizados no ecossistema Android, efetua-se a submissão do aplicativo na Apple App Store, assegurando conformidade com os requisitos de privacidade e transparência de rastreamento do iOS.

Em paralelo, a aplicação é empacotada para distribuição no Steam Direct para sistemas operacionais de desktop. O público do Steam é aproveitado para impulsionar a conversão de vendas do Pacote Fundador e do Passe de Temporada, alavancando jogadores de perfil competitivo avançado.

A arquitetura do sistema backend assegura o progresso cruzado (*cross-progression*) e a continuidade de partidas (*cross-play*) entre as plataformas Web, Discord, Android, iOS e PC. O usuário pode iniciar o Desafio Diário no navegador durante o dia, disputar partidas com amigos no Discord à noite e manter sua Ofensiva Diária atualizada através do dispositivo móvel em qualquer ambiente.

---

## 5. Conclusões e Recomendações Estratégicas

A análise estrutural desta arquitetura demonstra que é viável conceber, validar e monetizar um jogo competitivo *hybrid-casual* sem investimento inicial em tráfego pago. A independência de capital inicial é alcançada pela substituição da aquisição paga por uma distribuição em etapas via portais web e pelo uso de incentivos comportamentais de retenção.

A aplicação do Modelo Duolingo no design do jogo assegura retenção de longo prazo. A combinação do Desafio Diário de *Seed* Global com as Ligas Semanais de 30 jogadores cria compromissos rotineiros baseados em comparação social de baixa pressão e aversão à perda, reduzindo as taxas de evasão voluntária sem exigir a publicação frequente de novos pacotes de conteúdo.

A economia interna atinge equilíbrio ao utilizar cosméticos gerados puramente por código. O uso de shaders GLSL, estilizações vetoriais em SVG e sistemas de partículas em tempo de execução elimina os custos fixos de produção artística e possibilita a construção de uma tabela econômica sustentável, na qual a Moeda Suave atua como ralo de engajamento diário e a Moeda Premium monetiza a expressão estética e o status social [cite: 3].

A estratégia de distribuição em três estágios reduz o risco financeiro do projeto. Ao utilizar os portais Web abertos e o ecossistema do Discord para validar as métricas de retenção e acumular capital através da divisão de receitas publicitárias, a transição para as lojas nativas móveis e de PC ocorre de maneira autofinanciada e com uma base inicial de usuários já consolidada [cite: 4, 5, 10]. Recomendam-se a estrita observância às diretrizes técnicas de integração das plataformas parceiras e o foco permanente na experiência *Fair-to-Play* como pilares para a rentabilidade contínua do aplicativo [cite: 1, 4].

---

1. Monetization tips | Poki Documentation, [https://developers.poki.com/guide/monetization](https://developers.poki.com/guide/monetization)
2. Introduction - CrazyGames Documentation, [https://docs.crazygames.com/requirements/intro/](https://docs.crazygames.com/requirements/intro/)
3. Comic Procedural Shader - Adriano D'Elia - Gumroad, [https://adriano-delia.gumroad.com/l/GACvV](https://adriano-delia.gumroad.com/l/GACvV)
4. Advertisement requirements - CrazyGames Documentation, [https://docs.crazygames.com/requirements/ads/](https://docs.crazygames.com/requirements/ads/)
5. How we partner with you | Poki Documentation, [https://developers.poki.com/guide/revenue-deal-types](https://developers.poki.com/guide/revenue-deal-types)
6. poki contract: you have to publish 3y with them only + give them 50% revenue - Reddit, [https://www.reddit.com/r/gamemaker/comments/1hppdoi/poki_contract_you_have_to_publish_3y_with_them/](https://www.reddit.com/r/gamemaker/comments/1hppdoi/poki_contract_you_have_to_publish_3y_with_them/)
7. Working with Poki | Poki Documentation, [https://developers.poki.com/guide/working-with-poki](https://developers.poki.com/guide/working-with-poki)
8. Where to Publish HTML5 Games | Portal Size Rules and Setup - Summer Engine, [https://www.summerengine.com/make-great-games/publish-an-html5-game](https://www.summerengine.com/make-great-games/publish-an-html5-game)
9. CrazyGames Documentation, [https://docs.crazygames.com/](https://docs.crazygames.com/)
10. User Actions - Documentation - Discord Developer Portal, [https://docs.discord.com/developers/activities/development-guides/user-actions](https://docs.discord.com/developers/activities/development-guides/user-actions)
11. Mobile - Documentation - Discord Developer Platform, [https://docs.discord.com/developers/activities/development-guides/mobile](https://docs.discord.com/developers/activities/development-guides/mobile)
12. Implementing In-App Purchases for Activities - Documentation - Discord Developer Portal, [https://docs.discord.com/developers/monetization/implementing-iap-for-activities](https://docs.discord.com/developers/monetization/implementing-iap-for-activities)
13. How Activities Work - Documentation - Discord Developer Portal, [https://docs.discord.com/developers/activities/how-activities-work](https://docs.discord.com/developers/activities/how-activities-work)
14. Local Development - Documentation - Discord, [https://docs.discord.com/developers/activities/development-guides/local-development](https://docs.discord.com/developers/activities/development-guides/local-development)
15. Networking - Documentation - Discord Developer Portal, [https://docs.discord.com/developers/activities/development-guides/networking](https://docs.discord.com/developers/activities/development-guides/networking)
16. CrazyGames Developer Portal | Publish Unity and HTML5 web games and earn revenue, [https://developer.crazygames.com/](https://developer.crazygames.com/)
17. Multiplayer Experience - Documentation - Discord Developer Portal, [https://docs.discord.com/developers/activities/development-guides/multiplayer-experience](https://docs.discord.com/developers/activities/development-guides/multiplayer-experience)
