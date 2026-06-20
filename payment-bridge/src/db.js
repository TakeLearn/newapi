import mysql from 'mysql2/promise';

export function createPool(config) {
  return mysql.createPool({
    uri: config.databaseUrl,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
  });
}
