import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import path from 'path';
import { typeDefs, resolvers } from './schemas';
import db from './config/connection';
import { authMiddleware } from '../utils/auth';
const PORT = process.env.PORT || 3001;
const app = express();
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: authMiddleware,
});
const startApolloServer = async () => {
    await server.start();
    server.applyMiddleware({ app });
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, '../client/build')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/build/index.html'));
        });
    }
    db.once('open', () => {
        app.listen(PORT, () => {
            console.log(`API server running on port ${PORT}!`);
            console.log(`GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
        });
    });
};
// Start the server
startApolloServer();
