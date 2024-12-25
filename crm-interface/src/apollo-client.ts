import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://fictional-space-cod-v4xq99566gxh6qqq-5000.app.github.dev/graphql',
  headers: {
    Authorization: `Bearer ${process.env.CODESPACE_AUTH_TOKEN}`, // Replace with your actual token
  },
  cache: new InMemoryCache(),
});

export default client;