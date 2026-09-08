FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data

WORKDIR /app

RUN mkdir -p /app/data \
  && chown -R node:node /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json server.js template.docx ./
COPY --chown=node:node public ./public
COPY --chown=node:node db ./db
COPY --chown=node:node entities ./entities
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node docs ./docs

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "const http=require('http');const port=process.env.PORT||3001;const req=http.get({host:'127.0.0.1',port,path:'/'},res=>process.exit(res.statusCode<500?0:1));req.on('error',()=>process.exit(1));req.setTimeout(4000,()=>{req.destroy();process.exit(1);});"

CMD ["node", "server.js"]
