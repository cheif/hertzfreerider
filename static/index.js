/* global google, React, ReactDOM */
const map = new google.maps.Map(document.getElementById('map'), {
  center: {lat: 62.5831905, lng: 16.4901807},
  zoom: 5,
})

const hslToRgb = (_h, s, l) => {
  var h = Math.min(_h, 359)/60

  var c = (1-Math.abs((2*l)-1))*s
  var x = c*(1-Math.abs((h % 2)-1))
  var m = l - (0.5*c)

  var r = m, g = m, b = m

  if (h < 1) {
    r += c, g = +x, b += 0
  } else if (h < 2) {
    r += x, g += c, b += 0
  } else if (h < 3) {
    r += 0, g += c, b += x
  } else if (h < 4) {
    r += 0, g += x, b += c
  } else if (h < 5) {
    r += x, g += 0, b += c
  } else if (h < 6) {
    r += c, g += 0, b += x
  } else {
    r = 0, g = 0, b = 0
  }

  return `rgb(${Math.floor(r*255)},${Math.floor(g*255)},${Math.floor(b*255)}`
}

const createSpectrum = function(length) {
  var colors = []
  // 270 because we don't want the spectrum to circle back
  var step = 270/length
  for (var i = 1; i <= length; i++) {
    var color = hslToRgb((i)*step, 0.5, 0.5)
    colors.push(color)
  }

  return colors
}

const renderTripOnMap = (trip, color) => {
  const route = trip.directions.routes[0]
  const path = google.maps.geometry.encoding.decodePath(
    route.overview_polyline.points)
  const polyline = new google.maps.Polyline({
    path: path,
    visible: true,
    zIndex: 0,
    strokeColor: color,
  })
  polyline.setMap(map)
  window.poly = polyline
  return polyline
}

const Trip = React.createClass({
  getInitialState() {
    return {highlighted: false}
  },
  highlight() {
    this.setState({highlighted: true})
    this.props.polyline.setOptions({
      zIndex: 1000,
      strokeWeight: 6,
    })
    this.props.makeVisible(ReactDOM.findDOMNode(this))
  },
  unHighlight() {
    this.setState({highlighted: false})
    this.props.polyline.setOptions({
      zIndex: 0,
      strokeWeight: 3,
    })
  },
  componentWillMount() {
    // Add handlers for hovering over our polyline
    google.maps.event.addListener(this.props.polyline, 'mouseover', () => {
      this.highlight()
      google.maps.event.addListener(this.props.polyline, 'mouseout', () => {
        this.unHighlight()
      })
    })
  },
  render() {
    const trip = this.props
    return React.createElement(
      'div',
      {
        className: `trip${this.state.highlighted ? ' highlighted' : ''}`,
        onMouseOver: this.highlight,
        onMouseOut: this.unHighlight,
      },
      React.createElement('div', {className: 'noRides'}, `${trip.count}`),
      React.createElement(
        'div', {className: 'info'},
        React.createElement('h4', null, `${trip.from} -> ${trip.to}`),
        `${trip.startDate} - ${trip.endDate}`,
        React.createElement('span', null, `${trip.carType}`)
      ),
      React.createElement('div', {style: {clear: 'both', float: 'none'}})
    )
  },
})

const Trips = React.createClass({
  centerOnNode(node) {
    const container = ReactDOM.findDOMNode(this).parentElement
    if (node.offsetTop > container.scrollTop + container.offsetHeight ||
        node.offsetTop < container.scrollTop) {
      container.scrollTop = node.offsetTop - container.offsetTop
    }
  },
  render() {
    return React.createElement(
      'div', {className: 'tripList'},
      React.createElement('h2', null, 'Bilar just nu'),
      this.props.trips.map((trip, id) => {
        trip.key = id
        trip.makeVisible = (node) => this.centerOnNode(node)
        return React.createElement(Trip, trip)
      }))
  },
})

fetch('/trips').then(resp => resp.json()).then(trips => {
  const colors = createSpectrum(trips.length)

  trips.forEach((trip, i) => {
    const color = colors[i]
    trip.polyline = renderTripOnMap(trip, color)
  })
  ReactDOM.render(
    React.createElement(Trips, {trips: trips}),
    document.getElementById('content')
  )
})
