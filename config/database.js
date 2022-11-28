import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

// const db = knex({
//     client: process.env.DB_CLIENT,
//     connection: {
//       host : process.env.DB_AWS_HOST,
//       port : process.env.DB_PORT,
//       user : process.env.DB_USER,
//       password : process.env.DB_PASSWORD,
//       database : process.env.DB_NAME
//     }
//   });

const db = knex({
    client: 'mysql',
    connection: {
      host : '127.0.0.1',
      port : 3306,
      user : 'root',
      password : 'admin',
      database : 'test'
    }
  });

export default db;