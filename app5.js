/* =====================================================================
   GOLDEN CLEAN · app5.js — ALERTAS tienda ↔ taller
   - Tienda (recepción/control) y masters crean alertas.
   - El taller (usuario solo-taller) las ve SOBRE TODA LA PANTALLA con la
     franja ALERTA parpadeando en rojo + sonido; puede responder, minimizar o cerrar.
   - Las respuestas regresan a tienda en un panel con aviso.
   ===================================================================== */
'use strict';

const TIPOS_ALERTA = {
  cliente_espera: { l: 'Cliente esperando en tienda', i: '🧍', ph: 'El cliente está en tienda esperando su servicio. ¿Cuánto falta?' },
  cambio_fecha: { l: 'Cambio de fecha de entrega', i: '📅', ph: 'Se movió la fecha de entrega a …' },
  atraso: { l: 'Servicio atrasado', i: '⏰', ph: 'Este servicio va atrasado, ¿qué falta para terminarlo?' },
  urgente: { l: 'Urgente', i: '🔥', ph: 'Necesitamos este servicio lo antes posible.' },
  otro: { l: 'Mensaje', i: '💬', ph: 'Escribe tu mensaje para el taller…' },
};
const puedeEnviarAlerta = () => can('recepcion') || can('control');
const recibeAlertas = () => can('taller') && !vePrecios();
const puedeVerAlertas = () => vePrecios() || can('taller');

const AL = { abiertas: [], msgs: [], minimizado: false, actual: 0, timer: null, beepTimer: null, previas: new Set(), panelId: null, ctx: null, titulo: document.title };

const alVistoKey = () => 'gc_alertas_visto_' + (S.perfil?.id || '');
const alGetVisto = () => { try { return JSON.parse(localStorage.getItem(alVistoKey()) || '{}'); } catch { return {}; } };
const alSetVisto = v => { try { localStorage.setItem(alVistoKey(), JSON.stringify(v)); } catch { } };
const alHora = t => new Date(t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
const alHace = t => { const m = Math.round((Date.now() - new Date(t)) / 60000); return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`; };
const alMsgs = id => AL.msgs.filter(m => m.alerta_id === id);
// marcador de "novedad": último mensaje escrito por otra persona (0 = alerta sin respuestas)
const alMarcador = a => Math.max(0, ...alMsgs(a.id).filter(m => m.autor !== S.perfil.id).map(m => m.id));

function alBeep() {
  try {
    const c = AL.ctx || (AL.ctx = new (window.AudioContext || window.webkitAudioContext)());
    if (c.state === 'suspended') c.resume();
    [0, 0.28, 0.56].forEach(t => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'square'; o.frequency.value = 880;
      o.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(0.0001, c.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t + 0.2);
      o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.22);
    });
  } catch { }
}

// ---------------------------------------------------------------- arranque y sondeo
function iniciarAlertas() {
  if (!puedeVerAlertas()) return;
  clearInterval(AL.timer);
  pollAlertas();
  AL.timer = setInterval(pollAlertas, recibeAlertas() ? 8000 : 12000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pollAlertas(); });
}
window.iniciarAlertas = iniciarAlertas;

async function pollAlertas() {
  if (!S.perfil) return;
  const { data: al, error } = await S.sb.from('gc_alertas').select('*').eq('estado', 'abierta').order('id');
  if (error) return;
  let msgs = [];
  if (al.length) {
    const r = await S.sb.from('gc_alerta_mensajes').select('*').in('alerta_id', al.map(a => a.id)).order('id');
    msgs = r.data || [];
  }
  const cerradas = [...AL.previas].filter(id => !al.some(a => a.id === id));
  AL.abiertas = al; AL.msgs = msgs;
  AL.previas = new Set(al.map(a => a.id));
  alBadge();

  const visto = alGetVisto();
  if (recibeAlertas()) {
    const nuevas = al.filter(a => visto[a.id] === undefined || alMarcador(a) > visto[a.id]);
    if (nuevas.length) { AL.minimizado = false; AL.actual = Math.max(0, al.findIndex(a => a.id === nuevas[0].id)); alBeep(); }
    alOverlay();
  } else {
    const conResp = al.filter(a => alMarcador(a) > (visto[a.id] || 0));
    if (conResp.length && AL.panelId !== conResp[0].id) { alBeep(); alPanel(conResp[0].id); }
    else if (AL.panelId) alPanel(AL.panelId, true);
    if (cerradas.length && AL.panelId && cerradas.includes(AL.panelId)) { alCerrarPanel(); toast('La alerta fue cerrada'); }
  }
  if (S.view === 'alertas' && $('#alLista')) alListaRefrescar();
}

function alBadge() {
  const n = AL.abiertas.length;
  const b = $('#nb-alertas');
  if (b) { b.textContent = n; b.classList.toggle('hidden', !n); }
  document.title = (n && recibeAlertas() && !AL.minimizado ? '⚠ ALERTA · ' : '') + AL.titulo;
}

// ---------------------------------------------------------------- hilo de conversación (compartido)
function alHiloHTML(a) {
  const t = TIPOS_ALERTA[a.tipo] || TIPOS_ALERTA.otro;
  return `<div class="al-meta"><span class="al-tipo">${t.i} ${esc(t.l)}</span><span class="hint">De <b>${esc(a.creado_nombre || '—')}</b> · ${alHora(a.creado)} (${alHace(a.creado)})</span></div>
    ${a.detalle_folio ? `<div class="al-folio">${esc(a.detalle_folio)}</div>` : ''}
    <div class="al-msg">${esc(a.mensaje)}</div>
    <div class="al-hilo">${alMsgs(a.id).map(m => `<div class="al-resp${m.autor === S.perfil.id ? ' mia' : ''}"><div class="al-resp-h"><b>${esc(m.autor_nombre || '')}</b> · ${alHora(m.creado)}</div>${esc(m.texto)}</div>`).join('') || '<div class="hint">Sin respuestas todavía.</div>'}</div>`;
}
async function alResponder(id, texto) {
  if (!texto.trim()) return toast('Escribe tu respuesta', true);
  const { error } = await S.sb.rpc('gc_alerta_responder', { p_id: id, p_texto: texto });
  if (error) return fail(error);
  await pollAlertas();
  alMarcarVisto(id);
}
async function alCerrar(id, texto) {
  const { error } = await S.sb.rpc('gc_alerta_cerrar', { p_id: id, p_texto: texto && texto.trim() ? texto : null });
  if (error) return fail(error);
  toast('Alerta cerrada');
  await pollAlertas();
}
function alMarcarVisto(id) {
  const a = AL.abiertas.find(x => x.id === id); if (!a) return;
  const v = alGetVisto(); v[id] = alMarcador(a); alSetVisto(v);
}

// ---------------------------------------------------------------- TALLER: recuadro sobre toda la pantalla
function alOverlay() {
  let ov = $('#alOverlay');
  const al = AL.abiertas;
  let pill = $('#alPill');
  if (!al.length) { ov && ov.remove(); pill && pill.remove(); clearInterval(AL.beepTimer); AL.beepTimer = null; alBadge(); return; }
  if (AL.minimizado) {
    ov && ov.remove(); clearInterval(AL.beepTimer); AL.beepTimer = null;
    if (!pill) { pill = document.createElement('button'); pill.id = 'alPill'; pill.className = 'al-pill'; document.body.appendChild(pill); pill.onclick = () => { AL.minimizado = false; alOverlay(); }; }
    pill.textContent = `⚠ ${al.length} alerta${al.length > 1 ? 's' : ''} abierta${al.length > 1 ? 's' : ''} · ver`;
    alBadge(); return;
  }
  pill && pill.remove();
  AL.actual = Math.min(AL.actual, al.length - 1);
  const a = al[AL.actual];
  if (!ov) {
    ov = document.createElement('div'); ov.id = 'alOverlay'; ov.className = 'al-ov';
    ov.innerHTML = `<div class="al-box" role="alertdialog" aria-live="assertive">
      <div class="al-banner"><span>⚠ ALERTA</span><span class="al-nav"></span></div>
      <div class="al-body"><div id="alOvHilo"></div>
        <textarea class="inp" id="alOvTxt" placeholder="Escribe tu respuesta…" rows="2"></textarea>
        <div class="al-acc">
          <button class="btn ghost" id="alOvMin">Minimizar</button>
          <button class="btn ghost" id="alOvOk">✓ Enterado</button>
          <button class="btn gold" id="alOvResp">Responder</button>
          <button class="btn danger" id="alOvCerrar">Cerrar alerta</button>
        </div></div></div>`;
    document.body.appendChild(ov);
    $('#alOvMin').onclick = () => { AL.abiertas.forEach(x => alMarcarVisto(x.id)); AL.minimizado = true; alOverlay(); };
    $('#alOvOk').onclick = async () => { await alResponder(al0().id, 'Enterado ✓'); };
    $('#alOvResp').onclick = async () => { const t = $('#alOvTxt'); await alResponder(al0().id, t.value); t.value = ''; };
    $('#alOvCerrar').onclick = async () => {
      const t = $('#alOvTxt'); const a0 = al0();
      if (!await ask(`¿Cerrar la alerta${a0.folio ? ' del folio ' + a0.folio : ''}? ${t.value.trim() ? 'Se enviará tu respuesta.' : ''}`, 'Cerrar alerta')) return;
      await alCerrar(a0.id, t.value); t.value = '';
    };
    $('#alOvTxt').onkeydown = ev => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); $('#alOvResp').click(); } };
  }
  const nav = $('.al-nav', ov);
  nav.innerHTML = al.length > 1 ? `<button data-d="-1">‹</button> ${AL.actual + 1} de ${al.length} <button data-d="1">›</button>` : '';
  $$('button[data-d]', nav).forEach(b => b.onclick = () => { AL.actual = (AL.actual + +b.dataset.d + al.length) % al.length; alOverlay(); });
  $('#alOvHilo').innerHTML = alHiloHTML(a);
  const h = $('.al-hilo', ov); if (h) h.scrollTop = h.scrollHeight;
  al.forEach(x => alMarcarVisto(x.id));
  if (!AL.beepTimer) AL.beepTimer = setInterval(() => { if (!AL.minimizado && $('#alOverlay')) alBeep(); }, 30000);
  alBadge();
}
const al0 = () => AL.abiertas[Math.min(AL.actual, AL.abiertas.length - 1)];

// ---------------------------------------------------------------- TIENDA: panel de conversación
function alPanel(id, soloRefrescar = false) {
  const a = AL.abiertas.find(x => x.id === id);
  let p = $('#alPanel');
  if (!a) { if (p) alCerrarPanel(); return; }
  if (soloRefrescar && !p) return;
  if (!p) {
    p = document.createElement('div'); p.id = 'alPanel'; p.className = 'al-panel';
    p.innerHTML = `<div class="al-panel-h"><b>Alerta al taller</b><button class="x" aria-label="Ocultar">×</button></div>
      <div class="al-body"><div id="alPHilo"></div>
      <textarea class="inp" id="alPTxt" rows="2" placeholder="Responder al taller…"></textarea>
      <div class="al-acc"><button class="btn gold sm" id="alPResp">Responder</button><button class="btn danger sm" id="alPCerrar">Cerrar alerta</button></div></div>`;
    document.body.appendChild(p);
    $('.x', p).onclick = () => { alMarcarVisto(AL.panelId); alCerrarPanel(); };
    $('#alPResp').onclick = async () => { const t = $('#alPTxt'); await alResponder(AL.panelId, t.value); t.value = ''; };
    $('#alPCerrar').onclick = async () => { const t = $('#alPTxt'); await alCerrar(AL.panelId, t.value); t.value = ''; alCerrarPanel(); };
    $('#alPTxt').onkeydown = ev => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); $('#alPResp').click(); } };
  }
  AL.panelId = id;
  $('#alPHilo').innerHTML = alHiloHTML(a);
  const h = $('.al-hilo', p); if (h) h.scrollTop = h.scrollHeight;
  alMarcarVisto(id);
}
function alCerrarPanel() { $('#alPanel')?.remove(); AL.panelId = null; }

// ---------------------------------------------------------------- crear alerta
function nuevaAlerta(folio) {
  if (!puedeEnviarAlerta()) return toast('Tu usuario no puede enviar alertas', true);
  let tipo = 'cliente_espera';
  const m = modal({
    title: 'Alerta al taller',
    body: `<div class="fld"><label>Tipo</label><div class="chips" id="naTipos">${Object.entries(TIPOS_ALERTA).map(([k, t]) => `<span class="chip${k === tipo ? ' on' : ''}" data-t="${k}">${t.i} ${esc(t.l)}</span>`).join('')}</div></div>
      <div class="fld" style="margin-top:12px"><label>Folio (opcional)</label><input class="inp" id="naFolio" inputmode="numeric" value="${folio || ''}" placeholder="Ej. 1275" style="max-width:160px"><div class="hint" id="naDet"></div></div>
      <div class="fld" style="margin-top:12px"><label>Mensaje</label><textarea class="inp" id="naMsg" rows="4" placeholder="${esc(TIPOS_ALERTA[tipo].ph)}"></textarea></div>
      <div class="hint" style="margin-top:8px">Le aparecerá al taller sobre toda la pantalla, con la franja <b style="color:#C62828">ALERTA</b> parpadeando y un sonido. Te avisaremos cuando responda.</div>`,
    actions: [{ label: 'Cancelar', cls: 'ghost' }, {
      label: '⚠ Enviar alerta', cls: 'danger', onClick: async ({ body }) => {
        const f = +$('#naFolio', body).value || null, msg = $('#naMsg', body).value.trim();
        if (!msg) throw new Error('Escribe el mensaje');
        const { error } = await S.sb.rpc('gc_alerta_crear', { p_tipo: tipo, p_mensaje: msg, p_folio: f });
        if (error) throw error;
        toast('Alerta enviada al taller');
        pollAlertas();
        if (S.view === 'alertas') route();
      }
    }]
  });
  $$('#naTipos .chip', m.body).forEach(c => c.onclick = () => {
    tipo = c.dataset.t; $$('#naTipos .chip', m.body).forEach(x => x.classList.toggle('on', x === c));
    $('#naMsg', m.body).placeholder = TIPOS_ALERTA[tipo].ph;
  });
  const det = debounce(async () => {
    const f = +$('#naFolio', m.body).value;
    const d = $('#naDet', m.body);
    if (!f) { d.textContent = ''; return; }
    const { data } = await S.sb.from('gc_servicios_v').select('folio,articulo,marca,color,cliente,fecha_entrega,estado').eq('folio', f).maybeSingle();
    d.innerHTML = data ? `${esc(data.articulo || '')} ${esc(data.marca || '')} · ${esc(data.color || '')} · ${esc(data.cliente)} · entrega ${fmtD(data.fecha_entrega)} · ${ESTADOS[data.estado].s}` : '<span class="down">No existe ese folio</span>';
  }, 300);
  $('#naFolio', m.body).addEventListener('input', det);
  if (folio) det();
}
window.nuevaAlerta = nuevaAlerta;

// ---------------------------------------------------------------- pantalla ALERTAS
let alTab = 'abiertas';
V.alertas = async (el) => {
  el.innerHTML = head('Tienda ↔ taller', 'Alertas', puedeEnviarAlerta() ? '<button class="btn danger" id="alNueva">⚠ Nueva alerta al taller</button>' : '') + `
    <div class="tabs"><button class="tab${alTab === 'abiertas' ? ' on' : ''}" data-t="abiertas">Abiertas</button><button class="tab${alTab === 'cerradas' ? ' on' : ''}" data-t="cerradas">Cerradas (7 días)</button></div>
    <div id="alLista"><div class="loading">Cargando…</div></div>`;
  $('#alNueva') && ($('#alNueva').onclick = () => nuevaAlerta());
  $$('.tab', el).forEach(b => b.onclick = () => { alTab = b.dataset.t; route(); });
  await pollAlertas();
  await alListaRefrescar();
};
async function alListaRefrescar() {
  const box = $('#alLista'); if (!box) return;
  let lista = AL.abiertas, msgs = AL.msgs;
  if (alTab === 'cerradas') {
    const { data } = await S.sb.from('gc_alertas').select('*').eq('estado', 'cerrada').gte('creado', addDays(hoy(), -7)).order('id', { ascending: false }).limit(60);
    lista = data || [];
    if (lista.length) { const r = await S.sb.from('gc_alerta_mensajes').select('*').in('alerta_id', lista.map(a => a.id)).order('id'); msgs = r.data || []; }
  }
  if (!$('#alLista')) return;
  box.innerHTML = lista.length ? lista.slice().reverse().map(a => {
    const t = TIPOS_ALERTA[a.tipo] || TIPOS_ALERTA.otro, ms = msgs.filter(m => m.alerta_id === a.id), ult = ms[ms.length - 1];
    return `<div class="card al-card${a.estado === 'abierta' ? ' abierta' : ''}" data-id="${a.id}">
      <div class="row" style="justify-content:space-between;align-items:center"><span class="al-tipo">${t.i} ${esc(t.l)}</span>
        <span class="hint">${esc(a.creado_nombre || '')} · ${fmtD(a.creado.slice(0, 10))} ${alHora(a.creado)}${a.estado === 'cerrada' ? ` · cerrada por ${esc(a.cerrada_nombre || '')}` : ''}</span></div>
      ${a.detalle_folio ? `<div class="al-folio">${esc(a.detalle_folio)}</div>` : ''}
      <div style="font-size:15px;margin-top:6px">${esc(a.mensaje)}</div>
      <div class="hint" style="margin-top:6px">${ms.length ? `${ms.length} respuesta(s) · última de <b>${esc(ult.autor_nombre || '')}</b>: “${esc(ult.texto.slice(0, 90))}”` : 'Sin respuestas'}</div>
      ${a.estado === 'abierta' ? '<div class="row" style="margin-top:8px"><button class="btn sm gold" data-abrir>Abrir conversación</button></div>' : ''}
    </div>`;
  }).join('') : `<div class="card empty">${alTab === 'abiertas' ? 'No hay alertas abiertas 👌' : 'Sin alertas cerradas en los últimos 7 días.'}</div>`;
  $$('[data-abrir]', box).forEach(b => b.onclick = () => {
    const id = +b.closest('[data-id]').dataset.id;
    if (recibeAlertas()) { AL.minimizado = false; AL.actual = AL.abiertas.findIndex(a => a.id === id); alOverlay(); }
    else alPanel(id);
  });
}
