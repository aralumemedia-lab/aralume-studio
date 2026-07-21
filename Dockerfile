FROM oven/bun:1.3.14-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build && bun run backend:build

ENV NODE_ENV=production
EXPOSE 3001 4173

CMD ["bun", "run", "backend:start"]
