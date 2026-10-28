# Especificação Técnica de Arquitetura de IA para Ultimate Tic-Tac-Toe: Bitboards, MCTS em Web Workers e Mineração de Puzzles

## 1. Especificação da Estrutura de Dados e Layout de Memória (Bitboard Schema)

A execução de algoritmos de busca em árvore de alto desempenho no motor V8 (JavaScript/TypeScript) exige a minimização estrita de alocações de objetos no *Heap* do navegador [1]. A criação iterativa de instâncias de classes ou objetos literais durante milhões de simulações aciona ciclos frequentes de *Garbage Collection* (GC), gerando *micro-stutters* e reduzindo drasticamente a taxa de simulações por segundo em threads de Web Workers [1, 2]. Para garantir a execução continuada em navegadores móbiles sem sobrecarga de CPU ou drenagem excessiva de bateria, a representação do estado do jogo deve ser estruturada inteiramente através de operações bit a bit (*bitwise*) sobre buffers de memória contíguos (`TypedArrays`) [1, 2].

### Otimização de Numéricos no Motor V8

No V8, os números de ponto flutuante genéricos são representados como `HeapNumbers` ou `Doubles` de 64 bits. Contudo, valores inteiros de até 31 bits são otimizados como *Small Integers* (SMIs), mantidos diretamente em registradores de CPU sem alocação de ponteiros. A aplicação de operadores binários (`|`, `&`, `^`, `~`, `<<`, `>>`, `>>>`) força internamente o tempo de execução do V8 a converter os operandos em inteiros truncados de 32 bits assinados ou não assinados [3]. 

Dessa forma, todo o estado de um jogo de Ultimate Tic-Tac-Toe — composto por 81 casas de micro-tabuleiros, 9 macro-tabuleiros e restrições de jogada ativa — pode ser compactado em um vetor fixo de inteiros de 32 bits (`Uint32Array`), dispensando estruturas hierárquicas compostas por matrizes bidimensionais ou objetos aninhados [2].

### Esquema de Mapeamento de Memória

Um micro-tabuleiro $3 \times 3$ possui 9 posições, indexadas sequencialmente de 0 a 8 (da esquerda para a direita, de cima para baixo). O estado de ocupação de um micro-tabuleiro para um único jogador exige exatamente 9 bits [2]. Como o Ultimate Tic-Tac-Toe é composto por 9 micro-tabuleiros, são necessários $9 \times 9 = 81$ bits para mapear as jogadas de cada jogador [2]. Utilizando uma `Uint32Array` contígua de 8 posições (256 bits totais), o estado global do jogo é compactado de maneira escalar e amigável aos *caches* L1/L2 da CPU [1, 2, 4].

| Índice da `Uint32Array` | Intervalo de Bits Utilizados | Mapeamento do Estado do Jogo |
| :--- | :--- | :--- |
| `0` | `0..26` | Jogador X: Micro-tabuleiros 0, 1 e 2 (9 bits por micro-tabuleiro) [2] |
| `1` | `0..26` | Jogador X: Micro-tabuleiros 3, 4 e 5 (9 bits por micro-tabuleiro) [2] |
| `2` | `0..26` | Jogador X: Micro-tabuleiros 6, 7 e 8 (9 bits por micro-tabuleiro) [2] |
| `3` | `0..26` | Jogador O: Micro-tabuleiros 0, 1 e 2 (9 bits por micro-tabuleiro) [2] |
| `4` | `0..26` | Jogador O: Micro-tabuleiros 3, 4 e 5 (9 bits por micro-tabuleiro) [2] |
| `5` | `0..26` | Jogador O: Micro-tabuleiros 6, 7 e 8 (9 bits por micro-tabuleiro) [2] |
| `6` | `0..26` | Macro-tabuleiro: Vitórias X (bits 0..8), Vitórias O (bits 9..17), Empates (bits 18..26) [2, 4] |
| `7` | `0..5` | Restrição do Turno: Índice do micro-tabuleiro ativo 0..8 (bits 0..3), Flag de jogada livre (bit 4), Turno do jogador (bit 5) [2, 4] |

### Detecção de Vitória em Tempo Constante $O(1)$

A verificação de vitória em uma grade $3 \times 3$ tradicionalmente envolve iterações sobre vetores de linhas, colunas e diagonais. Com bitboards, as 8 combinações de vitória são convertidas em máscaras binárias exatas de 9 bits [2].

| Linha Vencedora | Posições da Grade | Padrão Binário (Bit 8 ao Bit 0) | Valor Decimal | Valor Hexadecimal |
| :--- | :--- | :--- | :--- | :--- |
| Linha Superior | 0, 1, 2 | `0b000000111` | 7 | `0x007` |
| Linha Central | 3, 4, 5 | `0b000111000` | 56 | `0x038` |
| Linha Inferior | 6, 7, 8 | `0b111000000` | 448 | `0x1C0` |
| Coluna Esquerda | 0, 3, 6 | `0b001001001` | 73 | `0x049` |
| Coluna Central | 1, 4, 7 | `0b010010010` | 146 | `0x092` |
| Coluna Direita | 2, 5, 8 | `0b100100100` | 292 | `0x124` |
| Diagonal Principal | 0, 4, 8 | `0b100010001` | 273 | `0x111` |
| Anti-Diagonal | 2, 4, 6 | `0b001010100` | 84 | `0x054` |

Para determinar se um jogador venceu um micro-tabuleiro, efetua-se a operação bitwise `AND` entre a máscara de 9 bits do jogador naquele quadrante e as máscaras predefinidas [2]. A abordagem de maior vazão no V8 elimina *branches* condicionais utilizando uma tabela de busca de acesso direto (*Lookup Table* precomputada) representada por um `Uint8Array` de 512 posições ($2^9 = 512$) [3]. O valor retornado por `WIN_TABLE[micro_board_mask]` indica instantaneamente se a posição é vencedora (valor `1`) ou não (valor `0`), garantindo avaliação em instrução única de CPU [2, 3].

### Integridade do Hashing de Zobrist para Tabelas de Transposição

Para identificar posições equivalentes alcançadas por diferentes ordens de lances (*transpositions*) e reutilizar dados da árvore de busca, o motor implementa *Zobrist Hashing* de 64 bits [4, 5]. Devido às limitações de operadores binários em JS com números de 64 bits nativos sem recorrer a objetos `BigInt` (que geram alocação de memória no *Heap*), a chave de Zobrist é mantida como dois inteiros de 32 bits: `hash_hi` e `hash_lo` [4].

Tabelas contendo inteiros pseudo-aleatórios de 32 bits são inicializadas offline para mapear as seguintes variáveis de estado [4]:
1. $2 \times 81$ valores correspondentes a cada combinação de casa local e jogador ativo [4].
2. $3 \times 9$ valores para o estado consolidado do macro-tabuleiro (vencido por X, O ou empatado) [4].
3. 9 valores para a restrição de micro-tabuleiro ativo enviado ao próximo jogador [4].
4. 1 valor indicador de alternância de turno do jogador [4].

As atualizações no hash ocorrem incrementalmente via operações `XOR` a cada movimento simulado, garantindo o custo computacional de atualização $O(1)$ sem a necessidade de recomputar a chave completa da posição [4].

---

## 2. Arquitetura e Engenharia do Algoritmo Monte Carlo Tree Search (MCTS)

### Alocador de Memória em Arena (Zero-GC Arena Allocator)

A implementação convencional do MCTS fundamentada em objetos relacionais JavaScript resulta em degradação severa do coletor de lixo após algumas dezenas de milhares de iterações [1]. A solução arquitetural para Web Workers consiste na pré-alocação de um vetor estático de nós (*Arena Allocator*) operando sobre `SharedArrayBuffer` ou `TypedArrays` genéricas [1]. 

Cada nó da árvore ocupa posições fixas dentro de vetores paralelos em um modelo de layout plano (*flat structure*) [1]:
*   `N_VISITS` (`Int32Array`): Registra o número total de visitas do nó ($N$) [1].
*   `W_REWARDS` (`Float64Array`): Armazena a pontuação acumulada de vitórias ($W$) [1].
*   `PARENT_INDEX` (`Int32Array`): Aponta para o índice do nó pai na arena [1].
*   `FIRST_CHILD_INDEX` (`Int32Array`): Aponta para o primeiro nó filho alocado [1].
*   `NUM_CHILDREN` (`Uint16Array`): Indica o número de nós filhos gerados [1].
*   `MOVE_CODE` (`Uint16Array`): Armazena o código da jogada responsável pela transição (0 a 80).

A expansão de um nó consiste unicamente em incrementar um ponteiro global de alocação de índices na Arena, eliminando por completo o uso do operador `new` durante o ciclo de execução do motor [1].

### O Ciclo de Quatro Fases do MCTS Aplicado ao Ultimate Tic-Tac-Toe

O algoritmo opera por meio da repetição continuada de quatro fases essenciais, projetadas para explorar o espaço de estados do jogo de forma estatisticamente direcionada [1].

1. **Seleção**: Inicia-se na raiz da árvore e navega recursivamente pelos nós já expandidos [1]. A escolha dos descendentes é orientada pela fórmula UCB1 [1]. A descida pela árvore é interrompida assim que se atinge um nó que ainda possui ações não expandidas ou que representa um estado terminal do jogo [1].
2. **Expansão**: Intervém quando a Seleção alcança um nó folha não terminal [1]. Uma das ações válidas ainda não exploradas é sorteada, e o estado resultante é instanciado na Arena de memória como um novo nó filho, registrando-se as alterações via operações de bitboard [1].
3. **Simulação (Rollout)**: Executa uma partida completa a partir do estado do nó recém-expandido até a conclusão do jogo (vitória, derrota ou empate) [1]. As jogadas dessa fase podem seguir uma política estocástica pura ou ser guiadas por heurísticas táticas de rápida avaliação [1, 6].
4. **Retropropagação (Backpropagation)**: Percorre o caminho inverso, partindo do nó expandido até atingir a raiz da árvore [1]. Em cada nó desse trajeto, o contador de visitas $N$ é incrementado em uma unidade, e o valor do resultado obtido na simulação ($R \in \{-1.0, 0.0, 1.0\}$) é somado à pontuação acumulada $W$, ajustando a avaliação das posições ancestrais [1].

### Parametrização da Formulação UCB1 e Ajuste Dinâmico

A seleção de nós descendentes durante a fase de navegação é governada pela equação UCB1 (*Upper Confidence Bound 1 applied to trees*):

$$\text{UCB1}(s, a_i) = \frac{W(a_i)}{N(a_i)} + C \cdot \sqrt{\frac{\ln N(s)}{N(a_i)}}$$

Na qual $W(a_i)$ representa a recompensa acumulada do nó filho $a_i$, $N(a_i)$ o número de visitas do nó filho, $N(s)$ o número de visitas do nó pai $s$, e $C$ a constante de exploração responsável por balancear a exploração de ramos pouco visitados e a exploração de ramos de alta recompensa [1, 7, 8].

Enquanto em jogos tradicionais com fator de ramificação estável a constante $C = \sqrt{2} \approx 1,414$ é considerada teoricamente ideal [7], no Ultimate Tic-Tac-Toe o fator de ramificação varia severamente conforme o estado do jogo [2]. Quando um jogador é enviado a um micro-tabuleiro ativo não finalizado, o número de ações possíveis varia entre 1 e 9. Contudo, ao ser enviado a um micro-tabuleiro fechado ou cheio, o jogador ganha uma "Jogada Livre" (*Free Move*), elevando o fator de ramificação para até 81 opções simultâneas [2].

Para evitar a dispersão excessiva da busca durante estados de Jogada Livre, a constante de exploração $C$ deve ser ajustada dinamicamente:
*   **Movimento Restrito a Micro-tabuleiro (Fator de ramificação $1..9$)**: Configura-se $C = 0,85$. A menor constante induz a busca a aprofundar em poucas linhas táticas, resolvendo disputas locais com rapidez [7, 8].
*   **Jogada Livre no Macro-tabuleiro (Fator de ramificação até $81$)**: Configura-se $C = 1,25$. A maior constante garante a varredura ampla de opções em um espaço de busca significativamente mais extenso [7, 8].

### Comparativo: Light Rollouts vs. Heavy Rollouts

A fase de simulação define a qualidade e a convergência das estimativas do MCTS [1, 6]. A escolha da política de simulação impacta diretamente a taxa de simulações por segundo e a suscetibilidade a erros táticos imediatos [6, 9].

| Métrica / Propriedade | Light Rollout (Puro Estocástico) | Heavy Rollout (Guiado por Heurística) |
| :--- | :--- | :--- |
| **Política de Decisão** | Sorteio uniforme entre todas as jogadas válidas [1]. | Seleção hierárquica baseada em regras táticas [6]. |
| **Vazão no V8 Engine** | $> 2.500.000$ lances/segundo. | $\approx 1.600.000$ lances/segundo (redução de $\sim 35\%$). |
| **Sensibilidade Tática** | Alta cegueira tática (*tactical blindness*) em poucas iterações. | Detecção imediata de ameaças e vitórias locais em 1 lance [6]. |
| **Variância da Recompensa** | Elevada; requer muitas simulações para estabilizar. | Baixa; estimativas de vitória convertem rapidamente [6]. |
| **Regras Ativas** | Nenhuma. | 1. Fechar micro-tabuleiro vencedor [6].<br>2. Bloquear vitória iminente do oponente [6].<br>3. Evitar conceder "Jogada Livre" [6]. |

A utilização de Heavy Rollouts baseados nessas três regras bitwise reduz a vazão computacional bruta, mas diminui a variância das estimativas em mais de $300\%$, permitindo que o motor atinja desempenho de nível Mestre com um número substancialmente menor de iterações totais [6, 9].

---

## 3. Calibragem de Dificuldade e "Humanização" de Bots

A criação de oponentes virtuais ajustados a diferentes níveis de habilidade exige a parametrização precisa dos limites de busca e das distribuições de probabilidade de decisão [9, 10, 11]. O uso de jogadas totalmente aleatórias para simular níveis fáceis resulta em comportamentos não naturais [9]. A calibragem adequada combina a variação do orçamento de iterações, a restrição temporal, a política de rollout, a suavização de seleção via Temperatura Softmax e a simulação de tempo de pensamento humano [9, 10, 11].

### Matriz de Configuração dos Níveis de Dificuldade

| Parâmetro de Controle | Nível Iniciante | Nível Casual | Nível Competitivo | Nível Mestre |
| :--- | :--- | :--- | :--- | :--- |
| **Limite de Iterações MCTS** | $150 - 300$ | $1.500 - 3.000$ | $15.000 - 30.000$ | $100.000+$ (ou limite por tempo) [9] |
| **Tempo Máximo por Turno** | $50\text{ ms}$ | $150\text{ ms}$ | $400\text{ ms}$ | $1000\text{ ms}$ [9] |
| **Constante de Exploração ($C$)** | $2,00$ (Sobexploração) | $1,414$ (Padrão) | $1,00$ | Dinâmica ($0,85 - 1,25$) [7, 8] |
| **Política de Rollout** | Light (100% Aleatório) | Light com Bloqueio 1-step | Heavy Rollout completo | Heavy Rollout Otimizado [6, 9] |
| **Temperatura Softmax ($T$)** | $1,8 - 2,5$ | $0,8 - 1,2$ | $0,2 - 0,4$ | $T \to 0$ (ArgMax Estrito) [10, 11] |
| **Reutilização da Árvore** | Desativada | Desativada | Ativada entre turnos | Ativada com Transposição [5, 9] |
| **Janela de Atraso Humano** | $200 - 400\text{ ms}$ | $400 - 800\text{ ms}$ | $600 - 1200\text{ ms}$ | Dinâmica por complexidade |

### Introdução de Temperatura (Softmax) na Escolha de Ações

Ao término das iterações da busca, a seleção do movimento a ser executado a partir do nó raiz não precisa ser estritamente determinística [10, 11]. A conversão das contagens de visitas dos nós descendentes $N(a_i)$ em probabilidades de escolha $P(a_i)$ é realizada aplicando a função Softmax parametrizada pela Temperatura $T$ [10, 11]:

$$P(a_i) = \frac{N(a_i)^{\frac{1}{T}}}{\sum_{j} N(a_j)^{\frac{1}{T}}}$$

Quando $T \to 0$, a distribuição de probabilidade se transforma na função *ArgMax* estrita, forçando o motor a escolher a ação com o maior número de visitas de forma determinística (ideal para o nível Mestre) [10]. Para $T = 1,0$, as probabilidades de seleção mantêm-se estritamente proporcionais ao volume de visitas acumulado durante a busca [10, 11]. Em valores de $T > 1,5$, a distribuição se aproxima de um perfil uniforme, elevando a entropia do processo seletivo [10, 11]. Isso faz com que o bot cometa imprecisões ocasionais sem optar por jogadas completamente irracionais, simulando com precisão o comportamento de um jogador iniciante [10, 11].

### Simulação de Tempo de Pensamento Humano

Respostas instantâneas emitidas por motores de inteligência artificial revelam sua natureza sintética e prejudicam a imersão do jogador. Para humanizar o comportamento dos bots, a thread do Web Worker calcula uma latência artificial antes de enviar a jogada à interface de usuário.

O cálculo da latência temporal dinamicamente adaptada ($t_{\text{pensamento}}$) é regido pela fórmula:

$$t_{\text{pensamento}} = t_{\text{base}} + \alpha \cdot H(S) + \beta \cdot \left( 1 - \frac{N_{\text{max1}} - N_{\text{max2}}}{N_{\text{total}}} \right)$$

Nessa formulação, $t_{\text{base}}$ estabelece o tempo mínimo de resposta visual, $H(S)$ mede a entropia do estado atual (proporcional ao número de casas válidas e ao tipo de movimento, seja restrito ou livre), $N_{\text{max1}}$ e $N_{\text{max2}}$ representam o número de visitas do nó mais visitado e do segundo nó mais visitado na raiz, respectivamente, e $\alpha$ e $\beta$ atuam como coeficientes de ponderação temporal [9, 10].

Quando a margem entre os dois nós mais visitados é reduzida, o motor identifica um dilema tático de alta incerteza [10]. Nesses cenários, a fórmula expande a latência de resposta, simulando a hesitação e o tempo de reflexão exigidos de um jogador humano diante de uma decisão complexa [9].

---

## 4. Geração Procedural de Puzzles Táticos

O sistema de desafios diários exige a geração automatizada de puzzles contendo posições táticas críticas nas quais existe uma **única sequência forçada de vitória** cobrindo de 2 a 3 lances ($3$ a $5$ *plies* de profundidade) [6, 12].

### Arquitetura de Mineração por Auto-Jogo (Self-Play Mining)

A mineração de puzzles ocorre por meio do auto-jogo entre duas instâncias do MCTS configuradas no nível Mestre [9]. Durante a partida, o sistema armazena a sequência de bitboards e o vetor de visitas do nó raiz a cada turno [1, 2]. 

Após a conclusão da partida, a trajetória de estados é analisada retroativamente para identificar posições $S_t$ que atendam cumulativamente a três critérios estatísticos [6, 9]:
1.  **Dominância Absoluta da Ação Principal**: O movimento candidato $a^*$ deve ter recebido no mínimo $85\%$ do total de visitas da raiz ($N(a^*) / N_{\text{total}} \ge 0,85$) [9].
2.  **Inexistência de Alternativas Viáveis**: O segundo movimento mais visitado $a'$ não pode ter ultrapassado $10\%$ das visitas ($N(a') / N_{\text{total}} \le 0,10$) [9].
3.  **Divergência Abrupta de Expectativa ($\Delta V$)**: A taxa de vitória estimada para o jogador ativo deve saltar de uma posição de equilíbrio ($V(S_t) \approx 0,50$) para um estado de vitória praticamente garantido ($V(S_{t+1}) \ge 0,90$) após a execução do lance $a^*$ [6, 9].

### Algoritmo de Validação e Garantia de Unicidade

Após a seleção de uma posição candidata $S_t$, o motor submete o estado a um processo rigoroso de validação e poda para assegurar a existência de apenas um caminho vitorioso [6, 12].

Primeiramente, o estado resultante da aplicação da ação principal $a^*$ é testado em uma busca MCTS profunda [1, 12]. A vitória do jogador ativo deve ser confirmada de maneira forcida contra todas as respostas defensivas possíveis do oponente dentro do limite de profundidade estabelecido [6, 12].

Em seguida, executa-se a verificação de unicidade sobre todas as ações alternativas $a' \neq a^*$ disponíveis no estado $S_t$ [12]. Para cada ação alternativa, o motor executa uma busca exaustiva de alta intensidade ($50.000$ iterações) [9, 12]. Se qualquer ação alternativa $a'$ resultar em uma taxa de vitória superior a $15\%$ para o jogador ativo, o tabuleiro é descartado por apresentar múltiplas soluções [12].

Puzzles validados são catalogados segundo sua complexidade [12]. Casos em que o oponente possui apenas uma resposta legal válida por turno são classificados como "Fáceis" [12]. Já os cenários nos quais o oponente dispõe de múltiplas respostas em quadrantes distintos, mas todas convergem para a vitória forçada do jogador ativo em até 3 lances, são rotulados como "Especialistas" [6, 12].

---

## 5. Referências e Fontes Consultadas

1. PaytonWebber/mcts-rs: MCTS em Rust com Alocador em Arena.
2. CyberLemonade/Ultimate-Tic-Tac-Toe-AI: MCTS em Bitboards.
3. COCI Contest Solution Strategies: Bitmasks e Tabelas de Busca.
4. Zobrist Hashing - Ramblings on Game Trees.
5. The Transposition Table - Ramblings on Game Trees.
6. Real-Time Solver for Klondike Solitaire: Rollouts e Heurísticas.
7. University of Padova: Parametrização UCB1 em MCTS.
8. Josselin Somerville Roberts: Reinforcement Learning in Ultimate Tic-Tac-Toe.
9. jeppeml/UTTT-For-Students: MCTS e Bots em Ultimate Tic-Tac-Toe.
10. Stack Exchange: O papel da Temperatura no Softmax.
11. Wikipedia: Função Softmax.
12. arXiv: Cognitive Framework for Tree Search & LLM Reasoning.
