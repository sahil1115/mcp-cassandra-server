import { Client, types, mapping } from 'cassandra-driver';

export interface CassandraClientConfig {
  contactPoints: string[];
  localDataCenter: string;
  keyspace?: string;
  username: string;
  password: string;
}

export interface CassandraQueryParams {
  [key: string]: any;
}

export class CassandraClient {
  private client: Client;
  private mapper: mapping.Mapper | null = null;

  constructor(config: CassandraClientConfig) {
    const authProvider = new types.auth.PlainTextAuthProvider(
      config.username,
      config.password
    );

    this.client = new Client({
      contactPoints: config.contactPoints,
      localDataCenter: config.localDataCenter,
      keyspace: config.keyspace,
      authProvider: authProvider,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    console.error('Connected to Cassandra cluster');
  }

  async executeQuery(query: string, params: CassandraQueryParams = {}): Promise<any[]> {
    try {
      const result = await this.client.execute(query, params, { prepare: true });
      return result.rows.map(row => {
        const processedRow: Record<string, any> = {};
        
        // Convert special Cassandra types to standard JS types
        for (const key in row) {
          const value = row[key];
          if (value instanceof types.Long) {
            processedRow[key] = value.toString();
          } else if (value instanceof types.Uuid) {
            processedRow[key] = value.toString();
          } else if (value instanceof types.TimeUuid) {
            processedRow[key] = value.toString();
          } else if (value instanceof types.LocalDate) {
            processedRow[key] = value.toString();
          } else if (value instanceof types.LocalTime) {
            processedRow[key] = value.toString();
          } else if (value instanceof types.Tuple) {
            processedRow[key] = value.values();
          } else {
            processedRow[key] = value;
          }
        }
        
        return processedRow;
      });
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  async createTable(tableName: string, schema: Record<string, string>, primaryKey: string | string[]): Promise<void> {
    let columns = Object.entries(schema)
      .map(([name, type]) => `${name} ${type}`)
      .join(', ');
    
    let primaryKeyClause: string;
    if (Array.isArray(primaryKey)) {
      primaryKeyClause = `PRIMARY KEY ((${primaryKey[0]}), ${primaryKey.slice(1).join(', ')})`;
    } else {
      primaryKeyClause = `PRIMARY KEY (${primaryKey})`;
    }
    
    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns}, ${primaryKeyClause})`;
    await this.executeQuery(query);
  }

  async insertData(tableName: string, data: Record<string, any>): Promise<void> {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(query, values);
  }

  async updateData(tableName: string, data: Record<string, any>, conditions: Record<string, any>): Promise<void> {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    
    const values = [...Object.values(data), ...Object.values(conditions)];
    
    const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    await this.executeQuery(query, values);
  }

  async deleteData(tableName: string, conditions: Record<string, any>): Promise<void> {
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    
    const values = Object.values(conditions);
    
    const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    await this.executeQuery(query, values);
  }

  async listTables(): Promise<string[]> {
    const query = "SELECT table_name FROM system_schema.tables WHERE keyspace_name = ?";
    const result = await this.executeQuery(query, [this.client.keyspace]);
    return result.map(row => row.table_name);
  }

  async close(): Promise<void> {
    await this.client.shutdown();
    console.error('Disconnected from Cassandra cluster');
  }
}