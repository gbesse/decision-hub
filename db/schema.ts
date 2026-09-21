// Purpose: Define tenant-keyed immutable policies, evaluation reports, revocable shares and bounded call quotas.
import {sqliteTable,text,integer,primaryKey,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const policies=sqliteTable('policies',{owner:text('owner').notNull(),id:text('id').notNull(),name:text('name').notNull(),version:text('version').notNull(),body:text('body').notNull()},t=>[primaryKey({columns:[t.owner,t.id]}),uniqueIndex('policy_owner_name_version').on(t.owner,t.name,t.version)]);
export const reports=sqliteTable('reports',{owner:text('owner').notNull(),id:text('id').notNull(),created:text('created').notNull(),body:text('body').notNull()},t=>[primaryKey({columns:[t.owner,t.id]})]);
export const shares=sqliteTable('shares',{owner:text('owner').notNull(),id:text('id').primaryKey(),expires:integer('expires').notNull(),body:text('body').notNull()});
export const quotas=sqliteTable('quotas',{owner:text('owner').notNull(),bucket:integer('bucket').notNull(),used:integer('used').notNull()},t=>[primaryKey({columns:[t.owner,t.bucket]})]);
