const fs = require('fs');
let text = fs.readFileSync('src/pages/MonitoreoView.jsx', 'utf8');

// The file has utf8 bytes interpreted as windows-1252, and then saved back as utf8.
// We can reverse this by encoding the string to latin1 (which extracts the raw bytes), 
// and then decoding it from utf8!

try {
  // Convert the string (which contains mojibake) into a Buffer treating each character as latin1 byte
  const buffer = Buffer.from(text, 'latin1');
  // Read the buffer back as UTF-8
  const fixedText = buffer.toString('utf8');
  
  // If it didn't throw an error and contains "submódulo", it worked!
  if (fixedText.includes('submódulo')) {
    fs.writeFileSync('src/pages/MonitoreoView.jsx', fixedText, 'utf8');
    console.log('Fixed encoding perfectly using Buffer conversion!');
  } else {
     console.log('Buffer conversion did not work perfectly, doing manual replace');
     throw new Error('Manual');
  }
} catch (e) {
  // Manual fallback
  text = text.replace(/Ã¡/g, 'á');
  text = text.replace(/Ã©/g, 'é');
  text = text.replace(/Ã­/g, 'í');
  text = text.replace(/Ã³/g, 'ó');
  text = text.replace(/Ãº/g, 'ú');
  text = text.replace(/Ã±/g, 'ñ');
  text = text.replace(/Ã /g, 'Á');
  text = text.replace(/Ã‰/g, 'É');
  text = text.replace(/Ã /g, 'Í');
  text = text.replace(/Ã“/g, 'Ó');
  text = text.replace(/Ãš/g, 'Ú');
  text = text.replace(/Ã‘/g, 'Ñ');
  
  // Some might be doubly mangled due to PowerShell, e.g., submÃƒÂ³dulo
  text = text.replace(/ÃƒÂ¡/g, 'á');
  text = text.replace(/ÃƒÂ©/g, 'é');
  text = text.replace(/ÃƒÂ­/g, 'í');
  text = text.replace(/ÃƒÂ³/g, 'ó');
  text = text.replace(/ÃƒÂº/g, 'ú');
  text = text.replace(/ÃƒÂ±/g, 'ñ');
  
  fs.writeFileSync('src/pages/MonitoreoView.jsx', text, 'utf8');
  console.log('Fixed encoding manually');
}
