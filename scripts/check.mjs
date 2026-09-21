// Purpose: Check deployment-ready source syntax without a build or bundling step.
import {readdir} from 'node:fs/promises';import {spawnSync} from 'node:child_process';
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+e.name;if(e.isDirectory())await walk(path);else if(/\.(mjs|js)$/.test(path)){if(spawnSync(process.execPath,['--check',path],{stdio:'inherit'}).status!==0)process.exit(1);}}}
for(const path of ['dist','scripts','tests'])await walk(path);
