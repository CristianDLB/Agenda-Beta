// Logos de ligas
const logos = {
  1: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v5/Competitions/11", // LaLiga
  2: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v12/Competitions/7", // Premier League
  3: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v3/Competitions/17", // Serie A
  4: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v5/Competitions/572", // Champions League
  5: "https://imagecache.365scores.com/image/upload/f_png,w_32,c_limit,q_auto:eco/v6/Competitions/102", // Libertadores
  6: "https://imagecache.365scores.com/image/upload/f_png,w_24,h_24,c_limit,q_auto:eco,dpr_2/v4/Competitions/72", // Liga Profesional
  7: "https://imagecache.365scores.com/image/upload/f_png,w_24,h_24,c_limit,q_auto:eco,dpr_2/v3/Competitions/583", // Liga 1 Perú
  8: "https://imagecache.365scores.com/image/upload/f_png,w_24,h_24,c_limit,q_auto:eco,dpr_2/v6/Competitions/7685" // Conference League
};

const FINALIZAR_MINUTOS = 180;
const { DateTime } = luxon;

// 📅 DATOS DE PARTIDOS
const matches = [
  {
    fecha: "2025-11-11",
    hora: "18:00",
    liga: 6,
    partido: "Liga 1: Sporting Cristal vs UTC Cajamarca",
    canales: [{ nombre: "ESPN 2", url: "https://www.espn.com" }]
  },
  {
    fecha: "2025-11-11",
    hora: "18:58",
    liga: 7,
    partido: "Liga 1: Los Chankas vs Alianza Lima",
    canales: [{ nombre: "ESPN 2", url: "https://www.espn.com" }]
  },
  {
    fecha: "2025-11-11",
    hora: "20:00",
    liga: 4,
    partido: "Champions League: Brujas vs Barcelona",
    canales: [
      { nombre: "ESPN 2", url: "https://www.espn.com" },
      { nombre: "ESPN", url: "https://www.espn.com" }
    ]
  },
  {
    fecha: "2025-11-12",
    hora: "18:00",
    liga: 8,
    partido: "UEFA Conference League: Noah vs Sigma Olomouc",
    canales: [
      { nombre: "ESPN 2", url: "https://www.espn.com" },
      { nombre: "ESPN", url: "https://www.espn.com" }
    ]
  }
];

// 🕒 FUNCIONES DE TIEMPO
function computeEstadoLocal(m) {
  const tzLocal = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const ahoraLocal = DateTime.now().setZone(tzLocal);
  const [h, min] = m.hora.split(':').map(Number);
  const [y, mo, d] = m.fecha.split('-').map(Number);

  const dtMadrid = DateTime.fromObject(
    { year: y, month: mo, day: d, hour: h, minute: min },
    { zone: 'Europe/Madrid' }
  );

  const dtLocal = dtMadrid.setZone(tzLocal);
  const dtStartLocal = dtLocal.minus({ minutes: 10 }); 
  const dtEndLocal = dtLocal.plus({ minutes: FINALIZAR_MINUTOS });

  let estado = 2;
  if (ahoraLocal >= dtStartLocal && ahoraLocal < dtEndLocal) estado = 1;
  if (ahoraLocal >= dtEndLocal) estado = 3;

  return { estado, dtLocal, dtMadrid };
}

// 🧱 RENDER PRINCIPAL
const container = document.getElementById("matches");
const search = document.getElementById("search");

function render(list) {
  container.innerHTML = "";

  const items = list.map(m => {
    const logo = logos[m.liga] || "";
    const { estado, dtLocal, dtMadrid } = computeEstadoLocal(m);
    const origIdx = matches.indexOf(m);
    return { m, origIdx, logo, estado, dtLocal, dtMadrid };
  }).filter(item => item.estado !== 3); // eliminar finalizados

  items.sort((a, b) => a.dtLocal - b.dtLocal);

  items.forEach(({ m, origIdx, logo, estado, dtLocal }) => {
    const horaLocal = dtLocal.toFormat("HH:mm");
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header" data-index="${origIdx}" tabindex="0" role="button" aria-expanded="false">
        <div class="left">
          <div class="time">${horaLocal}</div>
          <img class="logo" src="${logo}" alt="Logo liga ${m.liga}" loading="lazy">
          <div class="teams" title="${m.partido}">${m.partido}</div>
        </div>
      </div>
      <div class="card-body" id="body-${origIdx}">
        ${m.canales.map(c => `
          <div class="channel-link">
            <div class="ch-name">${c.nombre}</div>
            ${estado === 1 ? `
            <div class="channel-actions">
              <button class="channel-btn copiar-btn" data-url="${c.url}">
                <i class="fa-solid fa-clipboard-check"></i> Copiar transmisión
              </button>
              <button class="channel-btn ver-btn" data-url="${c.url}">
                <i class="fa-solid fa-up-right-from-square"></i> Ver en vivo
              </button>
            </div>` : ''}
          </div>`).join("")}
      </div>
    `;
    container.appendChild(card);
  });

  attachHandlers();
}
// 🎛️ INTERACCIÓN
function attachHandlers() {
  // delegación de eventos: más eficiente y evita duplicados
  container.addEventListener("click", (e) => {
    const header = e.target.closest(".card-header");
    const copiar = e.target.closest(".copiar-btn");
    const ver = e.target.closest(".ver-btn");

    if (header) {
      toggle(header);
      return;
    }

    if (copiar) {
      navigator.clipboard.writeText(copiar.dataset.url).then(() => {
        const original = copiar.innerHTML;
        copiar.innerHTML = 'Copiado <i class="fa-solid fa-check"></i>';
        copiar.classList.add("copiado");
        setTimeout(() => {
          copiar.innerHTML = original;
          copiar.classList.remove("copiado");
        }, 1700);
      }).catch(() => {
        // fallback si no hay permiso para clipboard
        const ta = document.createElement("textarea");
        ta.value = copiar.dataset.url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      });
      return;
    }

    if (ver) {
      window.open(ver.dataset.url, "_blank");
      return;
    }
  });
}

function toggle(header) {
  const idx = header.dataset.index;
  const body = document.getElementById(`body-${idx}`);
  if (!body) return;

  const card = header.closest(".card");

  // cerrar otros abiertos (si los hubiera)
  document.querySelectorAll(".card.open").forEach(openCard => {
    if (openCard !== card) {
      openCard.classList.remove("open");
      const ob = openCard.querySelector(".card-body");
      if (ob) {
        ob.classList.remove("open");
        ob.style.maxHeight = "0";
        ob.style.opacity = "0";
        ob.style.transform = "translateY(-8px)";
        openCard.querySelector(".card-header")?.setAttribute("aria-expanded","false");
      }
    }
  });

  const isOpen = card.classList.contains("open");

  if (!isOpen) {
    // abrir
    card.classList.add("open");
    body.classList.add("open");
    // asegurar altura suficiente para evitar "pegado"
    const mh = body.scrollHeight + 24; // + espacio extra
    body.style.maxHeight = mh + "px";
    body.style.opacity = "1";
    body.style.transform = "translateY(0)";
    header.setAttribute("aria-expanded","true");
  } else {
    // cerrar
    card.classList.remove("open");
    body.classList.remove("open");
    body.style.maxHeight = "0";
    body.style.opacity = "0";
    body.style.transform = "translateY(-8px)";
    header.setAttribute("aria-expanded","false");
  }
}

// 🔍 BUSCADOR
search.addEventListener("input", e => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = matches.filter(m => m.partido.toLowerCase().includes(q));
  render(filtered);
});

// 🕓 ACTUALIZADOR AUTOMÁTICO
function updateStates() {
  document.querySelectorAll('.card').forEach(card => {
    const idx = parseInt(card.querySelector('.card-header')?.dataset.index, 10);
    const m = matches[idx];
    if (!m) return;
    const { estado } = computeEstadoLocal(m);
    if (estado === 3) card.remove();
    const actions = card.querySelectorAll('.channel-actions');
    actions.forEach(a => a.style.display = estado === 1 ? 'flex' : 'none');
  });
}

setInterval(() => {
  updateStates();
  location.reload();
}, 30000);

// 📆 FECHA ACTUAL
function mostrarFechaActual() {
  const fecha = new Date();
  const opciones = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  let texto = fecha.toLocaleDateString('es-PE', opciones);
  texto = texto.charAt(0).toUpperCase() + texto.slice(1);
  document.getElementById('fecha-actual').textContent = texto;
}
mostrarFechaActual();

// 🚀 INICIO
updateStates();
render(matches);

window.addEventListener('load', () => {
  setTimeout(() => container.classList.add('loaded'), 120);
});
