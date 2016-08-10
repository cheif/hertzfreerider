const fs = require('fs')
const cheerio = require('cheerio')
const request = require('request')
const GoogleMapsAPI = require('googlemaps')

const maps = new GoogleMapsAPI({
  key: 'AIzaSyCI_zButnYg1jAyUqIQNN5ijMTtRRJSoD0',
})

const _getTripsFromWeb = () => {
  return new Promise((resolve, reject) => {
    request.get(
      'http://hertzfreerider.se/unauth/list_transport_offer.aspx',
      (err, resp, body) => {
        let $ = cheerio.load(body)
        let trs = $('tr.highlight')
        //console.log(trs)
        let trips = []
        trs.each((id, html) => {
          let eln = $(html)
          let stations = eln.find('a')
          let from = stations.first().text()
          let to = stations.last().text()

          let infoEln = eln.next()
          let info = infoEln.find('span')
          let [startDate, endDate] = [info.first().text(), info.eq(1).text()]
          let carType = info.last().text()
          trips.push({
            from: from,
            to: to,
            startDate: startDate,
            endDate: endDate,
            carType: carType,
          })
          return ''
        })

        return Promise.all(trips.map(trip => {
          return new Promise(resolve => {
            maps.directions({
              origin: trip.from,
              destination: trip.to,
            }, (err, res) => {
              if (res.status === 'OK') {
                trip.directions = res
              } else {
                // Don't handle that some trips don't have directions right
                // now, just log it
                console.error('Could not fetch directions for trip:', trip, ', google response:', res) // eslint-disable-line
              }
              resolve(trip)
            })
            return
          })
        })).then(trips => resolve(trips.filter(t => t.directions)), reject)
      })
  })
}

module.exports.getTrips = () => {
  return new Promise((resolve, reject) => {
    fs.stat('./trips.json', (err, stats) => {
      if (!stats || (new Date() - stats.mtime) > 60*60*1000) {
        // No cached data, or to old
        return _getTripsFromWeb().then(trips => {
          fs.writeFile('./trips.json', JSON.stringify(trips), (err) => {
            if (err) {
              return reject(err)
            }
            return resolve(trips)
          })
        }, reject)
      } else {
        // Use cached data
        fs.readFile('./trips.json', (err, data) => {
          if (err) {
            return reject(err)
          }
          return resolve(JSON.parse(data))
        })
      }
    })
  })
}


if (require.main === module) {
  module.exports.getTrips().then(trips => {
    console.log(trips) // eslint-disable-line
  }, console.error) // eslint-disable-line
}
