import express, { Application } from 'express';
import routes from './routes';
import { testConnection } from './config/db';
import cors from 'cors';
import { envConfig } from './config/env';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi';

import path from 'path';

//create express application
const app: Application = express();

//cors handling

function setupCors() {
    app.use(cors({
        origin: envConfig.corsOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Authorization', 'auth-token', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
        credentials: true
    }));
}

//JSON body parser middlerware
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Setup CORS middleware before routes
setupCors();

app.get('/docs/openapi.json', (_req, res) => {
    res.status(200).json(openApiDocument);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    explorer: true,
    customSiteTitle: 'BOOKORA API Docs'
}));
app.use('/api', routes);

export function startServer(){
   const PORT: number = envConfig.port;

    app.listen(PORT, function(){
        console.log("Server is up and running on port:" + PORT);
    });

    // Keep startup resilient even if the database is temporarily unavailable
    void testConnection();
}
