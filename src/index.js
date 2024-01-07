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
}

function hasCita(html) {
  return !html.includes('Las citas disponibles en esta oficina han sido reservadas recientemente, consulte otra oficina con disponibilidad.')
}

function leadZero(number) {
  return number.toString().padStart(2, '0')
}

async function checkCita() {
  return fetchResult()
    .then(result => {
      if (!hasCita(result)) {
        console.log('No cita found')
        return
      }
      const regex = /^\s*var diasDisponibles = JSON\.parse\('(.*)'\);\s*$/gm;
      const match = regex.exec(result);
      if (!match) {
        console.log('No match found')
        return
      }
      const diasDisponibles = JSON.parse(match[1]);

      const firstDay = diasDisponibles[0];
      const date = new Date(`${firstDay.ano}-${leadZero(firstDay.mes)}-${leadZero(firstDay.dia)}T00:00:00.000Z`); // `2021-06-01T00:00:00.000Z
      const inNDays = Math.round((date - new Date()) / (1000 * 60 * 60 * 24));
      if (inNDays > 7) {
        console.log(`Cita found but too far away (${inNDays} days)`)
        return
      }
      const firstDayDate = `${leadZero(firstDay.dia)}.${leadZero(firstDay.mes)}.${firstDay.ano}`
      const message = `Found a cita for ${firstDayDate}: https://servpub.madrid.es/GNSIS_WBCIUDADANO/horarioTramite.do`
      return bot.telegram.sendMessage(process.env.TG_CHAT_ID, message)
    })
    .then(async () => {
      await new Promise(r => setTimeout(r, 1000));
      checkCita()
    })
}

checkCita()


