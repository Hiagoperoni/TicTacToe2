# Especificação Técnica de UX Mobile, Game Feel Procedural e Governança de AI Harness para Tabuleiros Recursivos 9x9

## 1. Ergonomia e UX Mobile para Grade 9x9 Recursiva

### 1.1 Mitigação do Fat-Finger Problem em Interfaces de Alta Densidade
A exibição de um tabuleiro de jogo de Tic-Tac-Toe recursivo $9 \times 9$, composto por 81 células jogáveis organizadas em 9 sub-tabuleiros de $3 \times 3$, impõe restrições ergonômicas extremas em telas de smartphones (largura útil típica entre $360\text{ px}$ e $414\text{ px}$). A alocação direta de uma matriz $9 \times 9$ resulta em alvos de toque individuais inferiores a $4 \times 4\text{ mm}$, violando as diretrizes de interface humana que recomendam o mínimo de $9 \times 9\text{ mm}$ ($44 \times 44\text{ px}$) para evitar acionamentos acidentais (*Fat-Finger Problem*).

Para neutralizar o problema do toque impreciso sem comprometer a fluidez da partida, a arquitetura de interação combina expansão visual dinâmica com confirmação intencional:

| Padrão de UX | Mecânica de Funcionamento | Taxa de Erro Estimada | Latência de Interação | Adequação Mobile |
| :--- | :--- | :--- | :--- | :--- |
| **Smart Auto-Zoom** | O toque inicial no quadrante expande automaticamente o sub-tabuleiro $3 \times 3$ ativo para ocupar $85\%$ do viewport útil. | $< 1\%$ | Baixa ($150\text{ ms} - 250\text{ ms}$) | **Ideal**: Garante que cada célula atinja a dimensão tátil ergonômica ($> 48 \times 48\text{ px}$) sem poluir a tela. |
| **Two-Step Confirmation** | O primeiro toque pré-seleciona a célula; o segundo toque na mesma célula confirma a jogada. | $< 2\%$ | Média (requer dois toques explícitos) | **Alta**: Elimina execuções inadvertidas quando combinada com a expansão de Zoom. |
| **Magnifying Loupe** | Pressionar e arrastar exibe uma lupa flutuante que amplia a região sob o polegar. | $\approx 5\%$ | Alta (fricção por arraste contínuo) | **Baixa**: Oculta contexto visual crítico do tabuleiro global e gera fadiga muscular. |

A solução adota a integração do **Smart Auto-Zoom com Confirmação em Duas Etapas**. Ao reconhecer o toque no sub-tabuleiro válido, o motor de interface aciona uma transição contínua que enquadra a sub-grade em foco. Nesse estado expandido, a seleção da coordenada e a confirmação subsequente ocorrem com precisão tátil total.

---

### 1.2 Semiótica Visual e Leitura Cognitiva Instantânea (< 0,5s)
Para permitir uma leitura visual instantânea (inferior a $0,5$ segundo), a interface comunica três estados lógicos primários por meio de hierarquia visual e semiótica bem definida:

*   **Quadrante Obrigatório no Turno Atual**: O sub-tabuleiro em que o jogador é forçado a jogar recebe uma borda destacada com pulsação senoidal animada ($1,2\text{ Hz}$) em cor de alto contraste (`#FFD700` amarelo ouro ou verde esmeralda luminescente).
*   **Projeção de Destino do Oponente (Mira Reversa / Ghost Highlight)**: Ao tocar em uma célula para pré-visualização dentro da sub-grade ativa, o sub-tabuleiro correspondente no tabuleiro geral acende imediatamente um contorno fantasma, antecipando para qual quadrante o adversário será enviado no turno seguinte.
*   **Quadrantes Fechados ou Conquistados**: Sub-tabuleiros finalizados por vitória ou empate recebem uma sobreposição com $30\%$ de opacidade e efeito de *backdrop blur*. Um glifo vetorial gigante ($X$ ou $O$) é renderizado no centro do quadrante, desativando a interatividade das 9 células internas sem ocultar o histórico de jogadas.

---

### 1.3 Guia de UX e Estados Visuais do Tabuleiro

#### Wireframe Descritivo da Interface Mobile
```
+-------------------------------------------------------+
|  [ HEADER: Placar | Tempo Restante | Indicador Turno ] |
+-------------------------------------------------------+
|                                                       |
|  +-------------------------------------------------+  |
|  | TABULEIRO GERAL (9x9 / Nível de Zoom: Auto-Zoom) |  |
|  |                                                 |  |
|  |  [Q1: Desfocado]  [Q2: OBRIGATÓRIO] [Q3: Fechado] |  |
|  |                   +---------------+               |  |
|  |                   | [x] [ ] [ ]   |               |  |
|  |                   | [ ] [O] [ ]   |               |  |
|  |                   | [ ] [ ] [?] < | (Mira)        |  |
|  |                   +---------------+               |  |
|  |  [Q4: Conquistado][Q5: Desfocado] [Q6: Fantasma]  |  |
|  |                   (Destino Oponente <-------------+  |
|  |  [Q7: Desfocado]  [Q8: Desfocado] [Q9: Desfocado] |  |
|  +-------------------------------------------------+  |
|                                                       |
|  [ FOOTER: Ações Rápidas | Desfazer | Configurações ]  |
+-------------------------------------------------------+
```

#### Mapeamento de Estados da Interface e Comportamento Tátil
| Estado da UI | Nível de Zoom | Opacidade dos Quadrantes | Estado e Interatividade da Célula | Animação de Transição |
| :--- | :--- | :--- | :--- | :--- |
| **Visão Geral do Jogo** | $100\%$ (Grade completa $9 \times 9$) | $100\%$ no quadrante ativo; $40\%$ nos inativos | Toque no quadrante ativo dispara o Smart Auto-Zoom. | Escala inicial (`scale: 1`, duração $300\text{ ms}$). |
| **Sub-Grid Focada (Zoom)** | $220\% - 280\%$ (Enquadra a sub-grade $3 \times 3$) | $15\%$ (Deslocado para a periferia) | Células expandidas ($> 48\text{ px}$). Primeiro toque ativa destaque brilhante. | Mola física configurada para expansão suave. |
| **Pré-Visualização (2-Step)** | Zoom mantido na sub-grade focada | $15\%$ (Destino fantasma piscando no tabuleiro geral) | Célula exibe marca temporária transparente ($50\%$ alfa). | Micro-escala na célula (`scale: 1.15`) e haptic feedback. |
| **Confirmação da Jogada** | Transição de retorno para $100\%$ | Retorna a $100\%$ no tabuleiro geral | Célula fixa a marca definitiva; bloqueia novos toques. | Retração de Zoom e onda visual no quadrante afetado. |
| **Quadrante Finalizado** | Zoom $100\%$ imediato | Desfoque fosco ($30\%$ opacidade com marca gigante) | Interatividade desativada (`pointer-events: none`). | Animação de carimbo vetorial gigante com impacto visual. |

---

## 2. "Juiciness" (Game Feel) e Áudio Procedural (Zero Asset Cost)

### 2.1 Especificação de Física de Molas e Efeitos Visuais Declarativos
O aprimoramento sensorial da interface (*Game Feel*) utiliza física de molas amortecidas regida pela equação diferencial:

$$m \frac{d^2 x}{dt^2} + d \frac{dx}{dt} + k x = 0$$

onde $m$ é a massa, $d$ é o coeficiente de amortecimento (*damping*), e $k$ é a rigidez (*stiffness*).

Para garantir execução a $60/120\text{ FPS}$ em bibliotecas declarativas (Framer Motion / Canvas / CSS Shaders), especificam-se os seguintes parâmetros:

| Evento de Jogo | Rigidez ($k$) | Amortecimento ($d$) | Massa ($m$) | Efeito Visual Secundário e Partículas |
| :--- | :--- | :--- | :--- | :--- |
| **Toque na Célula** | $400$ | $25$ | $0,5$ | Micro-escala local ($0,92 \rightarrow 1,0$), sem emissão de partículas. |
| **Transição Auto-Zoom** | $180$ | $20$ | $1,0$ | Deslocamento de câmera com interpolação suave de viewport. |
| **Conquista de Quadrante** | $300$ | $12$ | $1,2$ | Emissão radial de 16 partículas vetoriais com desaceleração exponencial e desintegrador alpha. |
| **Screen Shake (Erro)** | $600$ | $30$ | $0,8$ | Deslocamento aleatório no eixo $X/Y$ ($\pm 6\text{ px}$) oscilando durante $120\text{ ms}$. |

---

### 2.2 Micro-Acústica Procedural e Síntese Web Audio API (Zero-Asset)
A síntese de som 100% via código utilizando a **Web Audio API** descarta arquivos `.mp3`/`.wav`, garantindo latência zero e custo nulo de download de assets. O fluxo conecta `OscillatorNode` $\rightarrow$ `BiquadFilterNode` $\rightarrow$ `GainNode` (com envelope **ADSR** amortecido via `AudioContext.currentTime`) $\rightarrow$ `AudioContext.destination`.

#### Tabela de Especificação de Áudio Sintético (Receitas Acústicas)
| Evento do Jogo | Formas de Onda | Curva de Frequência / Pitch | Envelope ADSR (Tempo / Ganho) | Filtro e Processamento Adicional |
| :--- | :--- | :--- | :--- | :--- |
| **Impacto Tátil / Madeira** | Triangle + Sine | Sweep descendente: $180\text{ Hz} \rightarrow 60\text{ Hz}$ em $0,04\text{ s}$ | A: $0,001\text{ s}$, D: $0,04\text{ s}$, S: $0,0$, R: $0,01\text{ s}$ (Ganho máx: $0,8$) | `BiquadFilter` Lowpass em $800\text{ Hz}$, ressonância $Q=1,0$. |
| **Clique Mecânico de Seleção** | Square + Noise Burst | Sweep rápido: $1200\text{ Hz} \rightarrow 400\text{ Hz}$ em $0,015\text{ s}$ | A: $0,0005\text{ s}$, D: $0,015\text{ s}$, S: $0,0$, R: $0,005\text{ s}$ (Ganho máx: $0,4$) | `BiquadFilter` Bandpass em $2500\text{ Hz}$, ressonância $Q=3,0$. |
| **Conquista de Quadrante** | Sine + Sawtooth | Arpejo ascendente: $C_4 (261,63\text{ Hz}) \rightarrow E_4 (329,63\text{ Hz}) \rightarrow G_4 (392,00\text{ Hz}) \rightarrow C_5 (523,25\text{ Hz})$ | A por nota: $0,01\text{ s}$, D: $0,15\text{ s}$, S: $0,2$, R: $0,3\text{ s}$ (Intervalo: $0,06\text{ s}$) | Filtro Lowpass automatizado de $400\text{ Hz}$ até $4000\text{ Hz}$ durante o arpejo. |
| **Alerta de Tempo Limite** | Square Wave | Pulsos fixos em $880\text{ Hz}$ ($A_5$), elevando para $1760\text{ Hz}$ nos últimos 3s | A: $0,001\text{ s}$, D: $0,02\text{ s}$, S: $0,0$, R: $0,01\text{ s}$ (Pulsos a cada $0,5\text{ s}$) | Distorção leve via `WaveShaperNode` para destaque auditivo. |
| **Vitória Final da Partida** | Acorde Triádico + Sub-Bass | Acorde simultâneo $G_4 (392\text{ Hz}) + C_5 (523,25\text{ Hz}) + E_5 (659,25\text{ Hz}) + G_5 (783,99\text{ Hz})$ | A: $0,02\text{ s}$, D: $0,3\text{ s}$, S: $0,6$, R: $0,8\text{ s}$ (Ganho máx master: $0,9$) | `DelayNode` com repetição em $0,125\text{ s}$ e ganho de feedback em $0,3$. |

---

## 3. Engenharia de AI Harness e Governança de Monorepo TypeScript

### 3.1 Hierarquia de Contexto e Documentação (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`)
O desenvolvimento por Agentes de IA exige governança estrita de contexto para evitar regressões e acoplamentos indevidos:

1.  **`AGENTS.md` (Fonte Universal de Verdade)**: Raiz do repositório. Define padrões globais lidos por agentes (Claude Code, Cursor, Copilot, Codex), contendo comandos de build, regras de pacotes e convenções invioláveis.
2.  **`.cursor/rules/*.mdc` (Regras Scoped)**: Arquivos de instrução especializados com seletores glob (`globs`). Carregados dinamicamente de acordo com os diretórios manipulados para economizar contexto.
3.  **`CLAUDE.md` (Diretrizes Imperativas)**: Arquivo conciso (< 200 linhas) para o Claude Code com comandos e regras diretas. Tópicos extensos usam referências `@docs/file.md`.

---

### 3.2 Isolamento de Estado, Contratos Zod e Limites de Código
*   **Separação Lógica de Pacotes**: Regras lógicas residem exclusivamente em `packages/core` (TypeScript puro sem dependências de DOM/UI). A interface gráfica habita em `packages/ui` como consumidora unidirecional.
*   **Contratos Zod nas Fronteiras de Estado**: As transições de estado e entradas de jogadas são validadas obrigatoriamente por schemas Zod (`type GameState = z.infer<typeof GameStateSchema>`).
*   **Limites Estritos por Arquivo**: Cada arquivo fonte em TypeScript deve conter no máximo **250 a 300 linhas de código**. Exceder esse limite força a extração para sub-módulos auxiliares puros.
*   **Tipagem Estrita**: Compilação com `strict: true` e `noImplicitAny: true`. Proibido o uso de `any` ou type assertions não seguras.

---

### 3.3 Guia de Governança do AI Harness

#### Regras de Ouro de Arquitetura e Monorepo
*   A lógica matemática e o estado do tabuleiro pertencem unicamente a `packages/core`. É proibido inserir regras de vitória ou validação de turnos em `packages/ui`.
*   O pacote `packages/ui` é puramente declarativo: recebe o estado imutável do motor e renderiza a interface, acionando animações e áudio procedural.
*   Nenhum arquivo de áudio pré-gravado (`.mp3`, `.wav`, `.ogg`) é permitido na estrutura de diretórios. Todo o som é sintético e gerado via Web Audio API.
*   Limite estrito de no máximo 300 linhas por arquivo em todo o repositório.

#### Checklist de Validação Automatizada para Agentes de IA
A esteira de integração contínua (CI) e os scripts locais de pré-commit executam a seguinte sequência de checagem automatizada a cada alteração feita por agentes de IA:

| Camada de Validação | Ferramenta Enforçadora | Escopo de Verificação do Agente | Ação Executada em Caso de Falha |
| :--- | :--- | :--- | :--- |
| **Tipagem Estática** | `pnpm tsc --noEmit` | Valida a integridade de tipos em todos os pacotes sem emitir arquivos compilados. | Bloqueio do commit e retorno do relatório de erros de tipagem ao agente. |
| **Contratos e Regras de Jogo** | `pnpm test` (`vitest`) | Testa o motor $9 \times 9$ contra jogadas inválidas, bordas, empates e determinismo de estado. | Reversão automática (*rollback*) da alteração e re-execução em isolamento. |
| **Sanidade de UI e Áudio** | `playwright` | Garante inicialização do `AudioContext` sem erros e integridade visual dos componentes gráficos. | Bloqueio de mesclagem no branch principal. |
| **Arquitetura de Código** | Custom Linting Scripts | Garante que nenhum arquivo alterado ou criado exceda o teto de $300$ linhas de código. | Rejeição imediata do PR instruindo o agente a refatorar em sub-módulos. |
