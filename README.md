# TurbidezRJ - Monitoramento da Qualidade da Água no Rio de Janeiro

![TurbidezRJ Screenshot](https://github.com/sigvum/turbidezrj/blob/main/public/screenshot.jpg)

## Descrição

O TurbidezRJ é um sistema WebGIS que visa disseminar informações sobre a qualidade da água no estado do Rio de Janeiro. O projeto analisa dados de turbidez hídrica no período de 2013 a 2019, utilizando dados oficiais da Agência Nacional de Águas (ANA).

Principais funcionalidades:

- Visualização da média de turbidez em corpos d'água
- Filtragem por ano (2013-2019) e média total do período
- Busca por pontos de monitoramento específicos utilizando o nome dos corpos d'água
- Visualização espacial interativa

## Tecnologias Utilizadas

- [Next.js](https://nextjs.org/) (Framework React)
- [Leaflet](https://leafletjs.com/) e [React-Leaflet](https://react-leaflet.js.org/) (Mapas interativos)
- [@turf/turf](https://turfjs.org/) (Análise espacial)
- PostgreSQL com PostGIS (Banco de dados geoespacial)

## Pré-requisitos

- Node.js (v16 ou superior)
- npm ou yarn
- Acesso ao banco de dados PostgreSQL com PostGIS

## Configuração do Ambiente

1. Clone o repositório:

git clone https://github.com/sigvum/turbidezrj.git
cd turbidezrj

2. Instale as dependências:
   npm install

3. Configure a variável de ambiente:
   Crie um arquivo .env.local na raiz do projeto com o seguinte conteúdo:
   DATABASE_URL=postgresql://usuario:senha@servidor:porta/nome_do_banco

4. Inicie o servidor de desenvolvimento:
   npm run dev

O aplicativo estará disponível em http://localhost:3000.

5. Contribuições
   Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.
