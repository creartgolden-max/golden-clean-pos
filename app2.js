/* =====================================================================
   GOLDEN CLEAN · app2.js — Notas / cotización, Etiquetas, Caja
   ===================================================================== */
'use strict';

// ================================================================= NOTAS
V.notas = async (el, params) => {
  let cliente = params.cliente ? S.clientes.find(c => c.id === +params.cliente) : null;
  let folios = [];        // filas gc_servicios_v del cliente
  let sel = new Set();    // ids seleccionados
  const pedidos = String(params.folios || '').split(',').map(x => +x).filter(Boolean);

  if (pedidos.length) {
    const { data, error } = await S.sb.from('gc_servicios_v').select('cliente_id').in('folio', pedidos).limit(1);
    if (error) throw error;
    if (data[0]) cliente = S.clientes.find(c => c.id === data[0].cliente_id) || cliente;
  }

  el.innerHTML = head('Orden de servicio', 'Nota / cotización') + `
    <div class="card"><div class="row" style="align-items:center">
      <div class="fld" style="flex:1;min-width:260px"><label>Cliente</label><input class="inp" id="nCli" autocomplete="off" placeholder="Buscar cliente…" value="${esc(cliente?.nombre || '')}"></div>
      <div class="fld"><label>o folio</label><input class="inp" id="nFolio" style="width:120px" inputmode="numeric" placeholder="1255"></div>
    </div></div>
    <div id="nArea"></div>`;
  buscadorClientes($('#nCli'), c => { cliente = c; cargar([]); });
  $('#nFolio').onkeydown = async ev => {
    if (ev.key !== 'Enter') return;
    const f = +ev.target.value; if (!f) return;
    const { data } = await S.sb.from('gc_servicios_v').select('cliente_id').eq('folio', f).maybeSingle();
    if (!data) return toast('No existe ese folio', true);
    cliente = S.clientes.find(c => c.id === data.cliente_id); $('#nCli').value = cliente?.nombre || '';
    cargar([f]);
  };

  const cargar = async (preSel) => {
    if (!cliente) { $('#nArea').innerHTML = '<div class="card empty">Busca un cliente o escribe un folio.</div>'; return; }
    $('#nArea').innerHTML = '<div class="loading">Cargando…</div>';
    const { data, error } = await S.sb.from('gc_servicios_v').select('*').eq('cliente_id', cliente.id).neq('estado', 'cancelado').order('folio', { ascending: false }).limit(200);
    if (error) return fail(error);
    folios = data;
    if (preSel.length) sel = new Set(folios.filter(f => preSel.includes(f.folio)).map(f => f.id));
    else {
      const ult = folios[0]?.orden_id ?? null, fr = folios[0]?.fecha_recepcion;
      sel = new Set(folios.filter(f => (ult ? f.orden_id === ult : f.fecha_recepcion === fr)).map(f => f.id));
    }
    dibujar();
  };

  const dibujar = () => {
    const visitas = [];
    folios.forEach(f => { let v = visitas.find(x => x.fecha === f.fecha_recepcion); if (!v) visitas.push(v = { fecha: f.fecha_recepcion, rows: [] }); v.rows.push(f); });
    const elegidos = folios.filter(f => sel.has(f.id)).sort((a, b) => a.folio - b.folio);
    const max = +cfg('max_folios_nota', 15);
    $('#nArea').innerHTML = `<div class="grid" style="grid-template-columns:minmax(260px,330px) minmax(0,1fr);align-items:start">
      <div class="card" style="max-height:80vh;overflow:auto"><h3>Folios de ${esc(cliente.nombre.split(' ')[0])}</h3>
        ${visitas.map(v => `<div style="margin:10px 0 4px" class="row"><b>${fmtD(v.fecha)}</b><button class="btn xs ghost" data-vis="${v.fecha}">Toda la visita</button></div>
          ${v.rows.map(f => `<label class="check" style="display:flex;margin:3px 0"><input type="checkbox" data-id="${f.id}" ${sel.has(f.id) ? 'checked' : ''}>
          <span><b>${f.folio}</b> ${esc(f.articulo || '')} ${esc(f.marca || '')} · ${money0(f.total)} <small class="muted">${ESTADOS[f.estado].s}</small></span></label>`).join('')}`).join('') || '<div class="hint">Sin folios.</div>'}
      </div>
      <div>
        <div class="card"><div class="row" style="align-items:center;justify-content:space-between">
          <div><b>${elegidos.length}</b> folio(s) en la nota ${elegidos.length > max ? `<span class="down">· más de ${max}</span>` : ''}</div>
          <div class="row">
            <button class="btn sm ghost" id="nPrint" ${elegidos.length ? '' : 'disabled'}>${svg('print')} Imprimir / PDF</button>
            <button class="btn sm ghost" id="nImg" ${elegidos.length ? '' : 'disabled'}>${svg('img')} Imagen</button>
            <button class="btn sm gold" id="nWa" ${elegidos.length && cliente.telefono ? '' : 'disabled'}>${svg('wa')} WhatsApp</button>
            ${(can('notas') || can('control')) ? `<button class="btn sm" id="nAprobar" ${elegidos.some(f => f.estado === 'recibido') ? '' : 'disabled'}>Cliente aprobó</button>` : ''}
          </div></div>
          <div class="hint" style="margin-top:6px">“Cliente aprobó” pasa los folios de <b>Recibido</b> a <b>En proceso</b>. Por WhatsApp: primero descarga la imagen, luego adjúntala al chat que se abre.</div></div>
        <div class="nota-prev" id="nPrev">${elegidos.length ? notaHTML(elegidos, cliente) : '<div class="empty">Selecciona folios</div>'}</div>
      </div></div>`;
    $$('#nArea input[data-id]').forEach(cb => cb.onchange = () => { cb.checked ? sel.add(+cb.dataset.id) : sel.delete(+cb.dataset.id); dibujar(); });
    $$('[data-vis]').forEach(b => b.onclick = () => { sel = new Set(folios.filter(f => f.fecha_recepcion === b.dataset.vis).map(f => f.id)); dibujar(); });
    if (!elegidos.length) return;
    const nombreArchivo = `Nota_${rangoFolios(elegidos).replace(/\s+/g, '')}_${cliente.nombre.split(' ')[0]}`;
    $('#nPrint').onclick = () => imprimir(notaHTML(elegidos, cliente));
    $('#nImg').onclick = async () => {
      try {
        const blob = await notaImagen();
        const file = new File([blob], nombreArchivo + '.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
          await navigator.share({ files: [file], title: 'Orden de servicio' });
        } else saveBlob(blob, file.name);
      } catch (e) { if (e.name !== 'AbortError') fail(e); }
    };
    $('#nWa').onclick = () => {
      const tot = elegidos.reduce((a, f) => a + +f.total, 0), pag = elegidos.reduce((a, f) => a + +f.pagado, 0);
      const ent = elegidos.map(f => f.fecha_entrega).filter(Boolean).sort().pop();
      const txt = `Hola ${cliente.nombre.split(' ')[0]}, te saluda Golden Clean Solutions. Te compartimos tu orden de servicio No. ${rangoFolios(elegidos)} (${elegidos.length} ${elegidos.length === 1 ? 'artículo' : 'artículos'}).\n` +
        `Total: ${money(tot)}${pag > 0 ? ` · Anticipo: ${money(pag)} · Saldo: ${money(tot - pag)}` : ''}\nFecha estimada de entrega: ${fmtD(ent)}\n\nConfírmanos por favor si estás de acuerdo para poder comenzar con tu servicio. ¡Gracias por confiar en nosotros!`;
      window.open(waLink(cliente.telefono, txt), '_blank', 'noopener');
      if (S.sb) S.sb.from('gc_ordenes').update({ estado_nota: 'enviada' }).in('id', uniq(elegidos.map(f => f.orden_id).filter(Boolean))).eq('estado_nota', 'cotizacion').then(() => {});
    };
    $('#nAprobar') && ($('#nAprobar').onclick = async () => {
      const rec = elegidos.filter(f => f.estado === 'recibido');
      if (!await ask(`El cliente aprobó la nota ${rangoFolios(elegidos)}. ¿Pasar ${rec.length} folio(s) a <b>En proceso</b>?`, 'Sí, aprobada')) return;
      const { error } = await S.sb.from('gc_servicios').update({ estado: 'en_proceso' }).in('id', rec.map(f => f.id));
      if (error) return fail(error);
      await S.sb.from('gc_ordenes').update({ estado_nota: 'aprobada' }).in('id', uniq(rec.map(f => f.orden_id).filter(Boolean)));
      toast('Nota aprobada · folios en proceso');
      cargar([...elegidos.map(f => f.folio)]);
    });
  };
  if (cliente) await cargar(pedidos); else $('#nArea').innerHTML = '<div class="card empty">Busca un cliente o escribe un folio.</div>';
};

const rangoFolios = rows => { const f = rows.map(r => r.folio).sort((a, b) => a - b); return f.length > 1 ? `${f[0]} AL ${f[f.length - 1]}` : `${f[0]}`; };

function notaHTML(rows, cliente) {
  const n = cfg('negocio', {});
  const tot = r2(rows.reduce((a, f) => a + +f.total, 0));
  const pagado = r2(rows.reduce((a, f) => a + +f.pagado, 0));
  const frec = rows.map(f => f.fecha_recepcion).filter(Boolean).sort()[0];
  const fent = rows.map(f => f.fecha_entrega).filter(Boolean).sort().pop();
  const hora = rows.map(f => f.hora_entrega).find(Boolean) || cfg('hora_entrega_default', '5:30 PM');
  const obs = uniq(rows.map(f => f.observaciones_orden).filter(Boolean)).join(' · ');
  const leyenda = esc(cfg('leyenda_nota', '')).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const cm = v => `<span>$</span>${Number(v || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `<div class="nota" id="notaDoc">
    <div class="n-top"><div class="n-logo"><img src="logo.jpg" alt="Golden Clean Solutions"></div>
      <div><div class="n-info">${esc(n.direccion || '')}<br>${esc(n.colonia || '')}<br>${esc(n.ciudad || '')}<br>TEL: ${esc(n.telefono || '')}<br>${esc(n.email || '')}</div>
        <div class="n-orden"><table><tr><td></td><td class="ttl">ORDEN DE SERVICIO</td></tr><tr><td>No.</td><td class="no">${rangoFolios(rows)}</td></tr></table></div></div></div>
    <div class="n-datos">
      <div class="n-cli">CLIENTE: <b>${esc(cliente.nombre)}</b></div>
      <div class="n-fechas"><span>FECHA DE RECEPCION:</span><b>${fmtD(frec)}</b><span>FECHA ESTIMADA DE ENTREGA:</span><b>${fmtD(fent)}</b><span>HORA DE ENTREGA:</span><b>${esc(hora)}</b></div>
    </div>
    <table class="n-tbl"><thead><tr><th style="width:70px">No.</th><th style="width:110px">TIPO DE ARTICULO</th><th style="width:120px">MARCA</th><th style="width:50px">ALTA GAMA</th><th style="width:110px">CORTE</th><th style="width:130px">COLOR</th><th>SERVICIO</th><th style="width:48px">CANT.</th><th style="width:95px">PRECIO</th><th style="width:100px">TOTAL</th></tr></thead>
      <tbody>${rows.map(f => `<tr><td class="fo">${f.folio}</td><td>${esc(f.articulo || '')}</td><td>${esc(f.marca || '')}</td><td><span class="box${f.alta_gama ? ' on' : ''}">${f.alta_gama ? '✓' : ''}</span></td>
        <td>${esc(f.corte || '')}</td><td>${esc(f.color || '')}</td><td>${esc(f.servicio || f.lineas_txt || '')}</td><td>1</td>
        <td class="m">${cm(f.precio)}</td><td class="m">${cm(f.total)}${+f.desc_monto ? `<small class="dsc">desc. ${+f.desc_pct}%</small>` : ''}</td></tr>`).join('')}</tbody>
      <tfoot>
        <tr><td colspan="2" class="obs">OBSERVACIONES:</td><td colspan="5" class="obsv">${esc(obs)}</td><td class="tot">${rows.length}</td><td class="tot">TOTAL</td><td class="m totv">${cm(tot)}</td></tr>
        ${pagado > 0 ? `<tr><td colspan="8"></td><td class="tot">ANTICIPO</td><td class="m">${cm(pagado)}</td></tr><tr><td colspan="8"></td><td class="tot">SALDO</td><td class="m totv">${cm(tot - pagado)}</td></tr>` : ''}
      </tfoot></table>
    <div class="n-leyenda">${leyenda}</div></div>`;
}
async function notaImagen() {
  if (!window.html2canvas) throw new Error('No cargó la librería de imagen; revisa tu conexión');
  const src = $('#notaDoc');
  const clone = src.cloneNode(true);
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-10000px;top:0;background:#fff';
  holder.appendChild(clone); document.body.appendChild(holder);
  try {
    const canvas = await html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    return await new Promise(res => canvas.toBlob(res, 'image/png'));
  } finally { holder.remove(); }
}

// ================================================================= ETIQUETAS
const LBL_KEY = 'gc_etiquetas_cfg';
const lblCfg = () => { try { return { ancho: 90, alto: 45, modo: 'rollo', letra: 13, ...JSON.parse(localStorage.getItem(LBL_KEY) || '{}') }; } catch { return { ancho: 90, alto: 45, modo: 'rollo', letra: 13 }; } };

V.etiquetas = async (el, params) => {
  const L = lblCfg();
  el.innerHTML = head('Identificación de artículos', 'Etiquetas') + `
    <div class="card"><div class="row">
      <div class="fld" style="flex:1;min-width:240px"><label>Folios</label><input class="inp" id="eFol" value="${esc(params.folios || '')}" placeholder="Ej. 1255-1260, 1270"></div>
      <button class="btn ghost" id="eHoy">Recibidos hoy</button>
      <button class="btn" id="eVer">Ver</button>
    </div>
    <div class="row" style="margin-top:12px">
      <div class="fld"><label>Impresora</label><select class="inp" id="eModo">${opts([{ v: 'rollo', l: 'Térmica / rollo (1 por hoja)' }, { v: 'hoja', l: 'Hoja carta (varias)' }], L.modo)}</select></div>
      <div class="fld"><label>Ancho (mm)</label><input class="inp num" type="number" id="eAncho" value="${L.ancho}" style="width:90px"></div>
      <div class="fld"><label>Alto (mm)</label><input class="inp num" type="number" id="eAlto" value="${L.alto}" style="width:90px"></div>
      <div class="fld"><label>Letra (px)</label><input class="inp num" type="number" id="eLetra" value="${L.letra}" style="width:80px"></div>
      <button class="btn gold" id="ePrint">${svg('print')} Imprimir</button>
    </div><div class="hint" style="margin-top:6px">El tamaño se guarda en esta computadora (cada equipo puede tener su impresora).</div></div>
    <div class="card"><div id="ePrev" class="lbl-grid"><div class="empty">Escribe los folios y presiona Ver.</div></div></div>`;
  let rows = [];
  const parse = s => {
    const out = [];
    String(s).split(/[,\s]+/).filter(Boolean).forEach(p => {
      const m = p.match(/^(\d+)-(\d+)$/);
      if (m) { const a = +m[1], b = +m[2]; for (let i = Math.min(a, b); i <= Math.max(a, b) && out.length < 500; i++) out.push(i); }
      else if (/^\d+$/.test(p)) out.push(+p);
    });
    return uniq(out);
  };
  const leerCfg = () => {
    const c = { modo: $('#eModo').value, ancho: +$('#eAncho').value || 90, alto: +$('#eAlto').value || 45, letra: +$('#eLetra').value || 13 };
    try { localStorage.setItem(LBL_KEY, JSON.stringify(c)); } catch { }
    return c;
  };
  const html = (c, paginas) => rows.map(r => `<div class="lbl${paginas ? ' page' : ''}" style="width:${c.ancho}mm;height:${c.alto}mm;font-size:${c.letra}px">
      <div class="l-fo">${r.folio}${r.alta_gama ? ' ★' : ''}</div>
      <div class="l-ln">SERVICIO ${r.folio}&nbsp;&nbsp;&nbsp;&nbsp; ENTREGA: ${fmtDM(r.fecha_entrega)}</div>
      <div class="l-ln">${esc(r.cliente)}</div>
      <div class="l-ln">${esc(r.articulo || '')}&nbsp;&nbsp;&nbsp;&nbsp; ${esc(r.marca || '')}</div>
      <div class="l-ln">${esc(r.corte || '')}&nbsp;&nbsp;&nbsp;&nbsp; ${esc(r.color || '')}</div>
      <div class="l-ln srv">${esc(r.servicio || '')}</div></div>`).join('');
  const ver = async () => {
    const f = parse($('#eFol').value);
    if (!f.length) return;
    const { data, error } = await S.sb.from('gc_taller_v').select('folio,cliente,articulo,marca,alta_gama,corte,color,servicio,fecha_entrega').in('folio', f).order('folio');
    if (error) return fail(error);
    rows = data;
    const falt = f.filter(x => !rows.some(r => r.folio === x));
    $('#ePrev').innerHTML = (rows.length ? html(leerCfg(), false) : '<div class="empty">No se encontraron folios</div>') + (falt.length ? `<div class="hint" style="width:100%">No existen: ${falt.slice(0, 20).join(', ')}</div>` : '');
  };
  $('#eVer').onclick = ver;
  $('#eFol').onkeydown = e => { if (e.key === 'Enter') ver(); };
  ['eModo', 'eAncho', 'eAlto', 'eLetra'].forEach(id => $('#' + id).onchange = () => rows.length && ver());
  $('#eHoy').onclick = async () => {
    const { data, error } = await S.sb.from('gc_taller_v').select('folio').eq('fecha_recepcion', hoy()).order('folio');
    if (error) return fail(error);
    if (!data.length) return toast('Hoy no hay folios recibidos');
    $('#eFol').value = `${data[0].folio}-${data[data.length - 1].folio}`; ver();
  };
  $('#ePrint').onclick = () => {
    if (!rows.length) return toast('Primero presiona Ver', true);
    const c = leerCfg();
    if (c.modo === 'rollo') imprimir(`<div class="lbl-grid">${html(c, true)}</div>`, `@page{size:${c.ancho}mm ${c.alto}mm;margin:0}`);
    else imprimir(`<div class="lbl-grid" style="gap:2mm">${html(c, false)}</div>`, '@page{size:letter;margin:8mm}');
  };
  if (params.folios) await ver();
};

// ================================================================= CAJA
V.caja = async (el, params) => {
  const tab = params.tab || (params.folios ? 'cobrar' : 'cobrar');
  el.innerHTML = head('Caja', 'Cobros y ventas') + `
    <div class="tabs">${[['cobrar', 'Cobrar servicios'], ['productos', 'Venta de productos'], ['movimientos', 'Movimientos del día']].map(([k, l]) => `<button class="tab${tab === k ? ' on' : ''}" data-t="${k}">${l}</button>`).join('')}</div>
    <div id="cajaArea"></div>`;
  $$('.tab', el).forEach(b => b.onclick = () => go('caja', { tab: b.dataset.t }));
  const area = $('#cajaArea');
  if (tab === 'productos') return cajaProductos(area);
  if (tab === 'movimientos') return cajaMovimientos(area);
  return cajaCobrar(area, params);
};

async function cajaCobrar(area, params) {
  let cliente = null, rows = [], sel = new Set();
  const pre = String(params.folios || '').split(',').map(Number).filter(Boolean);
  area.innerHTML = `<div class="card"><div class="row">
      <div class="fld" style="flex:1;min-width:260px"><label>Cliente</label><input class="inp" id="kCli" autocomplete="off" placeholder="Buscar cliente…"></div>
      <div class="fld"><label>o folio</label><input class="inp" id="kFol" style="width:120px" inputmode="numeric"></div></div></div>
    <div id="kArea"></div>`;
  buscadorClientes($('#kCli'), c => { cliente = c; cargar([]); });
  $('#kFol').onkeydown = async ev => {
    if (ev.key !== 'Enter' || !+ev.target.value) return;
    const { data } = await S.sb.from('gc_servicios_v').select('cliente_id').eq('folio', +ev.target.value).maybeSingle();
    if (!data) return toast('No existe ese folio', true);
    cliente = S.clientes.find(c => c.id === data.cliente_id); $('#kCli').value = cliente?.nombre || '';
    cargar([+ev.target.value]);
  };
  const cargar = async (preSel) => {
    const { data, error } = await S.sb.from('gc_servicios_v').select('*').eq('cliente_id', cliente.id).neq('estado', 'cancelado').gt('saldo', 0.009).order('folio');
    if (error) return fail(error);
    rows = data.filter(r => !(r.legado && r.estado === 'entregado'));
    sel = new Set(rows.filter(r => preSel.length ? preSel.includes(r.folio) : ['listo', 'avisado'].includes(r.estado)).map(r => r.id));
    if (!sel.size && !preSel.length) rows.forEach(r => sel.add(r.id));
    dibujar();
  };
  const dibujar = () => {
    const elegidos = rows.filter(r => sel.has(r.id));
    const saldo = r2(elegidos.reduce((a, r) => a + +r.saldo, 0));
    const cuentas = lista('cuenta');
    $('#kArea').innerHTML = !rows.length ? `<div class="card empty">${esc(cliente.nombre)} no tiene folios con saldo pendiente.</div>` : `
      <div class="card"><h3>Folios con saldo · ${esc(cliente.nombre)}</h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>No.</th><th>Recepción</th><th>Artículo</th><th>Servicio</th><th class="num">Total</th><th class="num">Pagado</th><th class="num">Saldo</th><th>Estado</th></tr></thead><tbody>
      ${rows.map(r => `<tr class="est-${r.estado}"><td><input type="checkbox" data-id="${r.id}" ${sel.has(r.id) ? 'checked' : ''}></td><td><b>${r.folio}</b></td><td>${fmtD(r.fecha_recepcion)}</td><td>${esc(r.articulo || '')} ${esc(r.marca || '')}</td><td class="wrap">${esc(r.servicio || '')}</td>
        <td class="num">${money(r.total)}</td><td class="num">${money(r.pagado)}</td><td class="num"><b>${money(r.saldo)}</b></td><td>${ESTADOS[r.estado].s}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="7">${elegidos.length} seleccionado(s)</td><td class="num">${money(saldo)}</td><td></td></tr></tfoot></table></div></div>
      <div class="card"><h3>Registrar pago</h3>
        <div class="grid g4">
          <div class="fld"><label>Monto</label><input class="inp num" type="number" step="0.01" min="0" id="kMonto" value="${saldo.toFixed(2)}"></div>
          <div class="fld"><label>Forma de pago</label><select class="inp" id="kForma">${opts(FORMAS.map(f => ({ v: f.id, l: f.l })), 'efectivo')}</select></div>
          <div class="fld"><label>Cuenta</label><select class="inp" id="kCuenta">${opts(cuentas, 'CAJA')}</select></div>
          <div class="fld"><label>Fecha</label><input class="inp" type="date" id="kFecha" value="${hoy()}" ${can('fechas') ? '' : 'disabled'}></div>
        </div>
        <div class="row" style="margin-top:12px;align-items:center">
          <label class="check"><input type="checkbox" id="kEntregar" ${elegidos.length && elegidos.every(r => ['listo', 'avisado'].includes(r.estado)) ? 'checked' : ''}> Marcar como ENTREGADO</label>
          <input class="inp" id="kNotas" placeholder="Nota (opcional)" style="max-width:300px">
          <span class="hint" id="kTipo"></span>
          <button class="btn gold" id="kOk" style="margin-left:auto" ${elegidos.length ? '' : 'disabled'}>Registrar pago</button>
        </div>
        <div class="hint" style="margin-top:8px">¿Paga con dos formas? Registra primero una parte y luego la otra. Si el monto es menor al saldo se guarda como <b>anticipo</b> y se reparte entre los folios.</div>
      </div>`;
    if (!rows.length) return;
    $$('#kArea input[data-id]').forEach(cb => cb.onchange = () => { cb.checked ? sel.add(+cb.dataset.id) : sel.delete(+cb.dataset.id); dibujar(); });
    const tipo = () => { const m = +$('#kMonto').value || 0; $('#kTipo').textContent = m <= 0 ? '' : m < saldo - 0.009 ? `Anticipo · quedará saldo de ${money(saldo - m)}` : 'Liquida el saldo'; };
    $('#kMonto').oninput = tipo; tipo();
    $('#kForma').onchange = e => { $('#kCuenta').value = cuentaDefault(e.target.value); };
    $('#kOk').onclick = async () => {
      const monto = r2($('#kMonto').value);
      if (!(monto > 0)) return toast('Escribe el monto', true);
      if (monto > saldo + 0.009) return toast(`El monto es mayor al saldo (${money(saldo)})`, true);
      const forma = $('#kForma').value, entregar = $('#kEntregar').checked;
      if (!await ask(`Registrar <b>${money(monto)}</b> en <b>${forma}</b> para ${elegidos.length} folio(s)${entregar ? ' y marcarlos como <b>ENTREGADOS</b>' : ''}?`, 'Registrar')) return;
      const b = $('#kOk'); b.disabled = true;
      try {
        const { data, error } = await S.sb.rpc('gc_registrar_pago', { p: {
          servicio_ids: elegidos.map(r => r.id), monto, forma, cuenta: $('#kCuenta').value, fecha: $('#kFecha').value, notas: $('#kNotas').value, entregar
        } });
        if (error) throw error;
        toast(`${data.tipo === 'anticipo' ? 'Anticipo' : 'Pago'} registrado: ${money(data.aplicado)}`);
        cargar([]);
      } catch (e) { fail(e); b.disabled = false; }
    };
  };
  if (pre.length) {
    const { data } = await S.sb.from('gc_servicios_v').select('cliente_id').in('folio', pre).limit(1);
    if (data?.[0]) { cliente = S.clientes.find(c => c.id === data[0].cliente_id); $('#kCli').value = cliente?.nombre || ''; await cargar(pre); }
  }
}

async function cajaProductos(area) {
  const V2 = { cliente: null, lineas: [], pagos: [{ forma: 'efectivo', cuenta: 'CAJA', monto: 0 }] };
  const prods = S.pcat.filter(p => p.activo);
  const label = p => [p.nombre, p.presentacion, p.color].filter(Boolean).join(' · ') + ` — ${money0(p.precio)}`;
  const draw = () => {
    const total = r2(V2.lineas.reduce((a, l) => a + l.cantidad * l.precio, 0));
    if (V2.pagos.length === 1) V2.pagos[0].monto = total;
    const pagado = r2(V2.pagos.reduce((a, p) => a + (+p.monto || 0), 0));
    area.innerHTML = `<div class="grid g2" style="align-items:start">
      <div class="card"><h3>Productos</h3>
        <div class="row"><select class="inp" id="pSel" style="flex:1"><option value="">Seleccionar producto…</option>${prods.map(p => `<option value="${p.id}">${esc(label(p))}</option>`).join('')}</select>
          <input class="inp num" type="number" min="1" step="1" id="pCant" value="1" style="width:80px"><button class="btn" id="pAdd">Agregar</button></div>
        <div class="tbl-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Total</th><th></th></tr></thead><tbody>
          ${V2.lineas.map((l, i) => `<tr><td>${esc([l.producto, l.presentacion, l.color].filter(Boolean).join(' · '))}</td>
            <td class="num"><input class="inp num" type="number" min="1" data-c="${i}" value="${l.cantidad}" style="width:70px"></td>
            <td class="num"><input class="inp num" type="number" min="0" step="0.01" data-p="${i}" value="${l.precio}" style="width:95px" ${can('descuentos') ? '' : 'disabled'}></td>
            <td class="num">${money(l.cantidad * l.precio)}</td><td><button class="btn xs danger" data-x="${i}">×</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Sin productos</td></tr>'}</tbody>
          <tfoot><tr><td colspan="3">Total</td><td class="num">${money(total)}</td><td></td></tr></tfoot></table></div>
        <div class="fld" style="margin-top:12px"><label>Cliente (opcional)</label><input class="inp" id="pCli" autocomplete="off" value="${esc(V2.cliente?.nombre || '')}" placeholder="Buscar cliente…"></div>
      </div>
      <div class="card"><h3>Pago</h3>
        ${V2.pagos.map((p, i) => `<div class="grid g3" style="margin-bottom:8px">
          <div class="fld"><label>Forma</label><select class="inp" data-pf="${i}">${opts(FORMAS.map(f => ({ v: f.id, l: f.l })), p.forma)}</select></div>
          <div class="fld"><label>Cuenta</label><select class="inp" data-pc="${i}">${opts(lista('cuenta'), p.cuenta)}</select></div>
          <div class="fld"><label>Monto</label><input class="inp num" type="number" step="0.01" data-pm="${i}" value="${p.monto}" ${V2.pagos.length === 1 ? 'disabled' : ''}></div></div>`).join('')}
        <div class="row"><button class="btn sm ghost" id="pSplit">${V2.pagos.length === 1 ? 'Pago dividido' : 'Un solo pago'}</button></div>
        <div class="sum-line big"><span>Total</span><span class="num">${money(total)}</span></div>
        ${V2.pagos.length > 1 ? `<div class="sum-line"><span>Suma de pagos</span><b class="num ${Math.abs(pagado - total) > 0.009 ? 'down' : 'up'}">${money(pagado)}</b></div>` : ''}
        <button class="btn gold" id="pOk" style="width:100%;margin-top:10px" ${V2.lineas.length ? '' : 'disabled'}>Registrar venta</button>
      </div></div>`;
    $('#pAdd').onclick = () => {
      const p = prods.find(x => x.id === +$('#pSel').value); if (!p) return;
      V2.lineas.push({ producto_id: p.id, producto: p.nombre, presentacion: p.presentacion, color: p.color, cantidad: Math.max(1, +$('#pCant').value || 1), precio: +p.precio });
      draw();
    };
    $$('[data-c]', area).forEach(i => i.onchange = () => { V2.lineas[+i.dataset.c].cantidad = Math.max(1, +i.value || 1); draw(); });
    $$('[data-p]', area).forEach(i => i.onchange = () => { V2.lineas[+i.dataset.p].precio = r2(i.value); draw(); });
    $$('[data-x]', area).forEach(b => b.onclick = () => { V2.lineas.splice(+b.dataset.x, 1); draw(); });
    $$('[data-pf]', area).forEach(s => s.onchange = () => { const p = V2.pagos[+s.dataset.pf]; p.forma = s.value; p.cuenta = cuentaDefault(s.value); draw(); });
    $$('[data-pc]', area).forEach(s => s.onchange = () => { V2.pagos[+s.dataset.pc].cuenta = s.value; });
    $$('[data-pm]', area).forEach(s => s.onchange = () => { V2.pagos[+s.dataset.pm].monto = r2(s.value); draw(); });
    $('#pSplit').onclick = () => { if (V2.pagos.length === 1) V2.pagos.push({ forma: 'tarjeta', cuenta: cuentaDefault('tarjeta'), monto: 0 }); else V2.pagos = [V2.pagos[0]]; draw(); };
    buscadorClientes($('#pCli'), c => { V2.cliente = c; $('#pCli').value = c.nombre; });
    $('#pCli').addEventListener('change', e => { if (!e.target.value.trim()) V2.cliente = null; });
    $('#pOk').onclick = async () => {
      if (Math.abs(pagado - total) > 0.009) return toast('La suma de pagos no cuadra con el total', true);
      const b = $('#pOk'); b.disabled = true;
      try {
        const { error } = await S.sb.rpc('gc_registrar_venta', { p: { cliente_id: V2.cliente?.id || null, lineas: V2.lineas, pagos: V2.pagos } });
        if (error) throw error;
        toast(`Venta registrada: ${money(total)}`);
        V2.lineas = []; V2.cliente = null; V2.pagos = [{ forma: 'efectivo', cuenta: 'CAJA', monto: 0 }]; draw();
      } catch (e) { fail(e); b.disabled = false; }
    };
  };
  draw();
}

async function cajaMovimientos(area) {
  let fecha = hoy();
  const draw = async () => {
    area.innerHTML = '<div class="loading">Cargando…</div>';
    const { data, error } = await S.sb.from('gc_pagos_v').select('*').eq('fecha', fecha).order('creado');
    if (error) return fail(error);
    const act = data.filter(p => !p.cancelado);
    const sum = f => r2(act.filter(p => p.forma === f).reduce((a, p) => a + +p.monto, 0));
    area.innerHTML = `<div class="card"><div class="row"><div class="fld"><label>Fecha</label><input class="inp" type="date" id="mF" value="${fecha}"></div></div></div>
      <div class="tiles">
        <div class="tile"><div class="k">Efectivo</div><div class="v">${money0(sum('efectivo'))}</div></div>
        <div class="tile"><div class="k">Tarjeta</div><div class="v">${money0(sum('tarjeta'))}</div></div>
        <div class="tile"><div class="k">Transferencia</div><div class="v">${money0(sum('transferencia'))}</div></div>
        <div class="tile"><div class="k">Total</div><div class="v">${money0(sum('efectivo') + sum('tarjeta') + sum('transferencia'))}</div><div class="s">${act.length} movimiento(s)</div></div>
      </div>
      ${data.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Hora</th><th>Cliente</th><th>Concepto</th><th>Tipo</th><th>Forma</th><th>Cuenta</th><th class="num">Monto</th><th>Registró</th><th></th></tr></thead><tbody>
        ${data.map(p => `<tr class="${p.cancelado ? 'est-cancelado' : ''}"><td>${new Date(p.creado).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td><td>${esc(p.cliente || '')}</td>
          <td class="wrap">${p.folio ? `Folio <b>${p.folio}</b> · ${esc(p.articulo || '')} ${esc(p.marca || '')}` : esc(p.productos || 'Productos')}</td><td>${esc(p.tipo)}</td><td>${esc(p.forma)}</td><td>${esc(p.cuenta || '')}</td>
          <td class="num">${money(p.monto)}</td><td>${esc(p.registro || '')}</td>
          <td>${p.cancelado ? '<small>cancelado</small>' : can('cancelar') ? `<button class="btn xs danger" data-c="${p.id}" data-v="${p.venta_id || ''}">Cancelar</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="card empty">Sin movimientos en esta fecha.</div>'}`;
    $('#mF').onchange = e => { fecha = e.target.value || hoy(); draw(); };
    $$('[data-c]', area).forEach(b => b.onclick = async () => {
      const motivo = await prompt2('Cancelar movimiento', b.dataset.v ? 'Se cancelará la venta completa. Motivo:' : 'Motivo de la cancelación');
      if (motivo === null) return;
      const { error: e } = b.dataset.v
        ? await S.sb.rpc('gc_cancelar_venta', { p_id: +b.dataset.v, p_motivo: motivo })
        : await S.sb.from('gc_pagos').update({ cancelado: true, cancelado_motivo: motivo || null }).eq('id', +b.dataset.c);
      if (e) return fail(e);
      toast('Cancelado'); draw();
    });
  };
  draw();
}
