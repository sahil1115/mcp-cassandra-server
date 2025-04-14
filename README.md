Cassandra MCP Server <br>
This Model Context Protocol (MCP) server integrates the Apache Cassandra database with Claude Desktop, enabling database operations through natural language interactions.
<br>
<br>
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

<br>
<br>
2. Adding to the Claude Desktop Configuration

Add this to your Claude Desktop config file (usually claude-desktop.config.json):

```
{
  "tools": [
    {
      "name": "mcp-cassandra-server",
      "command": "npx @sahil1115/mcp-cassandra-server",
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

Cassandra MCP Server Features
This Model Context Protocol (MCP) server provides integration between Apache Cassandra database and Claude Desktop, enabling database operations through natural language interactions.

Tools
1. execute_query: Execute CQL queries on the Cassandra database
* Supports all types of CQL queries (SELECT, INSERT, UPDATE, DELETE)
* Returns query results in a structured format
* Parameters can be passed to prevent injection attacks


2. create_table: Create a new table in the Cassandra database
* Define table schema with column names and data types
* Configure primary keys (simple or composite with partition and clustering keys)
* Automatically creates the table if it doesn't exist


3. insert_data: Insert data into Cassandra tables
* Add new records to existing tables
* Supports all Cassandra data types
* Auto-converts JavaScript types to Cassandra types


4. update_data: Update existing data in Cassandra tables
* Modify records based on specified conditions
* Update multiple columns in a single operation
* Uses parameterized queries for safety


5. delete_data: Remove data from Cassandra tables
* Delete records based on specified conditions
* Delete single or multiple records in one operation


6. list_tables: List all tables in the current keyspace
* Get an overview of available tables
* Quick schema discovery



Usage Examples
Here are examples of how you can interact with the Cassandra database using natural language:
<br>
<br>
Querying Data
You can ask questions like:
* "Show me all users from the 'users' table"
* "Find the latest 10 orders from customer 'ABC123'"
* "What's the average age of users in the 'customers' table?"

<br>
<br>
Creating Tables<br>
You can give instructions like:<br>
* "Create a new 'products' table with columns for id, name, price, and category"
* "Set up a users table with email as the primary key"
* "Create a time series table for temperature readings with device_id and timestamp as the primary key"
<br>
<br>
Inserting Data<br>
You can request data insertions like:<br>
* "Add a new user named Sarah Smith with email sarah@example.com and age 32"
* "Insert a product with ID 12345, name 'Wireless Earbuds', price $99.99"
* "Add a new temperature reading of 72.5°F for device ABC at the current time"
<br>
<br>

Updating Data<br>
You can ask for updates like:<br>
* "Update user john@example.com to have phone number 555-123-4567"
* "Change the price of product 12345 to $89.99"
* "Mark all orders from customer ABC123 as 'shipped'"
<br>
<br>
Deleting Data<br>
You can request deletions like:<br>
* "Delete user with email john@example.com"
* "Remove all products in the 'discontinued' category"
* "Delete temperature readings older than January 1st, 2023"
<br>
<br>
Complex Operations<br>
You can perform more complex operations with natural language:<br>
* "Find all orders placed by customers in New York in the last month"
* "Calculate the total sales by category for the current quarter"
* "List the top 5 most active users based on login count
