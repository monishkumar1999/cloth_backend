const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MIGRATIONS_TABLE = 'sequelize_meta';

async function ensureMetaTable(queryInterface) {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes(MIGRATIONS_TABLE)) {
    await queryInterface.createTable(MIGRATIONS_TABLE, {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
      }
    });
  }
}

async function runMigrations() {
  const queryInterface = sequelize.getQueryInterface();
  await ensureMetaTable(queryInterface);

  const [executedRows] = await sequelize.query(`SELECT name FROM ${MIGRATIONS_TABLE}`);
  const executed = new Set(executedRows.map(r => r.name));

  const migrationsDir = path.join(__dirname);
  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.js') && f !== 'runMigrations.js')
    .sort();

  console.log(`Checking ${files.length} migration(s)...`);

  for (const file of files) {
    if (!executed.has(file)) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      await migration.up(queryInterface, sequelize);
      await sequelize.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`, {
        replacements: [file]
      });
      console.log(`✓ Migration completed: ${file}`);
    } else {
      console.log(`- Already executed: ${file}`);
    }
  }

  console.log('All migrations are up to date.');
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
