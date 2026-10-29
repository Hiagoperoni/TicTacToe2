# Product Requirements Document (PRD) — Ultimate Tic-Tac-Toe (Super Jogo da Velha)

**Versão:** 1.0.0  
**Status:** Aprovado / Especificação Executável  
**Autor:** Principal Software & Game Architect  
**Alvo de Execução:** Monorepo TypeScript 100% conduzido por Agentes de IA  

---

## 1. Visão Geral do Produto e Objetivos Estratégicos

### 1.1 Visão
O **Ultimate Tic-Tac-Toe (Super Jogo da Velha)** é uma plataforma competitiva e casual avançada de estratégia abstrata. O produto eleva o jogo da velha clássico — historicamente trivial e de resultado empatado — a um eSport fractal e combinatório de alta profundidade tática, rodando de forma 100% serverless, multiplataforma (Web PWA, Mobile iOS/Android, Discord Activities, Poki/CrazyGames e Steam) com **custo zero de infraestrutura e zero custo de produção artística**.

### 1.2 Pilares Arquiteturais Invioláveis
1. **Zero-PII & Zero-Data:** Sem armazenamento de dados pessoais sensíveis, nomes reais, e-mails ou senhas. Identificação 100% pseudônima e opaca via OAuth (`sub`) ou hash de dispositivo.
2. **Zero-PCI Scope:** Nenhuma informação financeira ou de cartão trafega pelos servidores do jogo. Integrações exclusivamente via middlewares IAP (RevenueCat) e gateways/MoR externos (Mercado Pago, Paddle).
3. **Zero-Asset Sound & Graphics:** Ausência total de arquivos `.mp3`, `.wav` ou artes bitmap pesadas. Toda a experiência visual e sonora é gerada proceduralmente no cliente via Canvas 2D/WebGL, SVG dinâmico e Web Audio API.
4. **Zero Pay-to-Win:** A monetização é estritamente estética e de conveniência (skins, shaders, cosméticos e congelamento de ofensivas). Nenhuma vantagem competitiva pode ser comprada.
5. **Determinismo e Performance Extrema:** Motores de jogo e IA operam sobre **Bitboards (`Uint32Array`)** com alocação estática de memória (**Zero-GC Arena Allocator**), permitindo execuções a 60 FPS em qualquer dispositivo mobile básico.

---

## 2. Personas e Casos de Uso

| Persona | Perfil e Comportamento | Necessidade Primária | Solução no Produto |
| :--- | :--- | :--- | :--- |
| **Alex "The Strategist"** | Jogador competitivo de xadrez/Go, focado em subir no ranking Glicko-2. | Partidas rápidas e equilibradas sem trapaças ou lag. | Matchmaking por Glicko-2, Relógio Fischer autoritativo, Modos Ranqueados e Analisador MCTS Pós-Jogo. |
| **Sam "The Casual"** | Joga em sessões curtas (1-3 min) durante deslocamentos no transporte público. | Experiência fluida sem fricção de login e controle anti-erros de toque. | PWA leve (< 2MB), Smart Auto-Zoom anti-misclick, confirmação em dois toques e bot offline instantâneo. |
| **Leo "The Socialite"** | Curte desafiar amigos pelo Discord ou redes sociais sem exigir instalação de app. | Acesso instantâneo com 1 clique e compartilhamento de replays. | Fluxo *Link-to-Play* (`#room=x8k9`), Discord Activity nativo e exportação de replays em GIF/WebM (5s). |

---

## 3. Especificação Detalhada das Mecânicas de Jogo

### 3.1 Topologia e Geometria do Tabuleiro
O tabuleiro $G$ é um espaço fractal de dimensão $9 	imes 9$, resultante do produto cartesiano de um **Macro-Tabuleiro** $M$ ($3 	imes 3$) por 9 **Micro-Tabuleiros** $m$ ($3 	imes 3$):
$$|G| = 9 	imes 9 = 81 	ext{ células}$$

- **Mapeamento de Coordenadas:**
  - **Macro-Tabuleiro ($M$):** $R, C \in \{0, 1, 2\}$ (0: Superior/Esquerda, 1: Centro, 2: Inferior/Direita).
  - **Micro-Tabuleiro ($m$):** $r, c \in \{0, 1, 2\}$.
  - **Índice Linear Unificado (`cellIndex`):** $0 \dots 80$, dado por $cellIndex = (3R + r) 	imes 9 + (3C + c)$.
  - **Notação Algébrica Dual (DAN):** Formato `[Macro].[micro]` (ex: `B2.b2` para centro absoluto, `A1.c3` para célula inferior-direita do quadrante superior-esquerdo).
  - **Coordenadas Globais $(ho, \gamma)$:** Linhas $ho \in \{1 \dots 9\}$ e colunas $\gamma \in \{A \dots I\}$.

### 3.2 Regra de Redirecionamento e Regra Estrita de Free Move
- **Redirecionamento Compulsório:** Ao jogar na micro-célula $m_t = (r, c)$ do quadrante $M_t$, o jogador obriga o oponente a realizar a jogada seguinte dentro do micro-tabuleiro $M_{t+1} = (r, c)$.
- **Regra Estrita de Free Move:** Se o micro-tabuleiro de destino $M_{t+1}$ já estiver **resolvido** (vencido por X, por O ou empatado), a restrição de direcionamento é totalmente removida. O oponente recebe o estado `FREE_MOVE`, podendo escolher qualquer célula desocupada em qualquer micro-tabuleiro ainda aberto.

### 3.3 Critérios de Vitória Local e Resolução de Empates
- **Vitória Local (Micro-Tabuleiro):** Ocorre quando um jogador alinha 3 símbolos ($X$ ou $O$) na horizontal, vertical ou diagonal dentro do sub-tabuleiro.
- **Resolução de Empate Local (Variante A - Empate Neutro):** Se todas as 9 células de um micro-tabuleiro forem preenchidas sem vencedor, o quadrante assume o estado `DRAW_NEUTRAL`. Quadrantes empatados **não pontuam nem contam para alinhamentos no Macro-Tabuleiro**, atuando como obstáculos bloqueados para ambos os jogadores.

### 3.4 Critérios de Vitória Global e Hierarquia de Desempate
- **Vitória Global Padrão:** Conquistada pelo primeiro jogador que alinhar 3 sub-tabuleiros vencidos ($X$ ou $O$) no Macro-Tabuleiro $M$.
- **Macro Deadlock (Desempate Global em 3 Níveis):** Se o Macro-Tabuleiro for totalmente bloqueado por vitórias e empates sem que haja um alinhamento de 3 sub-tabuleiros, a partida é encerrada imediatamente e desempatada pela seguinte hierarquia estrita:
  1. **Nível 1:** Jogador com maior número de sub-tabuleiros (quadrantes) conquistados.
  2. **Nível 2:** Maior número total de células individuais marcadas ao longo de todo o tabuleiro $9 	imes 9$ (81 células).
  3. **Nível 3:** Vantagem do Jogador 2 ($O$), declarando $O$ vencedor como compensação matemática pela desvantagem de mover em segundo lugar.

### 3.5 Pie Rule (Swap Rule) no Turno 1
Para neutralizar a vantagem do primeiro jogador ($X$), aplica-se a **Pie Rule**:
1. No Turno 1 ($t=1$), o Jogador 1 efetua uma jogada inicial qualquer $u_1$.
2. No Turno 2 ($t=2$), o Jogador 2 pode escolher entre:
   - **Manter as cores:** Aceitar o movimento $u_1$ e realizar uma jogada válida normal $u_2$.
   - **Executar o SWAP:** Assumir o controle da peça $X$ colocada no movimento $u_1$, forçando o Jogador 1 a assumir as peças $O$ e realizar o lance seguinte no lugar do Jogador 2.

---

## 4. Modos de Jogo e Motor de Inteligência Artificial

### 4.1 Modos de Jogo e Variantes
- **Modos de Controle de Tempo Fischer:**
  - **Bullet:** $60	ext{s} + 1	ext{s}$ de incremento por lance.
  - **Blitz Ranqueado:** $120	ext{s} + 2	ext{s}$ de incremento.
  - **Rápido Padrão:** $180	ext{s} + 3	ext{s}$ de incremento.
  - **Competitivo:** $300	ext{s} + 5	ext{s}$ de incremento.
- **Variantes de Tabuleiro:**
  - `STANDARD`: Regras clássicas puras.
  - `FOG_OF_WAR` (Neblina de Guerra): Cada jogador enxerga apenas as células do sub-tabuleiro ativo para onde foi enviado e as últimas 2 jogadas realizadas.
  - `CHAOS_BLOCKED_CELLS`: 3 células são bloqueadas proceduralmente antes do início da partida, mantendo simetria pontual em relação ao centro $B2.b2$.

### 4.2 Motor de IA Unificado (Bitboards + MCTS)
Tanto o Bot Offline, quanto o Analisador Pós-Jogo (Web Worker) e o Ghost Bot de Fallback no Servidor (Cloudflare Durable Object) utilizam estritamente o mesmo motor **MCTS sobre Bitboards (`Uint32Array[8]`)** com **Zero-GC Arena Allocator**.

- **Layout de Memória Bitboard (`Uint32Array[8]` - 256 bits):**
  - `Index 0-2`: Jogador X (Micro 0-2, Micro 3-5, Micro 6-8; 9 bits por micro).
  - `Index 3-5`: Jogador O (Micro 0-2, Micro 3-5, Micro 6-8; 9 bits por micro).
  - `Index 6`: Estado Macro (bits 0..8: Vitórias X | bits 9..17: Vitórias O | bits 18..26: Empates).
  - `Index 7`: Controle de Turno (bits 0..3: `activeMacro` 0..8 | bit 4: `freeMove` | bit 5: `activePlayer`).
- **Máscaras Bitwise de Vitória $O(1)$:**
  - `0x007` (Linha Sup), `0x038` (Linha Mid), `0x1C0` (Linha Inf).
  - `0x049` (Col Esq), `0x092` (Col Mid), `0x124` (Col Dir).
  - `0x111` (Diag Prin), `0x054` (Anti-Diag).
- **Matriz de Calibragem dos 4 Níveis de Dificuldade:**
  - **Iniciante:** 150-300 iterações, $T = 2,0$ (Softmax alta entropia), $t_{	ext{delay}} = 200-400	ext{ms}$.
  - **Casual:** 1.500-3.000 iterações, $T = 1,0$, $t_{	ext{delay}} = 400-800	ext{ms}$.
  - **Competitivo:** 15.000-30.000 iterações, $T = 0,3$, $t_{	ext{delay}} = 600-1200	ext{ms}$.
  - **Mestre:** 100.000+ iterações (ou estouro de tempo de $1000	ext{ms}$), $T 	o 0$ (ArgMax estrito), tempo adaptativo por entropia de posição $H(S)$.

### 4.3 Analisador Pós-Jogo e Classificação de Lances
Localizado em Web Worker, avalia a variação da expectativa de vitória $\Delta W = W(s_t) - W(s_{t-1})$ onde $W(s) = rac{V(s) + 1}{2}$:
- **Brilhante (`!!`):** $\Delta W \ge -0.01 \land (W_{	ext{profundo}} - W_{	ext{raso}} > 0.25)$ com sacrifício tático do quadrante local.
- **Precisa (`!`):** $\Delta W \ge -0.01$.
- **Excelente (`✓`):** $-0.02 \le \Delta W < -0.01$.
- **Boa:** $-0.05 \le \Delta W < -0.02$.
- **Imprecisão (`?!`):** $-0.10 \le \Delta W < -0.05$.
- **Erro (`?`):** $-0.20 \le \Delta W < -0.10$.
- **Erro Crítico (`??`):** $\Delta W < -0.20$.

---

## 5. Arquitetura Multiplayer e Infraestrutura Serverless

### 5.1 Autoridade na Borda (Cloudflare Durable Objects & PartyKit)
- Cada sala de jogo é um Actor isolado instanciado via `idFromName(match_id)`.
- **WebSocket Hibernation API:** Mantém estado na memória RAM da borda e reduz custos hibernando conexões ociosas (`acceptWebSocket`, `serializeAttachment`).
- **Resiliência Mobile:** Desconexões temporárias concedem janela de graça de 30 segundos (via Cloudflare Alarms API) para reconexão transparente usando `resume_token` HMAC-SHA256.

### 5.2 Matchmaking e Glicko-2
- Algoritmo Glicko-2 completo com 5 passos matemáticos (parâmetros $r, RD, \sigma$).
- Atualização de volatilidade $\sigma'$ via Algoritmo Illinois de Falsa Posição ($	au = 0,5$, convergência em $|B - A| \le 10^{-6}$).
- Expansão de janela de busca: $\Delta	ext{MMR}(t) = 50 + 15 \cdot t^{1.2}$.
- **Fallback de Ghost Bot:** Se o tempo na fila exceder 15s, injeta-se silenciosamente uma instância do Ghost Bot MCTS imitando um jogador humano com variação gaussiana de tempo de reação.

---

## 6. Economia F2P Ética e Cosméticos Procedurais

### 6.1 Modelo Monetário Zero Pay-to-Win
O jogo utiliza uma economia equilibrada de dupla moeda:
- **Moeda Suave (Ouro):** Obtida gratuitamente ao jogar. Fluxo médio diário para jogador ativo:
  $$G_{	ext{diário}} = (3 \cdot [0,5 \cdot 20 + 0,5 \cdot 5]) + 100 	ext{ (Missões)} + 150 	ext{ (Desafio Diário)} = 287,5 	ext{ Ouro/dia}$$
- **Moeda Premium (Gemas):** Adquirida via compras In-App ou na trilha gratuita do Passe.

### 6.2 Catálogo de Ralos de Consumo
| Item Cosmético | Moeda | Preço | Tempo de Esforço Equivalente |
| :--- | :--- | :--- | :--- |
| **Streak Freeze (Congelamento de Ofensiva)** | Ouro | 300 Ouro | 1,04 dias |
| **Skin Vetorial SVG de Peças ($X / O$)** | Ouro | 1.500 Ouro | 5,21 dias |
| **Shader GLSL de Tabuleiro Radial** | Ouro | 4.000 Ouro | 13,91 dias |
| **Passe de Temporada (30 dias)** | Gemas | 500 Gemas | Compras IAP (\$4,99 USD) |

---

## 7. Requisitos Não-Funcionais (NFRs)

### 7.1 Performance e Carga
- **Footprint do Bundle:** $< 2.0 	ext{ MB}$ de carregamento inicial no navegador.
- **Taxa de Quadros:** 60 FPS constante no Canvas 2D/WebGL sem quedas de frames (*zero garbage collection freeze*).
- **Consumo de Memória:** $< 50 	ext{ MB}$ de uso de RAM no ambiente de runtime do cliente.

### 7.2 Latência e Sincronização de Rede
- **Tamanho do Frame WebSocket:** Limite rígido de $16 	ext{ KB}$ por pacote (código de término `1009`).
- **Rate Limit de Conexão:** Máximo de 10 msgs/s por conexão (`1008`) e 5 conexões/s por IP (HTTP `429`).
- **Compensação de Latência:** Relógio Fischer sincronizado via *One-Way Delay* ($L_{	ext{oneway}} = 	ext{RTT}/2$) com trava de segurança de drift temporal $T_{	ext{drift\_threshold}} = 200	ext{ ms}$.

### 7.3 Acessibilidade e UX Mobile
- **Smart Auto-Zoom:** Aplica ampliação de $220\% - 280\%$ enquadrando $85\%$ do viewport ao selecionar um quadrante, garantindo área de toque $> 48 	imes 48 	ext{ px}$ (solução definitiva para o *Fat-Finger Problem*).
- **Two-Step Confirmation:** Toque 1 seleciona a célula; Toque 2 confirma o lance.
- **AudioContext Management:** Inicialização sob demanda com retomada por clique (`resumeAudioContext`). Efeitos 100% sintetizados em código sem depender de arquivos de mídia pré-gravados.

---

## 8. Conformidade, Privacidade e Segurança (Zero-PII & Zero-PCI)

### 8.1 Arquitetura Zero-PII
- Armazenamento de identificadores opacos de provedores OAuth (`google_sub`, `apple_sub`, `discord_sub`) via alegação `sub`.
- Sem coleta de e-mail, nomes de usuário reais, endereços IP ou localização precisa.
- Exclusão de conta simplificada via rotina em cascata (`ON DELETE CASCADE`) no Supabase, acessível tanto no app quanto em uma URL web pública.

### 8.2 Proteção de Menores e Age Gate (ECA Digital, LGPD, COPPA)
- **Age Gate Neutro:** Solicitação de data de nascimento sem indicar idade mínima ideal.
- Configuração automática de SDKs de Anúncios e Analytics:
  - Para `< 13 anos`: Desativação total de métricas rastreáveis, anúncios estritamente contextuais sem coleta de ID de publicidade (`TFUA = true`, `COPPA = true`, `npa = 1`).

### 8.3 DDL do Banco de Dados Relacional Unificado (Supabase PostgreSQL)

```sql
-- TABELA UNIFICADA DE USUÁRIOS (ZERO-PII + GLICKO-2 + COMPLIANCE)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_device_id VARCHAR(64) UNIQUE,
    google_sub VARCHAR(255) UNIQUE,
    apple_sub VARCHAR(255) UNIQUE,
    discord_sub VARCHAR(255) UNIQUE,
    age_gate_status VARCHAR(16) NOT NULL DEFAULT 'UNDER_13' 
        CHECK (age_gate_status IN ('UNDER_13', 'TEEN_13_17', 'ADULT_18_PLUS')),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'RESTRICTED', 'BANNED', 'PENDING_DELETION')),
    
    -- Parâmetros Glicko-2
    rating NUMERIC(8,2) NOT NULL DEFAULT 1500.00,
    rd NUMERIC(8,2) NOT NULL DEFAULT 350.00,
    volatility NUMERIC(8,6) NOT NULL DEFAULT 0.060000,
    
    -- Progresso e Retenção
    streak_count INT NOT NULL DEFAULT 0 CHECK (streak_count >= 0),
    streak_freezes INT NOT NULL DEFAULT 0 CHECK (streak_freezes >= 0),
    last_played_at TIMESTAMPTZ,
    
    -- Controle Interno
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STORED PROCEDURE ATÔMICA DE FINALIZAÇÃO DE PARTIDA
CREATE OR REPLACE FUNCTION public.finalize_match(
    p_match_id VARCHAR(64),
    p_player_white_id UUID,
    p_player_black_id UUID,
    p_winner_id UUID,
    p_pgn_replay TEXT,
    p_variant VARCHAR(32),
    p_time_control VARCHAR(32),
    p_white_r_new NUMERIC(8,2),
    p_white_rd_new NUMERIC(8,2),
    p_white_vol_new NUMERIC(8,6),
    p_black_r_new NUMERIC(8,2),
    p_black_rd_new NUMERIC(8,2),
    p_black_vol_new NUMERIC(8,6),
    p_gold_reward_white INT,
    p_gold_reward_black INT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.match_history (
        match_id, player_white_id, player_black_id, winner_id, pgn_replay,
        variant, time_control, white_rating_before, white_rating_after, black_rating_before, black_rating_after
    ) SELECT
        p_match_id, p_player_white_id, p_player_black_id, p_winner_id, p_pgn_replay,
        p_variant, p_time_control, w.rating, p_white_r_new, b.rating, p_black_r_new
    FROM public.users w, public.users b WHERE w.id = p_player_white_id AND b.id = p_player_black_id;

    UPDATE public.users SET rating = p_white_r_new, rd = p_white_rd_new, volatility = p_white_vol_new, last_played_at = NOW() WHERE id = p_player_white_id;
    UPDATE public.users SET rating = p_black_r_new, rd = p_black_rd_new, volatility = p_black_vol_new, last_played_at = NOW() WHERE id = p_player_black_id;

    UPDATE public.virtual_wallets SET gold_balance = gold_balance + p_gold_reward_white, updated_at = NOW() WHERE user_id = p_player_white_id;
    UPDATE public.virtual_wallets SET gold_balance = gold_balance + p_gold_reward_black, updated_at = NOW() WHERE user_id = p_player_black_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---
