import knex from 'knex';

const db = knex({
    client: 'mysql',
    connection: {
      host : 'andoid-db0001.ceb5k0d6icw1.ap-south-1.rds.amazonaws.com',
      port : 3306,
      user : 'admin',
      password : 'adminadmin',
      database : 'test'
    }
  });

  export default db;