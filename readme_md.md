# Painel de Análise de Crédito com Machine Learning 📊

Este é um projeto desenvolvido em **React**, **TypeScript** e **Vite**, focado na análise de risco de crédito de clientes. A aplicação processa dados financeiros e utiliza um modelo matemático próprio (baseado em **K-Means**) para segmentar clientes em grupos comportamentais, atribuir pontuações de crédito (*credit scores*) e recomendar limites de forma dinâmica.

## ✨ Funcionalidades

* **Motor de Score Dinâmico**: Calcula a pontuação de crédito com base na renda mensal, dívida ativa e histórico de atrasos.
* **Agrupamento com K-Means**: Implementação nativa (do zero) do algoritmo K-Means para segmentar clientes em 3 clusters:
  * 🔴 Risco Médio / Inadimplência
  * 🟡 Base Geral
  * 🔵 Premium / Baixo Risco
* **Visualização de Dados**: Gráficos interativos (dispersão e histograma) utilizando a biblioteca `recharts`.
* **Exportação**: Geração e download de relatórios em formato `.csv`.
* **Modo Escuro (Dark Mode)**: Suporte a tema claro e escuro, respeitando a preferência do sistema operacional do utilizador e permitindo alternância manual.

## 🛠️ Tecnologias Utilizadas

* [React](https://reactjs.org/)
* [TypeScript](https://www.typescriptlang.org/)
* [Vite](https://vitejs.dev/)
* [Recharts](https://recharts.org/) (Gráficos)
* [Lucide React](https://lucide.dev/) (Ícones)
* [Tailwind CSS](https://tailwindcss.com/) / CSS Puro (Estilização)

## 🚀 Como Executar o Projeto Localmente

Siga os passos abaixo para testar a aplicação na sua máquina:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/daviChechetto/backup_machine_learning.git
   ```

2. **Aceda à pasta do projeto:**
   ```bash
   cd backup_machine_learning
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. Abra o seu navegador e aceda a `http://localhost:5173`.

## 🧠 Sobre o Algoritmo K-Means Implementado

O projeto não utiliza bibliotecas externas pesadas para Machine Learning. O algoritmo **K-Means** foi implementado do zero em TypeScript no ficheiro `App.tsx`. O processo inclui:
1. **Normalização Min-Max**: Para garantir que características de alta escala (como a Renda) não ofusquem características de baixa escala (como Dias de Atraso).
2. **Distância Euclidiana**: Cálculo matemático para aproximar os clientes aos seus centroides mais próximos.
3. **Reclassificação Dinâmica**: Recálculo iterativo dos centroides até a convergência (ou limite máximo de 50 iterações).

## 🗄️ Base de Dados (Para Integração Futura)

Na raiz do projeto encontra-se um ficheiro `database.sql` que contém a estrutura da tabela `clients` e um insert inicial, pronta para ser integrada com um backend (Node.js, Python, etc.) futuramente.