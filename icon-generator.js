// Este es un ícono básico en forma de data URI
// Un círculo azul con la letra "M" dentro
const canvas = document.createElement('canvas');
canvas.width = 192;
canvas.height = 192;
const ctx = canvas.getContext('2d');

// Dibujar un círculo azul
ctx.fillStyle = '#3b82f6';
ctx.beginPath();
ctx.arc(96, 96, 80, 0, Math.PI * 2);
ctx.fill();

// Dibujar la letra M
ctx.fillStyle = 'white';
ctx.font = 'bold 100px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('M', 96, 96);

// Convertir a data URL
const dataUrl = canvas.toDataURL('image/png');
console.log(dataUrl);

// Puedes usar este dataUrl en un elemento img para verificar cómo se ve
const img = document.createElement('img');
img.src = dataUrl;
document.body.appendChild(img);
