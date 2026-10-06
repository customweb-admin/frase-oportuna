let FRASES_OPORTUNAS = [];
let corrienteSeleccionada = 'aleatorio';
let fraseActual = null;
let promesaCarga = null;
let contadorFondoRotativo = 0; // Control secuencial estricto para evitar repeticiones de fondo

function cargarFrasesJSON() {
  if (!promesaCarga) {
    promesaCarga = fetch('frases.json')
      .then(res => {
        if (!res.ok) throw new Error('Error al solicitar frases.json');
        return res.json();
      })
      .then(datos => {
        if (Array.isArray(datos) && datos.length > 0) {
          FRASES_OPORTUNAS = datos;
        }
      })
      .catch(err => {
        console.error('Error cargando JSON:', err);
      });
  }
  return promesaCarga;
}

async function consultarCorriente(corriente) {
  await cargarFrasesJSON();

  if (!FRASES_OPORTUNAS || FRASES_OPORTUNAS.length === 0) {
    mostrarToast("Inconveniente al cargar el banco de frases.");
    return;
  }

  corrienteSeleccionada = corriente;

  document.querySelectorAll('#grid-corrientes > button').forEach(b => b.classList.remove('tarjeta-activa'));
  if (corriente !== 'aleatorio') {
    const tarjeta = document.getElementById(`card-${corriente}`);
    if (tarjeta) tarjeta.classList.add('tarjeta-activa');
  }

  const normalizar = (texto) => 
    (texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  let banco = FRASES_OPORTUNAS;
  if (corriente !== 'aleatorio') {
    banco = FRASES_OPORTUNAS.filter(f => 
      normalizar(f.categoria) === normalizar(corriente)
    );
  }

  if (!banco || banco.length === 0) {
    mostrarToast(`No hay frases registradas para ${corriente}.`);
    return;
  }

  let opciones = banco;
  if (fraseActual && banco.length > 1) {
    opciones = banco.filter(f => f.fragmento !== fraseActual.fragmento);
  }

  const indice = Math.floor(Math.random() * opciones.length);
  fraseActual = opciones[indice];

  mostrarCita(fraseActual);
}

function reconsultarMismaCorriente() {
  if (!fraseActual) return;
  consultarCorriente(corrienteSeleccionada);
}

function mostrarCita(cita) {
  if (!cita) return;

  const contenedor = document.getElementById('contenedor-resultado');
  const tarjeta = document.getElementById('tarjeta-lectura');

  tarjeta.classList.remove('anim-revelar');
  void tarjeta.offsetWidth;
  tarjeta.classList.add('anim-revelar');

  document.getElementById('res-categoria-nombre').textContent = cita.categoria;
  document.getElementById('res-fragmento').textContent = cita.fragmento;
  document.getElementById('res-autor').textContent = cita.autor;
  document.getElementById('res-obra').textContent = cita.obra;
  document.getElementById('res-metafora').textContent = cita.metafora;

  const btnReconsultar = document.getElementById('btn-reconsultar-mismo');
  if (corrienteSeleccionada === 'aleatorio') {
    btnReconsultar.textContent = `↻ Otra frase de ${cita.categoria}`;
  } else {
    btnReconsultar.textContent = `↻ Otra frase de esta corriente`;
  }

  contenedor.classList.remove('hidden');

  setTimeout(() => {
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function copiarCitaTexto() {
  if (!fraseActual) return;
  const texto = `“${fraseActual.fragmento}”\n\n— ${fraseActual.autor}, ${fraseActual.obra}\n\nFrase Oportuna • Sabiduría Universal`;
  
  const textArea = document.createElement("textarea");
  textArea.value = texto;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    mostrarToast("Pasaje copiado al portapapeles con éxito.");
  } catch (err) {
    mostrarToast("No fue posible copiar automáticamente.");
  } finally {
    document.body.removeChild(textArea);
  }
}

// DIBUJAR RELOJ DE ARENA EN CANVAS EXACTO AL SVG DEL LOGO WEB
function dibujarIconoReloj(ctx, x, y, size) {
  ctx.save();
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 2.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const scale = size / 24;
  ctx.translate(x - size/2, y - size/2);
  ctx.scale(scale, scale);

  ctx.beginPath();
  // Base y techo
  ctx.moveTo(5, 22); ctx.lineTo(19, 22);
  ctx.moveTo(5, 2); ctx.lineTo(19, 2);

  // Pared derecha
  ctx.moveTo(17, 22);
  ctx.lineTo(17, 17.828);
  ctx.bezierCurveTo(17, 17.298, 16.789, 16.789, 16.414, 16.414);
  ctx.lineTo(12, 12);
  ctx.lineTo(16.414, 7.586);
  ctx.bezierCurveTo(16.789, 7.211, 17, 6.702, 17, 6.172);
  ctx.lineTo(17, 2);

  // Pared izquierda
  ctx.moveTo(7, 22);
  ctx.lineTo(7, 17.828);
  ctx.bezierCurveTo(7, 17.298, 7.211, 16.789, 7.586, 16.414);
  ctx.lineTo(12, 12);
  ctx.lineTo(7.586, 7.586);
  ctx.bezierCurveTo(7.211, 7.211, 7, 6.702, 7, 6.172);
  ctx.lineTo(7, 2);

  // Arena acumulada en el fondo (idéntico al logo)
  ctx.moveTo(11, 16.5); ctx.lineTo(13, 16.5);
  ctx.moveTo(10.5, 19); ctx.lineTo(13.5, 19);

  ctx.stroke();
  ctx.restore();
}

// GENERADOR ROTATIVO DE 5 FONDOS (GARANTIZA NUNCA REPETIR EL MISMO EN DESCARGAS CONSECUTIVAS)
function aplicarFondoAleatorio(ctx, W, H) {
  const fondoIndice = contadorFondoRotativo % 5;
  contadorFondoRotativo++;

  switch (fondoIndice) {
    case 0: // 1. Noche Estelar
      ctx.fillStyle = "#0A1124";
      ctx.fillRect(0, 0, W, H);

      const g1 = ctx.createRadialGradient(W/2, H * 0.45, 50, W/2, H/2, 950);
      g1.addColorStop(0, "#233A5E");
      g1.addColorStop(0.5, "#121D36");
      g1.addColorStop(1, "#070C1B");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#FFFFFF";
      for (let i = 0; i < 220; i++) {
        const starX = Math.random() * W;
        const starY = Math.random() * H;
        const radius = Math.random() * 2.2 + 0.6;
        const alpha = Math.random() * 0.85 + 0.15;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(starX, starY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;

    case 1: // 2. Nebulosa Cobalto
      const g2 = ctx.createLinearGradient(0, 0, W, H);
      g2.addColorStop(0, "#0F172A");
      g2.addColorStop(0.5, "#152342");
      g2.addColorStop(1, "#0A1124");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      const rg2 = ctx.createRadialGradient(W/2, H * 0.45, 30, W/2, H * 0.45, 550);
      rg2.addColorStop(0, "rgba(56, 189, 248, 0.35)");
      rg2.addColorStop(0.6, "rgba(30, 58, 110, 0.2)");
      rg2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = rg2;
      ctx.fillRect(0, 0, W, H);
      break;

    case 2: // 3. Aurora Celeste
      const g3 = ctx.createLinearGradient(0, 0, 0, H);
      g3.addColorStop(0, "#030712");
      g3.addColorStop(0.5, "#0F172A");
      g3.addColorStop(1, "#030712");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, W, H);

      const rg3 = ctx.createRadialGradient(W/2, H * 0.4, 40, W/2, H * 0.4, 650);
      rg3.addColorStop(0, "rgba(125, 211, 252, 0.35)");
      rg3.addColorStop(0.5, "rgba(14, 165, 233, 0.15)");
      rg3.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = rg3;
      ctx.fillRect(0, 0, W, H);
      break;

    case 3: // 4. Pergamino Oscuro
      const g4 = ctx.createRadialGradient(W/2, H/2, 100, W/2, H/2, 900);
      g4.addColorStop(0, "#1A2846");
      g4.addColorStop(0.7, "#0D162A");
      g4.addColorStop(1, "#050814");
      ctx.fillStyle = g4;
      ctx.fillRect(0, 0, W, H);
      break;

    case 4: // 5. Resplandor Azul Zafiro
      const g5 = ctx.createLinearGradient(0, 0, W, H);
      g5.addColorStop(0, "#08101E");
      g5.addColorStop(1, "#02040A");
      ctx.fillStyle = g5;
      ctx.fillRect(0, 0, W, H);

      const rg5 = ctx.createRadialGradient(W/2, H * 0.42, 20, W/2, H * 0.42, 600);
      rg5.addColorStop(0, "rgba(56, 189, 248, 0.4)");
      rg5.addColorStop(0.4, "rgba(24, 45, 85, 0.3)");
      rg5.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = rg5;
      ctx.fillRect(0, 0, W, H);
      break;
  }
}

function descargarLámina() {
  if (!fraseActual) return;

  const canvas = document.getElementById('canvas-export');
  const ctx = canvas.getContext('2d');
  const W = 1080;
  const H = 1920;

  // 1. Fondo rotativo (Secuencia 1 -> 2 -> 3 -> 4 -> 5 -> 1...)
  aplicarFondoAleatorio(ctx, W, H);

  // Marco exterior
  ctx.save();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(45, 45, W - 90, H - 90, 40);
  ctx.stroke();
  ctx.restore();

  // 2. Branding superior con el trazo SVG idéntico al logo
  const brandY = 160;
  dibujarIconoReloj(ctx, W / 2, brandY, 48);

  ctx.fillStyle = "#CBD5E1";
  ctx.font = "bold 28px 'Nunito', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FRASE OPORTUNA", W / 2, brandY + 62);

  ctx.fillStyle = "#38BDF8";
  ctx.font = "extrabold 18px 'Nunito', sans-serif";
  ctx.fillText("SABIDURÍA UNIVERSAL", W / 2, brandY + 88);

  // Etiqueta de Categoría (Sin ícono ni emoji redundante dentro)
  const tagW = 420;
  const tagH = 58;
  const tagX = (W - tagW) / 2;
  const tagY = brandY + 120;

  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagW, tagH, 29);
  ctx.fillStyle = "rgba(18, 28, 56, 0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = "#7DD3FC";
  ctx.font = "bold 22px 'Nunito', sans-serif";
  ctx.fillText(fraseActual.categoria.toUpperCase(), W / 2, tagY + 37);

  // 3. Texto vertical en el lateral derecho
  ctx.save();
  ctx.translate(W - 68, H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = "rgba(203, 213, 225, 0.55)";
  ctx.font = "500 20px 'Roboto', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("frase-oportuna.vercel.app", 0, 0);
  ctx.restore();

  // 4. Preparación de Textos
  const maxWidth = W - 240;
  const lineHeightFragmento = 96;
  ctx.font = "500 64px 'Roboto', sans-serif";

  const words = fraseActual.fragmento.split(' ');
  let line = '';
  let fragmentLines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      fragmentLines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  fragmentLines.push(line.trim());

  // Preparar Pausa de Reflexión
  const reflBoxW = W - 220;
  const reflBoxX = (W - reflBoxW) / 2;
  const reflLineHeight = 56;
  ctx.font = "300 38px 'Roboto', sans-serif";

  const reflWords = fraseActual.metafora.split(' ');
  let reflLine = '';
  let reflLines = [];

  for (let m = 0; m < reflWords.length; m++) {
    const testLine =
