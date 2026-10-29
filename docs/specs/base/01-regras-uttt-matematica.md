# Especificação Formal e Matemática do Ultimate Tic-Tac-Toe (Super Jogo da Velha)

**Documento Técnico de Regras e Arquitetura de Jogo para Competição Determinística**  
*Autor: Especialista em Game Design e Matemática Computacional*

---

## 1. Topologia, Geometria do Tabuleiro e Notação Oficial

O **Ultimate Tic-Tac-Toe** (conhecido em português como *Super Jogo da Velha* ou *Jogo da Velha²*) é uma extensão fractal, combinatória e hierárquica do jogo da velha tradicional [1, 2]. Trata-se de um jogo de estratégia abstrata para dois jogadores, de informação perfeita, determinístico e de soma zero [2, 3].

### 1.1 Formulação Matemática do Espaço do Jogo
O espaço do tabuleiro $G$ é formalmente definido como o produto cartesiano de dois subespaços bidimensionais finitos de ordem $3 \times 3$:

$$G = M \times m$$

Onde:
* $M = \{(R, C) \mid R, C \in \{1, 2, 3\}\}$ representa o conjunto de coordenadas do **Macro-Tabuleiro** (ou Meta-Tabuleiro).
* $m = \{(r, c) \mid r, c \in \{1, 2, 3\}\}$ representa o conjunto de coordenadas do **Micro-Tabuleiro** (ou Tabuleiro Local).

A cardinalidade total de células discretas no tabuleiro é dada por:

$$|G| = |M| \times |m| = 9 \times 9 = 81 \text{ células}$$

A dinâmica fundamental de direcionamento obriga que a escolha da micro-célula $m_t = (r, c)$ realizada no turno $t$ determine de forma biunívoca a coordenada do Macro-Tabuleiro ativo $M_{t+1}$ no qual o oponente deve atuar no turno $t+1$:

$$M_{t+1} = (r, c)$$

Se $M_{t+1}$ corresponder a um micro-tabuleiro cujo estado já esteja resolvido (vencido por $X$, por $O$ ou empatado), a restrição topológica é suspensa [5, 6]. O jogador no turno $t+1$ recebe o estado de **Jogada Livre (*Free Move*)**, podendo escolher qualquer célula desocupada em qualquer micro-tabuleiro ativo [5, 6].

### 1.2 Notação Algébrica Dual (DAN) e Coordenadas Globais
Para garantir a rastreabilidade em engines de jogo, armazenamento de replays e intercâmbio de partidas sem ambiguidades, adota-se a **Notação Algébrica Dual (Dual Algebraic Notation - DAN)** [1].

* **Macro-Tabuleiro ($M$):** Colunas representadas por letras maiúsculas ($A, B, C$) e linhas por números ($1, 2, 3$).
* **Micro-Tabuleiro ($m$):** Colunas representadas por letras minúsculas ($a, b, c$) e linhas por números ($1, 2, 3$).
* **Identificação de Célula:** Formato `[Macro].[micro]` (ex.: `B2.b2` indica a célula central do micro-tabuleiro central; `A1.c3` representa a célula inferior direita do micro-tabuleiro superior esquerdo).

Para indexação vetorial e otimização de matrizes em sistemas computacionais, o espaço $M \times m$ projeta-se em uma grade cartesiana unificada de $9 \times 9$, parametrizada por linhas globais $\rho \in \{1, \dots, 9\}$ e colunas globais $\gamma \in \{A, \dots, I\}$:

$$\rho = 3 \cdot (R - 1) + r, \quad \gamma = 3 \cdot (C - 1) + c$$

$$R = \left\lfloor \frac{\rho - 1}{3} \right\rfloor + 1, \quad r = ((\rho - 1) \bmod 3) + 1$$

$$C = \left\lfloor \frac{\gamma - 1}{3} \right\rfloor + 1, \quad c = ((\gamma - 1) \bmod 3) + 1$$

#### Tabela de Mapeamento de Coordenadas
| Coordenada Macro ($M$) | Coordenada Micro ($m$) | Notação Algébrica Dual (DAN) | Coordenada Global Unificada |
| :--- | :--- | :--- | :--- |
| $(1, 1)$ [Superior Esquerdo] | $(1, 1)$ [Superior Esquerdo] | `A1.a1` | `A1` |
| $(1, 1)$ [Superior Esquerdo] | $(3, 3)$ [Inferior Direito] | `A1.c3` | `C3` |
| $(2, 2)$ [Centro] | $(2, 2)$ [Centro] | `B2.b2` | `E5` |
| $(3, 1)$ [Inferior Esquerdo] | $(2, 3)$ [Centro Direito] | `A3.b3` | `C8` |
| $(3, 3)$ [Inferior Direito] | $(3, 3)$ [Inferior Direito] | `C3.c3` | `I9` |

---

## 2. Análise Teórica dos Jogos e Vantagem do Primeiro Jogador

### 2.1 Estado Matemático de Solução
A determinação sobre a solutibilidade do Ultimate Tic-Tac-Toe depende intrinsecamente do tratamento dado aos micro-tabuleiros encerrados:

1. **Variante sem Fechamento / Sem Free Move:** Denis Lohner e Joachim Breitner demonstraram que esta variante está **fracamente resolvida** com vitória forçada para o Jogador 1 ($X$) [7]. A estratégia vitoriosa consiste em abrir no centro (`B2.b2`) e reenviar o Jogador 2 ($O$) continuamente para o micro-tabuleiro central até obter dominância tática total [7].
2. **Variante Oficial Competitiva (Com Free Move):** O jogo **permanece não resolvido** [8]. A introdução da regra de *Free Move* quando um jogador é enviado a um quadrante já encerrado insere uma não-linearidade na árvore de jogo que inviabiliza estratégias determinísticas de espelhamento [8, 9]. Solvers modernos que utilizam *Proof-Number Search* (PN-DFPN), *Zobrist Hashing* e operações de *bitboards* conseguem resolver posições específicas com 20 profundidades (*plys*), mas a árvore completa permanece computacionalmente inatingível (estimada em centenas de milhões de horas de CPU) [8, 10, 11, 12, 13].

### 2.2 Complexidade de Estados e Fator de Ramificação
* **Espaço de Estados Brutos:** $3^{81} \approx 4,43 \times 10^{38}$ posições.
* **Espaço de Estados Válidos/Alcançáveis:** Filtrando alternância de turnos e condições de encerramento, estima-se em $10^{27}$ a $10^{30}$ posições [14, 15].
* **Fator de Ramificação ($b$):**
  * Turno 1 (Abertura): $b_1 = 81$.
  * Turno Restrito Normal: $1 \le b_t \le 9$ (média $\bar{b} \approx 8$).
  * Turno de Jogada Livre (*Free Move*): $1 \le b_t \le 72$ (média $\bar{b} \approx 45$).

#### Tabela Comparativa de Complexidade
| Métrica Teórica | Jogo da Velha Tradicional (3x3) | Ultimate Tic-Tac-Toe (81 Células) |
| :--- | :--- | :--- |
| **Espaço de Estados Alcançáveis** | $5,48 \times 10^3$ [4] | $\sim 10^{27} \text{ a } 10^{30}$ [14, 15] |
| **Tamanho da Árvore de Jogo** | $\sim 2,55 \times 10^5$ | $\sim 10^{80}$ |
| **Fator de Ramificação Médio ($\bar{b}$)** | $4$ | $8$ (Restrito) a $45$ (Livre) |
| **Status de Solução Teórica** | Fortemente Resolvido (Empate) [16, 17] | Não Resolvido (Variante Oficial) [8] |

### 2.3 Regras de Abertura para Equilíbrio Competitivo
Devido à vantagem de iniciativa inicial do Jogador 1 em controlar o micro-tabuleiro central $B2$, utilizam-se regulamentos de abertura em torneios ranqueados [18]:

* **Regra da Torta (*Pie Rule / Swap Rule*):** Após a primeira jogada de $X$ no turno $t=1$, o Jogador 2 ($O$) pode optar por:
  1. *Manter as Cores:* Aceita a jogada de $X$ e responde normalmente como $O$.
  2. *Trocar de Lado (Swap):* Assume o símbolo $X$ e a peça já jogada, forçando o Jogador 1 a assumir $O$ e realizar a segunda jogada [18].
* **Restrição Posicional de Abertura:** Proíbe o Jogador 1 de realizar a primeira jogada no micro-tabuleiro central $B2$ ou nas micro-células centrais $b2$ de qualquer quadrante.

---

## 3. Análise Formal de Casos de Borda e Resolução de Impasses

### 3.1 Impacto Estratégico do *Free Move* em Quadrantes Resolvidos
Quando um jogador é direcionado para um micro-tabuleiro que já atingiu estado terminal (`MICRO_WON_X`, `MICRO_WON_O` ou `MICRO_TIED`), ele ganha permissão para jogar em qualquer célula vaga do tabuleiro global [5, 6]. Conceder um *Free Move* ao oponente carrega um risco tático gravíssimo, elevando o fator de ramificação de $\sim 8$ para até $72$ e permitindo ataques diretos a quadrantes estratégicos [9]. Em nível avançado, desenvolve-se a habilidade de "gestão de sacrifício de quadrante" para controlar os direcionamentos e evitar conceder *Free Moves* em momentos críticos [3].

### 3.2 Tratamento de Micro-Tabuleiros Empatados ("Velha Local")
Quando todas as 9 células de um micro-tabuleiro são preenchidas sem que nenhum jogador forme uma trinca local, o impasse é resolvido segundo uma de três variantes:

1. **Variante A: Quadrante Neutro / Morto (Padrão Competitivo Recomendado):** O micro-tabuleiro é marcado como Neutro ($\emptyset$). Não concede ponto a nenhum jogador e bloqueia a formação de trincas no Macro-Tabuleiro através daquele quadrante [5, 12].
2. **Variante B: Quadrante Coringa Dual (*Wildcard*):** O quadrante conta simultaneamente como $X$ e $O$ para o fechamento de linhas no Macro-Tabuleiro.
3. **Variante C: Desempate por Contagem de Peças:** O quadrante é atribuído ao jogador que possui maioria simples ($5$ contra $4$) de células marcadas [3].

#### Tabela Comparativa de Variantes para Empates Locais
| Categoria de Análise | Variante A: Quadrante Neutro | Variante B: Coringa Dual | Variante C: Contagem de Peças |
| :--- | :--- | :--- | :--- |
| **Atribuição do Macro-Quadrante** | Marcado como Neutro ($\emptyset$) | Atribuído a $X$ e $O$ simultaneamente | Atribuído ao jogador com maioria (5v4) |
| **Impacto no Alinhamento Macro** | Bloqueia linhas e colunas transversais | Facilita vitórias prematuras | Mantém atribuição binária |
| **Taxa de Empates Globais** | Moderada | Extremamente Baixa | Baixa |
| **Profundidade Estratégica** | **Alta** (Adiciona valor tático ao bloqueio) | Baixa (Incentiva forçar empates) | Média (Foco em controle territorial) |

A **Variante A** é a recomendação oficial. A Variante B empobrece o jogo tático ao premiar fechamentos acidentais, enquanto a Variante C descaracteriza a mecânica tradicional de alinhamento [3].

### 3.3 Critérios de Desempate Global para Bloqueio de Macro-Tabuleiro (Macro Deadlock)
Ocorre um Bloqueio de Macro-Tabuleiro quando todos os 9 micro-tabuleiros estão resolvidos/encerrados e nenhum jogador conquistou uma trinca alinhada no Meta-Tabuleiro. Para garantir um resultado determinístico sem prorrogações, aplica-se a seguinte hierarquia de desempate:

1. **Métrica Primária (Contagem de Quadrantes):** Vence o jogador com maior número absoluto de micro-tabuleiros conquistados ($V_X$ vs. $V_O$).
2. **Métrica Secundária (Contagem de Células):** Caso $V_X = V_O$, vence o jogador com maior total de micro-células marcadas no tabuleiro global de 81 posições ($C_X$ vs. $C_O$).
3. **Métrica Terciária (Vantagem de Pretas / Armageddon):** Se $V_X = V_O$ e $C_X = C_O$, a vitória é concedida ao Jogador 2 ($O$) como compensação matemática pela vantagem de iniciativa do Jogador 1.

---

## 4. Parametrização de Controles de Tempo e Protocolo Anti-Stalling

O ritmo do jogo deve acomodar os picos de complexidade cognitiva entre turnos restritos (decisão rápida entre $\le 9$ casas) e turnos sob *Free Move* (decisão ampla em até $72$ casas) [5, 6].

### 4.1 Comparativo de Sistemas de Relógio
* **Fischer Increment ($t_{\text{base}} + \Delta t$):** Adiciona $\Delta t$ segundos após cada jogada concluída. Permite acumular tempo durante jogadas forçadas em quadrantes restritos e reservá-lo para momentos de *Free Move* [8, 15]. É o modelo ideal para Ultimate Tic-Tac-Toe.
* **Bronstein Delay ($t_{\text{base}} + \text{delay}$):** Concede uma pausa antes de consumir o tempo base. Não permite o acúmulo estratégico de tempo.
* **Tempo Fixo por Turno (Time per Turn):** Penaliza severamente os jogadores durante turnos de *Free Move*, gerando erros por pressão de tempo injustificada [14, 15].

#### Parametrização Oficial de Relógios
| Modo de Jogo | Tempo Base ($t_{\text{base}}$) | Incremento Fischer ($\Delta t$) | Duração Estimada | Perfil de Aplicação |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile Blitz Ranqueado** | $2 \text{ minutos } (120\text{s})$ | $+ 2 \text{ segundos}$ | $3 \text{ a } 5 \text{ minutos}$ | Dispositivos móveis, dinamismo elevado, combate ao *stalling* |
| **Mobile Rápido Padrão** | $3 \text{ minutos } (180\text{s})$ | $+ 3 \text{ segundos}$ | $5 \text{ a } 7 \text{ minutos}$ | Equilíbrio ideal entre precisão tática e fluidez |
| **Competitivo / Torneio** | $5 \text{ minutos } (300\text{s})$ | $+ 5 \text{ segundos}$ | $10 \text{ a } 12 \text{ minutos}$ | Partidas de alto nível e análise profunda |

---

## 5. Tabela de Estados Possíveis (Máquina de Estados Finitos - FSM)

A arquitetura lógica do jogo é governada por uma FSM hierárquica dividida nos quatro níveis estruturais do sistema:

| Nível | Identificador do Estado | Condição Lógica do Estado | Transições de Estado Possíveis |
| :--- | :--- | :--- | :--- |
| **Célula** | `CELL_EMPTY` | Célula sem marcação de nenhum jogador. | $\rightarrow$ `CELL_X`, `CELL_O` |
| **Célula** | `CELL_X` | Ocupada pelo símbolo do Jogador 1. | Estado Terminal de Célula |
| **Célula** | `CELL_O` | Ocupada pelo símbolo do Jogador 2. | Estado Terminal de Célula |
| **Micro** | `MICRO_ACTIVE` | Células marcadas $< 9$ e sem 3-em-linha de $X$ ou $O$. | $\rightarrow$ `MICRO_WON_X`, `MICRO_WON_O`, `MICRO_TIED` |
| **Micro** | `MICRO_WON_X` | Presença de 3 células `CELL_X` alinhadas localmente. | Estado Terminal de Micro-Tabuleiro |
| **Micro** | `MICRO_WON_O` | Presença de 3 células `CELL_O` alinhadas localmente. | Estado Terminal de Micro-Tabuleiro |
| **Micro** | `MICRO_TIED` | 9 células preenchidas sem alinhamento local. | Estado Terminal de Micro-Tabuleiro |
| **Macro** | `MACRO_IN_PROGRESS` | Sem 3 quadrantes alinhados e sem bloqueio total. | $\rightarrow$ `MACRO_WON_X`, `MACRO_WON_O`, `MACRO_DEADLOCK` |
| **Macro** | `MACRO_WON_X` | Presença de 3 quadrantes `MICRO_WON_X` alinhados em linha/coluna/diagonal. | Estado Terminal de Macro-Tabuleiro |
| **Macro** | `MACRO_WON_O` | Presença de 3 quadrantes `MICRO_WON_O` alinhados em linha/coluna/diagonal. | Estado Terminal de Macro-Tabuleiro |
| **Macro** | `MACRO_DEADLOCK` | Todos os 9 micro-tabuleiros encerrados sem alinhamento Macro. | Estado Terminal de Macro-Tabuleiro |
| **Partida**| `MATCH_PIE_PHASE` | Turno inicial ($t=1$). Jogador 2 possui opção de *Swap*. | $\rightarrow$ `MATCH_PLAYING` |
| **Partida**| `MATCH_PLAYING` | Alternância regular de turnos entre $X$ e $O$. | $\rightarrow$ `MATCH_ENDED_X`, `MATCH_ENDED_O`, `MATCH_ENDED_DRAW` |
| **Partida**| `MATCH_ENDED_X` | Vitória do Jogador 1 por alinhamento, tempo ou W.O. | Estado Terminal Global |
| **Partida**| `MATCH_ENDED_O` | Vitória do Jogador 2 por alinhamento, tempo ou W.O. | Estado Terminal Global |
| **Partida**| `MATCH_ENDED_DRAW` | Empate confirmado após aplicação da hierarquia. | Estado Terminal Global |

---

## 6. Fluxograma Lógico Textual de Validação de Turno

O ciclo de vida de processamento de cada jogada submetida à engine segue o protocolo rigoroso de 5 etapas:

```
[INÍCIO DO TURNO]
   │
   ├── 1. PRÉ-CONDIÇÕES DE ENTRADA
   │      ├─ Verificar se Estado da Partida == MATCH_PLAYING (ou MATCH_PIE_PHASE no t=1)
   │      ├─ Verificar se ID do Emissor == Jogador Ativo do Turno
   │      └─ Verificar se Tempo Restante no Relógio (τ_ativo) > 0
   │
   ├── 2. VALIDAÇÃO TÁTICA DA JOGADA
   │      ├─ Decompor Intenção de Movimento U em (M_alvo, m_célula)
   │      ├─ Verificar se Célula (M_alvo, m_célula) == CELL_EMPTY
   │      └─ Validar Restrição de Redirecionamento Macro:
   │             ├─ Se TARGET_MACRO != FREE_MOVE ──► Exigir M_alvo == TARGET_MACRO
   │             └─ Se TARGET_MACRO == FREE_MOVE ──► Exigir que M_alvo esteja MICRO_ACTIVE
   │
   ├── 3. APLICAÇÃO DA JOGADA E ATUALIZAÇÃO LOCAL
   │      ├─ Alterar Célula de CELL_EMPTY ──► CELL_X (ou CELL_O)
   │      └─ Avaliar 8 Combinações de Alinhamento em M_alvo:
   │             ├─ Se houver 3 símbolos iguais alinhados ──► M_alvo transita para MICRO_WON_X / MICRO_WON_O
   │             └─ Se 9 células ocupadas sem trinca ───────► M_alvo transita para MICRO_TIED (Quadrante Neutro)
   │
   ├── 4. AVALIAÇÃO DE CONDIÇÕES GLOBAIS DE FIM DE JOGO
   │      ├─ Avaliar 8 Combinações de Alinhamento na Grade Macro:
   │      │      ├─ Se 3 quadrantes MICRO_WON_X alinhados ──► Partida transita para MATCH_ENDED_X
   │      │      └─ Se 3 quadrantes MICRO_WON_O alinhados ──► Partida transita para MATCH_ENDED_O
   │      └─ Se todos os 9 Micro-Tabuleiros estiverem encerrados sem trinca Macro:
   │             └─ Acionar HIERARQUIA DE DESEMPATE GLOBAL:
   │                    ├─ V_X != V_O ──► Vencedor por Maior Nº de Quadrantes
   │                    ├─ C_X != C_O ──► Vencedor por Maior Nº de Células
   │                    └─ Empate Total ──► Vitória de O (Vantagem de Pretas)
   │
   └── 5. ATUALIZAÇÃO DE DIRECIOMENTO E TRANSIÇÃO DO TURNO
          ├─ Definir M_destino = m_célula jogada
          ├─ Atualizar Parâmetro de Restrição TARGET_MACRO:
          │      ├─ Se M_destino for MICRO_ACTIVE ──► Definir TARGET_MACRO = M_destino
          │      └─ Se M_destino for ENCERRADO ────► Definir TARGET_MACRO = FREE_MOVE
          ├─ Creditar Incremento Fischer: τ_ativo = τ_ativo + Δt
          ├─ Alternar Jogador Ativo (X ↔ O)
          └─ Incrementar Turno em +1 ──► [PRÓXIMO TURNO]
```

---

## 7. Recomendação Justificada do Conjunto de Regras Oficiais (Modo Ranqueado)

Para garantir padronização em plataformas digitais e torneios eSports, define-se o regulamento oficial sumarizado na tabela a seguir:

| Parâmetro de Regulamento | Padrão Ranqueado Recomendado | Justificativa Técnica |
| :--- | :--- | :--- |
| **Mecanismo de Abertura** | Regra da Torta (*Pie Rule*) no Turno 1 [18] | Elimina a vantagem estatística do primeiro jogador [7, 18]. |
| **Tratamento de Empate Local** | Variante A: Quadrante Neutro ($\emptyset$) | Pune jogos passivos e incentiva disputas territoriais reais [5, 12]. |
| **Regra de Redirecionamento** | *Free Move* Estrito ao ser enviado a quadrante fechado [5, 6] | Maximiza a profundidade tática e a variação no fator de ramificação [9, 14]. |
| **Desempate de Deadlock** | Hierarquia: Quadrantes $\rightarrow$ Células $\rightarrow$ Jogador 2 | Elimina empates e garante desfecho determinístico sem prolongamentos. |
| **Controle de Tempo** | Fischer Increment ($2\text{m} + 2\text{s}$) | Adequado para partidas mobile rápidas sem sufocar turnos de *Free Move*. |
| **Derrota por Tempo** | Derrota Incondicional imediata ao zerar relógio | Combate práticas de *stalling* e desistências passivas em conexões móveis. |

---

## 8. Especificação dos Formatos de Serialização: Replay Notation e Seed para Puzzles

### 8.1 Notação UTTT-FEN (Forsyth-Edwards Notation para UTTT)
Permite codificar o estado instantâneo de um jogo em uma string compacta dividida em 6 campos delimitados por espaço:

`[Grade_Global_81] [Target_Macro] [Jogador_Ativo] [Estado_Pie] [Contador_Halfmove] [Numero_Turno]`

* **Grade_Global_81:** 9 micro-tabuleiros ordenados de $A1$ a $C3$, separados por `|`. Dentro de cada quadrante, células vazias consecutivas usam números de `1` a `9`, e células ocupadas usam `x` e `o`. Quadrantes resolvidos recebem os prefixos `[X]`, `[O]` ou `[N]`.
* **Target_Macro:** Coordenada restrita (ex.: `B2`) ou `*` para *Free Move*.
* **Jogador_Ativo:** `X` ou `O`.
* **Estado_Pie:** `PIE_AVAILABLE`, `PIE_SWAPPED` ou `PIE_DISABLED`.
* **Contador_Halfmove:** Número de jogadas desde o último fechamento de micro-tabuleiro.
* **Numero_Turno:** Número ordinal do turno atual.

*Exemplo de Estado Inicial:*  
`3/3/3/3/3/3/3/3/3|3/3/3/3/3/3/3/3/3|3/3/3/3/3/3/3/3/3|3/3/3/3/3/3/3/3/3|3/3/3/3/3/3/3/3/3|3/3/3/3/3/3/3/3/3|3/3/3/3/3/3/3/3/3|3/3/3/3/3/3/3/3/3|3/3/3/3/3/3/3/3/3 * X PIE_AVAILABLE 0 1`

### 8.2 Formato de Histórico e Replay (PGN-UTTT)
Registro sequencial em texto legível composto por cabeçalhos em chave-valor e histórico de jogadas em DAN [1]:

```pgn
[Event "Campeonato Ranqueado Mobile Season 1"]
[Site "Server-BR-1"]
[Date "2026.03.30"]
[Round "4"]
[White "Player_Alpha"]
[Black "Player_Beta"]
[Result "1-0"]
[TimeControl "120+2"]
[Variant "Standard Competitive"]
[Opening "Pie Rule Accepted"]

1. B2.b2 SWAP
2. B2.c3 C3.a1
3. A1.a1 A1.c3
4. C3.c3 FREE_MOVE(B3.a2)
5. A2.b1 1-0
```

### 8.3 Especificação de Seed para Desafios Diários (Daily Puzzles)
Permite a distribuição determinística e offline de cenários táticos sem consulta a banco de dados [19]:

$$\text{Seed\_Bruta} = \text{SHA256}(\text{Data\_ISO} + \text{UTTT-FEN})$$

$$\text{Puzzle\_Seed} = \text{Base64URL}(\text{Seed\_Bruta}[0 \dots 15])$$

#### Payload da Seed de Desafio
| Campo do Payload | Tamanho | Função na Engine |
| :--- | :--- | :--- |
| `Header_Version` | 2 Bytes | Versão da especificação da FSM do jogo. |
| `Timestamp_Epoch` | 4 Bytes | Timestamp da data do desafio (UTC). |
| `FEN_Compressed` | Variável | String UTTT-FEN comprimida via LZ4. |
| `Target_Move_Seq` | 8 Bytes | Sequência binária de jogadas que soluciona o puzzle. |
| `Difficulty_Elo` | 2 Bytes | Classificação ELO de dificuldade gerada pelo solver. |

*Exemplo de Seed Gerada:*  
`UTTT-PZK1-20260330-eJx9kM0NgDAMhG3C3o_yU6c3XgI4AC1SInH4mOaP053v03`

---

## Referências das Fontes

1. TextArena/textarena/envs/README.md at main - GitHub.
2. Mathematicians Playing Games (Kim Jon-Lark).
3. Ultimate Tic-Tac-Toe : r/math - Reddit.
4. Determining the number of valid TicTacToe board states in terms of board dimension.
5. Rules of the game | Ramblings on game trees (minimax.dev).
6. Analyzing Games and Playing Ultimate Tic-Tac-Toe - Chapel Hill Math Circle.
7. Ultimate Tic Tac Toe is always won by X – Blog (Joachim Breitner).
8. Solving Ultimate Tic Tac Toe - Ramblings on game trees (minimax.dev).
9. Math Games With Bad Drawings (Ben Orlin).
10. Proof Number search | Ramblings on game trees (minimax.dev).
11. Parallel proof tree search | Ramblings on game trees (minimax.dev).
12. Zobrist hashing - Ramblings on game trees (minimax.dev).
13. Efficient representation of Ultimate Tic Tac Toe - Ramblings on game trees.
14. Tang1705/Ultimate-Tic-Tac-Toe - GitHub.
15. r/chess - SinisterMagnus discussion.
16. Alyssa Choi - Tic-Tac-Toe - National Museum of Mathematics.
17. The Mathematics of Tic-Tac-Toe - Association of Old Crows.
18. Suggestions for Ultimate Tic-Tac-Toe rules - Board Game Arena.
19. Steam Workshop - The Full KTaNE Experience.
