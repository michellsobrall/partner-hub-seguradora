# =======================================================
# Dockerfile - Partner Hub Frontend (React 18 + Vite)
# =======================================================

FROM node:20-alpine

WORKDIR /app

# Cache de dependências
COPY package.json ./
RUN npm install

# Código-fonte
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

