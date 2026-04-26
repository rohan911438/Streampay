import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | undefined;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for @paystream/db");
  }

  return databaseUrl;
}

function getPool(): Pool {
  if (typeof window !== "undefined") {
    throw new Error("@paystream/db can only be used on the server");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

function assertIdentifier(identifier: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

function assertReturningClause(returning: string): string {
  const trimmed = returning.trim();

  if (trimmed === "*") {
    return "*";
  }

  const columns = trimmed.split(",").map((column) => column.trim()).filter(Boolean);

  if (columns.length === 0) {
    throw new Error("Invalid RETURNING clause");
  }

  return columns.map((column) => assertIdentifier(column)).join(", ");
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params as unknown[]);
}

export async function insert<T extends QueryResultRow = QueryResultRow>(
  table: string,
  values: Record<string, unknown>,
  returning = "*"
): Promise<T | null> {
  const entries = Object.entries(values);

  if (entries.length === 0) {
    throw new Error("insert values cannot be empty");
  }

  const tableName = assertIdentifier(table);
  const columns = entries.map(([column]) => assertIdentifier(column));
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  const params = entries.map(([, value]) => value);
  const safeReturning = assertReturningClause(returning);

  const text = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING ${safeReturning}`;

  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function update<T extends QueryResultRow = QueryResultRow>(
  table: string,
  values: Record<string, unknown>,
  whereClause: string,
  whereParams: readonly unknown[] = [],
  returning = "*"
): Promise<T | null> {
  const entries = Object.entries(values);

  if (entries.length === 0) {
    throw new Error("update values cannot be empty");
  }

  const tableName = assertIdentifier(table);
  const setClause = entries
    .map(([column], index) => `${assertIdentifier(column)} = $${index + 1}`)
    .join(", ");
  const params = [...entries.map(([, value]) => value), ...whereParams];
  const safeReturning = assertReturningClause(returning);

  const text = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause} RETURNING ${safeReturning}`;

  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function withTransaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const output = await run(client);
    await client.query("COMMIT");
    return output;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (!pool) return;

  await pool.end();
  pool = undefined;
}

export const db = {
  query,
  insert,
  update,
  withTransaction,
  closePool,
};
