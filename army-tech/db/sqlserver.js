const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || '112.137.140.138',
  database: process.env.DB_NAME || 'hvct-local',
  user: process.env.DB_USER || 'dev',
  password: process.env.DB_PASSWORD || 'dev123A@!',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 60000
  },
  pool: {
    max: 30,
    min: 2,
    idleTimeoutMillis: 30000
  }
};

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then(pool => {
        console.log(`✅ Kết nối SQL Server thành công: [${config.server}] -> [${config.database}]`);
        return pool;
      })
      .catch(err => {
        console.error('❌ Lỗi kết nối SQL Server:', err);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

/**
 * Chuẩn hóa câu query từ dạng positional (?) hoặc named (@param) sang SQL Server Request
 * @param {string} rawSql 
 * @param {Array|Object} params 
 * @returns {{ sql: string, bind: Function }}
 */
function prepareSqlAndParams(rawSql, params = []) {
  let paramIndex = 0;
  const paramMap = {};

  let formattedSql = rawSql;

  if (Array.isArray(params)) {
    // Thay thế ? bằng @p0, @p1, ...
    formattedSql = rawSql.replace(/\?/g, () => {
      const pName = `p${paramIndex}`;
      paramMap[pName] = params[paramIndex];
      paramIndex++;
      return `@${pName}`;
    });
  } else if (params && typeof params === 'object') {
    Object.assign(paramMap, params);
  }

  return {
    sql: formattedSql,
    bind: (request) => {
      for (const [key, value] of Object.entries(paramMap)) {
        let val = value;
        if (val === undefined) val = null;
        request.input(key, val);
      }
    }
  };
}

/**
 * Lấy 1 bản ghi duy nhất
 * @param {string} sqlText 
 * @param {Array|Object} params 
 * @param {sql.Transaction} [tx] 
 * @returns {Promise<Object|null>}
 */
async function get(sqlText, params = [], tx = null) {
  const pool = tx ? null : await getPool();
  const request = tx ? new sql.Request(tx) : pool.request();
  const prepared = prepareSqlAndParams(sqlText, params);
  prepared.bind(request);

  const result = await request.query(prepared.sql);
  return (result.recordset && result.recordset.length > 0) ? result.recordset[0] : null;
}

/**
 * Lấy danh sách nhiều bản ghi
 * @param {string} sqlText 
 * @param {Array|Object} params 
 * @param {sql.Transaction} [tx] 
 * @returns {Promise<Array<Object>>}
 */
async function all(sqlText, params = [], tx = null) {
  const pool = tx ? null : await getPool();
  const request = tx ? new sql.Request(tx) : pool.request();
  const prepared = prepareSqlAndParams(sqlText, params);
  prepared.bind(request);

  const result = await request.query(prepared.sql);
  return result.recordset || [];
}

/**
 * Thực thi câu lệnh INSERT, UPDATE, DELETE
 * @param {string} sqlText 
 * @param {Array|Object} params 
 * @param {sql.Transaction} [tx] 
 * @returns {Promise<{ changes: number, lastInsertRowid?: number, recordset?: any[] }>}
 */
async function run(sqlText, params = [], tx = null) {
  const pool = tx ? null : await getPool();
  const request = tx ? new sql.Request(tx) : pool.request();
  
  let queryText = sqlText.trim();
  const isInsert = /^\s*insert\s+into/i.test(queryText);

  // Nếu là INSERT mà chưa có OUTPUT hoặc SCOPE_IDENTITY, bổ sung SCOPE_IDENTITY() để lấy lastInsertRowid
  if (isInsert && !/OUTPUT\s+INSERTED/i.test(queryText) && !/SCOPE_IDENTITY\(\)/i.test(queryText)) {
    if (queryText.endsWith(';')) queryText = queryText.slice(0, -1);
    queryText += '; SELECT SCOPE_IDENTITY() AS insertId;';
  }

  const prepared = prepareSqlAndParams(queryText, params);
  prepared.bind(request);

  const result = await request.query(prepared.sql);
  const changes = Array.isArray(result.rowsAffected) 
    ? result.rowsAffected.reduce((acc, c) => acc + (c || 0), 0) 
    : (result.rowsAffected || 0);

  let lastInsertRowid = null;
  if (result.recordset && result.recordset.length > 0) {
    lastInsertRowid = result.recordset[0].insertId || result.recordset[0].id || null;
    if (lastInsertRowid !== null) {
      lastInsertRowid = Number(lastInsertRowid);
    }
  }

  return {
    changes,
    lastInsertRowid,
    recordset: result.recordset
  };
}

/**
 * Thực thi câu lệnh SQL thô
 * @param {string} sqlText 
 * @param {sql.Transaction} [tx] 
 * @returns {Promise<sql.IResult<any>>}
 */
async function exec(sqlText, tx = null) {
  const pool = tx ? null : await getPool();
  const request = tx ? new sql.Request(tx) : pool.request();
  return request.query(sqlText);
}

/**
 * Quản lý Transaction an toàn
 * @param {Function} callback (tx) => Promise<any>
 * @returns {Promise<any>}
 */
async function transaction(callback) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const txDb = {
      get: (sqlText, params) => get(sqlText, params, tx),
      all: (sqlText, params) => all(sqlText, params, tx),
      run: (sqlText, params) => run(sqlText, params, tx),
      exec: (sqlText) => exec(sqlText, tx),
      rawTx: tx
    };
    const res = await callback(txDb);
    await tx.commit();
    return res;
  } catch (err) {
    try {
      await tx.rollback();
    } catch (rbErr) {
      // rollback error ignore
    }
    throw err;
  }
}

module.exports = {
  sql,
  config,
  getPool,
  get,
  all,
  run,
  exec,
  transaction
};
