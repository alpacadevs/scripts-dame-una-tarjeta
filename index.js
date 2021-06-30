const { load } = require('cheerio')
const axios = require('axios')
const _has = require('lodash/has')

const fixExpireDate = date => {
  const [month, year] = date.split('/')
  const currentDate = new Date()
  const expireDate = new Date(year, month)
  const isDateExpired = currentDate > expireDate
  if (!isDateExpired) return date
  const fixedYear = currentDate.getFullYear() + 1
  return `${month}/${fixedYear}`
}

const mainUrl = 'https://generatarjetasdecredito.com/generador-tarjetas-'

const urls = {
  'visa': mainUrl + 'visa.php',
  'american express': mainUrl + 'american-express.php',
  'discover': mainUrl + 'discover.php',
  'mastercard':mainUrl + 'mastercard.php'
}

module.exports = function(app) {
  app.message(/dame una (visa|mastercard|discover|american express)/i, async (todo) => {
    const { context, say } = todo
    const match = context.matches[1].toLowerCase()

    if (!_has(urls, match)) {
      return say('No existe esa tarjeta')
    }
    
    axios.get(urls[match])
    .then(({ data }) => {
      try {
          const dom = load(data)
          const creditCardNumberNode = dom('.venta')
          const creditCardNumber = creditCardNumberNode.text()
          const cvv = creditCardNumberNode.next().text().split(': ')[1]
          const expireDate = creditCardNumberNode.next().next().text().split(': ')[1]
          say({
            "text": `Tu tarjeta ${match} es:`,
            "attachments": [
              {
                  "text": `Nº: ${creditCardNumber}\nVence: ${fixExpireDate(expireDate)}\nCVV: ${cvv}`
              },
            ]
          })
        } catch (error) {
          say('API error:', error)
        }
    })
    .catch(e => {
      say('Request error: ', e)
    })
  })
}

