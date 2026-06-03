# DoeRoupa 👕

Plataforma web de doação de roupas que conecta doadores a instituições beneficentes. Desenvolvida com Node.js, Express e SQLite, com suporte a PWA para uso mobile.

## Sobre o Projeto

O DoeRoupa permite que usuários cadastrem doações de roupas e entrem em contato diretamente com instituições cadastradas. A plataforma oferece chat em tempo real entre doadores e organizações, sistema de notificações e gerenciamento de perfis.

## Funcionalidades

- **Autenticação**: Cadastro e login para usuários e instituições, com recuperação de senha por e-mail
- **Doações**: Registro e acompanhamento de doações com informações do doador
- **Chat**: Conversa direta entre doadores e instituições
- **Notificações**: Alertas de novas mensagens e atividades
- **Perfis**: Páginas de perfil editáveis para usuários e instituições
- **PWA**: Funciona como app no celular (Progressive Web App)

## Tecnologias

- **Back-end**: Node.js + Express 5
- **Banco de dados**: SQLite 3
- **Front-end**: HTML + JavaScript (vanilla)
- **PWA**: Service Worker + Web App Manifest

## Instalação

```bash
# Clone o repositório
git clone https://github.com/RodrigoFass/apppoo2.git
cd apppoo2

# Instale as dependências
npm install

# Inicie o servidor
node server.js
```

Acesse `http://localhost:3000` no navegador.

## Rotas da API

| Método | Rota                         | Descrição                            |
|--------|------------------------------|--------------------------------------|
| POST   | `/cadastrar`                 | Cadastra usuário ou instituição      |
| POST   | `/login`                     | Autentica usuário ou instituição     |
| POST   | `/recuperar-senha`           | Recuperação de senha por e-mail      |
| GET    | `/usuario/:id`               | Retorna perfil do usuário            |
| POST   | `/atualizar-perfil`          | Atualiza dados do perfil             |
| GET    | `/verificar-tipo`            | Verifica tipo de conta               |
| POST   | `/doar`                      | Registra uma doação                  |
| GET    | `/doacoes`                   | Lista todas as doações               |
| POST   | `/criar-conversa`            | Inicia uma conversa                  |
| POST   | `/mensagem`                  | Envia uma mensagem                   |
| GET    | `/mensagens`                 | Recupera histórico de mensagens      |
| GET    | `/notificacoes`              | Busca notificações do usuário        |
| POST   | `/notificacoes-ler-conversa` | Marca notificações como lidas        |

## Estrutura do Projeto

```
DoeRoupa/
├── public/
│   ├── login.html
│   ├── cadastro.html
│   ├── home.html
│   ├── home_instituicao.html
│   ├── perfil.html
│   ├── chat.html
│   ├── conversa.html
│   ├── notificacoes.html
│   ├── agenda.html
│   ├── configuracoes.html
│   ├── contato.html
│   ├── esqueci-senha.html
│   ├── esqueci-usuario.html
│   ├── service-worker.js
│   └── manifest.json
├── server.js
├── banco.db
└── package.json
```

## Dependências

```json
{
  "express": "^5.1.0",
  "sqlite3": "^5.1.7",
  "body-parser": "^2.2.0"
}
```
