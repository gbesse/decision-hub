// Purpose: Generate inspectable D1-compatible SQL migrations from the tenant schema.
import {defineConfig} from 'drizzle-kit';
export default defineConfig({out:'./drizzle',schema:'./db/schema.ts',dialect:'sqlite'});
