const API_URL = "https://script.google.com/macros/s/AKfycbzJ6S0IWZDKvj9ihsXoe3dI4U1HZhhV37Gg1MVdLTBFiR26uCbWnCFZXugYfKP11w9Q/exec";

const canvas = document.getElementById("court");
const ctx = canvas.getContext("2d");

// dibujar cancha simple
ctx.fillStyle = "#f5f5f5";
ctx.fillRect(0, 0, canvas.width, canvas.height);

canvas.addEventListener("click", async (e) => {
  const rect = canvas.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // dibujar tiro
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fill();

  await guardarTiro(x, y);
});

async function guardarTiro(x, y) {
  const data = encodeURIComponent(JSON.stringify([
    Date.now(),
    "partido1",
    "jugador1",
    "tiro",
    x,
    y,
    1,
    new Date().toISOString()
  ]));

  try {
    const res = await fetch(
      `${API_URL}?action=append&sheet=acciones&data=${data}`
    );

    const json = await res.json();
    console.log("guardado", json);

  } catch (err) {
    console.error(err);
  }
}