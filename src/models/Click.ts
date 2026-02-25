import { pool } from "../config/database";

export interface Click {
  id: number;
  url_id: number;
  clicked_at: Date;
}

export const logClick = async (urlId: number): Promise<void> => {
  await pool.query(
    `INSERT INTO clicks (url_id)
     VALUES ($1)`,
    [urlId]
  );
};

export const getClickCount = async (urlId: number): Promise<number> => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM clicks WHERE url_id = $1`,
    [urlId]
  );

  return parseInt(result.rows[0].count, 10);
};
