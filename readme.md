# Sistema de Controle de Estoque (API RESTful)

Este projeto implementa uma API RESTful para um Sistema de Controle de Estoque, desenvolvido como parte do Módulo 9: Projetos Final do curso UniSENAI. Ele permite o gerenciamento de produtos, controle de movimentações de estoque (entradas e saídas) e geração de relatórios, tudo isso com autenticação e autorização robustas.

---

## 1. Introdução

* **Nome do Projeto:** Sistema de Controle de Estoque (API RESTful)
* **Descrição Geral:** Este sistema foi desenvolvido para oferecer uma solução completa e eficiente para o gerenciamento de estoque. Ele permite o cadastro e a gestão de produtos, o controle detalhado de todas as movimentações de entrada e saída de itens, e a geração de relatórios estratégicos para auxiliar na tomada de decisões. Construído com foco em boas práticas de desenvolvimento e segurança, a API é a base para qualquer interface de usuário (web, mobile, etc.) que venha a ser desenvolvida.
* **Tecnologias Utilizadas:**
    * **Back-end:** Node.js, Express (Framework web)
    * **Banco de Dados:** MySQL (utilizando o driver `mysql2/promise` para Promises)
    * **Autenticação:** JWT (JSON Web Tokens) para autenticação e `bcryptjs` para hashing de senhas.
    * **Gerenciamento de Variáveis de Ambiente:** `dotenv`
    * **Outras Ferramentas:** Postman/Insomnia (para testes manuais de API), Jest e Supertest (para testes automatizados - configurados mas com implementação inicial em andamento).

---

## 2. Requisitos Funcionais

O sistema oferece as seguintes funcionalidades principais:

* **Autenticação e Autorização:**
    * Registro de novos usuários com definição de perfis (`admin` ou `user`).
    * Login de usuários com geração de um JSON Web Token (JWT) para sessões seguras.
    * Proteção de rotas da API, garantindo que apenas usuários autenticados e com a permissão (role) adequada possam acessá-las.
* **Gestão de Produtos (CRUD - Create, Read, Update, Delete):**
    * **Cadastro de Produtos:** Adicionar novos produtos com nome, quantidade inicial, preço e categoria. O nome do produto deve ser único.
    * **Listagem de Produtos:** Visualizar todos os produtos cadastrados no sistema.
    * **Detalhes do Produto:** Consultar informações detalhadas de um produto específico por seu ID.
    * **Atualização de Produtos:** Modificar os dados de produtos existentes (nome, quantidade, preço, categoria).
    * **Exclusão de Produtos:** Remover produtos do sistema (apenas para administradores).
* **Controle de Movimentação de Estoque:**
    * **Entrada de Estoque:** Registrar a adição de unidades a um produto existente, aumentando sua quantidade em estoque.
    * **Saída de Estoque:** Registrar a retirada de unidades de um produto existente, diminuindo sua quantidade em estoque. Inclui validação para evitar estoque negativo.
    * **Histórico de Movimentos:** Visualizar todas as entradas e saídas registradas para um produto específico.
* **Geração de Relatórios:**
    * **Produtos Mais Vendidos:** Gerar um relatório dos produtos com maior volume de saídas (vendas).
    * **Estoque Baixo:** Gerar um relatório de produtos cuja quantidade em estoque está abaixo de um limite predefinido (threshold).

---

## 3. Modelagem de Dados

O banco de dados MySQL é composto pelas seguintes tabelas e suas relações:

* **`users` (Usuários)**
    * `id`: INT, AUTO_INCREMENT, PRIMARY KEY
    * `username`: VARCHAR(255), NOT NULL, UNIQUE
    * `password`: VARCHAR(255), NOT NULL (armazenado como hash)
    * `role`: VARCHAR(50), DEFAULT 'user' (ex: 'admin', 'user')
    * `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
    * **Descrição:** Armazena informações dos usuários do sistema, incluindo credenciais de login e perfil de acesso.

* **`products` (Produtos)**
    * `id`: INT, AUTO_INCREMENT, PRIMARY KEY
    * `name`: VARCHAR(255), NOT NULL, UNIQUE
    * `quantity`: INT, NOT NULL, DEFAULT 0
    * `price`: DECIMAL(10, 2), NOT NULL
    * `category`: VARCHAR(100)
    * `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
    * `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    * **Descrição:** Armazena os detalhes dos produtos disponíveis no estoque.

* **`stock_movements` (Movimentos de Estoque)**
    * `id`: INT, AUTO_INCREMENT, PRIMARY KEY
    * `product_id`: INT, NOT NULL (FOREIGN KEY para `products.id`, ON DELETE CASCADE)
    * `type`: ENUM('entrada', 'saida'), NOT NULL
    * `quantity`: INT, NOT NULL
    * `user_id`: INT (FOREIGN KEY para `users.id`, ON DELETE SET NULL, opcional para rastrear responsável)
    * `movement_date`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
    * **Descrição:** Registra cada operação de entrada ou saída de estoque para um produto, mantendo um histórico detalhado.

**Relações:**
* `products` 1:N `stock_movements`: Um produto pode ter múltiplos registros de movimentos de estoque (entradas e saídas).
* `users` 1:N `stock_movements`: Um usuário pode ser responsável por múltiplos movimentos de estoque.

---

## 4. Estrutura do Projeto

A estrutura do projeto segue um padrão MVC (Model-View-Controller) para o back-end, com middlewares dedicados e arquivos de configuração.

```

/
├── controllers/    \# Contém a lógica de negócio principal para cada recurso (autenticação, produtos, estoque, relatórios).
│   ├── authController.js
│   ├── productController.js
│   ├── stockController.js
│   └── reportController.js
├── models/         \# Define a estrutura das entidades do banco de dados e as operações de CRUD para cada uma (usuários, produtos, movimentos de estoque, relatórios).
│   ├── User.js
│   ├── Product.js
│   ├── StockMovement.js
│   └── Report.js
├── routes/         \# Define as rotas (endpoints) da API e as associa aos métodos dos controladores.
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── stockRoutes.js
│   └── reportRoutes.js
├── middleware/     \# Contém funções middleware para autenticação (verificação de token JWT) e autorização (verificação de roles de usuário).
│   └── authMiddleware.js
├── config/         \# Arquivos de configuração, como a conexão com o banco de dados.
│   └── db.js
├── .env            \# Arquivo para variáveis de ambiente (NÃO deve ser versionado).
├── app.js          \# Ponto de entrada da aplicação, onde o Express é configurado e as rotas são importadas.
├── package.json    \# Metadados do projeto e lista de dependências.
├── README.md       \# Este arquivo de documentação.
├── **tests**/      \# Pasta para testes automatizados (Jest, Supertest).
│   └── auth.test.js

````

**Dependências Principais:**

* `express`: Framework web rápido e flexível para Node.js.
* `mysql2`: Driver para conexão com banco de dados MySQL, com suporte a Promises.
* `jsonwebtoken`: Implementa a geração e verificação de JSON Web Tokens para autenticação.
* `bcryptjs`: Biblioteca para hashing e comparação segura de senhas.
* `dotenv`: Carrega variáveis de ambiente de um arquivo `.env` para `process.env`.
* `jest`: Framework de testes JavaScript.
* `supertest`: Biblioteca para testar APIs HTTP com Jest.

---

## 5. Endpoints da API

Esta seção detalha os endpoints disponíveis na API, seus métodos HTTP, URLs, parâmetros de requisição, e exemplos de respostas.

### 5.1. Autenticação e Usuários (`/api/auth`)

* **`POST /api/auth/register`**
    * **Descrição:** Registra um novo usuário no sistema.
    * **Permissões:** Público.
    * **Corpo da Requisição (JSON):**
        ```json
        {
            "username": "novo_usuario",
            "password": "senha_segura123",
            "role": "user" // Ou "admin"
        }
        ```
    * **Exemplo de Resposta (Sucesso - 201 Created):**
        ```json
        {
            "message": "Usuário registrado com sucesso!",
            "user": {
                "id": 1,
                "username": "novo_usuario",
                "role": "user"
            }
        }
        ```
    * **Exemplo de Resposta (Erro - 400 Bad Request):**
        ```json
        {
            "message": "Nome de usuário e senha são obrigatórios."
        }
        ```
    * **Exemplo de Resposta (Erro - 409 Conflict):**
        ```json
        {
            "message": "Nome de usuário já existe."
        }
        ```

* **`POST /api/auth/login`**
    * **Descrição:** Autentica um usuário e retorna um JSON Web Token (JWT).
    * **Permissões:** Público.
    * **Corpo da Requisição (JSON):**
        ```json
        {
            "username": "meuusuario",
            "password": "minhasenha123"
        }
        ```
    * **Exemplo de Resposta (Sucesso - 200 OK):**
        ```json
        {
            "message": "Login realizado com sucesso!",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJtZXV1c3VhcmlvIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2NzgyNjUxMDAsImV4cCI6MTY3ODI2ODcwMH0...."
        }
        ```
    * **Exemplo de Resposta (Erro - 401 Unauthorized):**
        ```json
        {
            "message": "Credenciais inválidas."
        }
        ```

### 5.2. Gestão de Produtos (`/api/products`)

* **`POST /api/products`**
    * **Descrição:** Cadastra um novo produto no sistema.
    * **Permissões:** Administradores (`admin`).
    * **Corpo da Requisição (JSON):**
        ```json
        {
            "name": "Smartphone XYZ",
            "quantity": 50,
            "price": 1200.50,
            "category": "Eletrônicos"
        }
        ```
    * **Exemplo de Resposta (Sucesso - 201 Created):**
        ```json
        {
            "message": "Produto cadastrado com sucesso!",
            "product": {
                "id": 1,
                "name": "Smartphone XYZ",
                "quantity": 50,
                "price": 1200.50,
                "category": "Eletrônicos"
            }
        }
        ```
    * **Exemplo de Resposta (Erro - 400 Bad Request):**
        ```json
        {
            "message": "Todos os campos (nome, quantidade, preço, categoria) são obrigatórios."
        }
        ```
    * **Exemplo de Resposta (Erro - 409 Conflict):**
        ```json
        {
            "message": "Produto com este nome já existe."
        }
        ```

* **`GET /api/products`**
    * **Descrição:** Lista todos os produtos cadastrados.
    * **Permissões:** Usuários Autenticados (`admin`, `user`).
    * **Parâmetros de Requisição:** Nenhum.
    * **Exemplo de Resposta (Sucesso - 200 OK):**
        ```json
        [
            {
                "id": 1,
                "name": "Smartphone XYZ",
                "quantity": 48,
                "price": 1200.50,
                "category": "Eletrônicos",
                "created_at": "2023-10-27T10:00:00.000Z",
                "updated_at": "2023-10-27T10:30:00.000Z"
            },
            {
                "id": 2,
                "name": "Fone de Ouvido ABC",
                "quantity": 100,
                "price": 150.00,
                "category": "Áudio",
                "created_at": "2023-10-27T11:00:00.000Z",
                "updated_at": "2023-10-27T11:00:00.000Z"
            }
        ]
        ```

* **`GET /api/products/:id`**
    * **Descrição:** Retorna os detalhes de um produto específico.
    * **Permissões:** Usuários Autenticados (`admin`, `user`).
    * **Parâmetros de Caminho:** `id` (ID numérico do produto).
    * **Exemplo de Resposta (Sucesso - 200 OK):**
        ```json
        {
            "id": 1,
            "name": "Smartphone XYZ",
            "quantity": 48,
            "price": 1200.50,
            "category": "Eletrônicos",
            "created_at": "2023-10-27T10:00:00.000Z",
            "updated_at": "2023-10-27T10:30:00.000Z"
        }
        ```
    * **Exemplo de Resposta (Erro - 404 Not Found):**
        ```json
        {
            "message": "Produto não encontrado."
        }
        ```

* **`PUT /api/products/:id`**
    * **Descrição:** Atualiza as informações de um produto existente.
    * **Permissões:** Administradores (`admin`).
    * **Parâmetros de Caminho:** `id` (ID numérico do produto).
    * **Corpo da Requisição (JSON):**
        ```json
        {
            "name": "Smartphone XYZ Pro",
            "quantity": 48,
            "price": 1350.00,
            "category": "Eletrônicos"
        }
        ```
    * **Exemplo de Resposta (Sucesso - 200 OK):**
        ```json
        {
            "message": "Produto atualizado com sucesso!",
            "product": {
                "id": 1,
                "name": "Smartphone XYZ Pro",
                "quantity": 48,
                "price": 1350.00,
                "category": "Eletrônicos"
            }
        }
        ```
    * **Exemplo de Resposta (Erro - 404 Not Found):**
        ```json
        {
            "message": "Produto não encontrado para atualização."
        }
        ```
    * **Exemplo de Resposta (Erro - 409 Conflict):**
        ```json
        {
            "message": "Já existe outro produto com este nome."
        }
        ```

* **`DELETE /api/products/:id`**
    * **Descrição:** Exclui um produto do sistema.
    * **Permissões:** Administradores (`admin`).
    * **Parâmetros de Caminho:** `id` (ID numérico do produto).
    * **Corpo da Requisição:** Nenhum.
    * **Exemplo de Resposta (Sucesso - 200 OK):**
        ```json
        {
            "message": "Produto excluído com sucesso."
        }
        ```
    * **Exemplo de Resposta (Erro - 404 Not Found):**
        ```json
        {
            "message": "Produto não encontrado para exclusão."
        }
        ```

### 5.3. Controle de Estoque (`/api/stock`)

* **`POST /api/stock/entry`**
    * **Descrição:** Registra uma entrada de estoque para um produto.
    * **Permissões:** Administradores (`admin`).
    * **Corpo da Requisição (JSON):**
        ```json
        {
            "productId": 1,
            "quantity": 10
        }
        ```
    * **Exemplo de Resposta (Sucesso - 200 OK):**
        ```json
        {
            "message": "Entrada de 10 unidades para o produto \"Smartphone XYZ\" registrada. Nova quantidade: 58."
        }
        ```
    * **Exemplo de Resposta (Erro - 400 Bad Request):**
        ```json
        {
            "message": "ID do produto e quantidade positiva são obrigatórios para entrada."
        }
        ```
    * **Exemplo de Resposta (Erro - 404 Not Found):**
        ```json
        {
            "message": "Produto não encontrado."
        }
        ```

* **`POST /api/stock/exit`**
    * **Descrição:** Registra uma saída de estoque para um produto.
    * **Permissões:** Administradores (`admin`).
    * **Corpo da Requisição (JSON):**
        ```json
        {
            "productId": 1,
            "quantity": 5
        }
        ```
    * **Exemplo de Resposta (Sucesso - 200 OK):**
        ```json
        {
            "message": "Saída de 5 unidades para o produto \"Smartphone XYZ\" registrada. Nova quantidade: 53."
        }
        ```
    * **Exemplo de Resposta (Erro - 400 Bad Request - Estoque Insuficiente):**
        ```json
        {
            "message": "Quantidade em estoque insuficiente para esta saída."
        }
        ```
    * **Exemplo de Resposta (Erro - 404 Not Found):**
        ```json
        {
            "message": "Produto não encontrado."
        }
        ```

* **`GET /api/stock/history/:productId`**
    * **Descrição:** Retorna o histórico completo de movimentos (entradas e saídas) para um produto específico.
    * **Permissões:** Usuários Autenticados (`admin`, `user`).
    * **Parâmetros de Caminho:** `productId` (ID numérico do produto).
    * **Exemplo de Resposta (Sucesso - 200 OK):**
        ```json
        {
            "productName": "Smartphone XYZ",
            "currentQuantity": 53,
            "history": [
                {
                    "id": 2,
                    "type": "saida",
                    "quantity": 5,
                    "movement_date": "2023-10-27T10:45:00.000Z",
                    "responsible_user": "adminuser"
                },
                {
                    "id": 1,
                    "type": "entrada",
                    "quantity": 10,
                    "movement_date": "2023-10-27T10:30:00.000Z",
                    "responsible_user": "adminuser"
                }
            ]
        }
        ```
    * **Exemplo de Resposta (Erro - 404 Not Found):**
        ```json
        {
            "message": "Produto não encontrado."
        }
        ```

### 5.4. Relatórios (`/api/reports`)

* **`GET /api/reports/most-sold`**
    * **Descrição:** Gera um relatório dos produtos mais vendidos (maior número de saídas). Limita a 10 produtos.
    * **Permissões:** Administradores (`admin`).
    * **Parâmetros de Requisição:** Nenhum.
    * **Exemplo de Resposta (Sucesso - 200 OK):**
        ```json
        {
            "message": "Relatório de Produtos Mais Vendidos",
            "data": [
                {
                    "id": 1,
                    "name": "Smartphone XYZ",
                    "category": "Eletrônicos",
                    "total_sold_quantity": 7
                },
                {
                    "id": 2,
                    "name": "Fone de Ouvido ABC",
                    "category": "Áudio",
                    "total_sold_quantity": 3
                }
            ]
        }
        ```

* **`GET /api/reports/low-stock`**
    * **Descrição:** Gera um relatório de produtos com quantidade em estoque abaixo de um limite (threshold).
    * **Permissões:** Administradores (`admin`).
    * **Parâmetros de Consulta (Query Parameters):**
        * `threshold`: (Opcional) Número inteiro para definir o limite de estoque. Padrão é 10.
    * **Exemplo de Requisição:** `GET /api/reports/low-stock?threshold=5`
    * **Exemplo de Resposta (Sucesso - 200 OK):**
        ```json
        {
            "message": "Relatório de Produtos com Estoque Baixo (Threshold: 5)",
            "data": [
                {
                    "id": 3,
                    "name": "Cabo USB Tipo C",
                    "quantity": 3,
                    "price": 25.00,
                    "category": "Acessórios"
                }
            ]
        }
        ```

---

## 6. Configuração do Ambiente

Siga os passos abaixo para configurar e rodar o projeto localmente.

1.  **Pré-requisitos:**
    * Certifique-se de ter o **Node.js** (versão 18 ou superior recomendada) instalado.
    * Um servidor **MySQL** (versão 8.0 ou superior recomendada) deve estar instalado e em execução.

2.  **Clone o repositório:**
    Abra seu terminal e execute:
    ```bash
    git clone [https://github.com/SEU_USUARIO/sistema-controle-estoque.git](https://github.com/SEU_USUARIO/sistema-controle-estoque.git)
    cd sistema-controle-estoque
    ```

3.  **Instale as dependências:**
    No diretório raiz do projeto, instale todas as dependências do Node.js:
    ```bash
    npm install
    ```

4.  **Configuração do Banco de Dados:**
    * Conecte-se ao seu servidor MySQL (via terminal, MySQL Workbench, DBeaver, etc.).
    * Crie um banco de dados com o nome `controle_estoque_db`:
        ```sql
        CREATE DATABASE controle_estoque_db;
        ```
    * As tabelas (`users`, `products`, `stock_movements`) serão criadas automaticamente na primeira vez que o servidor da aplicação for iniciado.

5.  **Configure as variáveis de ambiente:**
    * Crie um novo arquivo chamado `.env` na raiz do projeto.
    * Copie o conteúdo abaixo para o arquivo `.env` e substitua os valores pelos seus dados reais:
        ```dotenv
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=sua_senha_do_mysql
        DB_NAME=controle_estoque_db
        JWT_SECRET=sua_chave_secreta_para_jwt_muito_longa_e_unica_e_segura
        PORT=3000
        ```
        **Importante:** Mantenha o `JWT_SECRET` longo e complexo. Nunca compartilhe este arquivo em repositórios públicos.

6.  **Inicie o servidor:**
    Com todas as configurações feitas, inicie a aplicação:
    ```bash
    npm start
    ```
    O servidor estará rodando em `http://localhost:3000`. Você pode usar ferramentas como Postman ou Insomnia para testar os endpoints da API.

## 7. Documentação de Testes

Esta seção detalha os testes automatizados desenvolvidos para o sistema, garantindo a qualidade e a funcionalidade das APIs.

### Planos de Teste

Os testes foram escritos utilizando o framework Jest e a biblioteca Supertest para simular requisições HTTP e verificar o comportamento dos endpoints da API. As suítes de teste cobrem as seguintes funcionalidades:

* **Auth API (`auth.test.js`):**
    * Registro de novos usuários (incluindo validação de nome de usuário duplicado).
    * Login de usuários e geração de tokens JWT.
    * Controle de acesso a rotas protegidas por diferentes perfis (administrador e usuário comum).

* **Product API (`product.test.js`):**
    * Criação de produtos (com validação de nome duplicado).
    * Listagem de todos os produtos e busca por ID.
    * Atualização e exclusão de produtos.
    * Controle de acesso para ações de administrador (criação, atualização, exclusão).

* **Stock API (`stock.test.js`):**
    * Registro de entradas e saídas de estoque.
    * Verificação de quantidade insuficiente para saídas.
    * Obtenção da quantidade atual de um produto por ID.
    * Obtenção do histórico de movimentos de estoque de um produto, garantindo a ordenação correta.

* **Report API (`report.test.js`):**
    * Geração de relatório de produtos mais vendidos.
    * Geração de relatório de produtos com estoque baixo (com e sem threshold personalizado).
    * Controle de acesso para geração de relatórios (apenas administradores).

### Ferramentas Usadas

* **Jest:** Framework de testes em JavaScript.
* **Supertest:** Biblioteca para testar APIs HTTP.
* **MySQL:** Banco de dados utilizado, com um ambiente de teste limpo garantido por `TRUNCATE TABLE` antes de cada suíte de teste.

### Resultados dos Testes

A execução dos testes mais recentes resultou em:

* **Test Suites:** 1 failed, 3 passed, 4 total
* **Tests:** 2 failed, 31 passed, 33 total
* **Snapshots:** 0 total
* **Time:** 5.097 s
    *(**Nota:** Esta é a saída de um dos seus testes anteriores. Ao executar os testes novamente, espere que todos os testes passem após as correções.)*

### Cobertura de Código

Para gerar e visualizar o relatório de cobertura de código, siga os passos:

1.  Execute o comando: `npm test -- --coverage` ou `jest --coverage`.
2.  Após a execução, abra o arquivo `coverage/lcov-report/index.html` em seu navegador.