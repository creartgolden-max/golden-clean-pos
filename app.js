/* =====================================================================
   GOLDEN CLEAN SOLUTIONS · PUNTO DE VENTA
   app.js — núcleo: utilidades, sesión, menú, componentes, Inicio,
            Recepción, Control de servicios, Clientes
   ===================================================================== */
'use strict';

// ---------------------------------------------------------------- utilidades
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money0 = n => '$' + Number(n || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 });
const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
const TZ = 'America/Mexico_City';
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const diffDays = (a, b) => Math.round((new Date(a + 'T12:00:00Z') - new Date(b + 'T12:00:00Z')) / 86400000);
const dow = iso => new Date(iso + 'T12:00:00Z').getUTCDay();
const fmtD = iso => iso ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(2, 4)}` : '';
const fmtDM = iso => iso ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}` : '';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fmtLargo = iso => iso ? `${+iso.slice(8, 10)} de ${MESES[+iso.slice(5, 7) - 1]} de ${iso.slice(0, 4)}` : '';
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const digits = s => String(s ?? '').replace(/\D/g, '');
const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const cleanQ = s => String(s ?? '').replace(/[,()%*\\]/g, ' ').trim();
const uniq = a => [...new Set(a)];

const ICON = {
  inicio: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  recepcion: '<path d="M12 5v14M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="3"/>',
  control: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  clientes: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M17 11a3 3 0 1 0 0-6M22 21c0-3-2-5-5-5.5"/>',
  notas: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
  taller: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  etiquetas: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
  caja: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h4"/>',
  cortes: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  catalogos: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  admin: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  wa: '<path d="M3 21l1.7-5A9 9 0 1 1 8 19.4z"/><path d="M9 10c0 3 2 5 5 5l1.5-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z"/>',
  print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/>',
  xls: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11l5 6M14 11l-5 6"/>',
  img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
};
const svg = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor">${ICON[k] || ''}</svg>`;

const BLOQUES = [
  { id: 'inicio', label: 'Inicio', always: true },
  { id: 'recepcion', label: 'Recepción' },
  { id: 'control', label: 'Control de servicios' },
  { id: 'taller', label: 'Taller' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'notas', label: 'Notas / cotización' },
  { id: 'etiquetas', label: 'Etiquetas' },
  { id: 'caja', label: 'Caja' },
  { id: 'cortes', label: 'Cortes y reportes' },
  { id: 'catalogos', label: 'Catálogos' },
  { id: 'admin', label: 'Administración', masterOnly: true },
];
const PERMISOS = [
  { id: 'fechas', label: 'Modificar fechas (entrega, recepción y pagos con otra fecha)' },
  { id: 'descuentos', label: 'Descuentos y cambios de precio (precio fijo o ya aprobado)' },
  { id: 'cancelar', label: 'Cancelar / reabrir folios y cancelar pagos' },
];
const ESTADOS = {
  recibido: { l: 'Recibido · por aprobar', s: 'Recibido' },
  en_proceso: { l: 'En proceso', s: 'En proceso' },
  listo: { l: 'Listo · falta avisar', s: 'Listo' },
  avisado: { l: 'Avisado · por recoger', s: 'Avisado' },
  entregado: { l: 'Entregado', s: 'Entregado' },
  cancelado: { l: 'Cancelado', s: 'Cancelado' },
};
const ESTADOS_ABIERTOS = ['recibido', 'en_proceso', 'listo', 'avisado'];
const FORMAS = [{ id: 'efectivo', l: 'Efectivo' }, { id: 'tarjeta', l: 'Tarjeta' }, { id: 'transferencia', l: 'Transferencia' }];

// ---------------------------------------------------------------- estado global
const S = { sb: null, perfil: null, cfg: {}, listas: {}, marcas: [], scat: [], pcat: [], clientes: [], view: null, params: {} };
const V = window.V = {};
const can = b => !!S.perfil && S.perfil.activo && (S.perfil.rol === 'master' || (S.perfil.bloques || []).includes(b));
const isMaster = () => S.perfil?.rol === 'master';
const vePrecios = () => isMaster() || ['recepcion', 'control', 'clientes', 'notas', 'caja', 'cortes', 'catalogos'].some(can);
const cfg = (k, def) => (S.cfg[k] === undefined || S.cfg[k] === null ? def : S.cfg[k]);

// ---------------------------------------------------------------- UI helpers
function toast(msg, err = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : '');
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), err ? 7000 : 3500);
}
function errMsg(e) {
  const m = e?.message || e?.error_description || String(e);
  if (/Invalid login credentials/i.test(m)) return 'Usuario o contraseña incorrectos';
  if (/JWT|expired/i.test(m)) return 'La sesión expiró. Vuelve a entrar.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sin conexión a internet o al servidor';
  return m;
}
const fail = e => { console.error(e); toast(errMsg(e), true); };

function modal({ title, body = '', wide = false, actions = [], onOpen }) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">
    <div class="modal-head"><h3>${esc(title)}</h3><button class="x" aria-label="Cerrar">×</button></div>
    <div class="modal-body"></div><div class="modal-foot"></div></div>`;
  const bodyEl = $('.modal-body', wrap);
  if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.appendChild(body);
  const close = () => wrap.remove();
  $('.x', wrap).onclick = close;
  wrap.addEventListener('mousedown', ev => { if (ev.target === wrap) close(); });
  const foot = $('.modal-foot', wrap);
  if (!actions.length) foot.remove();
  actions.forEach(a => {
    const b = document.createElement('button');
    b.className = 'btn ' + (a.cls || '');
    b.innerHTML = a.label;
    b.onclick = async () => {
      if (a.onClick) {
        b.disabled = true;
        try { const r = await a.onClick({ close, el: wrap, body: bodyEl }); if (r !== false && !a.keep) close(); }
        catch (e) { fail(e); }
        finally { b.disabled = false; }
      } else close();
    };
    foot.appendChild(b);
  });
  $('#modals').appendChild(wrap);
  const m = { el: wrap, body: bodyEl, close };
  if (onOpen) onOpen(m);
  const first = $('input:not([type=checkbox]):not([disabled]),select,textarea', bodyEl);
  if (first) setTimeout(() => first.focus(), 30);
  return m;
}
function ask(text, okLabel = 'Aceptar', cls = '') {
  return new Promise(res => {
    const m = modal({
      title: 'Confirmar', body: `<p style="margin:0;line-height:1.5">${text}</p>`,
      actions: [{ label: 'Cancelar', cls: 'ghost', onClick: () => res(false) }, { label: okLabel, cls, onClick: () => res(true) }]
    });
    $('.x', m.el).addEventListener('click', () => res(false));
  });
}
function prompt2(title, label, value = '', type = 'text') {
  return new Promise(res => {
    modal({
      title, body: `<div class="fld"><label>${esc(label)}</label><input class="inp" id="p2" type="${type}" value="${esc(value)}"></div>`,
      actions: [{ label: 'Cancelar', cls: 'ghost', onClick: () => res(null) },
        { label: 'Aceptar', onClick: ({ body }) => res($('#p2', body).value) }]
    });
  });
}
function opts(list, sel, blank) {
  return (blank !== undefined ? `<option value="">${esc(blank)}</option>` : '') +
    list.map(o => { const v = typeof o === 'object' ? o.v : o; const l = typeof o === 'object' ? o.l : o;
      return `<option value="${esc(v)}"${String(v) === String(sel ?? '') ? ' selected' : ''}>${esc(l)}</option>`; }).join('');
}
function grupoBadge(g) {
  const c = g === 'Frecuente' ? 'b-frecuente' : g === 'Única vez' ? 'b-unica' : 'b-nuevo';
  return `<span class="badge ${c}">${esc(g || 'Nuevo')}</span>`;
}
function waLink(tel, text) {
  let d = digits(tel);
  if (d.length === 10) d = '52' + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}
function setPrintPage(css) { $('#printPage').textContent = css; }
function imprimir(html, pageCss = '@page{size:letter;margin:8mm}') {
  const pa = $('#printArea');
  pa.innerHTML = html;
  setPrintPage(pageCss);
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); pa.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 80);
}
async function fetchAll(make, size = 1000) {
  let out = [], from = 0;
  for (;;) {
    const { data, error } = await make().range(from, from + size - 1);
    if (error) throw error;
    out = out.concat(data || []);
    if (!data || data.length < size) break;
    from += size;
  }
  return out;
}
function saveBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---------------------------------------------------------------- Excel (ExcelJS)
const XL = {
  green: 'FF1E5B1E', money: '"$"#,##0.00',
  async save(nombre, build) {
    if (!window.ExcelJS) throw new Error('No cargó la librería de Excel; revisa tu conexión');
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Golden Clean POS';
    await build(wb);
    const buf = await wb.xlsx.writeBuffer();
    saveBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombre);
  },
  header(row) {
    row.eachCell(c => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.green } };
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    row.height = 30;
  },
  // cols: [{h, k|get, w, money, date}]
  table(ws, cols, rows, title) {
    if (title) {
      ws.addRow([title]).font = { bold: true, size: 14 };
      ws.addRow([]);
    }
    XL.header(ws.addRow(cols.map(c => c.h)));
    rows.forEach(r => {
      const row = ws.addRow(cols.map(c => { const v = c.get ? c.get(r) : r[c.k]; return c.money ? Number(v || 0) : (v ?? ''); }));
      cols.forEach((c, i) => { if (c.money) row.getCell(i + 1).numFmt = XL.money; });
    });
    cols.forEach((c, i) => { ws.getColumn(i + 1).width = c.w || 14; });
    return ws;
  }
};

// ---------------------------------------------------------------- sesión
const emailDe = u => `${String(u).trim().toLowerCase()}@${window.GC_CONFIG.DOMINIO_USUARIOS}`;

async function init() {
  const C = window.GC_CONFIG || {};
  if (!C.SUPABASE_URL || !/^https:\/\//.test(C.SUPABASE_URL) || !window.supabase) {
    $('#app').innerHTML = `<div class="login"><div class="login-card"><div class="wordmark"><b>GOLDEN CLEAN</b><span>SOLUTIONS</span></div>
      <h2>Falta conectar</h2><p class="sub">Pega la URL y la llave anon de Supabase en <b>config.js</b>.${window.supabase ? '' : ' (Tampoco cargó la librería de Supabase: revisa internet.)'}</p></div></div>`;
    return;
  }
  S.sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  const { data: { session } } = await S.sb.auth.getSession();
  if (session) await entrar(session.user); else pantallaLogin();
}

async function pantallaLogin(msg = '') {
  let hayUsuarios = true;
  try { const { data, error } = await S.sb.rpc('gc_hay_usuarios'); if (error) throw error; hayUsuarios = data; }
  catch (e) { msg = 'No se pudo conectar con la base de datos: ' + errMsg(e) + '. ¿Ya corriste gc_01_esquema.sql?'; }
  const primer = !hayUsuarios;
  $('#app').innerHTML = `<div class="login"><form class="login-card" id="fLogin" autocomplete="on">
    <div class="wordmark"><b>GOLDEN CLEAN</b><span>SOLUTIONS</span></div>
    <h2>${primer ? 'Configuración inicial' : 'Punto de venta'}</h2>
    <p class="sub">${primer ? 'Crea el usuario MASTER (Yuly). Después, desde Administración, se crean los demás.' : 'Entra con tu usuario y contraseña.'}</p>
    ${primer ? `<label>Nombre completo</label><input id="lNombre" value="Yuly Oñate" required>` : ''}
    <label>Usuario</label><input id="lUser" autocomplete="username" autocapitalize="none" placeholder="${primer ? 'ej. yuly' : ''}" required>
    <label>Contraseña</label><input id="lPass" type="password" autocomplete="${primer ? 'new-password' : 'current-password'}" required>
    ${primer ? `<label>Repetir contraseña</label><input id="lPass2" type="password" autocomplete="new-password" required>` : ''}
    <button class="btn gold" type="submit">${primer ? 'Crear usuario master' : 'Entrar'}</button>
    <div class="login-msg" id="lMsg">${esc(msg)}</div></form></div>`;
  $('#fLogin').onsubmit = async ev => {
    ev.preventDefault();
    const btn = $('button', ev.target); btn.disabled = true;
    const u = $('#lUser').value.trim().toLowerCase(), p = $('#lPass').value;
    $('#lMsg').textContent = '';
    try {
      if (!/^[a-z0-9._-]{3,30}$/.test(u)) throw new Error('El usuario debe tener 3 a 30 letras/números, sin espacios ni acentos');
      if (primer) {
        if (p.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
        if (p !== $('#lPass2').value) throw new Error('Las contraseñas no coinciden');
        const { data, error } = await S.sb.auth.signUp({ email: emailDe(u), password: p });
        if (error) throw error;
        if (!data.session) throw new Error('Supabase pide confirmar correo. En Authentication → Sign In / Providers → Email, desactiva "Confirm email" y vuelve a intentar.');
        const { error: e2 } = await S.sb.rpc('gc_primer_master', { p_usuario: u, p_nombre: $('#lNombre').value.trim() });
        if (e2) throw e2;
        await entrar(data.user);
      } else {
        const { data, error } = await S.sb.auth.signInWithPassword({ email: emailDe(u), password: p });
        if (error) throw error;
        await entrar(data.user);
      }
    } catch (e) { $('#lMsg').textContent = errMsg(e); btn.disabled = false; }
  };
}

async function entrar(user) {
  $('#app').innerHTML = '<div class="loading">Cargando sistema…</div>';
  const { data: perfil, error } = await S.sb.from('gc_usuarios').select('*').eq('id', user.id).maybeSingle();
  if (error || !perfil || !perfil.activo) {
    await S.sb.auth.signOut();
    return pantallaLogin(error ? errMsg(error) : 'Tu usuario no tiene acceso activo. Pide a la administradora que lo active.');
  }
  S.perfil = perfil;
  try { await cargarCatalogos(); await cargarClientes(); }
  catch (e) { fail(e); }
  shell();
  window.addEventListener('hashchange', route);
  route();
}

async function salir() {
  await S.sb.auth.signOut();
  location.hash = '';
  location.reload();
}

async function cargarCatalogos() {
  const [c, l, m, s, p] = await Promise.all([
    S.sb.from('gc_config').select('*'),
    S.sb.from('gc_listas').select('*').order('orden').order('valor'),
    fetchAll(() => S.sb.from('gc_marcas').select('*').order('nombre')),
    S.sb.from('gc_servicios_cat').select('*').order('orden').order('nombre'),
    S.sb.from('gc_productos_cat').select('*').order('nombre'),
  ]);
  for (const r of [c, l, s, p]) if (r.error) throw r.error;
  S.cfg = Object.fromEntries(c.data.map(x => [x.clave, x.valor]));
  S.listas = {};
  l.data.forEach(x => { (S.listas[x.tipo] ||= []).push(x); });
  S.marcas = m; S.scat = s.data; S.pcat = p.data;
}
const lista = tipo => (S.listas[tipo] || []).filter(x => x.activo).map(x => x.valor);

async function cargarClientes() {
  S.clientes = await fetchAll(() => S.sb.from('gc_clientes_v').select('*').order('numero'));
}

// ---------------------------------------------------------------- shell y rutas
function shell() {
  const p = S.perfil;
  const items = BLOQUES.filter(b => b.always || (b.masterOnly ? isMaster() : can(b.id)));
  $('#app').innerHTML = `
  <div class="mobile-top"><div class="wordmark"><b>GOLDEN CLEAN</b><span>SOLUTIONS</span></div><button id="mMenu">Menú</button></div>
  <div class="app">
    <aside class="side" id="side">
      <div class="wordmark"><b>GOLDEN CLEAN</b><span>SOLUTIONS</span></div>
      <nav class="nav">${items.map(b => `<button data-v="${b.id}">${svg(b.id)}<span>${esc(b.label)}</span></button>`).join('')}</nav>
      <div class="side-foot"><div class="who">${esc(p.nombre)}</div><div class="role">${p.rol === 'master' ? 'Usuario master' : 'Usuario'} · ${esc(p.usuario)}</div>
        <div class="links"><button id="bPass">Cambiar contraseña</button><button id="bSalir">Salir</button></div></div>
    </aside>
    <main class="main" id="main"></main>
  </div>`;
  $$('.nav button').forEach(b => b.onclick = () => { go(b.dataset.v); $('#side').classList.remove('open'); });
  $('#mMenu').onclick = () => $('#side').classList.toggle('open');
  $('#bSalir').onclick = salir;
  $('#bPass').onclick = cambiarMiPassword;
}

function go(view, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const h = '#' + view + (qs ? '?' + qs : '');
  if (location.hash === h) route(); else location.hash = h;
}
function route() {
  const raw = location.hash.slice(1) || 'inicio';
  const [view, qs] = raw.split('?');
  const allowed = BLOQUES.find(b => b.id === view && (b.always || (b.masterOnly ? isMaster() : can(b.id))));
  let v = allowed && V[view] ? view : 'inicio';
  if (v === 'inicio' && !vePrecios() && can('taller')) v = 'taller';
  S.view = v; S.params = Object.fromEntries(new URLSearchParams(qs || ''));
  $$('.nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  const main = $('#main');
  main.innerHTML = '<div class="loading">Cargando…</div>';
  window.scrollTo(0, 0);
  Promise.resolve(V[v](main, S.params)).catch(e => { fail(e); main.innerHTML = `<div class="card empty">No se pudo cargar: ${esc(errMsg(e))}</div>`; });
}
function head(eyebrow, title, right = '') {
  return `<div class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1></div><div class="row">${right}</div></div>`;
}

function cambiarMiPassword() {
  modal({
    title: 'Cambiar mi contraseña',
    body: `<div class="grid"><div class="fld"><label>Nueva contraseña</label><input class="inp" type="password" id="np1" autocomplete="new-password"></div>
      <div class="fld"><label>Repetir</label><input class="inp" type="password" id="np2" autocomplete="new-password"></div></div>`,
    actions: [{ label: 'Cancelar', cls: 'ghost' }, {
      label: 'Guardar', onClick: async ({ body }) => {
        const a = $('#np1', body).value, b = $('#np2', body).value;
        if (a.length < 6) throw new Error('Mínimo 6 caracteres');
        if (a !== b) throw new Error('No coinciden');
        const { error } = await S.sb.auth.updateUser({ password: a });
        if (error) throw error;
        toast('Contraseña actualizada');
      }
    }]
  });
}

// ---------------------------------------------------------------- componentes compartidos
function buscadorClientes(input, onPick, { max = 8 } = {}) {
  const box = document.createElement('div');
  box.className = 'dropdown hidden';
  input.parentElement.classList.add('search');
  input.parentElement.appendChild(box);
  let act = -1, res = [];
  const render = () => {
    const q = norm(input.value), qd = digits(input.value);
    if (!q) { box.classList.add('hidden'); return; }
    res = S.clientes.filter(c => {
      if (/^\d+$/.test(q) && (String(c.numero) === q || digits(c.telefono).includes(qd) || digits(c.telefono2).includes(qd))) return true;
      return norm(c.nombre).includes(q);
    }).sort((a, b) => (b.ultima || '').localeCompare(a.ultima || '')).slice(0, max);
    act = -1;
    box.innerHTML = res.length ? res.map((c, i) => `<div class="opt" data-i="${i}"><span><b>${esc(c.nombre)}</b> <small>#${c.numero}</small><br><small>${esc(c.telefono || 'sin teléfono')}</small></span><span>${grupoBadge(c.grupo)}<br><small>${c.visitas} visita(s) · ${c.folios} folio(s)</small></span></div>`).join('')
      : `<div class="opt"><small>Sin coincidencias</small></div>`;
    box.classList.remove('hidden');
    $$('.opt[data-i]', box).forEach(o => o.onmousedown = ev => { ev.preventDefault(); pick(+o.dataset.i); });
  };
  const pick = i => { if (!res[i]) return; box.classList.add('hidden'); onPick(res[i]); };
  input.addEventListener('input', debounce(render, 120));
  input.addEventListener('focus', render);
  input.addEventListener('blur', () => setTimeout(() => box.classList.add('hidden'), 150));
  input.addEventListener('keydown', ev => {
    const o = $$('.opt[data-i]', box);
    if (ev.key === 'ArrowDown') { act = Math.min(act + 1, o.length - 1); }
    else if (ev.key === 'ArrowUp') { act = Math.max(act - 1, 0); }
    else if (ev.key === 'Enter') { if (act >= 0) { ev.preventDefault(); pick(act); } return; }
    else return;
    ev.preventDefault();
    o.forEach((x, i) => x.classList.toggle('act', i === act));
  });
}

function formCliente(c = {}) {
  return `<div class="grid g2">
    <div class="fld" style="grid-column:1/-1"><label>Nombre completo *</label><input class="inp" id="cNombre" value="${esc(c.nombre)}"></div>
    <div class="fld"><label>Teléfono (WhatsApp) *</label><input class="inp" id="cTel" inputmode="tel" value="${esc(c.telefono)}" placeholder="10 dígitos"></div>
    <div class="fld"><label>Teléfono 2</label><input class="inp" id="cTel2" inputmode="tel" value="${esc(c.telefono2)}"></div>
    <div class="fld"><label>¿Cómo se enteró de nosotros? *</label><select class="inp" id="cOrigen">${opts(lista('origen'), c.origen, 'Seleccionar…')}</select></div>
    <div class="fld"><label>Redes sociales (usuario)</label><input class="inp" id="cRedes" value="${esc(c.redes)}" placeholder="@usuario"></div>
    <div class="fld"><label>Correo</label><input class="inp" id="cEmail" type="email" value="${esc(c.email)}"></div>
    <div class="fld"><label>Notas</label><input class="inp" id="cNotas" value="${esc(c.notas)}"></div>
    <div class="hint" id="cDup" style="grid-column:1/-1"></div></div>`;
}
function leerCliente(body) {
  const d = {
    nombre: $('#cNombre', body).value.trim().toUpperCase().replace(/\s+/g, ' '),
    telefono: digits($('#cTel', body).value) || null,
    telefono2: digits($('#cTel2', body).value) || null,
    origen: $('#cOrigen', body).value || null,
    redes: $('#cRedes', body).value.trim() || null,
    email: $('#cEmail', body).value.trim() || null,
    notas: $('#cNotas', body).value.trim() || null,
  };
  if (!d.nombre) throw new Error('Escribe el nombre del cliente');
  if (d.telefono && d.telefono.length !== 10) throw new Error('El teléfono debe tener 10 dígitos');
  return d;
}
function modalCliente(c, onSaved) {
  const nuevo = !c?.id;
  const m = modal({
    title: nuevo ? 'Cliente nuevo' : `Cliente #${c.numero}`,
    body: formCliente(c || {}),
    actions: [{ label: 'Cancelar', cls: 'ghost' }, {
      label: nuevo ? 'Crear cliente' : 'Guardar', onClick: async ({ body }) => {
        const d = leerCliente(body);
        if (nuevo && !d.telefono && !await ask('El cliente no tiene teléfono. ¿Guardarlo así?')) return false;
        if (nuevo && !d.origen) throw new Error('Selecciona cómo se enteró de nosotros');
        const q = nuevo ? S.sb.from('gc_clientes').insert(d).select().single() : S.sb.from('gc_clientes').update(d).eq('id', c.id).select().single();
        const { data, error } = await q;
        if (error) throw error;
        await cargarClientes();
        toast(nuevo ? `Cliente #${data.numero} creado` : 'Cliente actualizado');
        try { onSaved && onSaved(S.clientes.find(x => x.id === data.id) || data); } catch (e) { console.error(e); }
      }
    }]
  });
  const check = debounce(() => {
    const t = digits($('#cTel', m.body).value), n = norm($('#cNombre', m.body).value);
    const dup = S.clientes.filter(x => x.id !== c?.id && ((t.length >= 10 && (digits(x.telefono) === t || digits(x.telefono2) === t)) || (n.length > 5 && norm(x.nombre) === n)));
    $('#cDup', m.body).innerHTML = dup.length ? `⚠️ Ya existe: ${dup.slice(0, 3).map(x => `<a href="#" data-id="${x.id}"><b>#${x.numero} ${esc(x.nombre)}</b> (${esc(x.telefono || 's/tel')})</a>`).join(', ')} — clic para usarlo.` : '';
    $$('#cDup a', m.body).forEach(a => a.onclick = ev => { ev.preventDefault(); m.close(); onSaved && onSaved(S.clientes.find(x => x.id === +a.dataset.id)); });
  }, 300);
  if (nuevo) { $('#cTel', m.body).addEventListener('input', check); $('#cNombre', m.body).addEventListener('input', check); }
}

function modalNuevaMarca(nombre, onSaved) {
  modal({
    title: 'Agregar marca al catálogo',
    body: `<div class="grid g2"><div class="fld" style="grid-column:1/-1"><label>Marca</label><input class="inp" id="mNom" value="${esc((nombre || '').toUpperCase())}"></div>
      <div class="fld"><label>Segmento</label><select class="inp" id="mSeg">${opts(['Lujo', 'Premium', 'Deportiva', 'Moda'], 'Moda')}</select></div>
      <div class="fld"><label>&nbsp;</label><label class="check"><input type="checkbox" id="mAG"> Alta gama</label></div></div>`,
    onOpen: m => { $('#mSeg', m.body).onchange = e => { $('#mAG', m.body).checked = ['Lujo', 'Premium'].includes(e.target.value); }; },
    actions: [{ label: 'Cancelar', cls: 'ghost' }, {
      label: 'Agregar', onClick: async ({ body }) => {
        const d = { nombre: $('#mNom', body).value.trim().toUpperCase().replace(/\s+/g, ' '), segmento: $('#mSeg', body).value, alta_gama: $('#mAG', body).checked };
        if (!d.nombre) throw new Error('Escribe la marca');
        const { data, error } = await S.sb.from('gc_marcas').insert(d).select().single();
        if (error) throw /duplicate/i.test(error.message) ? new Error('Esa marca ya existe') : error;
        S.marcas.push(data); S.marcas.sort((a, b) => a.nombre.localeCompare(b.nombre));
        toast('Marca agregada');
        onSaved && onSaved(data);
      }
    }]
  });
}
const marcaInfo = nombre => S.marcas.find(m => m.nombre === String(nombre || '').trim().toUpperCase());

function calcEntrega(desde, lineas) {
  const dias = lineas.map(l => S.scat.find(c => c.id === +l.cat_id)?.dias_entrega).filter(x => x != null);
  let d = addDays(desde, dias.length ? Math.max(...dias) : +cfg('dias_entrega_default', 15));
  if (cfg('saltar_domingo', true) && dow(d) === 0) d = addDays(d, 1);
  return d;
}

// editor de líneas de servicio (recepción y edición de folio)
function lineasEditor(container, lineas, onChange, { bloqueado = false } = {}) {
  const cats = uniq(S.scat.filter(c => c.activo).map(c => c.categoria));
  const draw = () => {
    container.innerHTML = `
      <table class="lines">${lineas.map((l, i) => {
        const cat = S.scat.find(c => c.id === +l.cat_id);
        const fijo = cat?.precio_fijo && !can('descuentos');
        return `<tr><td style="width:60%">${l.cat_id ? `<b>${esc(l.nombre)}</b> <small class="muted">${esc(cat?.categoria || '')} · ${cat?.dias_entrega ?? '–'} días${fijo ? ' · precio fijo' : ''}</small>`
          : `<input class="inp" data-n="${i}" value="${esc(l.nombre)}" placeholder="Descripción del servicio">`}</td>
          <td style="width:120px"><input class="inp num" data-p="${i}" type="number" min="0" step="0.01" value="${l.precio}" ${fijo || bloqueado ? 'disabled' : ''}></td>
          <td style="width:34px"><button class="btn xs danger" data-x="${i}" ${bloqueado ? 'disabled' : ''}>×</button></td></tr>`;
      }).join('') || '<tr><td class="muted">Sin servicios todavía</td></tr>'}</table>
      <div class="row" style="margin-top:8px;align-items:center">
        <select class="inp" style="max-width:340px" data-add ${bloqueado ? 'disabled' : ''}><option value="">+ Agregar servicio del catálogo…</option>
          ${cats.map(cat => `<optgroup label="${esc(cat)}">${S.scat.filter(c => c.activo && c.categoria === cat).map(c => `<option value="${c.id}">${esc(c.nombre)} — ${c.precio ? money0(c.precio) : 'cotizar'} · ${c.dias_entrega} d</option>`).join('')}</optgroup>`).join('')}
        </select>
        <button class="btn sm ghost" data-libre ${bloqueado ? 'disabled' : ''}>+ Otro (texto libre)</button>
      </div>`;
    $('[data-add]', container).onchange = e => {
      const c = S.scat.find(x => x.id === +e.target.value); if (!c) return;
      lineas.push({ cat_id: c.id, nombre: c.nombre, precio: +c.precio }); draw(); onChange();
    };
    $('[data-libre]', container).onclick = ev => { ev.preventDefault(); lineas.push({ cat_id: null, nombre: '', precio: 0 }); draw(); onChange(); $$('input[data-n]', container).pop()?.focus(); };
    $$('[data-x]', container).forEach(b => b.onclick = ev => { ev.preventDefault(); lineas.splice(+b.dataset.x, 1); draw(); onChange(); });
    $$('[data-p]', container).forEach(inp => inp.oninput = () => { lineas[+inp.dataset.p].precio = r2(inp.value); onChange(true); });
    $$('[data-n]', container).forEach(inp => inp.oninput = () => { lineas[+inp.dataset.n].nombre = inp.value.toUpperCase(); onChange(true); });
  };
  draw();
}

// ================================================================= INICIO
V.inicio = async (el) => {
  if (!vePrecios()) {
    if (can('taller')) return V.taller(el, {});
    el.innerHTML = head(fmtLargo(hoy()), `Hola, ${S.perfil.nombre.split(' ')[0]}`) + '<div class="card empty">Usa el menú de la izquierda.</div>';
    return;
  }
  const h0 = hoy(), manana = addDays(h0, 1);
  const abiertos = await fetchAll(() => S.sb.from('gc_servicios_v')
    .select('id,folio,cliente,cliente_id,telefono,articulo,marca,servicio,estado,fecha_recepcion,fecha_entrega,avisado_en,rep,total,saldo,trabado')
    .in('estado', ESTADOS_ABIERTOS).order('folio'));
  const { count: recHoy } = await S.sb.from('gc_servicios').select('id', { count: 'exact', head: true }).eq('fecha_recepcion', h0);
  let cobradoHoy = null;
  if (can('caja') || can('cortes')) {
    const { data } = await S.sb.from('gc_pagos').select('monto').eq('fecha', h0).eq('cancelado', false);
    cobradoHoy = (data || []).reduce((a, x) => a + +x.monto, 0);
  }
  const by = e => abiertos.filter(x => x.estado === e);
  const vencidos = abiertos.filter(x => ['recibido', 'en_proceso'].includes(x.estado) && x.fecha_entrega && x.fecha_entrega < h0);
  const proximos = abiertos.filter(x => ['recibido', 'en_proceso'].includes(x.estado) && x.fecha_entrega && x.fecha_entrega >= h0 && x.fecha_entrega <= manana);
  const diasRec = +cfg('dias_recoger', 60);
  const sinRecoger = by('avisado').map(x => ({ ...x, dias: diffDays(h0, x.avisado_en || x.fecha_entrega || x.fecha_recepcion) })).sort((a, b) => b.dias - a.dias);
  const tile = (k, v, s, est, alert) => `<div class="tile link${alert ? ' alert' : ''}" data-est="${est || ''}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s || ''}</div></div>`;
  const mini = (rows, extra) => rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>No.</th><th>Cliente</th><th>Artículo</th><th>Entrega</th>${extra ? `<th>${extra.h}</th>` : ''}</tr></thead><tbody>
    ${rows.slice(0, 40).map(r => `<tr class="click est-${r.estado}" data-f="${r.folio}"><td><b>${r.folio}</b></td><td>${esc(r.cliente)}</td><td>${esc(r.articulo || '')} ${esc(r.marca || '')}</td><td>${fmtD(r.fecha_entrega)}</td>${extra ? `<td>${extra.td(r)}</td>` : ''}</tr>`).join('')}</tbody></table></div>`
    : '<div class="empty">Nada pendiente 👌</div>';

  el.innerHTML = head(fmtLargo(h0), `Hola, ${S.perfil.nombre.split(' ')[0]}`, can('recepcion') ? `<button class="btn gold" id="bNueva">${svg('recepcion')} Nueva recepción</button>` : '') + `
    <div class="tiles">
      ${tile('Recibidos hoy', recHoy ?? 0, 'folios capturados', '')}
      ${tile('Por aprobar', by('recibido').length, 'cotización enviada / pendiente', 'recibido')}
      ${tile('En proceso', by('en_proceso').length, 'en taller', 'en_proceso')}
      ${tile('Listos', by('listo').length, 'falta avisar al cliente', 'listo')}
      ${tile('Avisados', by('avisado').length, 'pendientes de recoger', 'avisado')}
      ${tile('Vencidos', vencidos.length, 'fecha de entrega ya pasó', 'vencidos', vencidos.length > 0)}
      ${tile('Trabados', abiertos.filter(x => x.trabado).length, 'detenidos en taller', 'trabados', abiertos.some(x => x.trabado))}
      ${cobradoHoy !== null ? tile('Cobrado hoy', money0(cobradoHoy), 'todas las formas de pago', '') : ''}
    </div>
    <div class="grid g2">
      <div class="card"><div class="card-head"><h3>Listos · avisar al cliente</h3></div>${mini(by('listo'), { h: 'Aviso', td: r => r.telefono ? `<a class="btn xs gold" target="_blank" rel="noopener" data-avisar="${r.id}" href="${waLink(r.telefono, `Hola ${r.cliente.split(' ')[0]}, te saluda Golden Clean Solutions. Tu servicio folio ${r.folio} (${[r.articulo, r.marca].filter(Boolean).join(' ')}) ya está listo para recoger. ¡Te esperamos!`)}">WhatsApp</a>` : '<span class="muted">sin tel.</span>' })}</div>
      <div class="card"><div class="card-head"><h3>Entregas de hoy y mañana</h3></div>${mini(proximos)}</div>
      <div class="card"><div class="card-head"><h3>Vencidos</h3></div>${mini(vencidos)}</div>
      <div class="card"><div class="card-head"><h3>Avisados sin recoger</h3><span class="hint">Aviso: ${diasRec} días para recoger</span></div>${mini(sinRecoger, { h: 'Días', td: r => `<b class="${r.dias >= diasRec ? 'down' : ''}">${r.dias}</b>` })}</div>
    </div>`;
  $('#bNueva') && ($('#bNueva').onclick = () => go('recepcion'));
  $$('.tile.link', el).forEach(t => t.onclick = () => { if (t.dataset.est) go('control', { estado: t.dataset.est }); });
  $$('tr[data-f]', el).forEach(tr => tr.onclick = ev => { if (ev.target.closest('a')) return; editarFolio(+tr.dataset.f); });
  $$('[data-avisar]', el).forEach(a => a.addEventListener('click', async () => {
    if (!(can('control') || can('notas') || can('recepcion'))) return;
    setTimeout(async () => {
      if (await ask('¿Marcar este folio como <b>AVISADO</b>?', 'Sí, avisado')) {
        const { error } = await S.sb.from('gc_servicios').update({ estado: 'avisado' }).eq('id', +a.dataset.avisar);
        if (error) fail(error); else { toast('Marcado como avisado'); route(); }
      }
    }, 400);
  }));
};

// ================================================================= RECEPCIÓN
const nuevoItem = () => ({ articulo: '', marca: '', alta_gama: false, corte: [], color: [], talla: '', lineas: [], rep: '', observaciones: '', desc_pct: 0, fecha_entrega: '' });
let R = null;
const resetR = () => { R = { cliente: null, frec: hoy(), hora: cfg('hora_entrega_default', '5:30 PM'), obs: '', items: [nuevoItem()], anticipo: 0, forma: 'efectivo', cuenta: '' }; };

V.recepcion = async (el, params) => {
  if (!R) resetR();
  if (params.cliente) { const c = S.clientes.find(x => x.id === +params.cliente); if (c) R.cliente = c; }
  el.innerHTML = head('Recepción de servicios', 'Nueva recepción', `<button class="btn ghost" id="bLimpiar">Limpiar</button>`) + `
  <div class="rec-layout">
    <div>
      <div class="card"><div class="card-head"><h3>Cliente</h3><button class="btn sm gold" id="bCliNuevo">+ Cliente nuevo</button></div><div id="cliArea"></div></div>
      <div class="card"><h3>Datos de la orden</h3>
        <div class="grid g3">
          <div class="fld"><label>Fecha de recepción</label><input class="inp" type="date" id="rFrec" value="${R.frec}" ${can('fechas') ? '' : 'disabled'}></div>
          <div class="fld"><label>Hora de entrega</label><input class="inp" id="rHora" value="${esc(R.hora)}" list="dlHoras"><datalist id="dlHoras">${['11:00 AM', '1:00 PM', '3:00 PM', '5:30 PM', '7:00 PM'].map(x => `<option value="${x}">`).join('')}</datalist></div>
          <div class="fld"><label>Observaciones generales (salen en la nota)</label><input class="inp" id="rObs" value="${esc(R.obs)}"></div>
        </div></div>
      <div id="itemsArea"></div>
      <button class="btn ghost" id="bAddItem">+ Agregar otro par / prenda</button>
    </div>
    <div class="rec-side"><div class="card" id="resumen"></div></div>
  </div>`;
  $('#bLimpiar').onclick = async () => { if (await ask('¿Borrar toda la captura actual?')) { resetR(); route(); } };
  $('#bCliNuevo').onclick = () => modalCliente(null, c => { R.cliente = c; drawCliente(); drawResumen(); });
  $('#rFrec').onchange = e => { R.frec = e.target.value || hoy(); drawItems(); drawResumen(); };
  $('#rHora').oninput = e => R.hora = e.target.value;
  $('#rObs').oninput = e => R.obs = e.target.value;
  $('#bAddItem').onclick = () => { R.items.push(nuevoItem()); drawItems(); drawResumen(); $$('.item', el).pop()?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const drawCliente = () => {
    const a = $('#cliArea');
    if (R.cliente) {
      const c = R.cliente;
      a.innerHTML = `<div class="cli-box"><div><div class="nm">${esc(c.nombre)} <small class="muted">#${c.numero}</small> ${grupoBadge(c.grupo)}</div>
        <div class="hint">${esc(c.telefono || 'sin teléfono')} · ${c.visitas} visita(s) · ${c.folios} folio(s)${c.ultima ? ' · última ' + fmtD(c.ultima) : ''}${c.origen ? ' · ' + esc(c.origen) : ''}</div></div>
        <div class="row"><button class="btn sm ghost" id="bCliEdit">Editar</button><button class="btn sm ghost" id="bCliCambiar">Cambiar</button></div></div>`;
      $('#bCliCambiar').onclick = () => { R.cliente = null; drawCliente(); drawResumen(); $('#cliQ')?.focus(); };
      $('#bCliEdit').onclick = () => modalCliente(c, n => { R.cliente = n; drawCliente(); });
    } else {
      a.innerHTML = `<div><input class="inp" id="cliQ" placeholder="Buscar por nombre, teléfono o número de cliente…" autocomplete="off"></div>
        <div class="hint" style="margin-top:6px">¿No aparece? Usa <b>+ Cliente nuevo</b>.</div>`;
      buscadorClientes($('#cliQ'), c => { R.cliente = c; drawCliente(); drawResumen(); });
    }
  };

  const itemTotals = it => { const precio = r2(it.lineas.reduce((a, l) => a + (+l.precio || 0), 0)); const desc = r2(precio * (+it.desc_pct || 0) / 100); return { precio, desc, total: r2(precio - desc) }; };

  const drawItems = () => {
    const area = $('#itemsArea');
    const articulos = lista('articulo'), materiales = lista('material'), colores = lista('color'), reps = lista('rep');
    area.innerHTML = R.items.map((it, i) => {
      const t = itemTotals(it);
      const ent = it.fecha_entrega || calcEntrega(R.frec, it.lineas);
      const extraColors = it.color.filter(c => !colores.includes(c));
      return `<div class="item" data-i="${i}">
        <div class="item-head"><b>Artículo ${i + 1}</b><span class="row"><button class="btn xs ghost" data-dup>Duplicar</button>${R.items.length > 1 ? '<button class="btn xs danger" data-del>Quitar</button>' : ''}</span></div>
        <div class="item-body">
          <div class="grid g4">
            <div class="fld"><label>Tipo de artículo *</label><select class="inp" data-f="articulo">${opts(uniq([...articulos, it.articulo].filter(Boolean)), it.articulo, 'Seleccionar…')}</select></div>
            <div class="fld"><label>Marca</label><input class="inp" data-f="marca" list="dlMarcas" value="${esc(it.marca)}" placeholder="Escribe o elige…" autocomplete="off"></div>
            <div class="fld"><label>Alta gama</label><label class="check" style="min-height:36px"><input type="checkbox" data-f="alta_gama" ${it.alta_gama ? 'checked' : ''}> Sí, alta gama</label></div>
            <div class="fld"><label>Talla</label><input class="inp" data-f="talla" value="${esc(it.talla)}"></div>
          </div>
          <div class="hint" data-marcahint></div>
          <div class="fld"><label>Corte / material</label><div class="chips">${materiales.map(m => `<span class="chip${it.corte.includes(m) ? ' on' : ''}" data-chip="corte" data-v="${esc(m)}">${esc(m)}</span>`).join('')}</div></div>
          <div class="fld"><label>Color</label><div class="chips">${uniq([...colores, ...extraColors]).map(m => `<span class="chip${it.color.includes(m) ? ' on' : ''}" data-chip="color" data-v="${esc(m)}">${esc(m)}</span>`).join('')}
            <input class="inp" data-colorlibre placeholder="Otro color + Enter" style="max-width:170px;min-height:30px;padding:4px 8px"></div></div>
          <div class="fld"><label>Servicios solicitados *</label><div data-lineas></div></div>
          <div class="grid g4">
            <div class="fld"><label>REP · maestro asignado</label><select class="inp" data-f="rep">${opts(reps, it.rep, 'Sin asignar')}</select></div>
            <div class="fld"><label>Descuento %</label><input class="inp num" type="number" min="0" max="100" step="0.5" data-f="desc_pct" value="${it.desc_pct || 0}" ${can('descuentos') ? '' : 'disabled title="Requiere permiso de descuentos"'}></div>
            <div class="fld"><label>Entrega estimada</label><input class="inp" type="date" data-f="fecha_entrega" value="${ent}" ${can('fechas') ? '' : 'disabled title="Se calcula con el catálogo de servicios"'}></div>
            <div class="fld"><label>Observaciones del artículo</label><input class="inp" data-f="observaciones" value="${esc(it.observaciones)}" placeholder="manchas, desgaste, detalles…"></div>
          </div>
        </div>
        <div class="item-foot"><span>Entrega: <b data-ent>${fmtD(ent)}</b></span><span data-tot>Precio ${money(t.precio)}${t.desc ? ` · Desc. −${money(t.desc)}` : ''} · <b>Total ${money(t.total)}</b></span></div>
      </div>`;
    }).join('') + `<datalist id="dlMarcas">${S.marcas.filter(m => m.activo).map(m => `<option value="${esc(m.nombre)}">`).join('')}</datalist>`;

    $$('.item', area).forEach(card => {
      const i = +card.dataset.i, it = R.items[i];
      const refresh = () => {
        const t = itemTotals(it);
        const ent = it.fecha_entrega || calcEntrega(R.frec, it.lineas);
        $('[data-ent]', card).textContent = fmtD(ent);
        if (!it.fecha_entrega) $('[data-f=fecha_entrega]', card).value = ent;
        $('[data-tot]', card).innerHTML = `Precio ${money(t.precio)}${t.desc ? ` · Desc. −${money(t.desc)}` : ''} · <b>Total ${money(t.total)}</b>`;
        drawResumen();
      };
      const marcaHint = () => {
        const mi = marcaInfo(it.marca);
        $('[data-marcahint]', card).innerHTML = !it.marca ? '' : mi ? `${esc(mi.segmento)}${mi.alta_gama ? ' · <span class="badge b-ag">ALTA GAMA</span>' : ''}`
          : `Marca no está en el catálogo. <a href="#" data-addmarca>+ Agregar "${esc(it.marca.toUpperCase())}"</a>`;
        const add = $('[data-addmarca]', card);
        if (add) add.onclick = ev => { ev.preventDefault(); modalNuevaMarca(it.marca, m => { it.marca = m.nombre; it.alta_gama = m.alta_gama; drawItems(); }); };
      };
      marcaHint();
      $$('[data-f]', card).forEach(inp => {
        const f = inp.dataset.f;
        const ev = inp.type === 'checkbox' || inp.tagName === 'SELECT' || inp.type === 'date' ? 'change' : 'input';
        inp.addEventListener(ev, () => {
          if (inp.type === 'checkbox') it[f] = inp.checked;
          else if (f === 'desc_pct') it[f] = Math.min(100, Math.max(0, +inp.value || 0));
          else if (f === 'fecha_entrega') it[f] = inp.value === calcEntrega(R.frec, it.lineas) ? '' : inp.value;
          else it[f] = inp.value;
          if (f === 'marca') {
            const mi = marcaInfo(inp.value);
            if (mi) { it.alta_gama = mi.alta_gama; $('[data-f=alta_gama]', card).checked = mi.alta_gama; }
            marcaHint();
          }
          refresh();
        });
      });
      $$('[data-chip]', card).forEach(ch => ch.onclick = () => {
        const arr = it[ch.dataset.chip], v = ch.dataset.v, k = arr.indexOf(v);
        if (k >= 0) arr.splice(k, 1); else arr.push(v);
        ch.classList.toggle('on', k < 0);
      });
      $('[data-colorlibre]', card).onkeydown = ev => {
        if (ev.key !== 'Enter') return; ev.preventDefault();
        const v = ev.target.value.trim().toUpperCase(); if (!v) return;
        if (!it.color.includes(v)) it.color.push(v);
        drawItems();
      };
      $('[data-dup]', card).onclick = () => { R.items.splice(i + 1, 0, JSON.parse(JSON.stringify(it))); drawItems(); drawResumen(); };
      const del = $('[data-del]', card);
      if (del) del.onclick = () => { R.items.splice(i, 1); drawItems(); drawResumen(); };
      lineasEditor($('[data-lineas]', card), it.lineas, () => refresh());
    });
  };

  const drawResumen = () => {
    const tot = R.items.reduce((a, it) => { const t = itemTotals(it); return { precio: a.precio + t.precio, desc: a.desc + t.desc, total: a.total + t.total }; }, { precio: 0, desc: 0, total: 0 });
    const max = +cfg('max_folios_nota', 15);
    const cuentas = lista('cuenta');
    const r = $('#resumen');
    r.innerHTML = `<h3>Resumen</h3>
      <div class="sum-line"><span>Cliente</span><b>${R.cliente ? esc(R.cliente.nombre) : '<span class="down">falta</span>'}</b></div>
      <div class="sum-line"><span>Pares / prendas (folios)</span><b>${R.items.length}</b></div>
      ${R.items.length > max ? `<div class="hint down">Más de ${max} folios: la nota saldrá larga.</div>` : ''}
      <div class="sum-line"><span>Precio</span><span class="num">${money(tot.precio)}</span></div>
      ${tot.desc ? `<div class="sum-line"><span>Descuentos</span><span class="num">−${money(tot.desc)}</span></div>` : ''}
      <div class="sum-line big"><span>Total</span><span class="num">${money(tot.total)}</span></div>
      <div class="sep"></div>
      <div class="fld"><label>Anticipo recibido</label><input class="inp num" type="number" min="0" step="0.01" id="rAnt" value="${R.anticipo || ''}" placeholder="0.00"></div>
      <div class="grid g2" style="margin-top:8px">
        <div class="fld"><label>Forma</label><select class="inp" id="rForma">${opts(FORMAS.map(f => ({ v: f.id, l: f.l })), R.forma)}</select></div>
        <div class="fld"><label>Cuenta</label><select class="inp" id="rCuenta">${opts(cuentas, R.cuenta || cuentaDefault(R.forma))}</select></div>
      </div>
      <div class="sum-line"><span>Saldo al entregar</span><b class="num">${money(Math.max(0, tot.total - (+R.anticipo || 0)))}</b></div>
      <button class="btn gold" id="bGuardar" style="width:100%;margin-top:12px">Guardar y asignar folios</button>
      <div class="hint" style="margin-top:8px">Los números de folio se asignan en automático al guardar (uno por par / prenda).</div>`;
    $('#rAnt').oninput = e => { R.anticipo = r2(e.target.value); $$('.sum-line b.num', r).pop().textContent = money(Math.max(0, tot.total - (+R.anticipo || 0))); };
    $('#rForma').onchange = e => { R.forma = e.target.value; R.cuenta = cuentaDefault(R.forma); $('#rCuenta').value = R.cuenta; };
    $('#rCuenta').onchange = e => R.cuenta = e.target.value;
    $('#bGuardar').onclick = guardar;
  };

  const guardar = async () => {
    if (!R.cliente) return toast('Selecciona o crea el cliente', true);
    for (const [i, it] of R.items.entries()) {
      if (!it.articulo) return toast(`Artículo ${i + 1}: falta el tipo de artículo`, true);
      if (!it.lineas.length) return toast(`Artículo ${i + 1}: agrega al menos un servicio`, true);
      if (it.lineas.some(l => !String(l.nombre).trim())) return toast(`Artículo ${i + 1}: hay un servicio sin descripción`, true);
    }
    const sinPrecio = R.items.some(it => it.lineas.some(l => !(+l.precio > 0)));
    if (sinPrecio && !await ask('Hay servicios con precio $0 (por cotizar). ¿Guardar de todos modos?', 'Guardar')) return;
    const payload = {
      cliente_id: R.cliente.id, fecha_recepcion: R.frec, hora_entrega: R.hora, observaciones: R.obs,
      anticipo: +R.anticipo || 0, anticipo_forma: R.forma, anticipo_cuenta: R.cuenta || cuentaDefault(R.forma),
      items: R.items.map(it => ({
        articulo: it.articulo, marca: it.marca, alta_gama: it.alta_gama, corte: it.corte.join('-'), color: it.color.join('-'),
        talla: it.talla, rep: it.rep, observaciones: it.observaciones, desc_pct: it.desc_pct || 0,
        fecha_entrega: it.fecha_entrega || '', lineas: it.lineas.map(l => ({ cat_id: l.cat_id, nombre: l.nombre, precio: +l.precio || 0 }))
      }))
    };
    const b = $('#bGuardar'); b.disabled = true; b.textContent = 'Guardando…';
    try {
      const { data, error } = await S.sb.rpc('gc_crear_recepcion', { p: payload });
      if (error) throw error;
      const folios = data.folios;
      const rango = folios.length > 1 ? `${folios[0]} AL ${folios[folios.length - 1]}` : `${folios[0]}`;
      const cli = R.cliente;
      resetR();
      cargarClientes().catch(() => {});
      modal({
        title: 'Recepción guardada',
        body: `<p style="font-size:15px;margin:0 0 6px">Cliente: <b>${esc(cli.nombre)}</b></p><p style="font-family:var(--serif);font-size:30px;color:var(--forest);margin:6px 0">Folio${folios.length > 1 ? 's' : ''} ${rango}</p>
          <p class="hint">Siguiente paso: genera la nota para enviarla al cliente y las etiquetas para cada artículo.</p>`,
        actions: [
          { label: 'Nueva recepción', cls: 'ghost', onClick: () => route() },
          ...(can('etiquetas') ? [{ label: 'Imprimir etiquetas', cls: 'ghost', onClick: () => go('etiquetas', { folios: folios.join(',') }) }] : []),
          ...(can('notas') ? [{ label: 'Ver nota', cls: 'gold', onClick: () => go('notas', { folios: folios.join(',') }) }] : []),
        ]
      });
      route();
    } catch (e) { fail(e); b.disabled = false; b.textContent = 'Guardar y asignar folios'; }
  };

  drawCliente(); drawItems(); drawResumen();
};
const cuentaDefault = forma => forma === 'tarjeta' ? cfg('cuenta_tarjeta', 'CLIP-SCOTIA') : forma === 'transferencia' ? cfg('cuenta_transferencia', 'BBVA-SCOTIA') : 'CAJA';

// ================================================================= CONTROL DE SERVICIOS
const C = { q: '', estados: [...ESTADOS_ABIERTOS], rep: '', desde: '', hasta: '', saldo: false, vencidos: false, trabados: false, limit: 300, sel: new Map() };

V.control = async (el, params) => {
  if (params.estado) {
    if (params.estado === 'vencidos') { C.estados = ['recibido', 'en_proceso']; C.vencidos = true; }
    else if (params.estado === 'trabados') { C.estados = [...ESTADOS_ABIERTOS]; C.trabados = true; C.vencidos = false; }
    else { C.estados = [params.estado]; C.vencidos = false; C.trabados = false; }
  }
  if (params.q) C.q = params.q;
  C.sel.clear();
  el.innerHTML = head('Control de servicios', 'Folios', `<button class="btn ghost" id="bXls">${svg('xls')} Excel</button>${can('recepcion') ? `<button class="btn gold" id="bNueva">+ Recepción</button>` : ''}`) + `
    <div class="card">
      <div class="row">
        <div class="fld" style="flex:1;min-width:220px"><label>Buscar</label><input class="inp" id="fQ" value="${esc(C.q)}" placeholder="Folio, cliente, teléfono, marca, servicio…"></div>
        <div class="fld"><label>REP</label><select class="inp" id="fRep">${opts(lista('rep'), C.rep, 'Todos')}</select></div>
        <div class="fld"><label>Recepción desde</label><input class="inp" type="date" id="fDesde" value="${C.desde}"></div>
        <div class="fld"><label>hasta</label><input class="inp" type="date" id="fHasta" value="${C.hasta}"></div>
        <label class="check" style="min-height:36px"><input type="checkbox" id="fSaldo" ${C.saldo ? 'checked' : ''}> Con saldo</label>
        <label class="check" style="min-height:36px"><input type="checkbox" id="fVenc" ${C.vencidos ? 'checked' : ''}> Vencidos</label>
        <label class="check" style="min-height:36px"><input type="checkbox" id="fTrab" ${C.trabados ? 'checked' : ''}> Trabados</label>
      </div>
      <div class="chips" style="margin-top:10px" id="fEst">${Object.entries(ESTADOS).map(([k, v]) => `<span class="chip${C.estados.includes(k) ? ' on' : ''}" data-e="${k}"><span class="dot ${k}"></span>${v.l}</span>`).join('')}
        <span class="chip" data-e="*">Todos</span><span class="chip" data-e="abiertos">Solo abiertos</span></div>
    </div>
    <div class="card" id="selBar" style="display:none;position:sticky;top:0;z-index:5"></div>
    <div id="tabla"><div class="loading">Cargando…</div></div>`;
  $('#bNueva') && ($('#bNueva').onclick = () => go('recepcion'));
  const reload = () => { C.limit = 300; cargar(); };
  $('#fQ').oninput = debounce(e => { C.q = e.target.value; reload(); }, 350);
  $('#fRep').onchange = e => { C.rep = e.target.value; reload(); };
  $('#fDesde').onchange = e => { C.desde = e.target.value; reload(); };
  $('#fHasta').onchange = e => { C.hasta = e.target.value; reload(); };
  $('#fSaldo').onchange = e => { C.saldo = e.target.checked; reload(); };
  $('#fVenc').onchange = e => { C.vencidos = e.target.checked; reload(); };
  $('#fTrab').onchange = e => { C.trabados = e.target.checked; reload(); };
  $$('#fEst .chip').forEach(ch => ch.onclick = () => {
    const e = ch.dataset.e;
    if (e === '*') C.estados = Object.keys(ESTADOS);
    else if (e === 'abiertos') C.estados = [...ESTADOS_ABIERTOS];
    else { const k = C.estados.indexOf(e); if (k >= 0) C.estados.splice(k, 1); else C.estados.push(e); }
    $$('#fEst .chip[data-e]').forEach(c => c.classList.toggle('on', C.estados.includes(c.dataset.e)));
    reload();
  });
  let rows = [];
  const cargar = async () => {
    $('#tabla').innerHTML = '<div class="loading">Cargando…</div>';
    let q = S.sb.from('gc_servicios_v').select('*').order('folio', { ascending: false }).limit(C.limit);
    if (C.estados.length && C.estados.length < 6) q = q.in('estado', C.estados);
    const t = cleanQ(C.q);
    if (t) {
      if (/^\d+$/.test(t)) q = t.length >= 7 ? q.ilike('telefono', `%${t}%`) : q.eq('folio', +t);
      else if (/^\d+\s*-\s*\d+$/.test(t)) { const [a, b] = t.split('-').map(x => +x.trim()); q = q.gte('folio', Math.min(a, b)).lte('folio', Math.max(a, b)); }
      else q = q.or(`cliente.ilike.%${t}%,marca.ilike.%${t}%,servicio.ilike.%${t}%,articulo.ilike.%${t}%,color.ilike.%${t}%`);
    }
    if (C.rep) q = q.eq('rep', C.rep);
    if (C.desde) q = q.gte('fecha_recepcion', C.desde);
    if (C.hasta) q = q.lte('fecha_recepcion', C.hasta);
    if (C.vencidos) q = q.lt('fecha_entrega', hoy());
    if (C.trabados) q = q.eq('trabado', true);
    const { data, error } = await q;
    if (error) throw error;
    rows = data.filter(r => !C.saldo || +r.saldo > 0.009);
    dibujar();
  };
  const dibujar = () => {
    const h0 = hoy();
    const tot = rows.reduce((a, r) => ({ total: a.total + +r.total, pagado: a.pagado + +r.pagado, saldo: a.saldo + Math.max(0, +r.saldo) }), { total: 0, pagado: 0, saldo: 0 });
    $('#tabla').innerHTML = rows.length ? `<div class="tbl-wrap" style="max-height:70vh"><table class="tbl"><thead><tr>
      <th><input type="checkbox" id="selAll"></th><th>No.</th><th>F. recep.</th><th>F. entrega</th><th>Cliente</th><th>REP</th><th>Artículo</th><th>Marca</th><th>Corte</th><th>Color</th><th>Servicio</th><th class="num">Total</th><th class="num">Saldo</th><th>Estado</th></tr></thead>
      <tbody>${rows.map(r => `<tr class="click est-${r.estado}" data-id="${r.id}">
        <td><input type="checkbox" data-sel="${r.id}" ${C.sel.has(r.id) ? 'checked' : ''}></td>
        <td><b>${r.folio}</b></td><td class="nw">${fmtD(r.fecha_recepcion)}</td>
        <td class="nw">${fmtD(r.fecha_entrega)}${r.fecha_entrega && r.fecha_entrega < h0 && ['recibido', 'en_proceso'].includes(r.estado) ? ' ⚠️' : ''}</td>
        <td>${esc(r.cliente)}</td><td>${esc(r.rep || '')}</td><td>${esc(r.articulo || '')}</td>
        <td>${esc(r.marca || '')}${r.alta_gama ? ' <span class="badge b-ag">AG</span>' : ''}</td><td>${esc(r.corte || '')}</td><td>${esc(r.color || '')}</td>
        <td class="wrap srv">${esc(r.servicio || '')}</td>
        <td class="num">${money(r.total)}${+r.desc_monto ? `<br><small>−${+r.desc_pct}%</small>` : ''}</td>
        <td class="num">${+r.saldo > 0.009 ? money(r.saldo) : '<small>pagado</small>'}</td>
        <td class="nw">${r.trabado ? `<span class="badge" style="background:#FDE2DE;color:#9B2C1F" title="${esc(r.trabado_motivo || '')}">⛔ Trabado</span><br>` : ''}<select class="est-sel" data-est="${r.id}">${Object.entries(ESTADOS).map(([k, v]) => `<option value="${k}"${k === r.estado ? ' selected' : ''}>${v.s}</option>`).join('')}</select></td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="11">${rows.length} folio(s)${rows.length >= C.limit ? ` · mostrando los ${C.limit} más recientes` : ''}</td><td class="num">${money(tot.total)}</td><td class="num">${money(tot.saldo)}</td><td></td></tr></tfoot></table></div>
      ${rows.length >= C.limit ? '<div style="text-align:center;margin-top:10px"><button class="btn ghost" id="bMas">Mostrar más</button></div>' : ''}`
      : '<div class="card empty">No hay folios con esos filtros.</div>';
    $('#bMas') && ($('#bMas').onclick = () => { C.limit += 300; cargar(); });
    $$('tr[data-id]').forEach(tr => tr.onclick = ev => {
      if (ev.target.closest('input,select,a,button')) return;
      editarFolio(+rows.find(r => r.id === +tr.dataset.id).folio, () => cargar());
    });
    $$('[data-sel]').forEach(cb => cb.onchange = () => { const r = rows.find(x => x.id === +cb.dataset.sel); if (cb.checked) C.sel.set(r.id, r); else C.sel.delete(r.id); barra(); });
    $('#selAll') && ($('#selAll').onchange = e => { rows.forEach(r => e.target.checked ? C.sel.set(r.id, r) : C.sel.delete(r.id)); $$('[data-sel]').forEach(cb => cb.checked = e.target.checked); barra(); });
    $$('[data-est]').forEach(s => s.onchange = async () => {
      const r = rows.find(x => x.id === +s.dataset.est);
      const nuevo = s.value;
      try {
        const { error } = await S.sb.from('gc_servicios').update({ estado: nuevo }).eq('id', r.id);
        if (error) throw error;
        r.estado = nuevo; s.closest('tr').className = `click est-${nuevo}`;
        toast(`Folio ${r.folio}: ${ESTADOS[nuevo].l}`);
      } catch (e) { s.value = r.estado; fail(e); }
    });
    barra();
  };
  const barra = () => {
    const bar = $('#selBar'); const sel = [...C.sel.values()];
    if (!sel.length) { bar.style.display = 'none'; return; }
    const clientes = uniq(sel.map(r => r.cliente_id));
    const folios = sel.map(r => r.folio).sort((a, b) => a - b);
    bar.style.display = 'block';
    bar.innerHTML = `<div class="row" style="align-items:center"><b>${sel.length} seleccionado(s)</b>
      ${can('notas') ? `<button class="btn sm gold" id="sNota" ${clientes.length > 1 ? 'disabled title="Selecciona folios de un solo cliente"' : ''}>Nota</button>` : ''}
      ${can('etiquetas') ? '<button class="btn sm ghost" id="sEtq">Etiquetas</button>' : ''}
      ${can('caja') ? `<button class="btn sm ghost" id="sCobrar" ${clientes.length > 1 ? 'disabled' : ''}>Cobrar</button>` : ''}
      <select class="inp" id="sEstado" style="max-width:190px"><option value="">Cambiar estado a…</option>${Object.entries(ESTADOS).map(([k, v]) => `<option value="${k}">${v.l}</option>`).join('')}</select>
      <select class="inp" id="sRep" style="max-width:170px"><option value="">Asignar REP…</option>${opts(lista('rep'))}</select>
      <button class="btn sm ghost" id="sClear">Quitar selección</button></div>`;
    $('#sNota') && ($('#sNota').onclick = () => go('notas', { folios: folios.join(',') }));
    $('#sEtq') && ($('#sEtq').onclick = () => go('etiquetas', { folios: folios.join(',') }));
    $('#sCobrar') && ($('#sCobrar').onclick = () => go('caja', { folios: folios.join(',') }));
    $('#sClear').onclick = () => { C.sel.clear(); dibujar(); };
    const masivo = async (campo, valor, texto) => {
      if (!valor) return;
      if (!await ask(`¿${texto} en ${sel.length} folio(s)?`)) return;
      const { error } = await S.sb.from('gc_servicios').update({ [campo]: valor }).in('id', sel.map(r => r.id));
      if (error) return fail(error);
      toast('Actualizado'); C.sel.clear(); cargar();
    };
    $('#sEstado').onchange = e => masivo('estado', e.target.value, `Cambiar estado a <b>${ESTADOS[e.target.value]?.l}</b>`);
    $('#sRep').onchange = e => masivo('rep', e.target.value, `Asignar REP <b>${esc(e.target.value)}</b>`);
  };
  $('#bXls').onclick = () => XL.save(`Control_servicios_${hoy()}.xlsx`, wb => {
    XL.table(wb.addWorksheet('Control de servicios'), [
      { h: 'No. SERVICIO', k: 'folio', w: 10 }, { h: 'FECHA RECEPCION', get: r => fmtD(r.fecha_recepcion), w: 12 }, { h: 'FECHA ENTREGA', get: r => fmtD(r.fecha_entrega), w: 12 },
      { h: 'No. CLIENTE', k: 'cliente_num', w: 9 }, { h: 'CLIENTE', k: 'cliente', w: 28 }, { h: 'TELEFONO', k: 'telefono', w: 14 }, { h: 'REP.', k: 'rep', w: 10 },
      { h: 'MODELO', k: 'articulo', w: 12 }, { h: 'MARCA', k: 'marca', w: 18 }, { h: 'ALTA GAMA', get: r => r.alta_gama ? 'SÍ' : '', w: 8 }, { h: 'CORTE', k: 'corte', w: 14 },
      { h: 'COLOR', k: 'color', w: 14 }, { h: 'SERVICIO', k: 'servicio', w: 45 }, { h: 'PRECIO', k: 'precio', money: true }, { h: '%', k: 'desc_pct', w: 6 },
      { h: 'DESC.', k: 'desc_monto', money: true }, { h: 'TOTAL', k: 'total', money: true }, { h: 'PAGADO', k: 'pagado', money: true }, { h: 'SALDO', k: 'saldo', money: true },
      { h: 'STATUS', get: r => ESTADOS[r.estado].l, w: 20 }, { h: 'OBSERVACIONES', k: 'observaciones', w: 40 },
    ], rows);
  }).catch(fail);
  await cargar();
};

// ---------------------------------------------------------------- editar folio (modal)
async function editarFolio(folio, onSaved) {
  const { data: r, error } = await S.sb.from('gc_servicios_v').select('*').eq('folio', folio).single();
  if (error) return fail(error);
  const [{ data: lin }, { data: pagos }] = await Promise.all([
    S.sb.from('gc_servicio_lineas').select('*').eq('servicio_id', r.id).order('orden').order('id'),
    S.sb.from('gc_pagos_v').select('*').eq('servicio_id', r.id).order('fecha'),
  ]);
  let bit = [];
  if (isMaster()) { const { data } = await S.sb.from('gc_bitacora').select('*').eq('tabla', 'servicios').eq('registro', String(folio)).order('cuando', { ascending: false }).limit(30); bit = data || []; }
  const lineas = (lin || []).map(l => ({ cat_id: l.cat_id, nombre: l.nombre, precio: +l.precio }));
  const lineasOrig = JSON.stringify(lineas);
  const puedeEditar = can('control') || can('recepcion');
  const bloqueoPrecio = r.estado !== 'recibido' && !can('descuentos');
  const m = modal({
    title: `Folio ${r.folio} · ${r.cliente}`, wide: true,
    body: `<div class="grid g4">
      <div class="fld"><label>Estado</label><select class="inp" id="eEst">${opts(Object.entries(ESTADOS).map(([k, v]) => ({ v: k, l: v.l })), r.estado)}</select></div>
      <div class="fld"><label>REP</label><select class="inp" id="eRep">${opts(uniq([...lista('rep'), r.rep].filter(Boolean)), r.rep, 'Sin asignar')}</select></div>
      <div class="fld"><label>Fecha recepción</label><input class="inp" type="date" id="eFrec" value="${r.fecha_recepcion || ''}" ${can('fechas') ? '' : 'disabled'}></div>
      <div class="fld"><label>Fecha entrega</label><input class="inp" type="date" id="eFent" value="${r.fecha_entrega || ''}" ${can('fechas') ? '' : 'disabled title="Solo con permiso de fechas"'}></div>
      <div class="fld"><label>Artículo</label><select class="inp" id="eArt">${opts(uniq([...lista('articulo'), r.articulo].filter(Boolean)), r.articulo, '—')}</select></div>
      <div class="fld"><label>Marca</label><input class="inp" id="eMarca" list="dlMarcasE" value="${esc(r.marca)}"><datalist id="dlMarcasE">${S.marcas.map(x => `<option value="${esc(x.nombre)}">`).join('')}</datalist></div>
      <div class="fld"><label>Alta gama</label><label class="check" style="min-height:36px"><input type="checkbox" id="eAG" ${r.alta_gama ? 'checked' : ''}> Sí</label></div>
      <div class="fld"><label>Talla</label><input class="inp" id="eTalla" value="${esc(r.talla)}"></div>
      <div class="fld"><label>Corte</label><input class="inp" id="eCorte" value="${esc(r.corte)}"></div>
      <div class="fld"><label>Color</label><input class="inp" id="eColor" value="${esc(r.color)}"></div>
      <div class="fld"><label>Descuento %</label><input class="inp num" type="number" id="ePct" min="0" max="100" step="0.5" value="${+r.desc_pct}" ${can('descuentos') ? '' : 'disabled'}></div>
      <div class="fld"><label>Cliente</label><div style="min-height:36px;display:flex;align-items:center">#${r.cliente_num} · ${esc(r.telefono || 's/tel')}</div></div>
      </div>
      <div class="fld" style="margin-top:12px"><label>Servicios ${bloqueoPrecio ? '<span class="muted">(precio aprobado: solo con permiso de descuentos)</span>' : ''}</label><div id="eLineas"></div></div>
      <div class="fld" style="margin-top:12px"><label>Observaciones</label><textarea class="inp" id="eObs">${esc(r.observaciones)}</textarea></div>
      <div class="row" style="margin-top:10px;align-items:center"><label class="check"><input type="checkbox" id="eTrab" ${r.trabado ? 'checked' : ''}> ⛔ Trabado</label>
        <input class="inp" id="eTrabM" style="flex:1" placeholder="Motivo por el que está trabado" value="${esc(r.trabado_motivo)}">${r.trabado_desde ? `<span class="hint">desde ${fmtD(r.trabado_desde)}</span>` : ''}</div>
      ${r.notas_taller ? `<div class="fld" style="margin-top:10px"><label>Bitácora del taller</label><div style="white-space:pre-line;font-size:13px;border:1px solid var(--line);border-radius:8px;padding:8px;max-height:140px;overflow:auto">${esc(r.notas_taller)}</div></div>` : ''}
      <div class="grid g4" style="margin-top:12px">
        <div class="tile"><div class="k">Precio</div><div class="v" style="font-size:22px" id="ePrecio">${money(r.precio)}</div></div>
        <div class="tile"><div class="k">Total</div><div class="v" style="font-size:22px" id="eTotal">${money(r.total)}</div></div>
        <div class="tile"><div class="k">Pagado</div><div class="v" style="font-size:22px">${money(r.pagado)}</div></div>
        <div class="tile"><div class="k">Saldo</div><div class="v" style="font-size:22px">${money(r.saldo)}</div></div>
      </div>
      <h3 style="margin:16px 0 8px;font-size:16px">Pagos</h3>
      ${(pagos || []).length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Tipo</th><th>Forma</th><th>Cuenta</th><th class="num">Monto</th><th>Registró</th><th></th></tr></thead><tbody>
        ${pagos.map(p => `<tr class="${p.cancelado ? 'est-cancelado' : ''}"><td>${fmtD(p.fecha)}</td><td>${esc(p.tipo)}</td><td>${esc(p.forma)}</td><td>${esc(p.cuenta || '')}</td><td class="num">${money(p.monto)}</td><td>${esc(p.registro || (p.legado ? 'Excel' : ''))}</td>
          <td>${p.cancelado ? `<small>cancelado${p.cancelado_motivo ? ': ' + esc(p.cancelado_motivo) : ''}</small>` : can('cancelar') ? `<button class="btn xs danger" data-cp="${p.id}">Cancelar</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="hint">Sin pagos registrados.</div>'}
      ${bit.length ? `<h3 style="margin:16px 0 8px;font-size:16px">Historial de cambios</h3><div class="tbl-wrap" style="max-height:220px"><table class="tbl"><tbody>${bit.map(b => `<tr><td>${new Date(b.cuando).toLocaleString('es-MX')}</td><td>${esc(b.usuario_nombre || '')}</td><td class="wrap">${esc(resumenCambios(b.detalle))}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="hint" style="margin-top:10px">Capturado ${r.legado ? 'desde el Excel' : new Date(r.creado).toLocaleString('es-MX')}${r.avisado_en ? ` · avisado ${fmtD(r.avisado_en)}` : ''}${r.entregado_en ? ` · entregado ${fmtD(r.entregado_en)}` : ''}</div>`,
    actions: [
      { label: 'Cerrar', cls: 'ghost' },
      ...(can('notas') ? [{ label: 'Nota del cliente', cls: 'ghost', onClick: () => go('notas', { cliente: r.cliente_id, folios: r.folio }) }] : []),
      ...(can('etiquetas') ? [{ label: 'Etiqueta', cls: 'ghost', onClick: () => go('etiquetas', { folios: r.folio }) }] : []),
      ...(can('caja') && +r.saldo > 0.009 && r.estado !== 'cancelado' ? [{ label: 'Cobrar', cls: 'ghost', onClick: () => go('caja', { folios: r.folio }) }] : []),
      ...(puedeEditar ? [{
        label: 'Guardar cambios', cls: 'gold', onClick: async ({ body }) => {
          const upd = {};
          const set = (k, v) => { if ((v ?? null) !== (r[k] ?? null)) upd[k] = v; };
          set('estado', $('#eEst', body).value);
          set('rep', $('#eRep', body).value || null);
          set('articulo', $('#eArt', body).value || null);
          set('marca', $('#eMarca', body).value.trim().toUpperCase() || null);
          if ($('#eAG', body).checked !== r.alta_gama) upd.alta_gama = $('#eAG', body).checked;
          set('talla', $('#eTalla', body).value.trim() || null);
          set('corte', $('#eCorte', body).value.trim().toUpperCase() || null);
          set('color', $('#eColor', body).value.trim().toUpperCase() || null);
          set('observaciones', $('#eObs', body).value.trim() || null);
          const trab = $('#eTrab', body).checked, trabM = $('#eTrabM', body).value.trim() || null;
          if (trab && !trabM) throw new Error('Escribe el motivo por el que está trabado');
          if (trab !== !!r.trabado) upd.trabado = trab;
          if (trab) set('trabado_motivo', trabM);
          if (can('fechas')) { set('fecha_recepcion', $('#eFrec', body).value || null); set('fecha_entrega', $('#eFent', body).value || null); }
          const lineasCambian = JSON.stringify(lineas) !== lineasOrig;
          if (lineasCambian) {
            if (!lineas.length) throw new Error('El folio debe tener al menos un servicio');
            const { error: e1 } = await S.sb.rpc('gc_guardar_lineas', { p_servicio_id: r.id, p_lineas: lineas });
            if (e1) throw e1;
          }
          const pct = +$('#ePct', body).value || 0;
          if (can('descuentos') && (pct !== +r.desc_pct || lineasCambian)) {
            const precio = lineasCambian ? r2(lineas.reduce((a, l) => a + (+l.precio || 0), 0)) : +r.precio;
            upd.desc_pct = pct; upd.desc_monto = r2(precio * pct / 100);
          }
          if (Object.keys(upd).length) {
            const { error: e2 } = await S.sb.from('gc_servicios').update(upd).eq('id', r.id);
            if (e2) throw e2;
          }
          toast(`Folio ${r.folio} guardado`);
          onSaved ? onSaved() : (S.view === 'inicio' && route());
        }
      }] : []),
    ]
  });
  lineasEditor($('#eLineas', m.body), lineas, () => {
    const p = r2(lineas.reduce((a, l) => a + (+l.precio || 0), 0));
    const pct = +$('#ePct', m.body).value || 0;
    $('#ePrecio', m.body).textContent = money(p);
    $('#eTotal', m.body).textContent = money(p - r2(p * pct / 100));
  }, { bloqueado: bloqueoPrecio || !puedeEditar });
  $('#ePct', m.body).oninput = () => { const p = r2(lineas.reduce((a, l) => a + (+l.precio || 0), 0)); $('#eTotal', m.body).textContent = money(p - r2(p * (+$('#ePct', m.body).value || 0) / 100)); };
  $('#eMarca', m.body).onchange = e => { const mi = marcaInfo(e.target.value); if (mi) $('#eAG', m.body).checked = mi.alta_gama; };
  $$('[data-cp]', m.body).forEach(b => b.onclick = async () => {
    const motivo = await prompt2('Cancelar pago', 'Motivo de la cancelación');
    if (motivo === null) return;
    const { error } = await S.sb.from('gc_pagos').update({ cancelado: true, cancelado_motivo: motivo || null }).eq('id', +b.dataset.cp);
    if (error) return fail(error);
    toast('Pago cancelado'); m.close(); editarFolio(folio, onSaved);
  });
}
function resumenCambios(d) {
  if (!d) return '';
  const nombres = { estado: 'estado', fecha_entrega: 'entrega', fecha_recepcion: 'recepción', precio: 'precio', desc_pct: 'desc %', desc_monto: 'desc $', rep: 'REP', servicio: 'servicio', marca: 'marca', observaciones: 'obs.' };
  return Object.entries(d).filter(([k]) => !['avisado_en', 'entregado_en'].includes(k))
    .map(([k, v]) => `${nombres[k] || k}: ${v?.antes ?? '—'} → ${v?.despues ?? '—'}`).join(' · ');
}

// ================================================================= CLIENTES
const CL = { q: '', grupo: '' };
V.clientes = async (el) => {
  await cargarClientes();
  el.innerHTML = head('Catálogo', 'Clientes', `<button class="btn ghost" id="bXls">${svg('xls')} Excel</button>${can('clientes') || can('recepcion') ? '<button class="btn gold" id="bNuevo">+ Cliente nuevo</button>' : ''}`) + `
    <div class="card"><div class="row">
      <div class="fld" style="flex:1;min-width:220px"><label>Buscar</label><input class="inp" id="qCli" value="${esc(CL.q)}" placeholder="Nombre, teléfono o número"></div>
      <div class="chips" id="gCli">${['', 'Nuevo', 'Frecuente', 'Única vez'].map(g => `<span class="chip${CL.grupo === g ? ' on' : ''}" data-g="${g}">${g || 'Todos'}</span>`).join('')}</div>
    </div><div class="hint" style="margin-top:8px">Grupo automático: <b>Nuevo</b> (1 visita) → <b>Frecuente</b> desde la 2ª visita → <b>Única vez</b> si pasan ${cfg('dias_unica_vez', 90)} días sin volver.</div></div>
    <div id="tCli"></div>`;
  const draw = () => {
    if (!$('#tCli')) return;
    const q = norm(CL.q), qd = digits(CL.q);
    const list = S.clientes.filter(c => (!CL.grupo || c.grupo === CL.grupo) &&
      (!q || norm(c.nombre).includes(q) || (qd && (digits(c.telefono).includes(qd) || String(c.numero) === qd))))
      .sort((a, b) => (b.ultima || '').localeCompare(a.ultima || '') || b.numero - a.numero);
    const cnt = g => S.clientes.filter(c => c.grupo === g).length;
    $$('#gCli .chip').forEach(ch => ch.textContent = (ch.dataset.g || 'Todos') + ` (${ch.dataset.g ? cnt(ch.dataset.g) : S.clientes.length})`);
    $('#tCli').innerHTML = `<div class="tbl-wrap" style="max-height:72vh"><table class="tbl"><thead><tr><th>No.</th><th>Nombre</th><th>Teléfono</th><th>Grupo</th><th class="num">Visitas</th><th class="num">Folios</th><th class="num">Pagado</th><th>Última visita</th><th>Origen</th></tr></thead>
      <tbody>${list.slice(0, 500).map(c => `<tr class="click" data-id="${c.id}"><td>${c.numero}</td><td><b>${esc(c.nombre)}</b></td><td>${esc(c.telefono || '')}</td><td>${grupoBadge(c.grupo)}</td>
        <td class="num">${c.visitas}</td><td class="num">${c.folios}</td><td class="num">${money0(c.gastado)}</td><td>${fmtD(c.ultima)}</td><td>${esc(c.origen || '')}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="9">${list.length} cliente(s)${list.length > 500 ? ' · se muestran 500, usa la búsqueda' : ''}</td></tr></tfoot></table></div>`;
    $$('#tCli tr[data-id]').forEach(tr => tr.onclick = () => fichaCliente(+tr.dataset.id, draw));
  };
  $('#qCli').oninput = debounce(e => { CL.q = e.target.value; draw(); }, 200);
  $$('#gCli .chip').forEach(ch => ch.onclick = () => { CL.grupo = ch.dataset.g; $$('#gCli .chip').forEach(x => x.classList.toggle('on', x === ch)); draw(); });
  $('#bNuevo') && ($('#bNuevo').onclick = () => modalCliente(null, () => draw()));
  $('#bXls').onclick = () => XL.save(`Clientes_${hoy()}.xlsx`, wb => XL.table(wb.addWorksheet('Clientes'), [
    { h: 'No. CLIENTE', k: 'numero', w: 10 }, { h: 'NOMBRE', k: 'nombre', w: 32 }, { h: 'TELÉFONO', k: 'telefono', w: 14 }, { h: 'TELÉFONO 2', k: 'telefono2', w: 14 },
    { h: 'GRUPO', k: 'grupo', w: 12 }, { h: 'VISITAS', k: 'visitas', w: 8 }, { h: 'FOLIOS', k: 'folios', w: 8 }, { h: 'PAGADO', k: 'gastado', money: true },
    { h: 'PRIMERA VISITA', get: c => fmtD(c.primera), w: 12 }, { h: 'ÚLTIMA VISITA', get: c => fmtD(c.ultima), w: 12 }, { h: 'NOS CONOCIÓ POR', k: 'origen', w: 16 },
    { h: 'REDES', k: 'redes', w: 16 }, { h: 'CORREO', k: 'email', w: 22 }, { h: 'NOTAS', k: 'notas', w: 40 },
  ], S.clientes)).catch(fail);
  draw();
};

async function fichaCliente(id, onChange) {
  const c = S.clientes.find(x => x.id === id);
  const { data: folios, error } = await S.sb.from('gc_servicios_v').select('*').eq('cliente_id', id).order('folio', { ascending: false }).limit(300);
  if (error) return fail(error);
  const m = modal({
    title: `#${c.numero} · ${c.nombre}`, wide: true,
    body: `<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:10px">
        <div>${grupoBadge(c.grupo)} <span class="hint">${c.visitas} visita(s) · ${c.folios} folio(s) · pagado ${money(c.gastado)}${c.primera ? ` · cliente desde ${fmtD(c.primera)}` : ''}</span></div>
        <div class="row">${c.telefono ? `<a class="btn sm ghost" target="_blank" rel="noopener" href="${waLink(c.telefono, `Hola ${c.nombre.split(' ')[0]}, te saluda Golden Clean Solutions.`)}">WhatsApp</a>` : ''}
        ${can('recepcion') ? '<button class="btn sm gold" id="fcRec">+ Recepción</button>' : ''}${can('notas') ? '<button class="btn sm ghost" id="fcNota">Nota</button>' : ''}</div></div>
      ${formCliente(c)}
      <h3 style="margin:16px 0 8px;font-size:16px">Historial de folios</h3>
      ${folios.length ? `<div class="tbl-wrap" style="max-height:300px"><table class="tbl"><thead><tr><th>No.</th><th>Recepción</th><th>Artículo</th><th>Marca</th><th>Servicio</th><th class="num">Total</th><th class="num">Saldo</th><th>Estado</th></tr></thead><tbody>
        ${folios.map(r => `<tr class="click est-${r.estado}" data-f="${r.folio}"><td><b>${r.folio}</b></td><td>${fmtD(r.fecha_recepcion)}</td><td>${esc(r.articulo || '')}</td><td>${esc(r.marca || '')}</td><td class="wrap srv">${esc(r.servicio || '')}</td><td class="num">${money(r.total)}</td><td class="num">${+r.saldo > 0.009 ? money(r.saldo) : ''}</td><td>${ESTADOS[r.estado].s}</td></tr>`).join('')}</tbody></table></div>` : '<div class="hint">Sin folios.</div>'}`,
    actions: [{ label: 'Cerrar', cls: 'ghost' }, ...((can('clientes') || can('recepcion')) ? [{
      label: 'Guardar datos', cls: 'gold', onClick: async ({ body }) => {
        const d = leerCliente(body);
        const { error: e } = await S.sb.from('gc_clientes').update(d).eq('id', id);
        if (e) throw e;
        await cargarClientes(); toast('Cliente actualizado'); onChange && onChange();
      }
    }] : [])]
  });
  $('#fcRec') && ($('#fcRec').onclick = () => { m.close(); if (!R) resetR(); R.cliente = c; go('recepcion'); });
  $('#fcNota') && ($('#fcNota').onclick = () => { m.close(); go('notas', { cliente: id }); });
  $$('tr[data-f]', m.body).forEach(tr => tr.onclick = () => editarFolio(+tr.dataset.f));
}

if (!window.GC_TEST) window.addEventListener('DOMContentLoaded', () => { init().catch(fail); });
