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
  2: { texto: "Pronto", clase: "pronto", icono:'<i class="fa-solid fa-clock"></i>' }
};

// --- DATOS DE PARTIDOS ---
const matches = [
  {
    hora: "18:45",
    liga: 4,
    partido: "Atletico vs St. Gilloise",
    estado: 1,
    canales: [
      { nombre: "ESPN 2", url: "https://www.espn.com" }
    ]
  },
  {
    hora: "21:00",
    liga: 4,
    partido: "Liverpool vs Real Madrid",
    estado: 1,
    canales: [
      { nombre: "ESPN", url: "https://www.espn.com" },
      { nombre: "Disney+", url: "https://www.starplus.com" }
    ]
  },
  {
    hora: "21:00",
    liga: 4,
    partido: "PSG vs Bayern",
    estado: 2,
    canales: [
      { nombre: "ESPN 2", url: "https://www.dazn.com" },
      { nombre: "Disney+", url: "https://www.starplus.com" },
      { nombre: "Sky Sports", url: "https://www.skysports.com" }
    ]
  },
  {
    hora: "21:00",
    liga: 4,
    partido: "Juventus vs Sporting",
    estado: 2,
    canales: [
      { nombre: "ESPN 5", url: "https://www.espn.com" }
    ]
  }
];

// --- ELEMENTOS DOM ---
const container = document.getElementById("matches");
const search = document.getElementById("search");

// --- FUNCIÓN DE RENDERIZADO PRINCIPAL ---
function render(list) {
  container.innerHTML = "";
  list.forEach((m, idx) => {
    const logo = logos[m.liga] || "";
    const est = estados[m.estado] || estados[2];

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header" data-index="${idx}" tabindex="0" role="button" aria-expanded="false">
        <div class="left">
          <div class="time">${convertirHoraEspañaALocal(m.hora)}</div>
          <img class="logo" src="${logo}" alt="Logo liga ${m.liga}" loading="lazy">
          <div class="teams" title="${m.partido}">${m.partido}</div>
        </div>
        <div class="status ${est.clase}">${est.icono} ${est.texto}</div>
      </div>
      <div class="card-body" id="body-${idx}">
        ${m.canales.map(c => `
          <div class="channel-link">
            <div class="ch-name">${c.nombre}</div>
            ${m.estado === 1 ? `
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
  const headers = document.querySelectorAll(".card-header");
  headers.forEach(h => {
    h.onclick = () => toggle(h);
    h.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(h); } };
  });

  // Botón "Copiar transmisión"
  document.querySelectorAll(".copiar-btn").forEach(btn => {
    btn.onclick = () => {
      navigator.clipboard.writeText(btn.dataset.url);
      btn.innerHTML = 'Copiado <i class="fa-solid fa-check"></i>';
      setTimeout(() => btn.innerHTML = '<i class="fa-solid fa-clipboard-check"></i> Copiar transmisión', 2000);
    };
  });

  // Botón "Ver en vivo"
  document.querySelectorAll(".ver-btn").forEach(btn => {
    btn.onclick = () => window.open(btn.dataset.url, "_blank");
  });
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

// --- RENDER INICIAL ---
render(matches);
