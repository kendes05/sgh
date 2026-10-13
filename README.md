# SGH — Sistema de Gestão Hospitalar



O **SGH (Sistema de Gestão Hospitalar)** é um projeto de software voltado ao gerenciamento de processos e informações de uma instituição de saúde. O projeto está organizado em duas partes principais: backend e frontend, separando a lógica da aplicação da interface com o usuário.



## Objetivo:



Desenvolver uma aplicação para facilitar a organização das informações hospitalares, centralizar dados e apoiar os processos administrativos e de atendimento.



## Funcionalidades:



O sistema tem como foco o gerenciamento hospitalar, podendo contemplar funcionalidades como:

- **Gestão de pacientes:** organização dos dados cadastrais dos pacientes.
- **Gestão de médicos:** gerenciamento das informações dos profissionais de saúde.
- **Agendamento de consultas:** registro e organização de consultas médicas.
- **Gestão de usuários:** controle dos usuários que acessam o sistema.
- **Integração entre frontend e backend:** comunicação entre a interface e os serviços da aplicação.

*Observação: a disponibilidade de cada funcionalidade deve ser confirmada conforme a implementação atual do projeto.*



## Estrutura do projeto:


```
sgh/
├── .vscode/
├── backend/
├── frontend/
│   └── sgh/
└── .gitignore
```

- **`backend/`** — contém a parte responsável pela lógica de negócio e pelos serviços da aplicação.
- **`frontend/sgh/`** — contém a parte voltada à interface e à interação com os usuários.
- **`.vscode/`** — reúne configurações do ambiente de desenvolvimento.
- **`.gitignore`** — define arquivos e pastas que não devem ser versionados pelo Git.



## Tecnologias utilizadas:



O projeto possui uma arquitetura dividida entre frontend e backend. As linguagens, frameworks, bibliotecas e o banco de dados utilizados devem ser identificados a partir dos arquivos de configuração de cada parte.



## Como executar o projeto:



### 1. Pré-requisitos

Instale as ferramentas necessárias conforme as tecnologias utilizadas pelo projeto, incluindo o Git e o ambiente de execução exigido pelo backend e pelo frontend.

### 2. Clone o repositório
```
git clone https://github.com/kendes05/sgh.git
cd sgh
```

### 3. Configure o backend

Acesse a pasta do backend:
```
cd backend
```

Consulte os arquivos de configuração e as instruções existentes para instalar as dependências, configurar as variáveis de ambiente e preparar o banco de dados.

### 4. Configure o frontend

Em outro terminal, acesse a pasta do frontend:
```
cd frontend/sgh
```

Instale as dependências e execute a aplicação conforme os comandos definidos nos arquivos de configuração do projeto.

> **Importante:** os comandos específicos de instalação e inicialização dependem das tecnologias e dos scripts configurados no repositório.
>
>

## Segurança:



- Não armazene senhas ou credenciais diretamente no código-fonte.
- Utilize variáveis de ambiente para configurações sensíveis.
- Mantenha arquivos com credenciais fora do controle de versão.
- Valide os dados recebidos pela aplicação e controle o acesso aos recursos.
