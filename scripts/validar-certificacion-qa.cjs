'use strict';
// Control-Interno: exigir dos pruebas APROBADAS del SHA exacto de BMZCN main.
// Ambas evidencias son generadas por workflows sin publicar instaladores.
const expected=String(process.env.BMZCN_SOURCE_SHA||'').trim().toLowerCase();
const token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN||'';
const repo='kusne/Control-Interno';
const MAX_RUNS=60;
const PERMISSIONS={Authorization:'Bearer '+token,
 Accept:'application/vnd.github+json',
 'X-GitHub-Api-Version':'2022-11-28',
 'User-Agent':'bmzcn-ci-verificacion'};
async function request(endpoint){
 const res=await fetch('https://api.github.com/repos/'+repo+endpoint,
  {headers:PERMISSIONS,signal:AbortSignal.timeout(30000)});
 if(!res.ok)throw Error('GitHub API HTTP '+res.status);
 return res.json();
}
async function exigirEvidencia(workflow,name,tipo){
 const response=await request('/actions/workflows/'+workflow+
  '/runs?status=success&branch=main&per_page='+MAX_RUNS);
 if(!Array.isArray(response.workflow_runs))
  throw Error('No se pudieron verificar los resultados de '+tipo+'.');
 for(const run of response.workflow_runs){
  if(run.conclusion!=='success'||run.status!=='completed'||
    run.head_branch!=='main'||!['push','workflow_dispatch'].includes(run.event))
   continue;
  const result=await request('/actions/runs/'+run.id+'/artifacts?per_page=100');
  const archivo=(result.artifacts||[]).find(a=>a.name===name &&
    a.expired===false && a.workflow_run?.id===run.id);
  if(archivo){
   console.log(tipo+' certificada para fuente exacta. Run: '+run.id);
   return;
  }
 }
 throw Error('Falta certificación vigente de '+tipo+' para el commit actual.');
}
async function verificar(){
 if(!/^[0-9a-f]{40}$/.test(expected))throw Error('SHA privado no válido.');
 if(!token)throw Error('Permisos insuficientes para consultar la QA.');
 await exigirEvidencia('qa-bmzcn-privado-sin-publicar.yml',
  'bmzcn-qa-main-'+expected,'QA de 150 regresiones');
 await exigirEvidencia('certificacion-electron-windows-bmzcn.yml',
  'bmzcn-electron-main-'+expected,'ejecutable Windows/Electron');
}
verificar().catch(error=>{
 console.error('PUBLICACIÓN BLOQUEADA: '+String(error.message||error).slice(0,160));
 process.exitCode=1;
});
