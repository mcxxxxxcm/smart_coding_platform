import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export function buildLimitOffset(page: number, limit: number): string {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const safeOffset = Math.max(0, (Math.floor(page) - 1) * safeLimit);
  return `LIMIT ${safeLimit} OFFSET ${safeOffset}`;
}

export async function paginatedQuery<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  countSql: string,
  params: any[],
  page: number,
  limit: number
): Promise<{ data: T[]; total: number; page: number; limit: number; totalPages: number }> {
  const limitClause = buildLimitOffset(page, limit);
  const [rows] = await pool.query<T[]>(`${sql} ${limitClause}`, params);
  const [countRows] = await pool.execute<(RowDataPacket & { total: number })[]>(countSql, params);
  const total = countRows[0]?.total || 0;
  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export function buildDynamicUpdate(fields: Record<string, any>): { setClause: string; values: any[] } {
  const updates: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }

  return { setClause: updates.join(', '), values };
}

export function buildWhereClause(conditions: { clause: string; value?: any }[]): {
  whereClause: string;
  params: any[];
} {
  const parts: string[] = [];
  const params: any[] = [];

  for (const { clause, value } of conditions) {
    parts.push(clause);
    if (value !== undefined) {
      if (Array.isArray(value)) {
        params.push(...value);
      } else {
        params.push(value);
      }
    }
  }

  return {
    whereClause: parts.length > 0 ? 'WHERE ' + parts.join(' AND ') : '',
    params
  };
}

export async function findById<T extends RowDataPacket = RowDataPacket>(
  table: string,
  id: number | string,
  columns: string = '*'
): Promise<T | null> {
  const [rows] = await pool.execute<T[]>(`SELECT ${columns} FROM ${table} WHERE id = ?`, [id]);
  return rows[0] || null;
}

export async function insert(
  table: string,
  data: Record<string, any>
): Promise<number> {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(', ');
  const values = keys.map(k => data[k]);

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
    values
  );

  return result.insertId;
}

export async function updateById(
  table: string,
  id: number | string,
  data: Record<string, any>
): Promise<void> {
  const { setClause, values } = buildDynamicUpdate(data);
  if (!setClause) return;

  await pool.execute(
    `UPDATE ${table} SET ${setClause} WHERE id = ?`,
    [...values, id]
  );
}

export async function deleteById(table: string, id: number | string): Promise<void> {
  await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
}
