Cassandra MCP Server Features
This Model Context Protocol (MCP) server provides integration between Apache Cassandra database and Claude Desktop, enabling database operations through natural language interactions.

1. Running the Cassandra MCP Server with NPX
First, publish your package to npm (or use it locally). 

```
npx @sahil1115/mcp-cassandra-server

```
Required environment variables (set these before running or in a .env file):

```
export CASSANDRA_PASSWORD=your_password
export CASSANDRA_CONTACT_POINTS=host1,host2
export CASSANDRA_LOCAL_DC=your_datacenter
export CASSANDRA_KEYSPACE=your_keyspace  # optional
export CASSANDRA_USERNAME=your_username  # defaults to "cassandra"
```


2. Adding to Claude Desktop Configuration

Add this to your Claude Desktop config file (usually claude-desktop.config.json):

```
{
  "tools": [
    {
      "name": "mcp-cassandra-server",
      "command": "npx @@sahil1115/mcp-cassandra-server",
      "env": {
        "CASSANDRA_PASSWORD": "your_password",
        "CASSANDRA_CONTACT_POINTS": "host1,host2",
        "CASSANDRA_LOCAL_DC": "your_datacenter",
        "CASSANDRA_KEYSPACE": "your_keyspace"
      },
      "stdio": true
    }
  ]
}
```

