import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { CassandraClient, CassandraClientConfig } from './cassandra-client.js';

interface ExecuteQueryArgs {
  query: string;
  params?: Record<string, any>;
}

interface CreateTableArgs {
  tableName: string;
  schema: Record<string, string>;
  primaryKey: string | string[];
}

interface InsertDataArgs {
  tableName: string;
  data: Record<string, any>;
}

interface UpdateDataArgs {
  tableName: string;
  data: Record<string, any>;
  conditions: Record<string, any>;
}

interface DeleteDataArgs {
  tableName: string;
  conditions: Record<string, any>;
}

function isExecuteQueryArgs(args: unknown): args is ExecuteQueryArgs {
  return typeof args === 'object' && args !== null && typeof (args as ExecuteQueryArgs).query === 'string';
}

function isCreateTableArgs(args: unknown): args is CreateTableArgs {
  return (
    typeof args === 'object' && 
    args !== null && 
    typeof (args as CreateTableArgs).tableName === 'string' && 
    typeof (args as CreateTableArgs).schema === 'object' &&
    ((args as CreateTableArgs).primaryKey !== undefined)
  );
}

function isInsertDataArgs(args: unknown): args is InsertDataArgs {
  return (
    typeof args === 'object' && 
    args !== null && 
    typeof (args as InsertDataArgs).tableName === 'string' && 
    typeof (args as InsertDataArgs).data === 'object'
  );
}

function isUpdateDataArgs(args: unknown): args is UpdateDataArgs {
  return (
    typeof args === 'object' && 
    args !== null && 
    typeof (args as UpdateDataArgs).tableName === 'string' && 
    typeof (args as UpdateDataArgs).data === 'object' &&
    typeof (args as UpdateDataArgs).conditions === 'object'
  );
}

function isDeleteDataArgs(args: unknown): args is DeleteDataArgs {
  return (
    typeof args === 'object' && 
    args !== null && 
    typeof (args as DeleteDataArgs).tableName === 'string' && 
    typeof (args as DeleteDataArgs).conditions === 'object'
  );
}

export class CassandraServer {
  private server: Server;
  private cassandra: CassandraClient;

  constructor(config: CassandraClientConfig) {
    this.server = new Server(
      {
        name: 'mcp-cassandra-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.cassandra = new CassandraClient(config);
    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
  }

  private setupToolHandlers(): void {
    // Define available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_query',
          description: 'Execute a CQL query on Cassandra database',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'CQL query to execute',
              },
              params: {
                type: 'object',
                description: 'Query parameters',
                additionalProperties: true,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'create_table',
          description: 'Create a new table in Cassandra database',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Name of the table to create',
              },
              schema: {
                type: 'object',
                description: 'Table schema with column names as keys and CQL types as values',
                additionalProperties: {
                  type: 'string',
                },
              },
              primaryKey: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'Single primary key column',
                  },
                  {
                    type: 'array',
                    description: 'Composite primary key with partition and clustering keys',
                    items: {
                      type: 'string',
                    },
                  },
                ],
                description: 'Primary key definition',
              },
            },
            required: ['tableName', 'schema', 'primaryKey'],
          },
        },
        {
          name: 'insert_data',
          description: 'Insert data into a Cassandra table',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Name of the table to insert data into',
              },
              data: {
                type: 'object',
                description: 'Data to insert with column names as keys',
                additionalProperties: true,
              },
            },
            required: ['tableName', 'data'],
          },
        },
        {
          name: 'update_data',
          description: 'Update data in a Cassandra table',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Name of the table to update data in',
              },
              data: {
                type: 'object',
                description: 'Data to update with column names as keys',
                additionalProperties: true,
              },
              conditions: {
                type: 'object',
                description: 'WHERE conditions with column names as keys',
                additionalProperties: true,
              },
            },
            required: ['tableName', 'data', 'conditions'],
          },
        },
        {
          name: 'delete_data',
          description: 'Delete data from a Cassandra table',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Name of the table to delete data from',
              },
              conditions: {
                type: 'object',
                description: 'WHERE conditions with column names as keys',
                additionalProperties: true,
              },
            },
            required: ['tableName', 'conditions'],
          },
        },
        {
          name: 'list_tables',
          description: 'List all tables in the current keyspace',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      ],
    }));

    // Tool execution handlers
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'execute_query': {
            if (!isExecuteQueryArgs(args)) {
              throw new McpError(ErrorCode.InvalidParams, 'Invalid execute_query arguments');
            }
            const result = await this.cassandra.executeQuery(args.query, args.params ?? {});
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'create_table': {
            if (!isCreateTableArgs(args)) {
              throw new McpError(ErrorCode.InvalidParams, 'Invalid create_table arguments');
            }
            await this.cassandra.createTable(args.tableName, args.schema, args.primaryKey);
            return {
              content: [
                {
                  type: 'text',
                  text: `Table '${args.tableName}' created successfully.`,
                },
              ],
            };
          }

          case 'insert_data': {
            if (!isInsertDataArgs(args)) {
              throw new McpError(ErrorCode.InvalidParams, 'Invalid insert_data arguments');
            }
            await this.cassandra.insertData(args.tableName, args.data);
            return {
              content: [
                {
                  type: 'text',
                  text: `Data inserted into '${args.tableName}' successfully.`,
                },
              ],
            };
          }

          case 'update_data': {
            if (!isUpdateDataArgs(args)) {
              throw new McpError(ErrorCode.InvalidParams, 'Invalid update_data arguments');
            }
            await this.cassandra.updateData(args.tableName, args.data, args.conditions);
            return {
              content: [
                {
                  type: 'text',
                  text: `Data updated in '${args.tableName}' successfully.`,
                },
              ],
            };
          }

          case 'delete_data': {
            if (!isDeleteDataArgs(args)) {
              throw new McpError(ErrorCode.InvalidParams, 'Invalid delete_data arguments');
            }
            await this.cassandra.deleteData(args.tableName, args.conditions);
            return {
              content: [
                {
                  type: 'text',
                  text: `Data deleted from '${args.tableName}' successfully.`,
                },
              ],
            };
          }

          case 'list_tables': {
            const tables = await this.cassandra.listTables();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tables, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error('Error executing tool:', error);
        return {
          content: [
            {
              type: 'text',
              text: error instanceof Error ? error.message : 'Unknown error occurred',
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    try {
      await this.cassandra.connect();
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Cassandra MCP server running on stdio');
    } catch (error) {
      console.error('Failed to start Cassandra MCP server:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.cassandra.close();
    await this.server.close();
  }
}