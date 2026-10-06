let FRASES_OPORTUNAS = [];
let corrienteSeleccionada = 'aleatorio';
let fraseActual = null;
let promesaCarga = null;
let ultimoFondoIndice = -1;

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

// DIBUJAR RELOJ DE ARENA EN CANVAS CON ARENA ACUMULADA (IGUAL AL LOGO WEB)
function dibujarIconoReloj(ctx, x, y, size) {
  ctx.save();
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  // Marcos superior e inferior
  ctx.moveTo(x - size/2, y - size/2);
  ctx.lineTo(x + size/2, y - size/2);
  ctx.moveTo(x - size/2, y + size/2);
  ctx.lineTo(x + size/2, y + size/2);

  // Cuerpo del reloj (embudo cruzado)
  ctx.moveTo(x + size/2.2, y - size/2);
  ctx.lineTo(x, y);
  ctx.lineTo(x - size/2.2, y + size/2);

  ctx.moveTo(x - size/2.2, y - size/2);
  ctx.lineTo(x, y);
  ctx.lineTo(x + size/2.2, y + size/2);

  // Líneas de arena en la parte inferior (igual que el SVG del logo)
  ctx.moveTo(x - size/4, y + size/4);
  ctx.lineTo(x + size/4, y + size/4);

  ctx.moveTo(x - size/3, y + size/2.8);
  ctx.lineTo(x + size/3, y + size/2.8);

  ctx.stroke();
  ctx.restore();
}

// GENERADOR DE 5 FONDOS DISTINTOS QUE NUNCA SE REPITEN CONSECUTIVAMENTE
function aplicarFondoAleatorio(ctx, W, H) {
  const totalFondos = 5;
  let nuevoIndice;

  do {
    nuevoIndice = Math.floor(Math.random() * totalFondos);
  } while (nuevoIndice === ultimoFondoIndice && totalFondos > 1);

  ultimoFondoIndice = nuevoIndice;

  switch (nuevoIndice) {
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

    case 2: // 3. Aurora Celeste (Luz superior e inferior)
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

  // 1. Fondo (Garantiza variedad en cada descarga)
  aplicarFondoAleatorio(ctx, W, H);

  // Marco exterior
  ctx.save();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(45, 45, W - 90, H - 90, 40);
  ctx.stroke();
  ctx.restore();

  // 2. Branding superior
  const brandY = 160;
  dibujarIconoReloj(ctx, W / 2, brandY, 42);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px 'Nunito', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FRASE OPORTUNA", W / 2, brandY + 55);

  ctx.fillStyle = "#38BDF8";
  ctx.font = "extrabold 18px 'Nunito', sans-serif";
  ctx.fillText("SABIDURÍA UNIVERSAL", W / 2, brandY + 82);

  // Etiqueta de Categoría (Sin el emoji de reloj redundante)
  const tagW = 420;
  const tagH = 58;
  const tagX = (W - tagW) / 2;
  const tagY = brandY + 115;

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
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
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
    const testLine = reflLine + reflWords[m] + ' ';
    if (ctx.measureText(testLine).width > reflBoxW - 80 && m > 0) {
      reflLines.push(reflLine.trim());
      reflLine = reflWords[m] + ' ';
    } else {
      reflLine = testLine;
    }
  }
  reflLines.push(reflLine.trim());

  const reflBoxH = 110 + (reflLines.length * reflLineHeight);

  // Centrado vertical
  const alturaComilla = 90;
  const alturaFragmento = fragmentLines.length * lineHeightFragmento;
  const espacioAutor = 130;
  const espacioReflexion = 60;

  const alturaTotal = alturaComilla + alturaFragmento + espacioAutor + espacioReflexion + reflBoxH;

  const zonaTop = tagY + tagH + 40;
  const zonaBottom = H - 130;
  const zonaUtil = zonaBottom - zonaTop;

  let currentY = zonaTop + Math.max(10, (zonaUtil - alturaTotal) / 2);

  // 5. Comilla Gigante Central
  ctx.fillStyle = "#38BDF8";
  ctx.font = "italic bold 120px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("“", W / 2, currentY + 80);

  currentY += alturaComilla + 35;

  // 6. Fragmento Principal
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "500 64px 'Roboto', sans-serif";
  ctx.textAlign = "center";

  for (let i = 0; i < fragmentLines.length; i++) {
    ctx.fillText(fragmentLines[i], W / 2, currentY + (i * lineHeightFragmento));
  }

  currentY += alturaFragmento + 25;

  // Viñeta divisoria ❧
  ctx.fillStyle = "#38BDF8";
  ctx.font = "32px Georgia, serif";
  ctx.fillText("❧", W / 2, currentY);

  ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo((W / 2) - 200, currentY - 10);
  ctx.lineTo((W / 2) - 35, currentY - 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo((W / 2) + 35, currentY - 10);
  ctx.lineTo((W / 2) + 200, currentY - 10);
  ctx.stroke();

  currentY += 55;

  // Autor
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 40px 'Nunito', sans-serif";
  ctx.fillText(fraseActual.autor.toUpperCase(), W / 2, currentY);

  currentY += 45;

  // Obra
  ctx.fillStyle = "#CBD5E1";
  ctx.font = "300 30px 'Roboto', sans-serif";
  ctx.fillText(fraseActual.obra, W / 2, currentY);

  currentY += 60;

  // 7. Pausa de Reflexión
  const reflBoxY = currentY;

  ctx.save();
  ctx.fillStyle = "rgba(18, 28, 56, 0.85)";
  ctx.beginPath();
  ctx.roundRect(reflBoxX, reflBoxY, reflBoxW, reflBoxH, 32);
  ctx.fill();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();

  // Título cuadro
  ctx.fillStyle = "#38BDF8";
  ctx.font = "bold 26px 'Nunito', sans-serif";
  ctx.fillText("❧  PAUSA DE REFLEXIÓN  ❧", W / 2, reflBoxY + 52);

  // Texto de reflexión
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "300 38px 'Roboto', sans-serif";

  for (let k = 0; k < reflLines.length; k++) {
    ctx.fillText(reflLines[k], W / 2, reflBoxY + 115 + (k * reflLineHeight));
  }

  // 8. Pie de página
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "bold 24px 'Nunito', sans-serif";
  ctx.fillText("Frase Oportuna • Sabiduría Universal", W / 2, H - 75);

  // Exportar PNG
  try {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = `Frase-Oportuna-${fraseActual.autor.replace(/\s+/g, '-')}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    mostrarToast("Lámina generada para Stories.");
  } catch (e) {
    mostrarToast("No fue posible generar la imagen en este dispositivo.");
  }
}

function mostrarToast(mensaje) {
  const toast = document.getElementById('toast-notificacion');
  const toastTexto = document.getElementById('toast-mensaje');
  if (!toast || !toastTexto) return;
  toastTexto.textContent = mensaje;
  
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

function irA(seccion, e) {
  if (e) e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('nav-btn-inicio')?.classList.add('nav-activo');
  document.getElementById('nav-btn-proposito')?.classList.remove('nav-activo');
}

function irAProposito(e) {
  if (e) e.preventDefault();
  const elem = document.getElementById('seccion-proposito-home');
  if (elem) {
    elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('nav-btn-proposito')?.classList.add('nav-activo');
    document.getElementById('nav-btn-inicio')?.classList.remove('nav-activo');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const elYear = document.getElementById('year-copy');
  if (elYear) elYear.textContent = new Date().getFullYear();
  
  cargarFrasesJSON();
});
