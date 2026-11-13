declare module "pg" {
  export interface QueryResultRow {
    [column: string]: any;
  }

  export interface QueryResult<R extends QueryResultRow = any> {
    rows: R[];
    fields: any[];
    rowCount: number | null;
    command: string;
    oid: number;
  }

  export interface PoolConfig {
    connectionString?: string;
    user?: string;
    database?: string;
    password?: string | (() => string | Promise<string>);
    port?: number;
    host?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean; ca?: string; key?: string; cert?: string };
    max?: number;
    min?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export class PoolClient {
    query<R extends QueryResultRow = any>(queryTextOrConfig: string | any, values?: any[]): Promise<QueryResult<R>>;
    release(err?: Error | boolean): void;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<R extends QueryResultRow = any>(queryTextOrConfig: string | any, values?: any[]): Promise<QueryResult<R>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
  }
}
