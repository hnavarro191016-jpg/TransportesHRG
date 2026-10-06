const fs = require('fs');
let text = fs.readFileSync('src/pages/MonitoreoView.jsx', 'utf8');

text = text.replace(/subm[^\s]+dulo/g, 'submódulo');
text = text.replace(/ubicaci[^\s]+n/g, 'ubicación');
text = text.replace(/Cam[^\s]+n/g, 'Camión');
text = text.replace(/Desconocid[^\s]+/g, 'Desconocido');
// "GarcÃƒÂ­a"
text = text.replace(/Garc[^\s]+a/g, 'García');

fs.writeFileSync('src/pages/MonitoreoView.jsx', text, 'utf8');
