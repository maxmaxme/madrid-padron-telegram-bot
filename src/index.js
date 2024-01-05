const {Telegraf} = require('telegraf');
const dotenv = require('dotenv');

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

async function fetchResult() {
  return fetch("https://servpub.madrid.es/GNSIS_WBCIUDADANO/horarioTramite.do", {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: (new URLSearchParams({
      idOficinaEdicion: "102",
      idFamiliaCitaEdicion: "321",
      valido: "true",
      idCategoria: "162",
      idFamiliaCita: "321",
      pais: "ESPAÑA",
      provincia: "MADRID",
      poblacion: "MADRID",
      idOficina: "102",
    })).toString(),
    method: "POST"
  })
    .then(response => response.text())
    .then(html => !html.includes('Las citas disponibles en esta oficina han sido reservadas recientemente, consulte otra oficina con disponibilidad.'))
}

fetchResult()
  .then(async (result) => {
    if (!result) {
      console.log('No cita found')
      return
    }
    await bot.telegram.sendMessage(process.env.TG_CHAT_ID, 'Found a cita https://servpub.madrid.es/GNSIS_WBCIUDADANO/horarioTramite.do')
  })
