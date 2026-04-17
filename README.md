

🚀 Sistema de Gestão e Faturamento Inteligente (Teste Técnico Korp)
Este projeto foi desenvolvido como parte do teste técnico para a Korp. Trata-se de uma aplicação Fullstack moderna, construída sobre uma arquitetura de Microsserviços, projetada para ser resiliente, escalável e inovadora, trazendo a Inteligência Artificial diretamente para as regras de negócio.

🎯 O Desafio
O objetivo foi criar um ecossistema onde o controle de inventário e a emissão de notas fiscais trabalhassem de forma independente, mas sincronizada, elevando a experiência do usuário com insights gerados por IA em tempo real.

✨ Funcionalidades e Diferenciais
📦 Microsserviço de Estoque (Estoque.Api)
CRUD Completo: Gerenciamento de produtos e saldos.

Assistente de Reposição (IA): Análise em tempo real do banco de dados que gera alertas logísticos inteligentes para itens com baixo volume.

Geração de Descrições: Otimização de catálogos com descrições comerciais geradas via Google Gemini.

🧾 Microsserviço de Faturamento (Faturamento.Api)
Gestão de Notas Fiscais: Abertura, auditoria e impressão de notas.

Comunicação Inter-serviços: Baixa automática e segura de inventário via requisições HTTP RESTful para o microsserviço de Estoque.

Cross-sell Automático (IA): Auditoria de carrinho que sugere, através de Inteligência Artificial, produtos complementares para maximizar vendas no momento do faturamento.

🛠️ Tecnologias Utilizadas
Frontend:

Angular (Interface reativa e componentizada)

Bootstrap / CSS Customizado (Design limpo e responsivo)

Backend:

C# / .NET 8 (Minimal APIs para alta performance)

Entity Framework Core (ORM)

SQLite (Banco de dados local e independente para cada microsserviço)

IHttpClientFactory (Comunicação resiliente entre as APIs)

Integrações:

Google Gemini API (Modelos Generativos para IA aplicada)

⚙️ Como Executar o Projeto
Para testar a aplicação localmente, você precisará do Node.js e do .NET 8 SDK instalados na sua máquina.

A API de Faturamento estará rodando em http://localhost:5259

(Nota: Os bancos de dados .db serão criados automaticamente na primeira execução graças ao EnsureCreated()).

Decisões Arquiteturais
Desacoplamento: A separação em dois microsserviços garante que uma falha no sistema de notas não derrube o controle de estoque.

Resiliência: Tratamento rigoroso de Bad Requests e Not Found na comunicação entre as APIs, garantindo que o usuário receba feedbacks claros na tela em vez de quebras de sistema.

IA Contextual: O uso da IA não é um "brinquedo", mas uma ferramenta de negócio (Cross-sell e Alertas Logísticos) integrada através do envio de Bearer Tokens seguros na camada de Backend.
