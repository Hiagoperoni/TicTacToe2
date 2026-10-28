# Compliance Legal, Privacy-by-Design e Engenharia de Segurança AppSec para Jogos Eletrônicos

A publicação e distribuição comercial de jogos eletrônicos gratuitos (*Free-to-Play*) com suporte a compras no aplicativo (*In-App Purchases*) e exibição de anúncios publicitários exige a convergência entre a engenharia de privacidade de dados (*Privacy-by-Design*) e os controles de segurança de aplicação (*AppSec*). No ecossistema regulatório contemporâneo — estruturado pela Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) no Brasil, pelo Regulamento Geral sobre a Proteção de Dados (GDPR) na União Europeia e pelo *Children's Online Privacy Protection Act* (COPPA) nos Estados Unidos, além de diplomas como o Marco Legal dos Jogos Eletrônicos (Lei nº 14.852/2024), a Lei do Bullying e Cyberbullying (Lei nº 14.811/2024) e o Estatuto da Criança e do Adolescente Digital (ECA Digital - Lei nº 15.211/2025) —, a coleta indiscriminada de Dados Pessoais Identificáveis (PII) eleva de forma exponencial o risco jurídico e os custos operacionais do desenvolvedor.

A adoção de uma arquitetura **Zero-PII** visa garantir que a infraestrutura do aplicativo opere fundamentada exclusivamente em identificadores pseudônimos e opacos. Essa abordagem neutraliza passivos regulatórios decorrentes de potenciais vazamentos de dados, reduz os custos administrativos de atendimento aos direitos dos titulares e cumpre rigorosamente as exigências contratuais de publicação impostas pela Google Play Store e pela Apple App Store.

---

## 1. Estratégia Zero-PII e Arquitetura de Minimização de Dados (LGPD, GDPR e COPPA)

### Autenticação Pseudônima e Federação de Identidade

A estratégia Zero-PII fundamenta-se no princípio da minimização de dados, prescrevendo que nenhum dado pessoal diretamente identificável — tais como nome civil, Cadastro de Pessoas Físicas (CPF), endereço de e-mail, número de telefone ou foto de perfil — seja coletado, processado ou mantido no banco de dados proprietário do jogo.

O fluxo de gerenciamento de identidade é estruturado em duas etapas progressivas:

1. **Autenticação Anônima Inicial (*Anonymous Auth / Device ID*):** Na primeira execução do aplicativo no dispositivo móvel, o sistema gera um identificador único aleatório (UUID v4) ou obtém um identificador por fornecedor fornecido pelo sistema operacional (como o IDFV no iOS). Este identificador é armazenado localmente em armazenamento seguro do dispositivo (*Keychain* no iOS ou *EncryptedSharedPreferences* no Android). O servidor do jogo consome este valor como uma conta anônima temporária à qual vincula o estado, moedas virtuais e inventários do jogo.
2. **Upgrade Opcional para Autenticação Social (*Social Identity Federation*):** Para viabilizar a recuperação de conta e a sincronização do progresso entre múltiplos dispositivos, o jogo permite ao usuário vincular voluntariamente sua sessão a provedores externos de identidade (Google Play Games Services, Apple Sign-In e Discord OAuth). A requisição OAuth é tecnicamente restrita ao escopo mínimo de autenticação (`openid`).

Na resposta do fluxo de autenticação federada, o backend do jogo extrai e armazena **exclusivamente** a alegação do identificador do sujeito (*Subject Identifier* ou `sub`). O valor `sub` consiste em uma cadeia alfanumérica opaca, imutável e gerada deterministicamente pelo provedor de identidade de forma pareada para a aplicação do desenvolvedor. Esse identificador não permite a reversão ou a descoberta da identidade do indivíduo no mundo real sem a cooperação do próprio provedor de identidade mediante ordem judicial.

```typescript
// Exemplo de extração estrita da alegação 'sub' do token OAuth no backend
import { decodeJwt } from "jose";

interface MinimalOAuthClaims {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
}

export function extractOpaqueSubject(identityToken: string): string {
  const claims = decodeJwt(identityToken) as unknown as MinimalOAuthClaims;
  
  if (!claims.sub || typeof claims.sub !== "string") {
    throw new Error("Token de identidade inválido: alegação 'sub' ausente.");
  }
  
  // Retorna estritamente o ID opaco sem registrar nome, e-mail ou foto
  return claims.sub;
}
```

### Impacto Legal e Simplificação Operacional sob a LGPD

A substituição de dados cadastrais tradicionais por identificadores opacos e pseudônimos traz reflexos diretos no cumprimento das obrigações da Lei Geral de Proteção de Dados (Lei nº 13.709/2018):

* **Mitigação do Risco do Artigo 46 da LGPD:** Na hipótese de uma exfiltração não autorizada do banco de dados relacional ou NoSQL do jogo por cibercriminosos, o material obtido conterá unicamente identificadores numéricos, pontuações e itens virtuais sem qualquer vínculo direto a nomes ou e-mails. Como não há dados pessoais identificáveis expostos, o incidente não configura "risco ou dano relevante aos titulares", dispensando a comunicação pública compulsória de vazamento e reduzindo drasticamente sanções administrativas da Autoridade Nacional de Proteção de Dados (ANPD).
* **Simplificação do Atendimento aos Direitos do Titular (Artigo 18 da LGPD / DSAR):** O atendimento às requisições de Acesso (Art. 18, II) e Eliminação (Art. 18, VI) torna-se direto e automatizado. Inexistindo registros de PII espalhados por tabelas secundárias, backups ou logs de comunicação, o processo de exclusão consiste em uma instrução atômica `DELETE` associada ao `user_id`. Isso reduz substancialmente os custos operacionais com solicitações de titulares (*Data Subject Access Requests - DSAR*).
* **Isenção de Elaboração de RIPD/DPIA Complexos:** O processamento de dados restrito a identificadores pseudônimos para execução de mecânicas de jogo não envolve decisões automatizadas de alto risco, perfilamento comportamental invasivo ou tratamento de dados sensíveis. A elaboração do Relatório de Impacto à Proteção de Dados Pessoais (RIPD) é dispensada ou simplificada para uma análise de baixo risco.
* **Adequação da Hipótese Legal (Artigo 7º, V da LGPD):** O tratamento de dados no modelo Zero-PII dispensa a coleta de consentimento revogável (Artigo 7º, I), fundamentando-se diretamente na Execução de Contrato e procedimentos preliminares (Artigo 7º, V da LGPD), uma vez que o identificador é estritamente necessário para prestar o serviço de entretenimento digital contratado pelo jogador.

---

## 2. Exigências Críticas das Lojas de Aplicativos e Proteção de Menores

### Exclusão de Conta Obrigatória e Ciclo de Vida do Titular

A Google Play Store e a Apple App Store estabelecem diretrizes estritas para qualquer aplicativo que permita a criação de conta ou perfil de usuário. As regras determinam que a exclusão da conta e de seus dados associados deve ser viabilizada de maneira simples e acessível.

Para garantir a conformidade contratual com as lojas e com a regulamentação de dados, a arquitetura deve fornecer dois caminhos independentes de exclusão:

1. **Fluxo In-App Nativamente Acessível:** Dentro do menu de configurações do jogo, deve existir um botão claro com o texto "Excluir Minha Conta e Dados". Ao ser acionado pelo usuário e confirmado via caixa de diálogo, o aplicativo realiza uma chamada HTTP DELETE autenticada ao servidor, que por sua vez executa a remoção completa e em cascata de todos os registros atrelados àquele `user_id`.
2. **Fluxo via Link Web Público (*Delete Account URL*):** De acordo com as normas da Google Play, os desenvolvedores devem cadastrar obrigatoriamente no Google Play Console (na seção de *Data Safety*) uma URL pública em protocolo HTTPS mantida no domínio do estúdio. Esta página web permite que qualquer usuário solicite a exclusão de sua conta e dados sem a necessidade de manter o aplicativo instalado no dispositivo.

Quando a solicitação de exclusão é processada no backend, os identificadores do usuário e seus estados de jogo associados devem ser apagados de forma permanente do banco de dados operacional. Caso a retenção de determinados registros seja estritamente exigida por razões fiscais, prevenção a fraudes no sistema financeiro das lojas ou cumprimento de obrigações regulatórias, o desenvolvedor deve desvincular qualquer ponteiro do registro mantido, isolando-o em tabelas de auditoria. Além disso, o sistema deve emitir notificações programmaticamente via webhooks de privacidade para as redes de anúncios integradas (como Google AdMob ou Unity Ads) para que eliminem o histórico do identificador de publicidade em suas bases.

### Proteção de Crianças e Adolescentes (ECA Digital, Lei nº 14.811/2024, LGPD Art. 14 e COPPA)

A legislação aplicável a crianças e adolescentes em ambientes digitais no Brasil teve avanços significativos com a aprovação do Marco Legal dos Jogos Eletrônicos (Lei nº 14.852/2024), da Lei de Combate ao Bullying e Cyberbullying (Lei nº 14.811/2024) e do Estatuto da Criança e do Adolescente Digital (Lei nº 15.211/2025).

Para viabilizar a distribuição do jogo em compliance com o Artigo 14 da LGPD, a COPPA norte-americana e as leis de proteção infantil brasileiras, o aplicativo deve implementar as seguintes salvaguardas técnicas:

* **Mecanismo de Age Gate Neutro:** O aplicativo deve apresentar uma tela de verificação de idade sem indicar a idade mínima exigida ou utilizar seleções pré-preenchidas. O usuário deve inserir manualmente o ano ou a data de nascimento.
* **Configuração Dinâmica dos SDKs de Publicidade (*Flags TFUA e COPPA*):** Quando a idade declarada no *Age Gate* for inferior a 13 anos (para fins da COPPA nos EUA) ou inferior a 18 anos (sob as exigências do ECA Digital, LGPD no Brasil e GDPR na Europa), os SDKs de anúncios integrados devem ser inicializados dinamicamente com parâmetros de restrição de privacidade:
  * *Google AdMob:* A aplicação deve chamar os métodos de configuração de privacidade antes da requisição do primeiro anúncio, definindo `tagForChildDirectedTreatment` como verdadeira para menores de 13 anos e `tagForUnderAgeOfConsent` (`TFUA`) como verdadeira para usuários abaixo da idade de consentimento na União Europeia e Brasil.
  * *Forçamento de Anúncios Não Personalizados (NPA):* A requisição de anúncios deve conter a propriedade `npa=1`, instruindo os servidores das redes de anúncios a servirem exclusivamente publicidade contextual, desativando a coleta do identificador de publicidade do dispositivo (IDFA no iOS ou GAID no Android) para rastreamento comportamental.
* **Mecanismos de Prevenção ao Cyberbullying (Lei nº 14.811/2024):** A inclusão do Artigo 146-A no Código Penal pela Lei nº 14.811/2024 criminaliza a intimidação sistemática virtual em jogos online. Plataformas de jogos acessíveis a menores devem manter salas de bate-papo abertas bloqueadas por padrão para contas identificadas como de menores de idade, implementar filtros automáticos na borda para bloqueio de linguagem ofensiva e fornecer botão acessível para denúncia e bloqueio instantâneo de usuários agressores.

### Substituição de Loot Boxes por Compra Direta e Passe de Batalha

A utilização de caixas de recompensa aleatórias pagas (*Loot Boxes*) tem enfrentado rejeição regulatória e judicial global por sua analogia a jogos de azar e pelos riscos de indução do público infantojuvenil ao consumo compulsivo.

No cenário nacional, o Marco Legal dos Jogos Eletrônicos (Lei nº 14.852/2024, Art. 15) estabelece a priorização do melhor interesse da criança e do adolescente, e o ECA Digital (Lei nº 15.211/2025, Art. 20) proíbe mecanismos aleatórios pagos em jogos eletrônicos direcionados a menores ou de acesso provável por eles. A manutenção de *Loot Boxes* expõe o projeto a sanções da SENACON, da ANPD e dos Ministérios Públicos estaduais, além de causar a rejeição do aplicativo durante a revisão das lojas.

A arquitetura comercial recomendada para mitigar riscos jurídicos baseia-se em dois pilares:

1. **Loja de Compra Direta:** Aquisição de bens digitais (como customizações estéticas e cosméticos) com preços exibidos em moeda corrente local (BRL), permitindo que o consumidor identifique e selecione exatamente o item que está adquirindo antes da efetivação da transação.
2. **Passe de Batalha (*Battle Pass*) Transparente:** Sistema de progressão linear no qual o jogador visualiza antecipadamente a trilha de recompensas associada a cada nível. O desbloqueio de itens depende estritamente do engajamento no jogo e do cumprimento de metas claras, eliminando a aleatoriedade paga.

---

## 3. Segurança de Infraestrutura Serverless e Proteção do Protocolo WebSocket

### Arquitetura Serverless WebSocket (PartyKit e Cloudflare)

Servidores de jogos distribuídos em tempo real construídos sobre plataformas Serverless — como o PartyKit fundamentado no Cloudflare Durable Objects — oferecem baixa latência no processamento de estado de jogo na borda da rede (*edge*). No entanto, a exposição pública de endpoints WebSocket contínuos torna a aplicação vulnerável a ataques de Negação de Serviço Distribuída (DDoS), esgotamento de memória e ataques de amplificação de custos de infraestrutura (*Denial of Wallet*).

Para proteger a infraestrutura Serverless contra sobrecargas e acessos maliciosos, a aplicação deve adotar os seguintes mecanismos de proteção:

* **Arquitetura de Hibernação de WebSockets (*WebSocket Hibernation API*):** A utilização da API de hibernação de WebSockets do Cloudflare Durable Objects permite que a instância de computação libere memória RAM e recursos de CPU enquanto os clientes conectados estiverem ociosos. Durante a hibernação, a conexão TCP/TLS permanece aberta na borda da rede, e a cobrança de mensagens recebidas cai para uma fração do custo normal por requisição (1/20 avos do valor da requisição padrão).
* **Limitação de Taxa de Conexões (*Rate Limiting*):** Implementação de regras de controle de vazão diretamente na camada do Cloudflare Worker / Edge Gateway antes do repasse da conexão ao Durable Object. Tentativas de conexões que excedam os limites de requisições por IP são bloqueadas imediatamente com o código de status HTTP `429 Too Many Requests`.
* **Restrição do Tamanho Máximo do Quadro WebSocket:** Limitar o tamanho máximo aceito de mensagens WebSocket a **16 KB**. Qualquer mensagem individual que ultrapasse essa marca deve provocar a desconexão sumária da sessão pelo servidor Serverless com a emissão do código de encerramento WebSocket `1009 Message Too Big`.

### Autenticação no Handshake e Validação de Payload na Borda

Como as especificações de navegadores e SDKs de comunicação móvel impedem a adição de cabeçalhos HTTP personalizados durante a negociação do *handshake* WebSocket, a verificação de autenticidade deve ser realizada passando um JSON Web Token (JWT) assinado de vida curta (por exemplo, com expiração em 60 segundos) no parâmetro de consulta (*query string*) do protocolo.

Ao receber a requisição de atualização de protocolo (`Upgrade: websocket`), o worker de borda intercepta a URL, extrai o token, valida a assinatura HMAC-SHA256 ou RS256 e confirma a validade temporal. Caso o token seja inválido ou esteja expirado, o upgrade é recusado imediatamente na borda sem gerar custos de computação no Durable Object.

Para conter ataques de injeção de dados e a submissão de mensagens malformadas projetadas para explorar falhas na lógica do jogo, a aplicação deve realizar a sanitização de todas as mensagens recebidas via WebSocket. A biblioteca Zod deve ser empregada para aplicar validação estrita de esquemas na entrada de dados:

```typescript
import { z } from "zod";

// Schema estrito para validação de ações de jogo no servidor de borda
export const GameActionSchema = z.object({
  type: z.enum(["MOVE", "USE_ITEM", "EMOTE"]),
  sequence: z.number().int().positive(),
  payload: z.object({
    x: z.number().min(-5000).max(5000),
    y: z.number().min(-5000).max(5000),
    itemId: z.string().alphanumeric().max(32).optional(),
  }).strict(), // .strict() rejeita propriedades não declaradas
}).strict();

export type GameAction = z.infer<typeof GameActionSchema>;

// Função de validação executada no handler de mensagens da borda
export function parseAndValidateFrame(rawFrame: string): GameAction {
  let parsedJson: unknown;
  
  try {
    parsedJson = JSON.parse(rawFrame);
  } catch {
    throw new Error("Erro de codificação: Mensagem não é um JSON válido.");
  }

  // Executa a validação de schema. Caso falhe, dispara uma exceção imediata
  return GameActionSchema.parse(parsedJson);
}
```

### Gestão Segura de Variáveis de Ambiente e Segredos de Infraestrutura

Nenhuma chave privada, segredo de cliente (*OAuth Client Secrets*) ou credencial de API para serviços internos ou de terceiros (como RevenueCat, Google Play Developer API ou Firebase Admin) deve ser embutida no código do cliente ou empacotada nos arquivos binários distribuídos (APK/AAB para Android e IPA para iOS). O código executado no dispositivo móvel deve ser considerado um ambiente totalmente exposto a engenharia reversa por meio de ferramentas de descompilação e inspeção de memória.

A gestão de segredos na infraestrutura do jogo exige os seguintes controles:

* **Injeção de Segredos na Borda Serverless:** Os segredos do servidor devem ser armazenados exclusivamente no ambiente seguro da plataforma de nuvem utilizando criptografia de segredos (*Cloudflare Encrypted Secrets*), vinculados ao projeto via comandos de gerenciamento CLI (`wrangler secret put SECRET_NAME`) ou pelo painel administrativo da plataforma.
* **Isolamento de Variáveis Públicas e Privadas:** O projeto deve segregar estritamente variáveis de ambiente orientadas ao cliente (com prefixos como `PUBLIC_`) das chaves privadas do servidor.
* **Princípio do Menor Privilégio na Integração de APIs:** As contas de serviço configuradas na nuvem para comunicação com as APIs das lojas de aplicativos devem ser restritas às permissões mínimas necessárias para verificação de recibos de compra e gerenciamento de assinaturas, passando por procedimentos periódicos de rotação de chaves.

---

## 4. Entregáveis Práticos: Checklists, Modelagem e Matrizes de Blindagem

### Checklist de Conformidade Legal para Lançamento

A tabela a seguir consolida os requisitos legais e regulatórios obrigatórios que devem ser auditados antes da distribuição comercial do aplicativo nas lojas oficiais:

| Domínio de Conformidade | Exigência Obrigatória | Ação Técnica de Implementação | Base Legal / Normativa |
| :--- | :--- | :--- | :--- |
| **Termos de Uso** | Transparência contratual e regras de conduta | Exibir Termos de Uso no primeiro acesso. Incluir vedações contra trapaças (*cheating*), condutas de cyberbullying e declaração da natureza dos bens digitais. | Código de Defesa do Consumidor / Lei nº 14.811/2024 |
| **Política de Privacidade** | Transparência no tratamento Zero-PII | Publicar Política de Privacidade acessível detalhando a ausência de coleta de PII direta e a utilização exclusiva de IDs pseudônimos. | LGPD Art. 9º / GDPR Art. 13 |
| **Direitos do Titular** | Exclusão de conta dentro do aplicativo | Implementar botão nativo de exclusão nas configurações do jogo que remova o registro e os dados associados. | Google Play Data Safety / App Store Guideline 5.1.1(v) |
| **Direitos do Titular** | Exclusão de conta via Web Pública | Manter formulário web seguro (HTTPS) no site do desenvolvedor para solicitações de exclusão sem dependência do aplicativo instalado. | Diretriz Explícita da Google Play Store |
| **Proteção Infantil** | Controladores de anúncio e *Age Gate* | Implementar *Age Gate* neutro. Se o usuário for menor de idade, ativar as *flags* `TFUA=true`, `COPPA=true` e `npa=1` nos SDKs de publicidade. | LGPD Art. 14 / COPPA / ECA Digital (Lei nº 15.211/2025) |
| **Monetização** | Isenção de mecanismos aleatórios pagos | Utilizar estritamente Loja de Compra Direta e Passe de Batalha com preços claros. Eliminar caixas de recompensa aleatórias pagas (*Loot Boxes*). | Marco Legal dos Jogos Eletrônicos (Art. 15) / ECA Digital (Art. 20) |

### Modelagem da Tabela `users` em Arquitetura Zero-PII

A estrutura da tabela principal de usuários abaixo exemplifica a implementação do conceito de minimização de dados no banco de dados relacional do projeto:

| Nome da Coluna | Tipo de Dado | Restrições / Indexação | Justificativa Técnica e Função de Privacidade |
| :--- | :--- | :--- | :--- |
| `user_id` | `UUID` | `PRIMARY KEY` | Identificador interno único e aleatório gerado pelo servidor para a conta de jogo. |
| `anonymous_device_id` | `VARCHAR(64)` | `UNIQUE`, `NULLABLE` | Hash SHA-256 do identificador do dispositivo. Utilizado exclusivamente para manter a sessão da conta anônima inicial. |
| `google_sub` | `VARCHAR(255)` | `UNIQUE`, `NULLABLE` | Identificador opaco (`sub`) retornado pelo Google Play Games Services após vínculo social. |
| `apple_sub` | `VARCHAR(255)` | `UNIQUE`, `NULLABLE` | Identificador opaco (`sub`) derivado do token de identidade do *Sign in with Apple*. |
| `discord_sub` | `VARCHAR(255)` | `UNIQUE`, `NULLABLE` | Identificador opaco (`sub`) derivado da autenticação via Discord OAuth2. |
| `age_gate_status` | `VARCHAR(16)` | `NOT NULL` | Estado retornado no controle de idade (`ADULT` ou `MINOR`). Define a configuração dos SDKs de anúncios. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Data e hora em formato UTC da criação do registro. Necessário para auditorias de infraestrutura. |
| `last_login_at` | `TIMESTAMPTZ` | `NOT NULL` | Data e hora do último acesso. Utilizado em rotinas de expurgo automático de contas anônimas inativas após 365 dias. |

### Matriz de Blindagem de Segurança AppSec (Proteção de Borda e Servidor)

A matriz a seguir mapeia as ameaças à infraestrutura Serverless, definindo a camada de atuação, os parâmetros numéricos recomendados e as respostas automáticas da infraestrutura:

| Vetor de Ameaça | Camada de Atuação | Parâmetro / Métrica de Controle | Resposta Automática da Infraestrutura |
| :--- | :--- | :--- | :--- |
| **Exaustão de Conexões WS (DDoS)** | Edge / Cloudflare Workers | Máximo de 5 conexões por segundo por endereço IP. Ativação da *WebSocket Hibernation API* no PartyKit. | Rejeição no *handshake* com `HTTP 429` ou desconexão imediata no Edge Gateway. |
| **Inundação de Mensagens (JSON Flood)** | Servidor Serverless (PartyKit) | Limite máximo de 10 mensagens por segundo por sessão de cliente ativa. | Encerramento imediato do socket com emissão do código `1008 Policy Violation`. |
| **Payload Oversized (Buffer Overflow)** | Borda (Edge Adapter) | Tamanho máximo aceito do quadro WebSocket fixado em **16 KB**. | Fechamento da sessão com código `1009 Message Too Big`. |
| **Injeção de Dados Maliciosos** | Validador de Schema (Zod) | Validação estrita de esquemas em tempo de execução via método `.strict()`. | Rejeição da mensagem malformada sem alteração de estado no banco de dados. |
| **Vazamento de Chaves Privadas** | Gestão de Segredos | Armazenamento via *Cloudflare Encrypted Secrets* sem inclusão nos binários móveis. | Bloqueio de acesso a recursos de backend a requisições não autenticadas na borda. |

---

## 5. Conclusões e Recomendações Operacionais

A convergência entre conformidade regulatória e engenharia de segurança representa uma vantagem competitiva sustentável no mercado de jogos eletrônicos. A adoção de uma arquitetura baseada na estratégia **Zero-PII** extingue o passivo decorrente da custódia de dados pessoais sensíveis ou identificáveis, desonerando o estúdio do cumprimento de rotinas operacionais complexas sob a LGPD e o GDPR.

Do ponto de vista de infraestrutura, a implementação do protocolo WebSocket sobre plataformas Serverless como **PartyKit e Cloudflare Durable Objects** — aliada à hibernação de sockets, limitação de taxa de requisições e validação estrita de esquemas com Zod — garante resiliência contra ataques de Negação de Serviço (*DDoS*) e previne a escalada imprevista de custos de computação em nuvem (*Denial of Wallet*).

Para assegurar a publicação eficiente e mitigar riscos legais e operacionais, recomendam-se as seguintes etapas executivas:

1. **Ajuste de Monetização:** Substituir completamente mecânicas aleatórias pagas (*Loot Boxes*) por Lojas de Compra Direta e Passes de Batalha determinísticos, assegurando conformidade com o Marco Legal dos Jogos Eletrônicos e o Estatuto da Criança e do Adolescente Digital.
2. **Homologação das Rotas de Exclusão:** Validar tecnicamente a rotina de exclusão de conta em cascata no caminho *in-app* e implantar a URL pública HTTPS de exclusão de conta e dados exigida pelas plataformas de distribuição móvel.
3. **Isolamento de Segredos de Servidor:** Realizar auditoria nos repositórios de código e scripts de compilação para garantir que nenhuma chave privada ou segredo de API de terceiros esteja presente nos arquivos binários distribuídos aos clientes, transferindo todas as integrações sensíveis para a camada de servidores de borda autenticados.
