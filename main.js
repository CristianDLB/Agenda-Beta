// --- LOGOS DE LIGAS ---
const logos = {
  1: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v5/Competitions/11", // LaLiga
  2: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v12/Competitions/7", // Premier League
  3: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v3/Competitions/17", // Serie A
  4: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v5/Competitions/572",// Champions
  5: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v6/Competitions/102", // Libertadores
  6: "https://imagecache.365scores.com/image/upload/f_png,w_24,h_24,c_limit,q_auto:eco,dpr_2,d_Countries:Round:10.png/v4/Competitions/72", //Liga Profesional
  7: "https://imagecache.365scores.com/image/upload/f_png,w_24,h_24,c_limit,q_auto:eco,dpr_2,d_Countries:Round:112.png/v3/Competitions/583", //Liga 1 Peru
  8: "https://imagecache.365scores.com/image/upload/f_png,w_24,h_24,c_limit,q_auto:eco,dpr_2,d_Countries:Round:19.png/v6/Competitions/7685" //Conference League
};

// --- ESTADOS ---
const estados = {
  1: { texto: "En Vivo", clase: "en-vivo", icono:'<i class="fa-solid fa-circle"></i>' },
  2: { texto: "Pronto", clase: "pronto", icono:'<i class="fa-solid fa-clock"></i>' },
  3: { texto: "Finalizado", clase: "finalizado", icono:'<i class="fa-solid fa-clock"></i>' }
};

const FINALIZAR_MINUTOS = 120;

// Función utilitaria que calcula el estado local (1=En Vivo,2=Pronto,3=Finalizado)
function computeEstadoLocal(m) {
  const tzLocal = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const ahoraLocal = DateTime.now().setZone(tzLocal);
  const ahoraMadrid = DateTime.now().setZone('Europe/Madrid');

  const [h, min] = m.hora.split(':').map(Number);
  const [y, mo, d] = m.fecha.split('-').map(Number);

  let dtMadrid = DateTime.fromObject({ year: y, month: mo, day: d, hour: h, minute: min }, { zone: 'Europe/Madrid' });
  const dtLocal = dtMadrid.setZone(tzLocal);
  const dtEndLocal = dtLocal.plus({ minutes: FINALIZAR_MINUTOS });

  let estado = ahoraLocal >= dtEndLocal ? 3 : (ahoraLocal >= dtLocal ? 1 : 2);

  return { estado, dtLocal, dtMadrid, dtEndLocal };
}

// --- DATOS DE PARTIDOS ---
const matches = [
  {
    fecha: "2025-11-05",
    hora: "16:15",
    liga: 7,
    partido: "Liga 1: Sporting Cristal vs UTC Cajamarca",
    canales: [
      { nombre: "ESPN 2", url: "https://www.espn.com" }
    ]
  },
  {
    fecha: "2025-11-05",
    hora: "21:15",
    liga: 7,
    partido: "Liga 1: Los Chankas vs Alianza Lima",
    canales: [
      { nombre: "ESPN 2", url: "https://www.espn.com" }
    ]
  },
  {
    fecha: "2025-11-05",
    hora: "21:00",
    liga: 4,
    partido: "Champions League: Brujas vs Barcelona",
    canales: [
      { nombre: "ESPN 2", url: "https://www.espn.com" },
      { nombre: "ESPN ", url: "https://www.espn.com" }
    ]
  },
  {
    fecha: "2025-11-06",
    hora: "18:45",
    liga: 8,
    partido: "UEFA Conference League: Noah vs Sigma Olomouc",
    canales: [
      { nombre: "ESPN 2", url: "https://www.espn.com" },
      { nombre: "ESPN ", url: "https://www.espn.com" }
    ]
  }
];

// --- ELEMENTOS DOM ---
const container = document.getElementById("matches");
const search = document.getElementById("search");

// --- FUNCIÓN DE RENDERIZADO PRINCIPAL ---
function render(list) {
  container.innerHTML = "";

  const items = list.map(m => {
    const logo = logos[m.liga] || "";
    const { estado, dtLocal, dtMadrid } = computeEstadoLocal(m);
    const origIdx = matches.indexOf(m);
    return { m, origIdx, logo, estado, dtLocal, dtMadrid };
  });

  // Ordenar: En Vivo → Pronto hoy → Finalizado hoy → Próximos días
  items.sort((a, b) => {
    const hoyMadrid = DateTime.now().setZone('Europe/Madrid').toISODate();
    const mananaMadrid = DateTime.now().setZone('Europe/Madrid').plus({ days: 1 }).toISODate();

    function getGroup(item) {
      const fechaPartido = item.dtMadrid.toISODate();
      if (item.estado === 1) return 1;
      if (fechaPartido === hoyMadrid && item.estado === 2) return 2;
      if (fechaPartido === hoyMadrid && item.estado === 3) return 3;
      if (fechaPartido >= mananaMadrid) return 4; // futuros días
      return 5;
    }

    const groupA = getGroup(a);
    const groupB = getGroup(b);
    if (groupA !== groupB) return groupA - groupB;
    return a.dtLocal.toMillis() - b.dtLocal.toMillis();
  });

items.forEach(({ m, origIdx, logo, estado, dtLocal, dtMadrid }) => {
    const hoyMadrid = DateTime.now().setZone('Europe/Madrid').toISODate();
    const mananaMadrid = DateTime.now().setZone('Europe/Madrid').plus({ days:1 }).toISODate();

    let estadoFinal = estado;
    if (dtMadrid.toISODate() > hoyMadrid) estadoFinal = 2; // futuros días siempre Pronto

    const est = estados[estadoFinal];
    const horaLocalAdaptada = dtLocal.toFormat("HH:mm");

    // --- ETIQUETA HOY / MAÑANA AL COSTADO ---
    let etiquetaFechaHtml = '';
    if (estadoFinal === 2) {
        const tzLocal = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const hoyLocal = DateTime.now().setZone(tzLocal).toISODate();
        const mananaLocal = DateTime.now().setZone(tzLocal).plus({ days: 1 }).toISODate();
        const fechaPartidoLocal = dtLocal.toISODate();
        /*
        if (fechaPartidoLocal === hoyLocal) etiquetaFechaHtml = `<span class="etiqueta-fecha">Hoy</span>`;
        else if (fechaPartidoLocal === mananaLocal) etiquetaFechaHtml = `<span class="etiqueta-fecha">Mañana</span>`;
        */
    }

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header" data-index="${origIdx}" tabindex="0" role="button" aria-expanded="false">
        <div class="left">
          <div class="time">${horaLocalAdaptada}</div>
          <img class="logo" src="${logo}" alt="Logo liga ${m.liga}" loading="lazy">
          <div class="teams" title="${m.partido}">${m.partido}</div>
        </div>
        <div class="status-wrapper">
          <div class="status ${est.clase}">${est.icono} ${est.texto}</div>
          ${etiquetaFechaHtml} <!-- etiqueta al costado -->
        </div>
      </div>
      <div class="card-body" id="body-${origIdx}">
        ${m.canales.map(c => `
          <div class="channel-link">
            <div class="ch-name">${c.nombre}</div>
            ${estadoFinal === 1 ? `
            <div class="channel-actions">
              <button class="channel-btn copiar-btn" data-url="${c.url}"><i class="fa-solid fa-clipboard-check"></i> Copiar transmisión</button>
              <button class="channel-btn ver-btn" data-url="${c.url}"><i class="fa-solid fa-up-right-from-square"></i> Ver en vivo</button>
            </div>` : ''}
          </div>`).join("")}
      </div>
    `;
    container.appendChild(card);
});
  attachHandlers();
}

// --- MANEJADORES DE DESPLIEGUE ---
function attachHandlers() {
  container.onclick = e => {
    const header = e.target.closest('.card-header');
    if (header) { toggle(header); return; }

    const copiar = e.target.closest('.copiar-btn');
    if (copiar) {
      navigator.clipboard.writeText(copiar.dataset.url).then(() => {
        const original = copiar.innerHTML;
        copiar.innerHTML = 'Copiado <i class="fa-solid fa-check"></i>';
        setTimeout(() => copiar.innerHTML = original, 2000);
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = copiar.dataset.url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      });
      return;
    }

    const ver = e.target.closest('.ver-btn');
    if (ver) { window.open(ver.dataset.url, '_blank'); return; }
  };

  container.addEventListener('keydown', e => {
    const header = e.target.closest('.card-header');
    if (!header) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(header); }
  });
}


// --- ACTUALIZACIÓN DE ESTADOS ---
function updateStates() {
  const tzLocal = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const ahoraLocal = DateTime.now().setZone(tzLocal);

  if (!Array.isArray(window.__prevEstados)) window.__prevEstados = matches.map(() => null);

  document.querySelectorAll('.card').forEach(card => {
    const header = card.querySelector('.card-header');
    if (!header) return;
    const origIdx = parseInt(header.dataset.index,10);
    const m = matches[origIdx];
    if (!m) return;

    const { estado, dtLocal, dtMadrid } = computeEstadoLocal(m);
    let estadoAuto = estado;
    const hoyMadrid = DateTime.now().setZone('Europe/Madrid').toISODate();
    if (dtMadrid.toISODate() > hoyMadrid) estadoAuto = 2; // futuros días

    const prevEstado = window.__prevEstados[origIdx];
    if (prevEstado === null) window.__prevEstados[origIdx] = estadoAuto;
    else if (prevEstado !== estadoAuto) window.__prevEstados[origIdx] = estadoAuto;

    const statusEl = card.querySelector('.status');
    if (statusEl) {
      statusEl.textContent = estados[estadoAuto].texto;
      statusEl.className = 'status ' + estados[estadoAuto].clase;
    }

    const channelActions = card.querySelectorAll('.channel-actions');
    channelActions.forEach(ca => { ca.style.display = estadoAuto === 1 ? 'flex' : 'none'; });
  });
}

// --- TOGGLE ACORDEÓN ---
function toggle(header) {
  const idx = header.dataset.index;
  const body = document.getElementById(`body-${idx}`);
  if (!body) return;

  // Cerrar cualquier otro abierto
  document.querySelectorAll(".card-body.open").forEach(openBody => {
    if (openBody !== body) {
      openBody.classList.add('closing');
      openBody.classList.remove("open");
      openBody.style.maxHeight = "0";
      openBody.style.opacity = "0";
      openBody.style.overflow = "hidden";
      const prevHeader = openBody.previousElementSibling;
      if (prevHeader) prevHeader.setAttribute("aria-expanded", "false");
    }
  });

  const isOpen = body.classList.contains("open");

  if (isOpen) {
    // Cerrar actual
    body.style.maxHeight = body.scrollHeight + "px"; // set current height
    requestAnimationFrame(() => {
      body.classList.add('closing');
      body.classList.remove("open");
      body.style.maxHeight = "0";
      body.style.opacity = "0";
      body.style.overflow = "hidden";
      header.setAttribute("aria-expanded", "false");
    });
  } else {
    // Abrir
    body.classList.add("open");
    body.style.maxHeight = body.scrollHeight + "px";
    body.style.opacity = "1";
    header.setAttribute("aria-expanded", "true");
    body.addEventListener("transitionend", () => {
      if (body.classList.contains("open")) {
        body.style.maxHeight = body.scrollHeight + 'px';
        setTimeout(() => { body.style.overflow = 'visible'; }, 20);
      }
      body.classList.remove('closing');
    }, { once: true });
  }
}

// --- BUSCADOR ---
search.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = matches.filter(m => m.partido.toLowerCase().includes(q));
  render(filtered);
});
// --- CONVERSIÓN DE HORA (24HRS)
const { DateTime } = luxon;
function convertirHoraEspañaALocal(horaMadrid) {
  const [h, m] = horaMadrid.split(":").map(Number);
  const ahoraMadrid = DateTime.now().setZone("Europe/Madrid");
  const dtMadrid = DateTime.fromObject({
    year: ahoraMadrid.year,
    month: ahoraMadrid.month,
    day: ahoraMadrid.day,
    hour: h,
    minute: m
  }, { zone: "Europe/Madrid" });

  const tzLocal = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const dtLocal = dtMadrid.setZone(tzLocal);
  return dtLocal.toFormat("HH:mm");
}
// --- FECHA ACTUAL ---
function mostrarFechaActual() {
  const fecha = new Date();
  const opciones = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  let fechaFormateada = fecha.toLocaleDateString('es-PE', opciones);
  fechaFormateada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  document.getElementById('fecha-actual').textContent = fechaFormateada;
}
mostrarFechaActual();

setInterval(() => {
  updateStates();
  setTimeout(() => {
    location.reload();
  }, 600);
}, 30000);
// Ejecutar una primera actualización ligera después del render inicial
updateStates();

// --- RENDER INICIAL ---
render(matches);

// Animación: entrada de las cards desde abajo al cargar la página
window.addEventListener('load', () => {
  setTimeout(() => {
    if (container && !container.classList.contains('loaded')) {
      container.classList.add('loaded');
    }
  }, 120);
});