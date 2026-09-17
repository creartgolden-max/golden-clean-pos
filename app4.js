/* =====================================================================
   GOLDEN CLEAN · app4.js — TALLER
   Seguimiento de servicios en taller: por aprobar, en taller, trabados,
   listos y llegadas/entregas. SIN precios, pagos ni teléfonos
   (lee la vista gc_taller_v, que la base de datos entrega sin esos datos).
   ===================================================================== */
'use strict';

const MOTIVOS_TRABADO = ['Espera autorización del cliente', 'Falta material / insumo', 'Daño adicional encontrado', 'Espera proveedor / maestro externo', 'Retrabajo / garantía', 'Pieza delicada: se evalúa'];
const TK = { tab: 'taller', rep: '', q: '' };

function diasTxt(fent, estado) {
  if (!fent) return { t: 'sin fecha', c: 'muted', n: null };
  if (!['recibido', 'en_proceso'].includes(estado)) return { t: fmtD(fent), c: '', n: null };
  const d = diffDays(fent, hoy());
  if (d < 0) return { t: `${fmtD(fent)} · atraso ${-d} d`, c: 'down', n: d };
  if (d === 0) return { t: `${fmtD(fent)} · HOY`, c: 'down', n: 0 };
  if (d === 1) return { t: `${fmtD(fent)} · mañana`, c: 'warn', n: 1 };
  return { t: `${fmtD(fent)} · en ${d} d`, c: 'muted', n: d };
}

V.taller = async (el, params) => {
  if (params.tab) TK.tab = params.tab;
  const h0 = hoy(), hace7 = addDays(h0, -7), en7 = addDays(h0, 7);
  el.innerHTML = head('Taller', 'Seguimiento de taller', `<button class="btn ghost" id="tXls">${svg('xls')} Excel</button>`) + '<div id="tBody"><div class="loading">Cargando…</div></div>';
  const [abiertos, recientes] = await Promise.all([
    fetchAll(() => S.sb.from('gc_taller_v').select('*').in('estado', ESTADOS_ABIERTOS).order('folio')),
    fetchAll(() => S.sb.from('gc_taller_v').select('*').in('estado', ['entregado']).gte('entregado_en', hace7).order('entregado_en', { ascending: false })),
  ]);
  const llegadas = await fetchAll(() => S.sb.from('gc_taller_v').select('*').gte('fecha_recepcion', hace7).neq('estado', 'cancelado').order('folio', { ascending: false }));

  const grupos = {
    porAprobar: abiertos.filter(r => r.estado === 'recibido'),
    taller: abiertos.filter(r => r.estado === 'en_proceso' && !r.trabado),
    trabados: abiertos.filter(r => r.trabado),
    listos: abiertos.filter(r => ['listo', 'avisado'].includes(r.estado)),
  };
  const vencidos = abiertos.filter(r => ['recibido', 'en_proceso'].includes(r.estado) && r.fecha_entrega && r.fecha_entrega < h0);
  const entregasProx = abiertos.filter(r => ['recibido', 'en_proceso'].includes(r.estado) && r.fecha_entrega && r.fecha_entrega >= h0 && r.fecha_entrega <= en7)
    .sort((a, b) => a.fecha_entrega.localeCompare(b.fecha_entrega));
  const puedeAccion = can('taller') || can('control');

  const dibujar = () => {
    const tabs = [['taller', 'En taller', grupos.taller.length], ['trabados', 'Trabados', grupos.trabados.length], ['porAprobar', 'Por aprobar', grupos.porAprobar.length],
      ['listos', 'Listos / por entregar', grupos.listos.length], ['movimientos', 'Llegadas y entregas', null]];
    const reps = uniq([...lista('rep'), ...abiertos.map(r => r.rep).filter(Boolean)]);
    const filtrar = rows => rows.filter(r => (!TK.rep || (TK.rep === '—' ? !r.rep : r.rep === TK.rep)) &&
      (!TK.q || String(r.folio) === TK.q.trim() || norm([r.cliente, r.marca, r.articulo, r.servicio, r.color].join(' ')).includes(norm(TK.q))));
    $('#tBody').innerHTML = `
      <div class="tiles">
        <div class="tile link" data-go="taller"><div class="k">En taller</div><div class="v">${grupos.taller.length}</div><div class="s">en proceso</div></div>
        <div class="tile link${grupos.trabados.length ? ' alert' : ''}" data-go="trabados"><div class="k">Trabados</div><div class="v">${grupos.trabados.length}</div><div class="s">requieren atención</div></div>
        <div class="tile link${vencidos.length ? ' alert' : ''}" data-go="taller"><div class="k">Atrasados</div><div class="v">${vencidos.length}</div><div class="s">pasó la fecha de entrega</div></div>
        <div class="tile link" data-go="movimientos"><div class="k">Entregas 7 días</div><div class="v">${entregasProx.length}</div><div class="s">comprometidas</div></div>
        <div class="tile link" data-go="listos"><div class="k">Listos</div><div class="v">${grupos.listos.length}</div><div class="s">terminados, por entregar</div></div>
        <div class="tile link" data-go="movimientos"><div class="k">Llegadas hoy</div><div class="v">${llegadas.filter(r => r.fecha_recepcion === h0).length}</div><div class="s">${llegadas.length} en 7 días</div></div>
      </div>
      <div class="tabs">${tabs.map(([k, l, n]) => `<button class="tab${TK.tab === k ? ' on' : ''}" data-t="${k}">${l}${n !== null ? ` (${n})` : ''}</button>`).join('')}</div>
      <div class="card"><div class="row">
        <div class="fld" style="flex:1;min-width:200px"><label>Buscar</label><input class="inp" id="tQ" value="${esc(TK.q)}" placeholder="Folio, cliente, marca, servicio…"></div>
        <div class="fld"><label>Maestro (REP)</label><select class="inp" id="tRep">${opts([...reps, '—'].map(r => ({ v: r, l: r === '—' ? 'Sin asignar' : r })), TK.rep, 'Todos')}</select></div>
      </div></div>
      <div id="tTabla"></div>`;
    const tabla = (rows, { acciones = true, fechaCol = 'entrega' } = {}) => {
      rows = filtrar(rows);
      if (!rows.length) return '<div class="card empty">Nada por aquí.</div>';
      return `<div class="tbl-wrap" style="max-height:68vh"><table class="tbl"><thead><tr>
        <th>No.</th><th>Llegó</th><th>${fechaCol === 'entregado' ? 'Entregado' : 'Entrega'}</th><th>Cliente</th><th>REP</th><th>Artículo</th><th>Marca</th><th>Corte</th><th>Color</th><th>Servicio</th><th>Observaciones</th><th>Estado</th>${acciones && puedeAccion ? '<th></th>' : ''}</tr></thead><tbody>
        ${rows.map(r => {
          const d = fechaCol === 'entregado' ? { t: fmtD(r.entregado_en), c: '' } : diasTxt(r.fecha_entrega, r.estado);
          const ultimaNota = String(r.notas_taller || '').split('\n').filter(Boolean).pop();
          return `<tr class="click est-${r.estado}" data-id="${r.id}">
          <td><b>${r.folio}</b></td><td class="nw">${fmtD(r.fecha_recepcion)}</td><td class="nw"><span class="${d.c}">${d.t}</span></td>
          <td>${esc(r.cliente)}</td><td>${esc(r.rep || '')}</td><td>${esc(r.articulo || '')}</td><td>${esc(r.marca || '')}${r.alta_gama ? ' <span class="badge b-ag">AG</span>' : ''}</td>
          <td>${esc(r.corte || '')}</td><td>${esc(r.color || '')}</td><td class="wrap srv">${esc(r.servicio || '')}</td>
          <td class="wrap"><small>${esc([r.observaciones_orden, r.observaciones].filter(Boolean).join(' · '))}${ultimaNota ? `<br><i>${esc(ultimaNota)}</i>` : ''}</small></td>
          <td class="nw">${r.trabado ? `<span class="badge" style="background:#FDE2DE;color:#9B2C1F">⛔ Trabado ${r.trabado_desde ? diffDays(h0, r.trabado_desde) + ' d' : ''}</span><br><small>${esc(r.trabado_motivo || '')}</small>` : ESTADOS[r.estado].s}</td>
          ${acciones && puedeAccion ? `<td class="nw">${r.estado === 'en_proceso' ? `<button class="btn xs gold" data-a="listo" data-i="${r.id}">Listo</button> ` : ''}${['recibido', 'en_proceso'].includes(r.estado) ? (r.trabado ? `<button class="btn xs ghost" data-a="destrabar" data-i="${r.id}">Destrabar</button>` : `<button class="btn xs danger" data-a="trabar" data-i="${r.id}">Trabado</button>`) : ''} <button class="btn xs ghost" data-a="nota" data-i="${r.id}">Nota</button></td>` : ''}
          </tr>`;
        }).join('')}</tbody><tfoot><tr><td colspan="${acciones && puedeAccion ? 13 : 12}">${rows.length} folio(s)</td></tr></tfoot></table></div>`;
    };
    const area = $('#tTabla');
    if (TK.tab === 'movimientos') {
      area.innerHTML = `<div class="card"><h3>Entregas comprometidas · próximos 7 días y atrasadas</h3>${tabla([...vencidos, ...entregasProx])}</div>
        <div class="card"><h3>Llegadas · últimos 7 días</h3>${tabla(llegadas, { acciones: false })}</div>
        <div class="card"><h3>Entregados · últimos 7 días</h3>${tabla(recientes, { acciones: false, fechaCol: 'entregado' })}</div>`;
    } else {
      const rows = TK.tab === 'listos' ? grupos.listos : TK.tab === 'trabados' ? grupos.trabados : TK.tab === 'porAprobar' ? grupos.porAprobar
        : [...grupos.taller].sort((a, b) => (a.fecha_entrega || '9').localeCompare(b.fecha_entrega || '9'));
      area.innerHTML = (TK.tab === 'porAprobar' ? '<div class="hint" style="margin-bottom:8px">Recibidos pero el cliente aún no aprueba la cotización: <b>no iniciar</b> hasta que pasen a “En taller”.</div>' : '') + tabla(rows);
    }
    $$('.tab[data-t]', el).forEach(b => b.onclick = () => { TK.tab = b.dataset.t; dibujar(); });
    $$('.tile[data-go]', el).forEach(t => t.onclick = () => { TK.tab = t.dataset.go; dibujar(); });
    $('#tQ').oninput = debounce(e => { TK.q = e.target.value; const pos = e.target.selectionStart; dibujar(); const i = $('#tQ'); i.focus(); i.setSelectionRange(pos, pos); }, 300);
    $('#tRep').onchange = e => { TK.rep = e.target.value; dibujar(); };
    $$('button[data-a]', area).forEach(b => b.onclick = ev => { ev.stopPropagation(); accionTaller(+b.dataset.i, b.dataset.a, () => route()); });
    $$('tr[data-id]', area).forEach(tr => tr.onclick = ev => { if (ev.target.closest('button')) return; fichaTaller(+tr.dataset.id); });
  };
  const todos = new Map([...abiertos, ...recientes, ...llegadas].map(r => [r.id, r]));
  const fichaTaller = id => {
    const r = todos.get(id); if (!r) return;
    const d = diasTxt(r.fecha_entrega, r.estado);
    const m = modal({
      title: `Folio ${r.folio} · ${r.articulo || ''} ${r.marca || ''}`, wide: true,
      body: `<div class="grid g4">
          <div><div class="hint">Cliente</div><b>${esc(r.cliente)}</b></div>
          <div><div class="hint">Llegó</div><b>${fmtD(r.fecha_recepcion)}</b></div>
          <div><div class="hint">Entrega</div><b class="${d.c}">${d.t}</b></div>
          <div><div class="hint">Estado</div><b>${ESTADOS[r.estado].l}</b>${r.trabado ? ' <span class="badge" style="background:#FDE2DE;color:#9B2C1F">⛔ Trabado</span>' : ''}</div>
          <div><div class="hint">Artículo / marca</div><b>${esc(r.articulo || '')} ${esc(r.marca || '')}</b>${r.alta_gama ? ' <span class="badge b-ag">ALTA GAMA</span>' : ''}</div>
          <div><div class="hint">Corte / color</div><b>${esc(r.corte || '')} · ${esc(r.color || '')}</b></div>
          <div><div class="hint">Talla</div><b>${esc(r.talla || '—')}</b></div>
          <div class="fld"><label>Maestro (REP)</label><select class="inp" id="fRep" ${puedeAccion ? '' : 'disabled'}>${opts(uniq([...lista('rep'), r.rep].filter(Boolean)), r.rep, 'Sin asignar')}</select></div>
        </div>
        <div class="card" style="margin-top:12px;background:#fbf8f1"><div class="hint">Servicio</div><div style="font-size:16px;font-weight:700;margin-top:4px">${esc(r.servicio || '')}</div>
          ${r.observaciones || r.observaciones_orden ? `<div class="hint" style="margin-top:8px">Observaciones</div><div>${esc([r.observaciones_orden, r.observaciones].filter(Boolean).join(' · '))}</div>` : ''}
          ${r.trabado ? `<div class="hint down" style="margin-top:8px">Trabado desde ${fmtD(r.trabado_desde)}</div><div>${esc(r.trabado_motivo || '')}</div>` : ''}</div>
        <h3 style="font-size:15px;margin:6px 0">Bitácora del taller</h3>
        <div style="white-space:pre-line;font-size:13px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px;max-height:200px;overflow:auto">${esc(r.notas_taller || 'Sin notas todavía.')}</div>`,
      actions: [{ label: 'Cerrar', cls: 'ghost' },
        ...(can('etiquetas') ? [{ label: 'Etiqueta', cls: 'ghost', onClick: () => go('etiquetas', { folios: r.folio }) }] : []),
        ...(puedeAccion ? [
          { label: 'Agregar nota', cls: 'ghost', onClick: () => accionTaller(r.id, 'nota', () => route()) },
          ...(r.estado === 'listo' ? [{ label: 'Regresar a taller', cls: 'ghost', onClick: () => accionTaller(r.id, 'regresar', () => route()) }] : []),
          ...(['recibido', 'en_proceso'].includes(r.estado) ? [r.trabado ? { label: 'Destrabar', cls: 'ghost', onClick: () => accionTaller(r.id, 'destrabar', () => route()) } : { label: '⛔ Marcar trabado', cls: 'danger', onClick: () => accionTaller(r.id, 'trabar', () => route()) }] : []),
          ...(r.estado === 'en_proceso' ? [{ label: '✓ Terminado (listo)', cls: 'gold', onClick: () => accionTaller(r.id, 'listo', () => route()) }] : []),
        ] : [])]
    });
    const sr = $('#fRep', m.body);
    if (sr && puedeAccion) sr.onchange = async () => {
      const { error } = await S.sb.rpc('gc_taller_accion', { p_id: r.id, p_accion: 'rep', p_texto: sr.value });
      if (error) return fail(error);
      r.rep = sr.value || null; toast(`Folio ${r.folio}: REP ${sr.value || 'sin asignar'}`);
    };
  };
  $('#tXls').onclick = () => XL.save(`Taller_${h0}.xlsx`, wb => {
    const cols = [
      { h: 'No. SERVICIO', k: 'folio', w: 10 }, { h: 'LLEGÓ', get: r => fmtD(r.fecha_recepcion), w: 11 }, { h: 'ENTREGA', get: r => fmtD(r.fecha_entrega), w: 11 },
      { h: 'DÍAS', get: r => { const d = diasTxt(r.fecha_entrega, r.estado).n; return d === null ? '' : d; }, w: 7 },
      { h: 'CLIENTE', k: 'cliente', w: 26 }, { h: 'REP', k: 'rep', w: 12 }, { h: 'ARTÍCULO', k: 'articulo', w: 12 }, { h: 'MARCA', k: 'marca', w: 18 },
      { h: 'ALTA GAMA', get: r => r.alta_gama ? 'SÍ' : '', w: 9 }, { h: 'CORTE', k: 'corte', w: 14 }, { h: 'COLOR', k: 'color', w: 14 }, { h: 'SERVICIO', k: 'servicio', w: 45 },
      { h: 'ESTADO', get: r => ESTADOS[r.estado].s + (r.trabado ? ' · TRABADO' : ''), w: 18 }, { h: 'MOTIVO TRABADO', k: 'trabado_motivo', w: 26 },
      { h: 'OBSERVACIONES', get: r => [r.observaciones_orden, r.observaciones].filter(Boolean).join(' · '), w: 36 }, { h: 'NOTAS TALLER', k: 'notas_taller', w: 45 },
    ];
    XL.table(wb.addWorksheet('En taller'), cols, grupos.taller, `EN TALLER · ${fmtD(h0)}`);
    XL.table(wb.addWorksheet('Trabados'), cols, grupos.trabados, `TRABADOS · ${fmtD(h0)}`);
    XL.table(wb.addWorksheet('Por aprobar'), cols, grupos.porAprobar, `POR APROBAR · ${fmtD(h0)}`);
    XL.table(wb.addWorksheet('Listos'), cols, grupos.listos, `LISTOS / POR ENTREGAR · ${fmtD(h0)}`);
    XL.table(wb.addWorksheet('Llegadas 7 días'), cols, llegadas, `LLEGADAS DEL ${fmtD(hace7)} AL ${fmtD(h0)}`);
    XL.table(wb.addWorksheet('Entregados 7 días'), cols, recientes, `ENTREGADOS DEL ${fmtD(hace7)} AL ${fmtD(h0)}`);
  }).catch(fail);
  dibujar();
};

async function accionTaller(id, accion, after) {
  let texto = null;
  if (accion === 'trabar') {
    texto = await new Promise(res => modal({
      title: 'Marcar como TRABADO',
      body: `<div class="fld"><label>Motivo</label><select class="inp" id="mtSel">${opts(MOTIVOS_TRABADO, '', 'Seleccionar…')}<option value="__otro">Otro…</option></select></div>
        <div class="fld" style="margin-top:10px"><label>Detalle</label><textarea class="inp" id="mtTxt" placeholder="¿Qué falta o qué pasó?"></textarea></div>`,
      actions: [{ label: 'Cancelar', cls: 'ghost', onClick: () => res(null) }, {
        label: 'Marcar trabado', cls: 'danger', onClick: ({ body }) => {
          const s = $('#mtSel', body).value, t = $('#mtTxt', body).value.trim();
          const v = [s && s !== '__otro' ? s : '', t].filter(Boolean).join(': ');
          if (!v) throw new Error('Indica el motivo');
          res(v);
        }
      }]
    }));
    if (texto === null) return;
  } else if (accion === 'nota') {
    texto = await prompt2('Nota del taller', 'Nota (avance, detalle, pendiente…)');
    if (texto === null || !texto.trim()) return;
  } else if (['listo', 'destrabar', 'regresar'].includes(accion)) {
    const msg = { listo: '¿Marcar como <b>TERMINADO (listo)</b>? Recepción avisará al cliente.', destrabar: '¿El folio ya se <b>destrabó</b>?', regresar: '¿Regresar el folio a <b>taller</b>?' }[accion];
    if (!await ask(msg, 'Sí')) return;
  }
  const { error } = await S.sb.rpc('gc_taller_accion', { p_id: id, p_accion: accion, p_texto: texto });
  if (error) return fail(error);
  toast({ listo: 'Marcado como listo', trabar: 'Marcado como trabado', destrabar: 'Destrabado', nota: 'Nota agregada', regresar: 'Regresó a taller' }[accion] || 'Hecho');
  after && after();
}
