# Arquitetura de Pagamentos Cross-Platform "Zero-Data" e Gerenciamento de Assinaturas/IAP

## 1. Estratégia de Unificação Cross-Platform e Gerenciadores de IAP Mobile

A unificação da monetização em aplicações e jogos multiplataforma que operam simultaneamente em iOS, Android, Web e PC exige o desacoplamento rigoroso entre a gestão de identidade do jogador e o processamento financeiro. Em uma **Zero-Data Architecture**, a meta primária é atingir conformidade total com o menor nível de escopo do Padrão de Segurança de Dados do Setor de Cartões de Pagamento (*Payment Card Industry Data Security Standard* - PCI-DSS SAQ A). Nesse modelo, a infraestrutura própria do desenvolvedor não processa, transmite ou armazena números de cartão de crédito (PAN), códigos de verificação (CVV) ou dados fiscais identificáveis.

Para centralizar e abstrair a complexidade de validação de recibos nativos do Apple StoreKit e do Google Play Billing, o uso de um middleware especializado em in-app purchases (IAP) atua como uma camada autoritativa intermediária, unificando a emissão de direitos de uso (*entitlements*) e normalizando o estado das assinaturas.

### Análise Comparativa de Middlewares IAP: RevenueCat, Adapty e Qonversion

A precificação das plataformas de unificação de IAP é majoritariamente baseada na métrica de Receita Mensal Rasteada (*Monthly Tracked Revenue* - MTR), que representa o volume bruto faturado através das lojas antes da dedução das comissões cobradas pela Apple e pelo Google.

*   **RevenueCat**: Isento de cobrança no Free Tier até $2.500 USD de MTR mensal. Acima desse valor, cobra 1% sobre o MTR excedente (ou planos de $8 a $12 por $1.000 MTR em faixas específicas). Possui o maior ecossistema de SDKs (Unity, React Native, Flutter, Native) e integrações consolidadas. Contudo, o modelo percentual linear escala indefinidamente, gerando um custo operacional expressivo em volumes elevados (> $100k MTR).
*   **Adapty**: Oferece limite gratuito até $5.000 ou $10.000 USD de MTR, migrando para um modelo de taxa fixa por faixas de volume (*Flat-Fee*, ex: $249/mês até $100k MTR). Destaca-se pelo editor visual de telas de pagamento (*Paywall Builder*) e testes A/B avançados (Bayesianos e Preditivos por IA).
*   **Qonversion**: Disponibiliza Free Tier até $10.000 USD de MTR e escalonamento por faixas fixas (ex: $99/mês até $50k MTR e $599/mês até $500k MTR). Foca em análise preditiva de receita e automação de dados com menor custo de infraestrutura.

Em cenários de crescimento acelerado (> $500.000 MTR), soluções baseadas em taxas fixas por faixas de volume (como Adapty e Qonversion) podem reduzir o custo de infraestrutura de gerenciamento de IAP em até 80% quando comparadas ao modelo de 1% do RevenueCat.

### Mecanismo de Direitos Unificados Cross-Platform (*Cross-Platform Entitlements*)

O reconhecimento automático de um benefício (como um "Passe de Batalha" ou a "Remoção de Anúncios") em um ambiente Web ou PC, após ter sido adquirido originalmente em um dispositivo móvel Android ou iOS, exige o desacoplamento do token da loja nativa em relação à conta do jogador:

1.  **Identificador Opaco Universal (`app_user_id`)**: Durante o processo de autenticação primária do jogador (via OAuth2 ou OpenID Connect), o servidor do jogo gera um UUID único desprovido de Informações de Identificação Pessoal (PII).
2.  **Registro no SDK Mobile**: Ao inicializar o SDK do gerenciador de IAP na aplicação móvel, essa chave opaca é registrada. Qualquer transação efetuada no Google Play Billing ou Apple StoreKit é automaticamente associada a este identificador no middleware.
3.  **Mapeamento de Entitlements**: Os produtos das lojas nativas são vinculados a *Entitlements* conceituais (por exemplo, a chave lógica `battlepass_season_10`).
4.  **Sincronização via Webhook**: Quando a compra é confirmada na plataforma móvel, o gerenciador de IAP dispara um Webhook assinado para o servidor autoritativo do jogo. O servidor valida a mensagem, associa o *Entitlement* ao `app_user_id` e persiste o estado na tabela de direitos do banco de dados.
5.  **Acesso Multiplataforma**: Quando o usuário inicia sessão na versão Web ou PC, a API do jogo consulta o banco de dados interno e libera os recursos correspondentes, sem depender de chamadas síncronas adicionais às lojas de aplicativos móveis.

---

## 2. Pagamentos Web e PC: Merchant of Record (MoR) vs. Gateways Locais

A comercialização de itens virtuais e assinaturas fora do ecossistema fechado das lojas móveis exige a definição do modelo de responsabilidade fiscal e processamento financeiro.

### Diferenciação Estrutural

*   **Merchant of Record (MoR)** (ex: Paddle, Lemon Squeezy, Stripe Managed Payments): Atua como a entidade jurídica que revende legalmente o produto digital ao consumidor final. O MoR assume a responsabilidade pelo recolhimento de impostos sobre vendas e valor agregado (VAT/GST/Sales Tax) em mais de 100 a 200 jurisdições internacionais, gerencia disputas, previne fraudes e lida com chargebacks. Essa comodidade é remunerada por taxas tipicamente entre 3,9% e 5% + $0,50 USD por transação.
*   **Gateway de Pagamento / PSP Local** (ex: Mercado Pago, Asaas, AbacatePay, Efí): Atua unicamente no processamento da liquidação financeira. A responsabilidade tributária (emissão de Nota Fiscal de Serviços Eletrônica - NFS-e e recolhimento de impostos federais/municipais no Brasil) permanece sob a gestão da empresa desenvolvedora. Em contrapartida, as taxas para Pix são substancialmente menores (geralmente abaixo de 1% ou tarifas fixas como R$ 0,99 a R$ 1,99 por cobrança compensada).

### Inviabilidade Econômica do MoR em Microtransações Locais

A aplicação do modelo MoR para microtransações de baixo valor no Brasil (entre R$ 5,00 e R$ 25,00) apresenta uma distorção financeira severa provocada pela taxa fixa cobrada em dólar:

$$\text{Taxa MoR (R\$ 5,00)} = (\$0,50 \text{ USD} \times \text{R\$ 5,60}) + (5\% \times \text{R\$ 5,00}) = \text{R\$ 2,80} + \text{R\$ 0,25} = \text{R\$ 3,05}$$

Uma retenção de **61% do valor total da venda** inviabiliza o modelo de negócios. Em contrapartida, o processamento da mesma transação de R$ 5,00 por meio de um PSP local via Pix (com tarifa fixa de R$ 0,99 ou percentual de 0,99% = R$ 0,05) preserva a rentabilidade do desenvolvedor.

### Arquitetura de Redirecionamento (*Hosted Checkout Page*) e Zero PCI Scope

Para assegurar a eliminação do escopo PCI-DSS na infraestrutura do jogo:

1.  O cliente do jogo solicita a compra de um item ao servidor autoritativo.
2.  O servidor faz uma requisição servidor-a-servidor para a API do Gateway ou MoR, enviando o valor, moeda e metadados opacos (`app_user_id` e `item_id`).
3.  O gateway responde retornando uma URL temporária e exclusiva para o checkout hospedado.
4.  O cliente do jogo redireciona o navegador do usuário para essa URL do gateway, onde os dados bancários ou o QR Code Pix são inseridos diretamente no domínio seguro e certificado (PCI-DSS Level 1) do provedor.
5.  Concluído o pagamento, o gateway redireciona o cliente para uma página de retorno e emite uma notificação assíncrona baseada em servidor (**Webhook**) confirmando o sucesso da transação.

### Validação de Integridade via Webhooks Assinados (HMAC-SHA256)

A confirmação de pagamento e a liberação de itens devem ser disparadas estritamente pelo Webhook assinado enviado diretamente ao servidor do jogo:

1.  O provedor gera um hash HMAC-SHA256 aplicando o algoritmo no corpo bruto do JSON da requisição (*raw payload*) utilizando uma chave secreta compartilhada (*Webhook Secret*).
2.  O hash calculado é transmitido no cabeçalho HTTP da requisição (ex: `X-Signature` ou `X-Hub-Signature-256`).
3.  Ao receber o Webhook, o servidor do jogo obtém o corpo bruto HTTP antes de realizar qualquer parsing de JSON.
4.  O servidor calcula localmente a assinatura HMAC-SHA256 utilizando o corpo bruto recebido e o *Webhook Secret* mantido em cofre de credenciais.
5.  O servidor realiza a comparação entre os hashes por meio de uma função de comparação de tempo constante (*constant-time comparison*), neutralizando potenciais ataques de análise de tempo (*Timing Attacks*). Se as assinaturas divergirem, o servidor rejeita a requisição imediatamente com código HTTP 401 Unauthorized.

---

## 3. Matriz Comparativa de Provedores de Monetização

| Provedor / Plataforma | Categoria de Serviço | Taxas e Comissões | Limite Gratuito / Starter | Tratamento de Dados e Escopo PCI-DSS | Responsabilidade Fiscal e Tributária |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Apple App Store (StoreKit 2)** | Loja Nativa Mobile | 30% padrão (15% no *Small Business Program* para receita < $1M/ano). | Sem mensalidade; taxa anual de desenvolvedor de $99 USD. | Isolamento total. Transmite apenas recibos JWS assinados criptograficamente. | **Merchant of Record**. A Apple recolhe e repassa os impostos globais de vendas. |
| **Google Play Billing** | Loja Nativa Mobile | 30% padrão (15% sobre o primeiro milhão de dólares anual). | Sem taxa recorrente; taxa única de cadastro de $25 USD. | Isolamento total. Fornece tokens opacos de compra (`purchaseToken`) via API v3. | **Merchant of Record**. O Google gerencia a retenção e o recolhimento fiscal global. |
| **RevenueCat** | Middleware IAP Cross-Platform | 1% sobre o MTR excedente ou $8 a $12/mês por $1k MTR. | Isento de cobrança até $2.500 USD de MTR. | Fora do escopo PCI. Armazena apenas histórico transacional e identificadores opacos. | Nenhuma. Atua estritamente na validação e gestão do estado dos recibos. |
| **Paddle** | Merchant of Record Global (Web/PC) | 5% + $0,50 USD por transação. Taxas de conversão de moeda de 2% a 3%. | Sem custo fixo mensal no plano padrão. | PCI-DSS SAQ A (Zero Scope). Absorve todo o fluxo financeiro na página hospedada. | **Merchant of Record Full**. Recolhe impostos (VAT/GST/Sales Tax) em 200+ países. |
| **Lemon Squeezy** | Merchant of Record Global (Web/PC) | 5% + $0,50 USD por transação (+1,5% para cartões internacionais). | Isento de taxa de assinatura ou mensalidade. | PCI-DSS SAQ A (Zero Scope). Checkout processado em ambiente seguro do MoR. | **Merchant of Record Full**. Emite recibos e gerencia conformidade fiscal internacional. |
| **Mercado Pago (Checkout Pro)** | Gateway / Subadquirente Local (Brasil) | **Pix:** ~0,99%. **Crédito:** 3,98% a 4,98%. **Boleto:** R$ 3,49. | Sem custo de manutenção ou mensalidade. | Zero PCI Scope no modelo Checkout Pro. (Checkout Transparente exige SAQ A-EP). | **Gateway**. O desenvolvedor é responsável pela emissão de notas fiscais e apuração tributária. |
| **Asaas** | PSP / Gateway Recorrente Local | **Pix:** R$ 0,99 a R$ 1,99 por cobrança. **Boleto:** R$ 1,89 a R$ 2,85. **Crédito:** 2,99% + R$ 0,49. | Sem mensalidade ou custos fixos de manutenção. | Zero PCI Scope com a utilização de Links de Pagamento ou Checkout Hospedado. | **Gateway**. Responsabilidade fiscal mantida sob a estrutura jurídica do desenvolvedor. |
| **AbacatePay** | Gateway Pix Dev-First (Brasil) | Foco em taxas reduzidas para transações via Pix e checkouts simplificados. | Sem mensalidade. Voltado a criadores e pequenas empresas. | Zero PCI Scope. Processamento Pix isento de dados bancários sensíveis de cartão. | **Gateway**. Cumprimento das obrigações fiscais e contábeis mantido no CNPJ do jogo. |

---

## 4. Segurança Transacional, Validação Server-Side e Idempotência

Devido à vulnerabilidade do cliente móvel ou executável PC a injeções de memória local e ferramentas de bypass (como *Lucky Patcher*), a validação de compras deve ser executada integralmente no servidor autoritativo.

### Validação Server-Side de Recibos (*Server-Side Receipt Validation*)

#### Apple App Store: StoreKit 2 e App Store Server API (JWS)
O StoreKit 2 adota o formato JSON Web Signature (JWS) para o envio de assinaturas e transações. O pipeline de validação criptográfica no servidor opera da seguinte forma:

1. Ao receber a string `jwsRepresentation` (da aplicação ou via App Store Server Notifications V2), o servidor decodifica o cabeçalho base64 do JWS para extrair `alg` (ex: `ES256`) e `x5c` (array de certificados X.509 formatados em DER e codificados em Base64).
2. Valida-se a cadeia de certificados (`x5c`):
   * `x5c[0]` é o certificado folha (*Leaf Certificate*), utilizado para assinar o payload.
   * `x5c[1]` é o certificado intermediário da Apple, e `x5c[2]` é o certificado raiz (*Apple Root CA*).
   * O servidor valida se o certificado folha foi assinado pelo intermediário e se este foi assinado pelo certificado raiz mantido em cofre confiável no servidor (`AppleRootCA-G3.pem`).
3. Extrai-se a chave pública do certificado folha e valida-se a assinatura digital do payload JWS.
4. Decodifica-se o payload validado para conferir os dados de negócio: `bundleId`, `productId`, `transactionId`, `environment` (evitando tokens de *Sandbox* em *Production*), `expiresDate` e `revocationDate`.

#### Google Play Developer API v3
1. O cliente transmite ao servidor o token de compra opaco (`purchaseToken`), `packageName` e `productId`.
2. O servidor autoritativo utiliza credenciais de uma Conta de Serviço do Google Cloud (escopo `https://www.googleapis.com/auth/androidpublisher`) para obter um token de acesso OAuth2.
3. Realiza consulta síncrona aos endpoints:
   * Compras pontuais: `androidpublisher.purchases.products.get`
   * Assinaturas: `androidpublisher.purchases.subscriptions.get`
4. Inspeciona a propriedade `purchaseState`: somente o valor `1` (`PURCHASED`) confirma a conclusão. O valor `0` sinaliza compra pendente.
5. Após conceder o item no banco de dados, o servidor envia uma requisição de confirmação (*Acknowledgement*) ou consumo (*Consume*) ao Google Play em até 3 dias; caso contrário, o Google cancela a compra e reembolsa o usuário automaticamente.

### Arquitetura de Idempotência de Webhooks e Tabela de Auditoria

Para evitar a entrega duplicada de moedas ou recursos em retransmissões de Webhooks, utiliza-se uma trava atômica no banco de dados através da tabela `processed_events`:

1. Ao receber o Webhook, o servidor valida a assinatura HMAC ou JWS e extrai o identificador único da notificação (`event_id` ou `transaction_id`).
2. O servidor abre uma transação com o banco de dados (*Database Transaction*) e tenta inserir uma linha na tabela `processed_events` contendo `event_id`, `provider` e o carimbo de data/hora atual.
3. Se a tentativa falhar por violação de chave primária duplicada (*Unique Constraint Violation*), o sistema identifica que o evento já foi processado, aborta a transação (*Rollback*) e responde imediatamente com HTTP 200 OK.
4. Se a inserção for concluída com sucesso, o pipeline altera a carteira virtual ou a tabela de direitos, grava o registro de auditoria, confirma a transação (*Commit*) e responde com HTTP 200 OK.

### Tratamento Automatizado de Chargebacks e Reembolsos (*Refunds*)

O servidor deve escutar webhooks específicos de cancelamento:
* **Apple App Store**: Eventos `REVOCATION` e `REFUND` via App Store Server Notifications V2.
* **Google Play**: Notificações via Google Cloud Pub/Sub integradas à *Voided Purchases API*.
* **Gateways Web / MoRs**: Eventos `chargeback.created`, `dispute.opened` ou `refund.processed`.

**Ações de Mitigação**:
* **Itens Não Consumíveis**: O servidor altera a flag `is_active` na tabela `entitlements` referente ao `app_user_id` para `FALSE`.
* **Moedas Virtuais Consumíveis Gastas**: Se o jogador já gastou as moedas estornadas, o servidor efetua o débito na tabela `virtual_wallets`. Se o saldo for menor que o valor estornado, a carteira assume um saldo negativo (ex: `balance = -750`).
* **Restrições Programáticas**: Um saldo negativo aciona bloqueios automáticos no perfil, como suspensão do acesso a partidas ranqueadas, impedimento de trocas (*trading*) e restrição ao uso do mercado interno até que o saldo seja recomposto.

---

## 5. Diagrama de Sequência Textual do Fluxo de Compra Segura

```
[Cliente (Web/PC/Mobile)] ──(1. Solicitar Compra)──> [Servidor Autoritativo]
                                                              │
                                                (2. Criar Sessão/URL)
                                                              │
                                                              ▼
[Cliente (Web/PC/Mobile)] <──(Retornar URL Hosted)── [Gateway / MoR]
           │
  (3. Digitar Dados/Pix no
   Ambiente Seguro PCI-DSS)
           │
           ▼
   [Gateway / MoR] ──(4. Disparar Webhook Assinado HMAC-SHA256)──> [Servidor Autoritativo]
                                                                        │
                                                          (5. Validar HMAC &
                                                           Trava Idempotente
                                                           em processed_events)
                                                                        │
                                                                        ▼
                                                          [Banco de Dados]
                                                          (Gravar Audit &
                                                           Ativar Entitlement/Wallet)
                                                                        │
[Cliente (Web/PC/Mobile)] <──(6. Notificar Sucesso via WebSocket/SSE)───┘
```

---

## 6. Especificação do Schema de Banco de Dados Mínimo para Auditoria "Zero-Data"

Em conformidade com o escopo PCI-DSS SAQ A e normas globais de privacidade, a modelagem restringe-se ao armazenamento de identificadores opacos de sistema, datas, status e valores brutos para conciliação.

### Tabela 1: `users`
Armazena a entidade básica do jogador desprovida de Informações de Identificação Pessoal (PII).

| Nome da Coluna | Tipo de Dado | Anulável | Restrições / Chaves | Descrição Funcional |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Não | PRIMARY KEY | Identificador global opaco do jogador (`app_user_id`). |
| `created_at` | TIMESTAMPTZ | Não | DEFAULT NOW() | Carimbo de data/hora de criação do perfil no jogo. |
| `status` | VARCHAR(32) | Não | DEFAULT 'ACTIVE' | Estado da conta (ex: `'ACTIVE'`, `'RESTRICTED'`, `'BANNED'`). |

### Tabela 2: `entitlements`
Registra a concessão e a validade de direitos não consumíveis ou passes de conteúdo.

| Nome da Coluna | Tipo de Dado | Anulável | Restrições / Chaves | Descrição Funcional |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Não | PRIMARY KEY | Identificador do registro de direito de acesso. |
| `user_id` | UUID | Não | FOREIGN KEY (`users.id`) | Vínculo com o jogador proprietário do recurso. |
| `entitlement_key` | VARCHAR(64) | Não | INDEX (`user_id`, `entitlement_key`) | Chave lógica do benefício (ex: `'battlepass_s10'`, `'no_ads'`). |
| `is_active` | BOOLEAN | Não | DEFAULT TRUE | Status do recurso. Alterado para `FALSE` em estornos. |
| `granted_at` | TIMESTAMPTZ | Não | DEFAULT NOW() | Carimbo de data/hora da concessão inicial. |
| `expires_at` | TIMESTAMPTZ | Sim | INDEX | Data de expiração para assinaturas com prazo determinado. |

### Tabela 3: `virtual_wallets`
Gerencia os saldos acumulados de moedas virtuais do jogo associados ao usuário.

| Nome da Coluna | Tipo de Dado | Anulável | Restrições / Chaves | Descrição Funcional |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | UUID | Não | PRIMARY KEY (COMPOSITE), FK (`users.id`) | Vínculo direto com o usuário proprietário da carteira. |
| `currency_type` | VARCHAR(32) | Não | PRIMARY KEY (COMPOSITE) | Tipo da moeda do jogo (ex: `'GOLD'`, `'GEMS'`). |
| `balance` | BIGINT | Não | DEFAULT 0 | Saldo disponível. Pode assumir valor negativo em estornos. |
| `updated_at` | TIMESTAMPTZ | Não | DEFAULT NOW() | Carimbo de data/hora da última alteração de saldo. |

### Tabela 4: `processed_events`
Controla a idempotência no processamento de webhooks e notificações assíncronas.

| Nome da Coluna | Tipo de Dado | Anulável | Restrições / Chaves | Descrição Funcional |
| :--- | :--- | :--- | :--- | :--- |
| `event_id` | VARCHAR(128) | Não | PRIMARY KEY | Identificador único do evento fornecido pelo gateway. |
| `provider` | VARCHAR(32) | Não | Classificador | Nome do provedor emissor (ex: `'STRIPE'`, `'MERCADOPAGO'`, `'PADDLE'`). |
| `processed_at` | TIMESTAMPTZ | Não | DEFAULT NOW() | Carimbo de data/hora da execução bem-sucedida do evento. |

### Tabela 5: `purchase_audits`
Mantém o registro imutável do histórico de compras concluídas para conciliação financeira e auditoria.

| Nome da Coluna | Tipo de Dado | Anulável | Restrições / Chaves | Descrição Funcional |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Não | PRIMARY KEY | Identificador interno do registro de auditoria. |
| `user_id` | UUID | Não | FOREIGN KEY (`users.id`) | Referência ao jogador associado à compra. |
| `provider_transaction_id` | VARCHAR(128) | Não | INDEX | Identificador do pedido no sistema do provedor parceiro. |
| `provider` | VARCHAR(32) | Não | Classificador | Plataforma utilizada (ex: `'GOOGLE_PLAY'`, `'APPLE_STOREKIT'`, `'PADDLE'`). |
| `product_id` | VARCHAR(64) | Não | Identificador de Item | Código do produto no catálogo do jogo (ex: `'gems_pack_01'`). |
| `amount_cents` | INTEGER | Não | Quantidade Monetária | Valor transacionado expresso na menor unidade da moeda (ex: centavos). |
| `currency` | VARCHAR(3) | Não | Código ISO 4217 | Código da moeda da transação (ex: `'BRL'`, `'USD'`). |
| `status` | VARCHAR(32) | Não | Estado | Status da transação (ex: `'COMPLETED'`, `'REFUNDED'`). |
| `created_at` | TIMESTAMPTZ | Não | DEFAULT NOW() | Data e hora em que a confirmação foi gravada no banco. |

---

## 7. Conclusões e Diretrizes Arquiteturais

1. **Eficiência de Custos em Middleware IAP**: A abstração da validação de compras móveis via RevenueCat, Adapty ou Qonversion elimina a necessidade de manutenção de infraestrutura de recibos própria. Para fases iniciais, os Free Tiers de MTR garantem custo zero; em estágios avançados (> $100k MTR), soluções com planos de taxa fixa (*Flat-Fee*) protegem as margens operacionais.
2. **Segmentação Geográfica no Checkout Web**: Vendas globais ou de alto valor se beneficiam do modelo *Merchant of Record* (MoR) para mitigação de impostos internacionais (VAT/GST). Para microtransações locais no Brasil (R$ 5 a R$ 25), o uso de gateways/PSPs locais focados em Pix é obrigatório para evitar a perda de margem causada por taxas fixas em dólar.
3. **Segurança Severa Server-Side**: O servidor do jogo deve ser a única autoridade para liberação de inventário, condicionado à validação de assinaturas criptográficas (HMAC-SHA256 ou JWS X.509) e processamento idempotente via `processed_events`.
