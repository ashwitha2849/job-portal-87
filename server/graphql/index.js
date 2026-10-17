import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

// Build context from Clerk auth attached to req by clerkMiddleware
const buildContext = ({ req }) => {
  const userId = req.auth?.userId || null;
  return { userId, req };
};

// Create and start the Apollo Server, returns Express middleware
export const createApolloMiddleware = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Enable GraphQL Playground/Studio
    formatError: (formattedError) => {
      console.error('[GraphQL Error]', formattedError.message);
      return formattedError;
    }
  });

  await server.start();

  return expressMiddleware(server, {
    context: buildContext
  });
};
