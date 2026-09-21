// Purpose: Exercise the exact production prepared SQL with local SQLite and committed migration files.
import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync,mkdirSync} from 'node:fs';import {dirname} from 'node:path';
export function localDatabase(path=':memory:'){
 if(path!==':memory:')mkdirSync(dirname(path),{recursive:true,mode:0o700});const db=new DatabaseSync(path);db.exec('PRAGMA journal_mode=WAL;');
 db.exec('CREATE TABLE IF NOT EXISTS applied_migrations(name TEXT PRIMARY KEY)');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort()){if(!db.prepare('SELECT name FROM applied_migrations WHERE name=?').get(file)){db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));db.prepare('INSERT INTO applied_migrations VALUES(?)').run(file);}}
 return {db,prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return db.prepare(sql).get(...args)??null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){const result=db.prepare(sql).run(...args);return {success:true,meta:{changes:result.changes}};}};},close(){db.close();}};
}
