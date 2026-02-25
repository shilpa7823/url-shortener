import { pool } from "../config/database";

export interface Url {
  id: number;
  original_url: string;
  short_code: string;
  created_at: Date;
}

export const createUrl = async (
  originalUrl: string,
  shortCode: string
): Promise<Url> => {
  const result = await pool.query(
    `INSERT INTO urls (original_url, short_code)
     VALUES ($1, $2)
     RETURNING *`,
    [originalUrl, shortCode]
  );

  return result.rows[0];
};

export const findByShortCode = async (
  shortCode: string
): Promise<Url | null> => {
  const result = await pool.query(
    `SELECT * FROM urls WHERE short_code = $1`,
    [shortCode]
  );

  return result.rows[0] || null;
};
