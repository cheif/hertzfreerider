const express = require('express')
const app = express()
const freerider = require('./freerider')

app.use(express.static('static'))

app.get('/', (req, res) => {
  res.sendFile(__dirname+'/index.html')
})

const getNorthMost = (trip) =>
  trip.directions.routes[0].bounds.northeast.lat

const replace = (lst, search, replace) =>
  lst.map((eln) => eln == search ? replace : eln)

const equals = (a, b, fields) => {
  return fields.reduce((bool, field) => {
    return bool && a[field] == b[field]}, true)
}

app.get('/trips', (req, res) => {
  freerider.getTrips().then(trips => {
    res.status(200).send(
      trips.slice(10)
        .reduce((trips, trip) => {
          const inList = trips.find((eln) => equals(trip, eln, ['from', 'to']))
          if (inList) {
            // Update no trips
            return replace(trips, inList, Object.assign(
              {}, inList, {count: inList.count + 1}))
          }
          return trips.concat(Object.assign({}, trip, {count: 1}))
        }, [])
        .sort((a, b) => getNorthMost(b) - getNorthMost(a)))
  }, err => res.status(500).send(err))
})

app.listen('8080')
