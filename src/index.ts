#!/usr/bin/env node
import { CassandraServer } from './server.js';

// Load configuration from environment variables
const cassandraPassword = process.env.CASSANDRA_PASSWORD;

// Exit if password is not provided
if (!cassandraPassword) {
  console.error('Error: CASSANDRA_PASSWORD environment variable is required');
  process.exit(1);
}

const config = {
  contactPoints: (process.env.CASSANDRA_CONTACT_POINTS || 'localhost').split(','),
  localDataCenter: process.env.CASSANDRA_LOCAL_DC || 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE,
  username: process.env.CASSANDRA_USERNAME || 'cassandra',
  password: cassandraPassword,
};

// Start the server
const server = new CassandraServer(config);

server.run().catch((error) => {
  console.error('Failed to start Cassandra MCP server:', error);
  process.exit(1);
});

// Cleanup on exit
process.on('SIGINT', async () => {
  try {
    await server.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await server.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
