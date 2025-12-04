# 📸 Gerador de Cards de Alunos Destaques

Aplicação web para criar cards visuais estilo Instagram para destacar alunos. Ideal para escolas que desejam publicar posts de reconhecimento nas redes sociais.

![Preview](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple)

## ✨ Funcionalidades

### 📋 Gerenciamento de Alunos
- Adicionar, editar e remover alunos
- Upload de foto com **ajuste de enquadramento** (drag + zoom)
- Reordenar alunos via drag-and-drop
- Importação em lote via Excel (.xlsx, .xls, .csv)

### 🎨 Personalização Visual
- **Múltiplos layouts**: 2×2 (4 alunos), 3×2 (6 alunos), 3×3 (9 alunos)
- Temas de cores: Verde, Azul, Vermelho, Roxo, Preto e **Customizado**
- Upload de logo/brasão e imagem de fundo
- Controles de desfoque, overlay e cores dos detalhes
- Configuração de títulos (cabeçalho, rodapé, subtítulo)

### 🔍 Filtros e Visualização
- Filtrar alunos por **ano escolar** e **curso**
- Preview em tempo real com controles de **escala** (70%, 85%, 100%)
- Simulação de **visualização mobile** com frame de celular

### 📥 Exportação
- Download de página individual em **PNG 1080×1350** (formato Instagram 4:5)
- Download de **todas as páginas em ZIP**
- Alta qualidade para redes sociais

### 💾 Persistência
- Dados salvos automaticamente no navegador (localStorage)
- Restauração automática ao reabrir a aplicação

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/massarovictor/geradordeposts.git

# Entrar na pasta
cd geradordeposts

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 🛠️ Stack Tecnológica

- **Frontend**: React 19, TypeScript
- **Build**: Vite 6
- **Estilização**: TailwindCSS (via CDN)
- **Ícones**: Heroicons
- **Exportação de Imagem**: html-to-image
- **Manipulação de Excel**: xlsx
- **Compressão ZIP**: jszip

## 📁 Estrutura do Projeto

```
├── App.tsx                 # Componente principal
├── types.ts                # Tipos e interfaces
├── components/
│   ├── ClassGrid.tsx       # Card visual dos alunos
│   ├── FilterBar.tsx       # Barra de filtros
│   ├── ImageCropper.tsx    # Ajuste de enquadramento de foto
│   ├── LayoutSelector.tsx  # Seletor de layout
│   ├── PreviewControls.tsx # Controles de preview
│   ├── StudentForm.tsx     # Formulário de aluno
│   └── StudentList.tsx     # Lista de alunos
├── hooks/
│   ├── useConfig.ts        # Estado de configurações
│   ├── useFilters.ts       # Estado de filtros
│   ├── useLocalStorage.ts  # Persistência
│   └── useStudents.ts      # CRUD de alunos
└── index.html
```

## 📝 Licença

Este projeto está sob a licença MIT.

---

Desenvolvido para **EEEP Maria Célia Pinheiro Falcão** 🎓
