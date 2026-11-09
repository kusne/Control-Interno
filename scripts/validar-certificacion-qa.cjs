'use strict';
// Control-Interno: exigir QA Windows APROBADA para el SHA exacto del main privado.
// Este archivo reside en el repositorio público de publicación, fuera de BMZCN.
const expected = String(process.env.BMZCN_SOURCE_SHA || '').trim().toLowerCase();
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const repo = 'kusne/Control-Interno';
const workflow = 'qa-bmzcn-privado-sin-publicar.yml';
const maxRuns = 60;
const fail = message => { console.error('PUBLICACION BLOQUEADA: '+message); process.exitCode=1; };
async function request(endpoint) {
  const res = await fetch('https://api.github.com/repos/'+repo+endpoint,{
    headers:{
      Authorization:'Bearer '+token,
      Accept:'application/vnd.github+json',
      'X-GitHub-Api-Version':'2022-11-28',
      'User-Agent':'bmzcn-ci-verificacion'
    },
    signal:AbortSignal.timeout(30000)
  });
  if (!res.ok) throw Error('GitHub API HTTP '+res.status);
  return res.json();
}
async function verificar() {
  if (!/^[0-9a-f]{40}$/.test(expected)) return fail('SHA de origen inválido.');
  if (!token) return fail('Falta permiso de lectura para verificar QA.');
  // No se aceptan pruebas de ramas experimentales ni ejecuciones fallidas.
  const runs = await request('/actions/workflows/'+workflow+
    '/runs?status=success&branch=main&per_page='+maxRuns);
  if (!Array.isArray(runs.workflow_runs)) throw Error('GitHub no devolvió ejecuciones QA verificables.');
  const name = 'bmzcn-qa-main-'+expected;
  for (const run of runs.workflow_runs) {
    if (run.conclusion!=='success' || run.status!=='completed' ||
        run.head_branch!=='main' || !['push','workflow_dispatch'].includes(run.event))
      continue;
    const result = await request('/actions/runs/'+run.id+'/artifacts?per_page=100');
    const evidence = (result.artifacts || []).find(a=>a.name===name &&
      a.expired===false && a.workflow_run?.id===run.id);
    if (!evidence) continue;
    console.log('QA Windows certificada para fuente exacta. Run: '+run.id);
    return;
  }
  return fail('No existe QA Windows exitosa con evidencia vigente para este commit de main.');
}
verificar().catch(error=>fail('Verificación indisponible ('+String(error.message||error).slice(0,100)+').'));
