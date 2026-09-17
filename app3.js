/* =====================================================================
   GOLDEN CLEAN · app3.js — Cortes y reportes, Catálogos, Administración
   ===================================================================== */
'use strict';

// ================================================================= CORTES Y REPORTES
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function periodo(tipo, ancla, hasta) {
  const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const y = +ancla.slice(0, 4), m = +ancla.slice(5, 7);
  let d1, d2, p1, p2, label, labelPrev;
  if (tipo === 'dia') {
    d1 = d2 = ancla; p1 = p2 = addDays(ancla, -1);
    label = `${DIAS[dow(ancla)]} ${fmtD(ancla)}`; labelPrev = `${DIAS[dow(p1)]} ${fmtD(p1)}`;
  } else if (tipo === 'semana') {
    d1 = addDays(ancla, -((dow(ancla) + 6) % 7)); d2 = addDays(d1, 6); p1 = addDays(d1, -7); p2 = addDays(d1, -1);
    label = `Semana ${fmtD(d1)} al ${fmtD(d2)}`; labelPrev = `Semana ${fmtD(p1)} al ${fmtD(p2)}`;
  } else if (tipo === 'mes') {
    d1 = iso(y, m, 1); d2 = iso(y, m, lastDay(y, m));
    const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1;
    p1 = iso(py, pm, 1); p2 = iso(py, pm, lastDay(py, pm));
    label = `${MESES[m - 1]} ${y}`; labelPrev = `${MESES[pm - 1]} ${py}`;
  } else if (tipo === 'trimestre') {
    const q = Math.floor((m - 1) / 3), qm = q * 3 + 1;
    d1 = iso(y, qm, 1); d2 = iso(y, qm + 2, lastDay(y, qm + 2));
    const py = q === 0 ? y - 1 : y, pq = q === 0 ? 3 : q - 1, pqm = pq * 3 + 1;
    p1 = iso(py, pqm, 1); p2 = iso(py, pqm + 2, lastDay(py, pqm + 2));
    label = `Trimestre ${q + 1} · ${y}`; labelPrev = `Trimestre ${pq + 1} · ${py}`;
  } else {
    d1 = ancla <= hasta ? ancla : hasta; d2 = ancla <= hasta ? hasta : ancla;
    const n = diffDays(d2, d1) + 1; p2 = addDays(d1, -1); p1 = addDays(d1, -n);
    label = `Del ${fmtD(d1)} al ${fmtD(d2)}`; labelPrev = `Del ${fmtD(p1)} al ${fmtD(p2)}`;
  }
  return { d1, d2, p1, p2, label, labelPrev };
}

const K = { tipo: 'dia', ancla: null, hasta: null, tab: 'corte' };

V.cortes = async (el) => {
  K.ancla ||= hoy(); K.hasta ||= hoy();
  el.innerHTML = head('Cortes y reportes', 'Corte de ventas', `<button class="btn gold" id="kXls">${svg('xls')} Descargar Excel</button>`) + `
    <div class="card"><div class="row">
      <div class="fld"><label>Periodo</label><div class="chips" id="kTipo">${[['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes'], ['trimestre', 'Trimestre'], ['rango', 'Rango']].map(([k, l]) => `<span class="chip${K.tipo === k ? ' on' : ''}" data-k="${k}">${l}</span>`).join('')}</div></div>
      <div class="fld"><label id="kAnclaL">${K.tipo === 'rango' ? 'Desde' : 'Fecha'}</label><input class="inp" type="date" id="kAncla" value="${K.ancla}"></div>
      <div class="fld${K.tipo === 'rango' ? '' : ' hidden'}" id="kHastaF"><label>Hasta</label><input class="inp" type="date" id="kHasta" value="${K.hasta}"></div>
      <div class="fld"><label>&nbsp;</label><div class="row"><button class="btn ghost sm" id="kPrev">‹ Anterior</button><button class="btn ghost sm" id="kNext">Siguiente ›</button></div></div>
    </div></div>
    <div class="tabs">${[['corte', 'Corte de ventas'], ['pagos', 'Pagos (quién, cuánto, cómo)'], ['metricas', 'Métricas y comparativo']].map(([k, l]) => `<button class="tab${K.tab === k ? ' on' : ''}" data-t="${k}">${l}</button>`).join('')}</div>
    <div id="kArea"><div class="loading">Calculando…</div></div>`;
  $$('#kTipo .chip').forEach(c => c.onclick = () => { K.tipo = c.dataset.k; route(); });
  $('#kAncla').onchange = e => { K.ancla = e.target.value || hoy(); cargar(); };
  $('#kHasta') && ($('#kHasta').onchange = e => { K.hasta = e.target.value || hoy(); cargar(); });
  $$('.tab[data-t]', el).forEach(b => b.onclick = () => { K.tab = b.dataset.t; $$('.tab[data-t]', el).forEach(x => x.classList.toggle('on', x === b)); pintar(); });
  const mover = dir => {
    const P = periodo(K.tipo, K.ancla, K.hasta);
    if (K.tipo === 'rango') { const n = diffDays(P.d2, P.d1) + 1; K.ancla = addDays(P.d1, dir * n); K.hasta = addDays(P.d2, dir * n); $('#kHasta').value = K.hasta; }
    else K.ancla = dir < 0 ? P.p1 : addDays(P.d2, 1);
    $('#kAncla').value = K.ancla; cargar();
  };
  $('#kPrev').onclick = () => mover(-1);
  $('#kNext').onclick = () => mover(1);

  let D = null;
  const cargar = async () => {
    $('#kArea').innerHTML = '<div class="loading">Calculando…</div>';
    const P = periodo(K.tipo, K.ancla, K.hasta);
    const pag = (a, b) => fetchAll(() => S.sb.from('gc_pagos_v').select('*').gte('fecha', a).lte('fecha', b).eq('cancelado', false).order('fecha').order('id'));
    const srv = (a, b) => fetchAll(() => S.sb.from('gc_servicios_v').select('id,folio,cliente_id,articulo,marca,alta_gama,servicio,total,estado,fecha_recepcion,rep').gte('fecha_recepcion', a).lte('fecha_recepcion', b).neq('estado', 'cancelado').order('folio'));
    const [pc, pp, sc, sp] = await Promise.all([pag(P.d1, P.d2), pag(P.p1, P.p2), srv(P.d1, P.d2), srv(P.p1, P.p2)]);
    await cargarClientes();
    D = { P, cur: calcular(pc, sc, P.d1, P.d2), prev: calcular(pp, sp, P.p1, P.p2) };
    pintar();
  };
  const pintar = () => {
    if (!D) return;
    if (K.tab === 'pagos') return pintarPagos($('#kArea'), D);
    if (K.tab === 'metricas') return pintarMetricas($('#kArea'), D);
    return pintarCorte($('#kArea'), D);
  };
  $('#kXls').onclick = () => { if (D) excelCortes(D).catch(fail); };
  await cargar();
};

function calcular(pagos, servicios, d1, d2) {
  const com = +cfg('comision_tarjeta_pct', 3.6), iva = +cfg('iva_comision_pct', 16);
  const folios = new Map(), ventas = new Map();
  const add = (o, p) => { o[p.forma] = r2((o[p.forma] || 0) + +p.monto); o.total = r2((o.total || 0) + +p.monto); o.tipos.add(p.tipo); };
  pagos.forEach(p => {
    if (p.servicio_id) {
      if (!folios.has(p.servicio_id)) folios.set(p.servicio_id, { folio: p.folio, cliente: p.cliente, articulo: p.articulo, marca: p.marca, servicio: p.servicio, precio: +p.precio, desc_pct: +p.desc_pct, desc_monto: +p.desc_monto, total_folio: +p.total_folio, tipos: new Set() });
      add(folios.get(p.servicio_id), p);
    } else if (p.venta_id) {
      if (!ventas.has(p.venta_id)) ventas.set(p.venta_id, { venta: p.venta_id, cliente: p.cliente, productos: p.productos, total_venta: +p.total_venta, tipos: new Set() });
      add(ventas.get(p.venta_id), p);
    }
  });
  const filas = [...folios.values()].sort((a, b) => a.folio - b.folio);
  const prods = [...ventas.values()];
  const sum = (arr, k) => r2(arr.reduce((a, x) => a + (+x[k] || 0), 0));
  const T = { efectivo: sum(pagos.filter(p => p.forma === 'efectivo'), 'monto'), tarjeta: sum(pagos.filter(p => p.forma === 'tarjeta'), 'monto'), transferencia: sum(pagos.filter(p => p.forma === 'transferencia'), 'monto') };
  T.total = r2(T.efectivo + T.tarjeta + T.transferencia);
  T.servicios = sum(filas, 'total'); T.productos = sum(prods, 'total');
  T.precio = sum(filas, 'precio'); T.desc = sum(filas, 'desc_monto');
  T.comision = r2(T.tarjeta * com / 100); T.ivaCom = r2(T.comision * iva / 100); T.netoTarjeta = r2(T.tarjeta - T.comision - T.ivaCom);
  T.anticipos = sum(pagos.filter(p => p.tipo === 'anticipo'), 'monto');
  const cuentas = {};
  pagos.forEach(p => { const k = `${p.forma}|${p.cuenta || ''}`; cuentas[k] = r2((cuentas[k] || 0) + +p.monto); });
  // métricas de recepción
  const cliIds = new Set(servicios.map(s => s.cliente_id));
  const nuevos = S.clientes.filter(c => c.primera && c.primera >= d1 && c.primera <= d2);
  const cuenta = (arr, f) => { const m = new Map(); arr.forEach(x => [].concat(f(x)).filter(Boolean).forEach(k => { const o = m.get(k) || { k, n: 0, v: 0 }; o.n++; o.v += +x.total || 0; m.set(k, o); })); return [...m.values()].sort((a, b) => b.n - a.n || b.v - a.v); };
  const porDia = {};
  pagos.forEach(p => { porDia[p.fecha] = r2((porDia[p.fecha] || 0) + +p.monto); });
  return {
    pagos, filas, prods, T, cuentas, porDia,
    recibidos: servicios.length, valorRecibido: sum(servicios, 'total'),
    foliosCobrados: filas.length, clientesAtendidos: cliIds.size, nuevos: nuevos.length,
    altaGama: servicios.filter(s => s.alta_gama).length,
    topServicios: cuenta(servicios, s => String(s.servicio || '').split('+').map(x => x.trim().replace(/\s+/g, ' ')).filter(Boolean)),
    topMarcas: cuenta(servicios, s => s.marca), topArticulos: cuenta(servicios, s => s.articulo),
    origenNuevos: (() => { const m = new Map(); nuevos.forEach(c => { const k = c.origen || 'Sin dato'; m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n); })(),
  };
}

function pintarCorte(area, D) {
  const c = D.cur, T = c.T;
  const cuentaLineas = Object.entries(c.cuentas).filter(([k]) => !k.startsWith('tarjeta|')).map(([k, v]) => {
    const [forma, cta] = k.split('|');
    return `<div class="sum-line"><span>${forma === 'efectivo' ? 'VENTAS EFECTIVO' : 'TR ' + esc(cta || 'TRANSFERENCIA')}</span><b class="num">${money(v)}</b></div>`;
  }).join('');
  area.innerHTML = `<div class="card"><div class="card-head"><h3>CORTE DE VENTAS · ${esc(D.P.label)}</h3><button class="btn sm ghost" id="cPrint">${svg('print')} Imprimir</button></div>
    ${c.filas.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>No. servicio</th><th>Modelo</th><th>Marca</th><th>Servicio</th><th class="num">Precio</th><th class="num">%</th><th class="num">Desc.</th><th class="num">Pago efectivo</th><th class="num">Pago con tarjeta</th><th class="num">Pago transf.</th></tr></thead><tbody>
      ${c.filas.map(f => `<tr><td><b>${f.folio}</b>${f.tipos.has('anticipo') ? ' <small class="muted">anticipo</small>' : ''}${Math.abs(f.total - f.total_folio) > 0.009 && !f.tipos.has('anticipo') ? ' <small class="muted">parcial</small>' : ''}</td><td>${esc(f.articulo || '')}</td><td>${esc(f.marca || '')}</td><td class="wrap">${esc(f.servicio || '')}</td>
        <td class="num">${money(f.precio)}</td><td class="num">${f.desc_pct ? f.desc_pct + '%' : ''}</td><td class="num">${f.desc_monto ? '−' + money(f.desc_monto) : ''}</td>
        <td class="num">${f.efectivo ? money(f.efectivo) : ''}</td><td class="num">${f.tarjeta ? money(f.tarjeta) : ''}</td><td class="num">${f.transferencia ? money(f.transferencia) : ''}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>${c.filas.length}</td><td colspan="3"><i>TOTAL SERVICIOS ENTREGADOS</i></td><td class="num">${money(T.precio)}</td><td></td><td class="num">${T.desc ? '−' + money(T.desc) : ''}</td>
        <td class="num">${money(c.filas.reduce((a, f) => a + (f.efectivo || 0), 0))}</td><td class="num">${money(c.filas.reduce((a, f) => a + (f.tarjeta || 0), 0))}</td><td class="num">${money(c.filas.reduce((a, f) => a + (f.transferencia || 0), 0))}</td></tr></tfoot></table></div>` : '<div class="empty">Sin cobros de servicios en el periodo.</div>'}
    ${c.prods.length ? `<h3 style="margin:16px 0 8px;font-size:16px">Venta de productos</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Productos</th><th>Cliente</th><th class="num">Efectivo</th><th class="num">Tarjeta</th><th class="num">Transf.</th></tr></thead><tbody>
      ${c.prods.map(v => `<tr><td class="wrap">${esc(v.productos || '')}</td><td>${esc(v.cliente || '')}</td><td class="num">${v.efectivo ? money(v.efectivo) : ''}</td><td class="num">${v.tarjeta ? money(v.tarjeta) : ''}</td><td class="num">${v.transferencia ? money(v.transferencia) : ''}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="2">${c.prods.length} venta(s)</td><td class="num">${money(c.prods.reduce((a, v) => a + (v.efectivo || 0), 0))}</td><td class="num">${money(c.prods.reduce((a, v) => a + (v.tarjeta || 0), 0))}</td><td class="num">${money(c.prods.reduce((a, v) => a + (v.transferencia || 0), 0))}</td></tr></tfoot></table></div>` : ''}
    </div>
    <div class="grid g2" style="align-items:start">
      <div class="card"><h3>Totales</h3>
        <div class="sum-line"><span>Pago efectivo</span><b class="num">${money(T.efectivo)}</b></div>
        <div class="sum-line"><span>Pago con tarjeta</span><b class="num">${money(T.tarjeta)}</b></div>
        <div class="sum-line"><span>Pago transferencia</span><b class="num">${money(T.transferencia)}</b></div>
        <div class="sum-line big"><span>TOTAL COBRADO</span><span class="num">${money(T.total)}</span></div>
        <div class="hint">Servicios ${money(T.servicios)} · Productos ${money(T.productos)}${T.anticipos ? ` · incluye anticipos ${money(T.anticipos)}` : ''}</div></div>
      <div class="card"><h3>Depósitos</h3>
        <div class="sum-line"><span>Comisión tarjeta (${cfg('comision_tarjeta_pct', 3.6)}%)</span><span class="num">${money(T.comision)}</span></div>
        <div class="sum-line"><span>IVA comisión (${cfg('iva_comision_pct', 16)}%)</span><span class="num">${money(T.ivaCom)}</span></div>
        <div class="sum-line"><span>TR ${esc(cfg('cuenta_tarjeta', 'CLIP-SCOTIA'))} (neto tarjeta)</span><b class="num">${money(T.netoTarjeta)}</b></div>
        ${cuentaLineas}</div>
    </div>`;
  $('#cPrint').onclick = () => imprimir(`<div style="font-family:Arial;font-size:11px">${$('#kArea').innerHTML}</div>`, '@page{size:letter landscape;margin:8mm}');
}

function pintarPagos(area, D) {
  const grupos = gruposPago(D.cur.pagos);
  const porCliente = new Map();
  grupos.forEach(g => { const k = g.cliente || '(sin cliente)'; const o = porCliente.get(k) || { cliente: k, num: g.cliente_num, folios: new Set(), monto: 0, formas: new Set(), pagos: 0 }; g.folios.forEach(f => o.folios.add(f)); o.monto += g.monto; o.formas.add(g.forma); o.pagos++; porCliente.set(k, o); });
  const pc = [...porCliente.values()].sort((a, b) => b.monto - a.monto);
  area.innerHTML = `<div class="card"><div class="card-head"><h3>Pagos · ${esc(D.P.label)}</h3><span class="hint">${grupos.length} pago(s) · ${money(D.cur.T.total)}</span></div>
    ${grupos.length ? `<div class="tbl-wrap" style="max-height:60vh"><table class="tbl"><thead><tr><th>Fecha</th><th>No.</th><th>Cliente</th><th>Concepto</th><th class="num">Servicios</th><th>Tipo</th><th>Forma</th><th>Cuenta</th><th class="num">Monto</th><th>Registró</th></tr></thead><tbody>
      ${grupos.map(g => `<tr><td>${fmtD(g.fecha)}</td><td>${g.cliente_num || ''}</td><td>${esc(g.cliente || '')}</td><td class="wrap">${g.folios.length ? 'Folios ' + g.folios.join(', ') : esc(g.productos || 'Productos')}</td><td class="num">${g.folios.length || ''}</td>
        <td>${esc(g.tipo)}</td><td>${esc(g.forma)}</td><td>${esc(g.cuenta || '')}</td><td class="num">${money(g.monto)}</td><td>${esc(g.registro || (g.legado ? 'Excel' : ''))}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sin pagos en el periodo.</div>'}</div>
    <div class="card"><h3>Resumen por cliente</h3>${pc.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>No.</th><th>Cliente</th><th class="num">Servicios pagados</th><th class="num">Pagos</th><th>Formas de pago</th><th class="num">Total pagado</th></tr></thead><tbody>
      ${pc.map(o => `<tr><td>${o.num || ''}</td><td>${esc(o.cliente)}</td><td class="num">${o.folios.size}</td><td class="num">${o.pagos}</td><td>${[...o.formas].join(', ')}</td><td class="num"><b>${money(o.monto)}</b></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">—</div>'}</div>`;
}
function gruposPago(pagos) {
  const m = new Map();
  pagos.forEach(p => {
    const k = p.grupo || (p.venta_id ? `v${p.venta_id}|${p.forma}` : `${p.fecha}|${p.cliente_id}|${p.forma}|${p.tipo}|${p.legado}`);
    const o = m.get(k) || { fecha: p.fecha, cliente: p.cliente, cliente_num: p.cliente_num, tipo: p.tipo, forma: p.forma, cuenta: p.cuenta, registro: p.registro, legado: p.legado, productos: p.productos, folios: [], monto: 0, notas: p.notas };
    if (p.folio) o.folios.push(p.folio);
    o.monto = r2(o.monto + +p.monto);
    m.set(k, o);
  });
  return [...m.values()].sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.folios[0] || 0) - (b.folios[0] || 0));
}

function metricasLista(D) {
  const c = D.cur, p = D.prev;
  return [
    { k: 'Total cobrado', a: c.T.total, b: p.T.total, m: true },
    { k: 'Cobrado en servicios', a: c.T.servicios, b: p.T.servicios, m: true },
    { k: 'Venta de productos', a: c.T.productos, b: p.T.productos, m: true },
    { k: 'Servicios cobrados (folios)', a: c.foliosCobrados, b: p.foliosCobrados },
    { k: 'Promedio cobrado por servicio', a: c.foliosCobrados ? c.T.servicios / c.foliosCobrados : 0, b: p.foliosCobrados ? p.T.servicios / p.foliosCobrados : 0, m: true },
    { k: 'Servicios recibidos (folios)', a: c.recibidos, b: p.recibidos },
    { k: 'Valor de lo recibido', a: c.valorRecibido, b: p.valorRecibido, m: true },
    { k: 'Promedio por servicio recibido', a: c.recibidos ? c.valorRecibido / c.recibidos : 0, b: p.recibidos ? p.valorRecibido / p.recibidos : 0, m: true },
    { k: 'Clientes atendidos', a: c.clientesAtendidos, b: p.clientesAtendidos },
    { k: 'Clientes nuevos', a: c.nuevos, b: p.nuevos },
    { k: 'Artículos alta gama recibidos', a: c.altaGama, b: p.altaGama },
    { k: 'Anticipos cobrados', a: c.T.anticipos, b: p.T.anticipos, m: true },
  ];
}
const deltaTxt = (a, b) => { if (!b) return a ? { t: 'nuevo', c: 'up' } : { t: '—', c: 'flat' }; const d = (a - b) / Math.abs(b) * 100; return { t: `${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}%`, c: Math.abs(d) < 0.05 ? 'flat' : d > 0 ? 'up' : 'down' }; };

function pintarMetricas(area, D) {
  const c = D.cur, p = D.prev;
  const ML = metricasLista(D);
  const barras = (lista, max = 10, money_ = false) => {
    const top = lista.slice(0, max), mx = Math.max(1, ...top.map(x => x.n));
    return top.length ? `<table class="tbl"><tbody>${top.map(x => `<tr><td style="width:45%" class="wrap">${esc(x.k)}</td><td><div class="bar" style="width:${Math.round(x.n / mx * 100)}%"></div></td><td class="num">${x.n}</td>${money_ ? `<td class="num">${money0(x.v)}</td>` : ''}</tr>`).join('')}</tbody></table>` : '<div class="empty">Sin datos</div>';
  };
  const formas = ['efectivo', 'tarjeta', 'transferencia'];
  const mxF = Math.max(1, ...formas.flatMap(f => [c.T[f], p.T[f]]));
  const dias = Object.keys(c.porDia).sort();
  const mxD = Math.max(1, ...Object.values(c.porDia));
  area.innerHTML = `<div class="hint" style="margin-bottom:10px"><b>${esc(D.P.label)}</b> comparado con <b>${esc(D.P.labelPrev)}</b></div>
    <div class="tiles">${ML.map(x => { const d = deltaTxt(x.a, x.b); return `<div class="tile"><div class="k">${esc(x.k)}</div><div class="v" style="font-size:24px">${x.m ? money0(x.a) : Math.round(x.a)}</div><div class="d ${d.c}">${d.t}</div><div class="s">antes: ${x.m ? money0(x.b) : Math.round(x.b)}</div></div>`; }).join('')}</div>
    <div class="grid g2" style="align-items:start">
      <div class="card"><h3>Servicios más pedidos</h3>${barras(c.topServicios, 12, true)}</div>
      <div class="card"><h3>Marcas</h3>${barras(c.topMarcas, 12, true)}</div>
      <div class="card"><h3>Tipo de artículo</h3>${barras(c.topArticulos, 10, true)}</div>
      <div class="card"><h3>Cómo nos conocieron (clientes nuevos)</h3>${barras(c.origenNuevos, 10)}</div>
      <div class="card"><h3>Forma de pago · actual vs anterior</h3><table class="tbl"><tbody>
        ${formas.map(f => `<tr><td style="width:28%">${f}</td><td><div class="bar" style="width:${Math.round(c.T[f] / mxF * 100)}%"></div><div class="bar prev" style="width:${Math.round(p.T[f] / mxF * 100)}%;margin-top:3px"></div></td><td class="num">${money0(c.T[f])}<br><small class="muted">${money0(p.T[f])}</small></td></tr>`).join('')}</tbody></table>
        <div class="hint" style="margin-top:6px"><span class="bar" style="display:inline-block;width:14px"></span> actual · <span class="bar prev" style="display:inline-block;width:14px"></span> anterior</div></div>
      ${dias.length > 1 ? `<div class="card"><h3>Cobrado por día</h3><table class="tbl"><tbody>${dias.map(d => `<tr><td style="width:28%">${DIAS[dow(d)].slice(0, 3)} ${fmtDM(d)}</td><td><div class="bar" style="width:${Math.round(c.porDia[d] / mxD * 100)}%"></div></td><td class="num">${money0(c.porDia[d])}</td></tr>`).join('')}</tbody></table></div>` : ''}
    </div>`;
}

async function excelCortes(D) {
  const c = D.cur, T = c.T;
  const fill = argb => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
  await XL.save(`Corte_${D.P.d1}_${D.P.d2}.xlsx`, wb => {
    // --- Corte
    const ws = wb.addWorksheet('Corte de ventas');
    ws.columns = [{ width: 13 }, { width: 13 }, { width: 22 }, { width: 44 }, { width: 13 }, { width: 7 }, { width: 11 }, { width: 15 }, { width: 17 }, { width: 16 }];
    ws.mergeCells('A1:D1'); ws.getCell('A1').value = 'CORTE DE VENTAS'; ws.getCell('A1').font = { bold: true, size: 16 };
    ws.mergeCells('H1:J1'); ws.getCell('H1').value = D.P.label.toUpperCase(); ws.getCell('H1').font = { bold: true, italic: true, underline: true, size: 13 }; ws.getCell('H1').alignment = { horizontal: 'right' };
    XL.header(ws.addRow(['No. SERVICIO', 'MODELO', 'MARCA', 'SERVICIO', 'PRECIO', '%', 'DESC.', 'PAGO EFECTIVO', 'PAGO CON TARJETA', 'PAGO TRANSF.']));
    c.filas.forEach(f => {
      const r = ws.addRow([f.folio, f.articulo || '', f.marca || '', f.servicio || '', f.precio, f.desc_pct ? f.desc_pct / 100 : null, f.desc_monto ? -f.desc_monto : null, f.efectivo || null, f.tarjeta || null, f.transferencia || null]);
      r.getCell(1).alignment = { horizontal: 'center' }; r.getCell(1).font = { bold: true };
      r.getCell(4).alignment = { wrapText: true, vertical: 'top' }; r.getCell(4).font = { size: 9 };
      [5, 7, 8, 9, 10].forEach(i => r.getCell(i).numFmt = XL.money); r.getCell(6).numFmt = '0%';
    });
    if (c.prods.length) {
      ws.addRow([]);
      const hr = ws.addRow(['', 'PRODUCTOS', '', '', 'TOTAL', '', '', 'PAGO EFECTIVO', 'PAGO CON TARJETA', 'PAGO TRANSF.']); XL.header(hr);
      c.prods.forEach(v => { const r = ws.addRow(['', v.productos || '', '', v.cliente || '', v.total, null, null, v.efectivo || null, v.tarjeta || null, v.transferencia || null]); [5, 8, 9, 10].forEach(i => r.getCell(i).numFmt = XL.money); });
    }
    ws.addRow([]);
    const tr = ws.addRow([c.filas.length, 'TOTAL SERVICIOS ENTREGADOS', '', '', T.precio + T.productos, null, T.desc ? -T.desc : 0, T.efectivo, T.tarjeta, T.transferencia]);
    tr.getCell(1).alignment = { horizontal: 'center' }; tr.getCell(1).font = { bold: true }; tr.getCell(2).font = { italic: true };
    [[5, 'FF000000', 'FFFFFFFF'], [7, 'FF000000', 'FFFFFFFF'], [8, 'FF66FF33', 'FF000000'], [9, 'FFFF6600', 'FF000000'], [10, 'FF0033FF', 'FFFFFFFF']].forEach(([i, bg, fg]) => { const cc = tr.getCell(i); cc.fill = fill(bg); cc.font = { bold: true, color: { argb: fg } }; cc.numFmt = XL.money; });
    const line = (label, val, bg, fg = 'FF000000', bold = true) => { const r = ws.addRow(['', '', '', '', '', '', '', '', label, val]); r.getCell(9).alignment = { horizontal: 'right' }; r.getCell(9).font = { italic: !bg, size: 10 }; const v = r.getCell(10); v.numFmt = XL.money; v.font = { bold, color: { argb: fg } }; if (bg) v.fill = fill(bg); return r; };
    line('TOTAL COBRADO', T.total, 'FFFFFF00');
    line(`COMISION TARJETA ${cfg('comision_tarjeta_pct', 3.6)}%`, T.comision, null, 'FF000000', false);
    line(`IVA COMISION`, T.ivaCom, null, 'FF000000', false);
    ws.addRow([]);
    line(`TR ${cfg('cuenta_tarjeta', 'CLIP-SCOTIA')}`, T.netoTarjeta, 'FFFF6600');
    Object.entries(c.cuentas).filter(([k]) => !k.startsWith('tarjeta|')).forEach(([k, v]) => {
      const [forma, cta] = k.split('|');
      line(forma === 'efectivo' ? 'VENTAS EFECTIVO' : `TR ${cta || 'TRANSFERENCIA'}`, v, forma === 'efectivo' ? 'FF66FF33' : 'FF0033FF', forma === 'efectivo' ? 'FF000000' : 'FFFFFFFF');
    });
    // --- Pagos
    const g = gruposPago(c.pagos);
    XL.table(wb.addWorksheet('Pagos'), [
      { h: 'FECHA', get: x => fmtD(x.fecha), w: 11 }, { h: 'No. CLIENTE', k: 'cliente_num', w: 10 }, { h: 'CLIENTE', k: 'cliente', w: 28 },
      { h: 'FOLIOS / PRODUCTOS', get: x => x.folios.length ? x.folios.join(', ') : (x.productos || ''), w: 30 }, { h: 'No. SERVICIOS', get: x => x.folios.length || '', w: 11 },
      { h: 'TIPO', k: 'tipo', w: 10 }, { h: 'FORMA DE PAGO', k: 'forma', w: 14 }, { h: 'CUENTA', k: 'cuenta', w: 14 }, { h: 'MONTO', k: 'monto', money: true },
      { h: 'REGISTRÓ', get: x => x.registro || (x.legado ? 'Excel' : ''), w: 16 }, { h: 'NOTAS', k: 'notas', w: 30 },
    ], g, `PAGOS · ${D.P.label.toUpperCase()}`);
    const pc = new Map();
    g.forEach(x => { const k = x.cliente || '(sin cliente)'; const o = pc.get(k) || { cliente: k, num: x.cliente_num, folios: new Set(), monto: 0, formas: new Set(), pagos: 0 }; x.folios.forEach(f => o.folios.add(f)); o.monto = r2(o.monto + x.monto); o.formas.add(x.forma); o.pagos++; pc.set(k, o); });
    XL.table(wb.addWorksheet('Por cliente'), [
      { h: 'No. CLIENTE', k: 'num', w: 10 }, { h: 'CLIENTE', k: 'cliente', w: 30 }, { h: 'SERVICIOS PAGADOS', get: o => o.folios.size, w: 12 }, { h: 'PAGOS', k: 'pagos', w: 8 },
      { h: 'FORMAS DE PAGO', get: o => [...o.formas].join(', '), w: 26 }, { h: 'TOTAL PAGADO', k: 'monto', money: true, w: 15 },
    ], [...pc.values()].sort((a, b) => b.monto - a.monto), `PAGOS POR CLIENTE · ${D.P.label.toUpperCase()}`);
    // --- Métricas
    const wm = wb.addWorksheet('Métricas');
    XL.table(wm, [{ h: 'INDICADOR', k: 'k', w: 34 }, { h: D.P.label.toUpperCase(), k: 'a', w: 22 }, { h: D.P.labelPrev.toUpperCase(), k: 'b', w: 22 }, { h: 'VARIACIÓN', get: x => deltaTxt(x.a, x.b).t, w: 12 }],
      metricasLista(D), 'MÉTRICAS PRINCIPALES');
    metricasLista(D).forEach((x, i) => { if (x.m) { wm.getCell(4 + i, 2).numFmt = XL.money; wm.getCell(4 + i, 3).numFmt = XL.money; } });
    const off = wm.rowCount + 2;
    wm.getCell(off, 1).value = 'SERVICIOS MÁS PEDIDOS'; wm.getCell(off, 1).font = { bold: true };
    c.topServicios.slice(0, 20).forEach((x, i) => { wm.getCell(off + 1 + i, 1).value = x.k; wm.getCell(off + 1 + i, 2).value = x.n; });
    const off2 = off + 23;
    wm.getCell(off2, 1).value = 'MARCAS'; wm.getCell(off2, 1).font = { bold: true };
    c.topMarcas.slice(0, 20).forEach((x, i) => { wm.getCell(off2 + 1 + i, 1).value = x.k; wm.getCell(off2 + 1 + i, 2).value = x.n; });
  });
}

// ================================================================= CATÁLOGOS
V.catalogos = async (el, params) => {
  const tab = params.tab || 'servicios';
  await cargarCatalogos();
  el.innerHTML = head('Catálogos', 'Catálogos') + `
    <div class="tabs">${[['servicios', 'Servicios y precios'], ['marcas', 'Marcas'], ['productos', 'Productos'], ['listas', 'Listas']].map(([k, l]) => `<button class="tab${tab === k ? ' on' : ''}" data-t="${k}">${l}</button>`).join('')}</div>
    <div id="catArea"></div>`;
  $$('.tab', el).forEach(b => b.onclick = () => go('catalogos', { tab: b.dataset.t }));
  const area = $('#catArea');
  const guardarCampo = async (tabla, id, campo, valor, arr) => {
    const { error } = await S.sb.from(tabla).update({ [campo]: valor }).eq('id', id);
    if (error) { fail(error); return false; }
    const o = arr.find(x => x.id === id); if (o) o[campo] = valor;
    toast('Guardado');
    return true;
  };
  const celda = (tabla, arr, row, campo, tipo = 'text', extra = {}) => {
    const v = row[campo];
    if (tipo === 'check') return `<input type="checkbox" data-t="${tabla}" data-id="${row.id}" data-c="${campo}" data-k="check" ${v ? 'checked' : ''}>`;
    if (tipo === 'select') return `<select class="inp" data-t="${tabla}" data-id="${row.id}" data-c="${campo}">${opts(extra.opts, v)}</select>`;
    return `<input class="inp${tipo === 'number' ? ' num' : ''}" ${tipo === 'number' ? 'type="number" step="0.01"' : ''} ${extra.list ? `list="${extra.list}"` : ''} data-t="${tabla}" data-id="${row.id}" data-c="${campo}" data-k="${tipo}" value="${esc(v)}" style="${extra.w ? 'width:' + extra.w : ''}">`;
  };
  const enlazar = (arr) => $$('[data-t]', area).forEach(inp => inp.onchange = async () => {
    const k = inp.dataset.k;
    let v = k === 'check' ? inp.checked : k === 'number' ? r2(inp.value) : inp.value.trim();
    if (['nombre', 'valor'].includes(inp.dataset.c) && inp.dataset.t !== 'gc_listas') v = String(v).toUpperCase();
    if (inp.dataset.c === 'segmento') { const row = arr.find(x => x.id === +inp.dataset.id); const ag = ['Lujo', 'Premium'].includes(v); if (row && row.alta_gama !== ag) { await guardarCampo('gc_marcas', row.id, 'alta_gama', ag, arr); const cb = $(`[data-id="${row.id}"][data-c="alta_gama"]`, area); if (cb) cb.checked = ag; } }
    const ok = await guardarCampo(inp.dataset.t, +inp.dataset.id, inp.dataset.c, v, arr);
    if (!ok && k === 'check') inp.checked = !inp.checked;
  });

  if (tab === 'servicios') {
    const cats = uniq(['Sneaker Care', 'Gamuza', 'Lustral', 'Legacy', 'Repair', 'Cap Care', ...S.scat.map(s => s.categoria)]);
    area.innerHTML = `<div class="card"><h3>Agregar servicio</h3><div class="row">
        <div class="fld" style="flex:2;min-width:220px"><label>Nombre</label><input class="inp" id="nsNom"></div>
        <div class="fld"><label>Categoría</label><input class="inp" id="nsCat" list="dlCats"><datalist id="dlCats">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>
        <div class="fld"><label>Tipo</label><select class="inp" id="nsTipo">${opts([{ v: 'base', l: 'Base' }, { v: 'adicional', l: 'Adicional' }])}</select></div>
        <div class="fld"><label>Precio</label><input class="inp num" type="number" id="nsPre" style="width:100px"></div>
        <div class="fld"><label>Días entrega</label><input class="inp num" type="number" id="nsDias" value="15" style="width:90px"></div>
        <label class="check" style="min-height:36px"><input type="checkbox" id="nsFijo"> Precio fijo</label>
        <button class="btn gold" id="nsOk">Agregar</button></div>
        <div class="hint" style="margin-top:8px"><b>Precio fijo</b>: en recepción no se puede cambiar (solo con permiso de descuentos). Sin marcar: el precio es sugerido y se puede editar (precio especial). Los <b>días de entrega</b> calculan la fecha estimada.</div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Servicio</th><th>Categoría</th><th>Tipo</th><th class="num">Precio</th><th>Fijo</th><th class="num">Días</th><th class="num">Orden</th><th>Activo</th><th>Notas</th></tr></thead><tbody>
      ${S.scat.map(s => `<tr><td>${celda('gc_servicios_cat', S.scat, s, 'nombre', 'text', { w: '260px' })}</td><td>${celda('gc_servicios_cat', S.scat, s, 'categoria', 'text', { list: 'dlCats', w: '130px' })}</td>
        <td>${celda('gc_servicios_cat', S.scat, s, 'tipo', 'select', { opts: ['base', 'adicional'] })}</td><td>${celda('gc_servicios_cat', S.scat, s, 'precio', 'number', { w: '95px' })}</td>
        <td>${celda('gc_servicios_cat', S.scat, s, 'precio_fijo', 'check')}</td><td>${celda('gc_servicios_cat', S.scat, s, 'dias_entrega', 'number', { w: '70px' })}</td>
        <td>${celda('gc_servicios_cat', S.scat, s, 'orden', 'number', { w: '70px' })}</td><td>${celda('gc_servicios_cat', S.scat, s, 'activo', 'check')}</td><td>${celda('gc_servicios_cat', S.scat, s, 'notas', 'text', { w: '220px' })}</td></tr>`).join('')}
      </tbody></table></div>`;
    enlazar(S.scat);
    $('#nsOk').onclick = async () => {
      const d = { nombre: $('#nsNom').value.trim().toUpperCase(), categoria: $('#nsCat').value.trim() || 'Repair', tipo: $('#nsTipo').value, precio: r2($('#nsPre').value), dias_entrega: +$('#nsDias').value || 15, precio_fijo: $('#nsFijo').checked, orden: (Math.max(0, ...S.scat.map(s => s.orden)) + 10) };
      if (!d.nombre) return toast('Escribe el nombre', true);
      const { error } = await S.sb.from('gc_servicios_cat').insert(d);
      if (error) return fail(error);
      toast('Servicio agregado'); route();
    };
  } else if (tab === 'marcas') {
    let q = '';
    const draw = () => {
      const list = S.marcas.filter(m => !q || norm(m.nombre).includes(norm(q)));
      $('#mTbl').innerHTML = `<div class="tbl-wrap" style="max-height:65vh"><table class="tbl"><thead><tr><th>Marca</th><th>Segmento</th><th>Alta gama</th><th>Activa</th></tr></thead><tbody>
        ${list.map(m => `<tr><td>${celda('gc_marcas', S.marcas, m, 'nombre', 'text', { w: '260px' })}</td><td>${celda('gc_marcas', S.marcas, m, 'segmento', 'select', { opts: ['Lujo', 'Premium', 'Deportiva', 'Moda'] })}</td>
          <td>${celda('gc_marcas', S.marcas, m, 'alta_gama', 'check')}</td><td>${celda('gc_marcas', S.marcas, m, 'activo', 'check')}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="4">${list.length} marca(s) · ${list.filter(m => m.alta_gama).length} alta gama</td></tr></tfoot></table></div>`;
      enlazar(S.marcas);
    };
    area.innerHTML = `<div class="card"><div class="row"><div class="fld" style="flex:1"><label>Buscar marca</label><input class="inp" id="mQ"></div><button class="btn gold" id="mNueva">+ Agregar marca</button></div>
      <div class="hint" style="margin-top:8px">Al elegir la marca en Recepción, “Alta gama” se marca solo según este catálogo.</div></div><div id="mTbl"></div>`;
    $('#mQ').oninput = debounce(e => { q = e.target.value; draw(); }, 200);
    $('#mNueva').onclick = () => modalNuevaMarca($('#mQ').value, () => draw());
    draw();
  } else if (tab === 'productos') {
    area.innerHTML = `<div class="card"><h3>Agregar producto</h3><div class="row">
        <div class="fld" style="flex:2"><label>Producto</label><input class="inp" id="npNom"></div><div class="fld"><label>Presentación</label><input class="inp" id="npPres" placeholder="250 ML"></div>
        <div class="fld"><label>Color</label><input class="inp" id="npCol"></div><div class="fld"><label>Precio</label><input class="inp num" type="number" id="npPre" style="width:100px"></div>
        <button class="btn gold" id="npOk">Agregar</button></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Producto</th><th>Presentación</th><th>Color</th><th class="num">Precio</th><th>Activo</th></tr></thead><tbody>
      ${S.pcat.map(p => `<tr><td>${celda('gc_productos_cat', S.pcat, p, 'nombre', 'text', { w: '240px' })}</td><td>${celda('gc_productos_cat', S.pcat, p, 'presentacion')}</td><td>${celda('gc_productos_cat', S.pcat, p, 'color')}</td>
        <td>${celda('gc_productos_cat', S.pcat, p, 'precio', 'number', { w: '95px' })}</td><td>${celda('gc_productos_cat', S.pcat, p, 'activo', 'check')}</td></tr>`).join('')}</tbody></table></div>`;
    enlazar(S.pcat);
    $('#npOk').onclick = async () => {
      const d = { nombre: $('#npNom').value.trim().toUpperCase(), presentacion: $('#npPres').value.trim().toUpperCase(), color: $('#npCol').value.trim().toUpperCase(), precio: r2($('#npPre').value) };
      if (!d.nombre) return toast('Escribe el producto', true);
      const { error } = await S.sb.from('gc_productos_cat').insert(d);
      if (error) return fail(error);
      toast('Producto agregado'); route();
    };
  } else {
    const tipos = [['articulo', 'Tipos de artículo'], ['material', 'Corte / material'], ['color', 'Colores'], ['origen', 'Cómo nos conocieron'], ['rep', 'REP · maestros'], ['cuenta', 'Cuentas de depósito']];
    const t = params.tipo || 'articulo';
    const arr = (S.listas[t] || []);
    area.innerHTML = `<div class="chips" style="margin-bottom:12px">${tipos.map(([k, l]) => `<span class="chip${t === k ? ' on' : ''}" data-lt="${k}">${l}</span>`).join('')}</div>
      <div class="card"><div class="row"><div class="fld" style="flex:1"><label>Nuevo valor</label><input class="inp" id="nlVal"></div><button class="btn gold" id="nlOk">Agregar</button></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Valor</th><th class="num">Orden</th><th>Activo</th></tr></thead><tbody>
      ${arr.map(x => `<tr><td>${celda('gc_listas', arr, x, 'valor', 'text', { w: '280px' })}</td><td>${celda('gc_listas', arr, x, 'orden', 'number', { w: '80px' })}</td><td>${celda('gc_listas', arr, x, 'activo', 'check')}</td></tr>`).join('')}</tbody></table></div>`;
    $$('[data-lt]', area).forEach(c => c.onclick = () => go('catalogos', { tab: 'listas', tipo: c.dataset.lt }));
    enlazar(arr);
    $('#nlOk').onclick = async () => {
      let v = $('#nlVal').value.trim(); if (!v) return;
      if (t !== 'origen') v = v.toUpperCase();
      const { error } = await S.sb.from('gc_listas').insert({ tipo: t, valor: v, orden: Math.max(0, ...arr.map(x => x.orden)) + 1 });
      if (error) return fail(error);
      toast('Agregado'); route();
    };
  }
};

// ================================================================= ADMINISTRACIÓN
V.admin = async (el, params) => {
  if (!isMaster()) { el.innerHTML = '<div class="card empty">Solo el usuario master.</div>'; return; }
  const tab = params.tab || 'usuarios';
  el.innerHTML = head('Administración', 'Usuarios y configuración') + `
    <div class="tabs">${[['usuarios', 'Usuarios y permisos'], ['config', 'Configuración'], ['bitacora', 'Bitácora de cambios']].map(([k, l]) => `<button class="tab${tab === k ? ' on' : ''}" data-t="${k}">${l}</button>`).join('')}</div>
    <div id="adArea"><div class="loading">Cargando…</div></div>`;
  $$('.tab', el).forEach(b => b.onclick = () => go('admin', { tab: b.dataset.t }));
  const area = $('#adArea');
  if (tab === 'config') return adminConfig(area);
  if (tab === 'bitacora') return adminBitacora(area);
  return adminUsuarios(area);
};

async function adminUsuarios(area) {
  const { data: users, error } = await S.sb.from('gc_usuarios').select('*').order('creado');
  if (error) throw error;
  const bloquesSel = BLOQUES.filter(b => !b.always && !b.masterOnly);
  area.innerHTML = `<div class="card"><div class="card-head"><h3>Usuarios (${users.length})</h3><button class="btn gold" id="uNuevo">+ Nuevo usuario</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Bloques y permisos</th><th>Activo</th><th></th></tr></thead><tbody>
    ${users.map(u => `<tr><td><b>${esc(u.usuario)}</b></td><td>${esc(u.nombre)}</td><td>${u.rol === 'master' ? '<span class="badge b-ag">MASTER</span>' : 'Usuario'}</td>
      <td class="wrap">${u.rol === 'master' ? '<small>Todo</small>' : (u.bloques || []).map(b => `<span class="badge b-nuevo" style="margin:1px">${esc((BLOQUES.find(x => x.id === b) || PERMISOS.find(x => x.id === b) || { label: b }).label.split(' (')[0])}</span>`).join(' ') || '<small class="muted">sin acceso</small>'}</td>
      <td>${u.activo ? 'Sí' : '<span class="down">No</span>'}</td>
      <td><div class="row"><button class="btn xs ghost" data-e="${u.id}">Editar</button><button class="btn xs ghost" data-p="${u.id}">Contraseña</button></div></td></tr>`).join('')}</tbody></table></div>
    <div class="hint" style="margin-top:8px">Cada usuario entra con su <b>usuario</b> y <b>contraseña</b> en el link del sistema. Solo ve los bloques que tenga marcados.</div></div>`;
  const form = (u = {}) => `<div class="grid g2">
      <div class="fld"><label>Usuario (para entrar)</label><input class="inp" id="uU" value="${esc(u.usuario)}" ${u.id ? 'disabled' : ''} autocapitalize="none" placeholder="ej. alma"></div>
      <div class="fld"><label>Nombre</label><input class="inp" id="uN" value="${esc(u.nombre)}"></div>
      ${u.id ? '' : '<div class="fld"><label>Contraseña (mín. 6)</label><input class="inp" id="uP" type="text" autocomplete="off"></div>'}
      <div class="fld"><label>Rol</label><select class="inp" id="uR">${opts([{ v: 'usuario', l: 'Usuario' }, { v: 'master', l: 'Master (todo)' }], u.rol || 'usuario')}</select></div>
      <div class="fld"><label>Activo</label><label class="check" style="min-height:36px"><input type="checkbox" id="uA" ${u.activo === false ? '' : 'checked'}> Puede entrar</label></div></div>
    <h3 style="margin:14px 0 6px;font-size:15px">Bloques a los que tiene acceso</h3>
    <div class="grid g3">${bloquesSel.map(b => `<label class="check"><input type="checkbox" data-b="${b.id}" ${(u.bloques || []).includes(b.id) ? 'checked' : ''}> ${esc(b.label)}</label>`).join('')}</div>
    <h3 style="margin:14px 0 6px;font-size:15px">Permisos especiales</h3>
    <div class="grid">${PERMISOS.map(b => `<label class="check"><input type="checkbox" data-b="${b.id}" ${(u.bloques || []).includes(b.id) ? 'checked' : ''}> ${esc(b.label)}</label>`).join('')}</div>`;
  const leer = body => ({ usuario: $('#uU', body).value.trim().toLowerCase(), nombre: $('#uN', body).value.trim(), rol: $('#uR', body).value, activo: $('#uA', body).checked, bloques: $$('[data-b]', body).filter(x => x.checked).map(x => x.dataset.b) });
  $('#uNuevo').onclick = () => modal({
    title: 'Nuevo usuario', wide: true, body: form(),
    actions: [{ label: 'Cancelar', cls: 'ghost' }, {
      label: 'Crear usuario', cls: 'gold', onClick: async ({ body }) => {
        const d = leer(body), pass = $('#uP', body).value;
        if (!/^[a-z0-9._-]{3,30}$/.test(d.usuario)) throw new Error('Usuario: 3 a 30 letras/números, sin espacios ni acentos');
        if (!d.nombre) throw new Error('Escribe el nombre');
        if (pass.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
        const Cf = window.GC_CONFIG;
        const tmp = window.supabase.createClient(Cf.SUPABASE_URL, Cf.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'gc-tmp-alta' } });
        const { data, error } = await tmp.auth.signUp({ email: emailDe(d.usuario), password: pass });
        if (error) throw /registered|exists/i.test(error.message) ? new Error('Ese usuario ya existe') : error;
        if (!data.user || (data.user.identities && data.user.identities.length === 0)) throw new Error('Ese usuario ya existe');
        const { error: e2 } = await S.sb.rpc('gc_admin_guardar_usuario', { p_id: data.user.id, p_usuario: d.usuario, p_nombre: d.nombre, p_rol: d.rol, p_bloques: d.bloques, p_activo: d.activo });
        if (e2) throw e2;
        toast(`Usuario ${d.usuario} creado`); route();
      }
    }]
  });
  $$('[data-e]', area).forEach(b => b.onclick = () => {
    const u = users.find(x => x.id === b.dataset.e);
    modal({
      title: `Editar · ${u.usuario}`, wide: true, body: form(u),
      actions: [{ label: 'Cancelar', cls: 'ghost' }, {
        label: 'Guardar', cls: 'gold', onClick: async ({ body }) => {
          const d = leer(body);
          const { error: e } = await S.sb.rpc('gc_admin_guardar_usuario', { p_id: u.id, p_usuario: u.usuario, p_nombre: d.nombre, p_rol: d.rol, p_bloques: d.bloques, p_activo: d.activo });
          if (e) throw e;
          toast('Usuario actualizado'); route();
        }
      }]
    });
  });
  $$('[data-p]', area).forEach(b => b.onclick = async () => {
    const u = users.find(x => x.id === b.dataset.p);
    const p = await prompt2(`Nueva contraseña para ${u.usuario}`, 'Contraseña (mín. 6)');
    if (p === null) return;
    const { error: e } = await S.sb.rpc('gc_admin_cambiar_password', { p_id: u.id, p_pass: p });
    if (e) return fail(e);
    toast('Contraseña cambiada');
  });
}

async function adminConfig(area) {
  await cargarCatalogos();
  const n = cfg('negocio', {});
  const campos = [
    ['comision_tarjeta_pct', 'Comisión por pago con tarjeta (%)', 'number'], ['iva_comision_pct', 'IVA sobre la comisión (%)', 'number'],
    ['cuenta_tarjeta', 'Cuenta de depósito tarjeta', 'text'], ['cuenta_transferencia', 'Cuenta de transferencias', 'text'],
    ['dias_unica_vez', 'Días sin volver para “Única vez”', 'number'], ['dias_entrega_default', 'Días de entrega si el servicio no tiene', 'number'],
    ['hora_entrega_default', 'Hora de entrega por defecto', 'text'], ['dias_recoger', 'Días para recoger después del aviso', 'number'],
    ['max_folios_nota', 'Máximo sugerido de folios por nota', 'number'],
  ];
  area.innerHTML = `<div class="card"><h3>Operación</h3><div class="grid g3">
      ${campos.map(([k, l, t]) => `<div class="fld"><label>${esc(l)}</label><input class="inp" data-cfg="${k}" type="${t}" value="${esc(cfg(k, ''))}"></div>`).join('')}
      <div class="fld"><label>Fecha de entrega en domingo</label><label class="check" style="min-height:36px"><input type="checkbox" id="cfDom" ${cfg('saltar_domingo', true) ? 'checked' : ''}> Pasar al lunes</label></div></div></div>
    <div class="card"><h3>Datos que salen en la nota</h3><div class="grid g2">
      ${['direccion', 'colonia', 'ciudad', 'telefono', 'email'].map(k => `<div class="fld"><label>${k}</label><input class="inp" data-neg="${k}" value="${esc(n[k] || '')}"></div>`).join('')}</div>
      <div class="fld" style="margin-top:10px"><label>Leyenda al pie de la nota (**texto** = negritas)</label><textarea class="inp" id="cfLey" style="min-height:160px">${esc(cfg('leyenda_nota', ''))}</textarea></div></div>
    <button class="btn gold" id="cfOk">Guardar configuración</button>`;
  $('#cfOk').onclick = async () => {
    const rows = campos.map(([k, , t]) => { const v = $(`[data-cfg="${k}"]`).value; return { clave: k, valor: t === 'number' ? Number(v) : v }; });
    rows.push({ clave: 'saltar_domingo', valor: $('#cfDom').checked });
    rows.push({ clave: 'negocio', valor: Object.fromEntries($$('[data-neg]').map(i => [i.dataset.neg, i.value.trim()])) });
    rows.push({ clave: 'leyenda_nota', valor: $('#cfLey').value });
    const { error } = await S.sb.from('gc_config').upsert(rows);
    if (error) return fail(error);
    await cargarCatalogos(); toast('Configuración guardada');
  };
}

async function adminBitacora(area) {
  const { data, error } = await S.sb.from('gc_bitacora').select('*').order('cuando', { ascending: false }).limit(400);
  if (error) throw error;
  area.innerHTML = data.length ? `<div class="tbl-wrap" style="max-height:75vh"><table class="tbl"><thead><tr><th>Cuándo</th><th>Usuario</th><th>Tabla</th><th>Registro</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>
    ${data.map(b => `<tr><td>${new Date(b.cuando).toLocaleString('es-MX')}</td><td>${esc(b.usuario_nombre || '')}</td><td>${esc(b.tabla)}</td><td>${b.tabla === 'servicios' ? `<a href="#" data-f="${esc(b.registro)}">${esc(b.registro)}</a>` : esc(b.registro || '')}</td><td>${esc(b.accion)}</td>
      <td class="wrap"><small>${esc(b.tabla === 'servicios' ? resumenCambios(b.detalle) : b.tabla === 'pagos' ? `${b.detalle?.antes?.forma || ''} ${money(b.detalle?.antes?.monto)}${b.detalle?.despues?.cancelado_motivo ? ' · ' + b.detalle.despues.cancelado_motivo : ''}` : JSON.stringify(b.detalle || ''))}</small></td></tr>`).join('')}</tbody></table></div>`
    : '<div class="card empty">Sin cambios registrados todavía.</div>';
  $$('[data-f]', area).forEach(a => a.onclick = ev => { ev.preventDefault(); editarFolio(+a.dataset.f); });
}
