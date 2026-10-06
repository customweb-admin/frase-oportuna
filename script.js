let FRASES_OPORTUNAS = [];
let corrienteSeleccionada = 'aleatorio';
let fraseActual = null;
let promesaCarga = null;

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

function descargarLámina() {
  if (!fraseActual) return;

  const canvas = document.getElementById('canvas-export');
  const ctx = canvas.getContext('2d');
  const W = 1080;
  const H = 1920;

  ctx.fillStyle = "#0A1124";
  ctx.fillRect(0, 0, W, H);

  const cardX = 70;
  const cardY = 100;
  const cardW = W - 140;
  const cardH = H - 200;
  const radius = 52;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 45;
  ctx.shadowOffsetY = 18;
  
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.strokeStyle = "#E2E2DC";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  const tagW = 440;
  const tagH = 64;
  const tagX = (W - tagW) / 2;
  const tagY = cardY + 55;
  
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagW, tagH, 32);
  ctx.fillStyle = "#F3F3EE";
  ctx.fill();
  ctx.strokeStyle = "#E2E2DC";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.font = "bold 23px 'Nunito', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`⌛ ${fraseActual.categoria.toUpperCase()}`, W / 2, tagY + 41);

  const maxWidth = cardW - 100;
  const lineHeightFragmento = 86;
  ctx.font = "400 56px 'Roboto', sans-serif";

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

  const reflBoxW = cardW - 80;
  const reflBoxX = (W - reflBoxW) / 2;
  const reflLineHeight = 52;
  ctx.font = "300 34px 'Roboto', sans-serif";

  const reflWords = fraseActual.metafora.split(' ');
  let reflLine = '';
  let reflLines = [];

  for (let m = 0; m < reflWords.length; m++) {
    const testLine = reflLine + reflWords[m] + ' ';
    if (ctx.measureText(testLine).width > reflBoxW - 60 && m > 0) {
      reflLines.push(reflLine.trim());
      reflLine = reflWords[m] + ' ';
    } else {
      reflLine = testLine;
    }
  }
  reflLines.push(reflLine.trim());

  const reflBoxH = 95 + (reflLines.length * reflLineHeight);

  const alturaFragmento = fragmentLines.length * lineHeightFragmento;
  const espacioSeparador = 70;
  const alturaAutorObra = 100;
  const espacioAntesReflexion = 60;

  const alturaTotalBloque = alturaFragmento + espacioSeparador + alturaAutorObra + espacioAntesReflexion + reflBoxH;

  const zonaUtilTop = tagY + tagH + 25;
  const zonaUtilBottom = cardY + cardH - 120;
  const zonaUtilH = zonaUtilBottom - zonaUtilTop;

  let currentY = zonaUtilTop + Math.max(10, (zonaUtilH - alturaTotalBloque) / 2);

  ctx.fillStyle = "#111827";
  ctx.font = "400 56px 'Roboto', sans-serif";
  ctx.textAlign = "center";

  const firstLineWidth = ctx.measureText(fragmentLines[0]).width;
  const firstLineX = (W / 2) - (firstLineWidth / 2);
  ctx.save();
  ctx.font = "italic 76px 'Playfair Display', Georgia, serif";
  ctx.fillStyle = "#111827";
  ctx.textAlign = "right";
  ctx.fillText("“", firstLineX - 14, currentY + 16);
  ctx.restore();

  for (let i = 0; i < fragmentLines.length; i++) {
    ctx.fillStyle = "#111827";
    ctx.font = "400 56px 'Roboto', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(fragmentLines[i], W / 2, currentY + (i * lineHeightFragmento));
  }

  const lastLineIndex = fragmentLines.length - 1;
  const lastLineWidth = ctx.measureText(fragmentLines[lastLineIndex]).width;
  const lastLineX = (W / 2) + (lastLineWidth / 2);
  ctx.save();
  ctx.font = "italic 76px 'Playfair Display', Georgia, serif";
  ctx.fillStyle = "#111827";
  ctx.textAlign = "left";
  ctx.fillText("”", lastLineX + 14, currentY + (lastLineIndex * lineHeightFragmento) + 16);
  ctx.restore();

  currentY += alturaFragmento + 25;

  ctx.textAlign = "center";
  ctx.fillStyle = "#111827";
  ctx.font = "28px Georgia, serif";
  ctx.fillText("❧", W / 2, currentY + 10);

  ctx.strokeStyle = "#E2E2DC";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo((W / 2) - 220, currentY);
  ctx.lineTo((W / 2) - 30, currentY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo((W / 2) + 30, currentY);
  ctx.lineTo((W / 2) + 220, currentY);
  ctx.stroke();

  currentY += 55;

  ctx.textAlign = "center";
  ctx.fillStyle = "#111827";
  ctx.font = "bold 36px 'Nunito', sans-serif";
  ctx.fillText(fraseActual.autor.toUpperCase(), W / 2, currentY);

  currentY += 42;

  ctx.fillStyle = "#4B5563";
  ctx.font = "300 28px 'Roboto', sans-serif";
  ctx.fillText(fraseActual.obra, W / 2, currentY);

  currentY += 55;

  const reflBoxY = currentY;

  ctx.fillStyle = "#F3F3EE";
  ctx.beginPath();
  ctx.roundRect(reflBoxX, reflBoxY, reflBoxW, reflBoxH, 28);
  ctx.fill();
  ctx.strokeStyle = "#E2E2DC";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#111827";
  ctx.font = "bold 24px 'Nunito', sans-serif";
  ctx.fillText("❧  PAUSA DE REFLEXIÓN  ❧", W / 2, reflBoxY + 48);

  ctx.fillStyle = "#374151";
  ctx.font = "300 34px 'Roboto', sans-serif";

  for (let k = 0; k < reflLines.length; k++) {
    ctx.fillText(reflLines[k], W / 2, reflBoxY + 106 + (k * reflLineHeight));
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#111827";
  ctx.font = "bold 25px 'Nunito', sans-serif";
  ctx.fillText("Frase Oportuna • Sabiduría Universal", W / 2, cardY + cardH - 65);

  ctx.fillStyle = "#6B7280";
  ctx.font = "400 20px 'Roboto', sans-serif";
  ctx.fillText("frase-oportuna.vercel.app", W / 2, cardY + cardH - 35);

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
