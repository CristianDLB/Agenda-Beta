// --- LOGOS DE LIGAS ---
const logos = {
  1: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v5/Competitions/11", // LaLiga
  2: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v12/Competitions/7", // Premier League
  3: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v3/Competitions/17", // Serie A
  4: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v5/Competitions/572",// Champions
  5: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v6/Competitions/102" // Libertadores
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
  if (typeof luxon === 'undefined') return { estado: 2 };
  const { DateTime } = luxon;
  const tzLocal = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const ahoraLocal = DateTime.now().setZone(tzLocal);
  const [h, min] = m.hora.split(':').map(Number);
  const ahoraMadrid = DateTime.now().setZone('Europe/Madrid');
  const dtMadrid = DateTime.fromObject({
    year: ahoraMadrid.year,
    month: ahoraMadrid.month,
    day: ahoraMadrid.day,
    hour: h,
    minute: min
  }, { zone: 'Europe/Madrid' });
  const dtLocal = dtMadrid.setZone(tzLocal);
  const dtEnd = dtLocal.plus({ minutes: FINALIZAR_MINUTOS });
  const estado = ahoraLocal >= dtEnd ? 3 : (ahoraLocal >= dtLocal ? 1 : 2);
  return { estado, dtLocal };
}

// --- DATOS DE PARTIDOS ---
const matches = [
  {
    hora: "22:02",
    liga: 4,
    partido: "Atletico vs St. Gilloise",
    canales: [
      { nombre: "ESPN 2", url: "https://www.espn.com" }
    ]
  },
  {
    hora: "22:03",
    liga: 4,
    partido: "Liverpool vs Real Madrid",
    canales: [
      { nombre: "ESPN", url: "https://www.espn.com" },
      { nombre: "Disney+", url: "https://www.starplus.com" }
    ]
  }
];

// --- ELEMENTOS DOM ---
const container = document.getElementById("matches");
const search = document.getElementById("search");

// --- FUNCIÓN DE RENDERIZADO PRINCIPAL ---
function render(list) {
  container.innerHTML = "";
  // Preparar lista con estado y hora local calculada
  const items = list.map((m, idx) => {
    const logo = logos[m.liga] || "";
    const { estado, dtLocal } = computeEstadoLocal(m);
    return { m, idx, logo, estado, dtLocal };
  });
  // Ordenar: los finalizados (3) al final; el resto por hora local ascendente
  items.sort((a, b) => {
    if ((a.estado === 3) !== (b.estado === 3)) return a.estado === 3 ? 1 : -1;
    // si ambos son finalizados o ninguno, ordenar por dtLocal
    return a.dtLocal.toMillis() - b.dtLocal.toMillis();
  });
  // Renderizar según orden calculado
  items.forEach(({ m, idx, logo, estado, dtLocal }) => {
    const est = estados[estado] || estados[2];
    const horaLocalAdaptada = dtLocal.toFormat("HH:mm");
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header" data-index="${idx}" tabindex="0" role="button" aria-expanded="false">
        <div class="left">
          <div class="time">${horaLocalAdaptada}</div>
          <img class="logo" src="${logo}" alt="Logo liga ${m.liga}" loading="lazy">
          <div class="teams" title="${m.partido}">${m.partido}</div>
        </div>
        <div class="status ${est.clase}">${est.icono} ${est.texto}</div>
      </div>
      <div class="card-body" id="body-${idx}">
        ${m.canales.map(c => `
          <div class="channel-link">
            <div class="ch-name">${c.nombre}</div>
            ${estado === 1 ? `
            <div class="channel-actions">
              <button class="channel-btn copiar-btn" data-url="${c.url}"><i class="fa-solid fa-clipboard-check"></i> Copiar transmisión</button>
              <button class="channel-btn ver-btn" data-url="${c.url}"><i class="fa-solid fa-up-right-from-square"></i> Ver en vivo</button>
            </div>
            ` : ''}
          </div>
        `).join("")}
      </div>
    `;
    container.appendChild(card);
  });
  attachHandlers();
}

// --- MANEJADORES DE DESPLIEGUE ---
function attachHandlers() {

  container.onclick = (e) => {
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
  container.addEventListener('keydown', (e) => {
    const header = e.target.closest('.card-header');
    if (!header) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(header); }
  });
}
// Actualiza solo estados y visibilidad de botones sin re-renderizar todo
function updateStates() {
  if (typeof luxon === 'undefined') return;
  const { DateTime } = luxon;
  const tzLocal = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const ahoraLocal = DateTime.now().setZone(tzLocal);
  // función auxiliar: calcula estado local (1=En Vivo, 2=Pronto, 3=Finalizado)
  // Usa la función global computeEstadoLocal
  function getEstadoLocal(m) {
    return computeEstadoLocal(m).estado;
  }
  let changed = false;
  // Inicializar array de estados previo si no existe
  if (!Array.isArray(window.__prevEstados)) window.__prevEstados = matches.map(() => null);

  document.querySelectorAll('.card').forEach((card) => {
    const header = card.querySelector('.card-header');
    if (!header) return;
    const origIdx = parseInt(header.dataset.index, 10);
    const m = matches[origIdx];
    if (!m) return;
    const estadoAuto = getEstadoLocal(m);
    const prevEstado = window.__prevEstados[origIdx];
    if (prevEstado === null) {
      window.__prevEstados[origIdx] = estadoAuto;
    } else if (prevEstado !== estadoAuto) {
      window.__prevEstados[origIdx] = estadoAuto;
      changed = true;
      // Si pasó a finalizado y antes no lo era, mover la card al final
      if (estadoAuto === 3 && prevEstado !== 3) {
        try { container.appendChild(card); } catch (e) { /* no bloquear */ }
      }
    }
    // Actualizar estado visual
    const statusEl = card.querySelector('.status');
    if (statusEl) {
      statusEl.textContent = estados[estadoAuto].texto;
      statusEl.className = 'status ' + estados[estadoAuto].clase;
    }
    // Mostrar/ocultar botones
    const channelActions = card.querySelectorAll('.channel-actions');
    channelActions.forEach(ca => {
      ca.style.display = estadoAuto === 1 ? 'flex' : 'none';
    });
  });
  // Si detectamos que algún estado cambió, recargamos la página para que todo se sincronice
  if (changed) {
    setTimeout(() => {
      location.reload();
    }, 600);
  }
}
// --- FUNCIÓN PARA ABRIR/CERRAR CARD ---
function toggle(header) {
  const idx = header.dataset.index;
  const body = document.getElementById(`body-${idx}`);
  if (!body) return;
  document.querySelectorAll(".card-body.open").forEach(openBody => {
    if (openBody !== body) {
      const prevHeader = openBody.previousElementSibling;
      openBody.style.maxHeight = openBody.scrollHeight + "px";
      openBody.offsetHeight; // fuerza reflow
      openBody.style.maxHeight = "0";
      openBody.style.overflow = "hidden";
      openBody.classList.remove("open");
      if (prevHeader) prevHeader.setAttribute("aria-expanded", "false");
    }
  });
  const isOpen = body.classList.contains("open");
  if (isOpen) {
    const currentHeight = body.scrollHeight;
    body.style.maxHeight = currentHeight + "px";
    body.offsetHeight;
    body.style.maxHeight = "0";
    body.style.overflow = "hidden";
    header.setAttribute("aria-expanded", "false");

    body.addEventListener("transitionend", () => {
      body.classList.remove("open");
      body.style.overflow = "hidden";
    }, { once: true });
  } else {
    body.classList.add("open");
    body.style.overflow = "hidden";
    body.style.maxHeight = "0";

    requestAnimationFrame(() => {
      const targetHeight = body.scrollHeight;
      body.style.maxHeight = targetHeight + "px";
    });

    body.addEventListener("transitionend", () => {
      body.style.maxHeight = "none";
      body.style.overflow = "visible";
    }, { once: true });

    header.setAttribute("aria-expanded", "true");
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