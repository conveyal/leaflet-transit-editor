/**
 * The Leaflet transit editor
 * It is stop/"control point" based. As you draw a line it follows streets (or not), and the control points optionally become stops.
 * You can also tell it to create stops automatically.
 *
 * It's built using a bunch of Leaflet draggable markers; the geometry between them is filled in automatically (eventually using the street network)

 * @author mattwigway
 */

import L from 'leaflet'
import lineString from 'turf-linestring'

/** simple circle marker for control points */
const controlPointIcon = L.icon({
  iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AEWEDoh52T9hgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAABA0lEQVRIx72VsW7CMBBA3/kjkGBtd1aWjhaiEqr/oRNfxNR/OIREhTxmYWWHlUj8hDvU6ZA6FW19vCmSL/ec3OlOGCDEhHrpnqfADBgBV+CgXo79uBIylDjE9AKsgDnD7IG1etkMiUqCMdAAD9zOGXhSL23/wPWSL4DLL5OT4y/5/fIX5MMd/+dZvbx/CUJMAON881pMgFa94HJhGurSdAWX3C1KfQKwccArNqzUCw5YGgnm39q0+j+KaWoqAGbWgpG14GotOJgK1MvRAVuj/PuuTd+MBOsQ0+c0DTGd/jCif9wP6uXxLtPUfh8UNtquVvL77+RMmwsUbmjhLRByfFsK+ABYUWNiAQ1ofgAAAABJRU5ErkJggg==',
  iconRetinaUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AEWEDoTL7OsBgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAACCklEQVRo3u2arW8CQRDFf0sb0uAInqRVaCCpaRU5D6IKW4Hjb8Ehzlb3PKlqDUlBV9EET+pIcwm5Cmab4wrHZ7idpGPOLHvv3bz52B1AuZljN2gOogugDNSAW3lWgJIsmQEfwAgYynMaeGaRGYHmIDJAFegAjwe+2wf6wDjwTHQWAvK1W8ATkD+RCkKgDTwf4hWzB/g74OWEwNcRaQSeeTspgeYgKgC9I6RyiLS6gWfmRxNoDqJrCcD8mZNLCFQCz3xuW5hLAV8DJhmAR945EQz7e0B++O5Iqq8HnhntTEBkM3GsXt1skpNZE7BfGclmW0wU1wV2MgZ6DoK3MdFL9YDk+VfHW5/7ZJ0wsQo7d/TrJ6VUiFdsK6GWAvBWSq0VD0hj9q2EgPXClW0Ac9JVagFvvVCNS6ij8BzTiUsoQqddBp5Z5BSfJsupzZwCq2kncPvvgYytop1ASTsBtBOYaSfwoZ3ASDuB4b8HMrapJeArBO/bY2WO5RW3NuvH68BYjmlaLBTMSwJytmwrItCOD0RsED8r8UIoWFdbCQmIhgICjeQU5zeNyo2XyxnJXze9SdaBrqNSCgVbejcqt78VFw8vm0ZOfyqx3MPXHQJfTxs1bZyROTKlSZ3OpBIQEnqHfDE5Fc+cnXyW05jPXRarH3Tv3E7LxgXg4cSpNpQ9C/uC38sDCW8482ePH5cYptdlRb02AAAAAElFTkSuQmCC',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

/** bus stop (or generic transit vehicle) stop, dark (for stops that have been manually created). Icon from MapBox Maki Icons (CC0) */
const stopIcon = L.icon({
  iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADwSURBVDiNzZM/CsIwFMa/p44lAbFewaHgFHR1yegB7Cm6CB7Bsaeou46l4FpHoUMXD2BBKLiJ1KUtEhJrRcFvCt97/PL+JFQUBb6hnsEfABCG+B1ADODyCtQHMAZgeZ7nJkmyUCmO42x83+8CuAI4VkBSWpu5rrvOsmza1Ipt23EQBCsAe11FVgUJw3Bugkgpd2WeVXmdppvf1f+BTOuHlHLXBvT71jjnKRHdnj0iunHO01YgIcSWMXZ69hhjJyHEVpdvnFEURUvVy/N8pPNfVtRW6heZABhWG9O9biV2BnDQgWpYea4Tm2I60Ef62owe2LdQCE5t/koAAAAASUVORK5CYII=',
  iconRetinaUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAbrwAAG68BXhqRHAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAF5SURBVFiF7Zc/S8NAGIefSpcsBl2cughXKDhmEeduOggZugmBfpZ+CKFzh4MUdOvm4hcQCgou7pV0cRHq0EbOs70/baIp5IEQcnnf3O9+eS+5aywWC6rEwX8L0Gl6xh8DHeDIM28OPAEzW6CvQ2dbiAE4ZDkQKw1LDTWBU6AFBHljt9u981EzmUyulMsP4A14BT7XdWgScw6EPp07EABt4AR41EWZHGoD7dFoJKSU/SzLnCy3EYbhNI7j216v9wI8r45vTDXUAihSDECWZR0pZV/tQ8X0yoL8AWqjVg/OqHWnPDPQ4yr3HaoF2agF2agF2fD923v/x3ypnEO1IBv7L0gIMR4MBjdCiHGRsVsLSpIkjaJoliRJWmRsjve0Hw6H10C6OhcWm2NaMV5Ced8dZV11r7bvf1GXTeUEmWroAmVTqNeS69rakjcHHtT7Joemq4SyeGe5vf6BbecKmlMav0a4a55LDW1yau0Id81zcehPqdwsqwXZ+AKNJoIKmZ6z5wAAAABJRU5ErkJggg==',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
})

/** ghosted version of above */
const ghostedStopIcon = L.icon({
  iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA3XAAAN1wFCKJt4AAAAB3RJTUUH4AIJDzQceS9FTQAAAOFJREFUOMvNlKEOwjAURe/K5BQhTfU+AEXAoqaKq4GPWCb5BOSyn8BD1RR2SNxMPwCBwi1kmHWBptuypGJPNe/dnLx781Kvrmu4KL+jvwCw6ph/ABQAXn2gOYAlgEBKecjzfG9Soig6c85nAN4AHhroGda2aZqelFKbISthGBZJkhwB3GwbBRqSZdmuCxLH8bXRBbpH4KimB/L7cpiWNcZYSQip/sSEVIyxchRICHGhlKrfHqVUCSEuNr15kHxMNs2tSacZmRutAVC9le26jdkTwN0GamHNuxUOzTxX/5GzjL490FEJz2lqvwAAAABJRU5ErkJggg==',
  iconRetinaUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAABuvAAAbrwFeGpEcAAAAB3RJTUUH4AIJDzUBAzIY1QAAAVBJREFUWMPtmDFqwzAUhj8XL15amqVeshQaMPQCpTpCO3Tx2imrD+AD6ABaewMvCbQnyNILFAItdOmiKYUsXQruooBIU1t2FHBBD4SxeU/+9PRb0nNU1zVDsiMGZnFH/xGQAacd49bAC7DynaHLHjAAx2YgrRa1aCgGzoExkGweFkXx2IVGKXVr3X4BH8A78N1lymLgCjjxLJMEmABnwPM2VFOGJqZdSCmnWuvMB02apsuyLB+AN+DVNCcNjQF8wgBorTMp5dR+h+uUJZsOGvTgbLburD6Twa9DASgABaCh7fad97EwZQFo8EBCiLlS6l4IMffp2xsoz/MZsDJXb769gaqqugNG5urN1+XEeHPIdcc6Vz2Fr+xfAzVp6NouCre15Hq2bolbAwvXDC1NwKHs05TXnSrXX5naUbMvfMa5aOivTO0c4b5xUfg/FID2tB9E1X0XSflgsAAAAABJRU5ErkJggg==',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
})

export default class TransitEditorLayer extends L.LayerGroup {
  /**
   * construct with a GeoJSON geometry and a list of which coordinates are stops and which coordinates are control points.
   */
  constructor ({ geometry, stops, controlPoints }) {
    super()

    this.handleClick = this.handleClick.bind(this)

    // state
    this.extendFromEnd = true
    this.followStreets = false

    this.controlPoints = controlPoints
    this.stops = stops

    this.segments = []

    // handle features or raw geojson geometries
    if (geometry.geometry) geometry = geometry.geometry

    // create the segments
    for (let i = 0; i < geometry.coordinates.length - 1; i++) {
      this.segments.push(lineString([geometry.coordinates[i], geometry.coordinates[i + 1]]))
    }

    this.draw()
  }

  addTo (map) {
    super.addTo(map)
    this.map = map
    this.map.on('click', this.handleClick)
  }

  handleClick (e) {
    let coord = [e.latlng.lng, e.latlng.lat]
    // this is a control point and a stop
    this.splice(coord, this.extendFromEnd ? this.segments.length : -1, true, true)
    this.draw()
  }

  /** (re)draw the layer */
  draw () {
    // clear the map
    if (this.markers) {
      this.markers.forEach(m => this.removeLayer(m))
      this.segmentLayers.forEach(l => this.removeLayer(l))
    }

    this.markers = []
    this.segmentLayers = this.segments.map(s => this.getSegmentLayer(s))

    // draw segments
    this.segmentLayers.forEach(l => this.addLayer(l))

    // draw the markers
    for (let i = 0; i < this.segments.length; i++) {
      let controlPoint = this.controlPoints[i]
      let stop = this.stops[i]

      let marker = this.getMarker(this.segments[i].geometry.coordinates[0], controlPoint, stop)
      // will be null if no marker is needed
      if (marker !== null) this.addLayer(marker)
      // add anyhow to preserve positioning
      this.markers.push(marker)
    }

    // add the last marker
    if (this.segments.length > 0) {
      let marker = this.getMarker(this.segments[this.segments.length - 1].geometry.coordinates[1], this.controlPoints[this.segments.length], this.stops[this.segments.length])
      if (marker !== null) this.addLayer(marker)
      // add evin if null to preserve positioning
      this.markers.push(marker)
    }
  }

  /** get a layer to show a segment of the line */
  getSegmentLayer (geometry) {
    return L.geoJson(geometry)
  }

  /** get a marker */
  getMarker (coord, controlPoint, stop) {
    let icon

    // manually placed stop
    if (controlPoint && stop) icon = stopIcon
    // autogenerated stop
    else if (stop && !controlPoint) icon = ghostedStopIcon
    // just a control point
    else if (controlPoint && !stop) icon = controlPointIcon
    // no marker needed, not a stop or control point
    else return null

    // https://twitter.com/tmcw/status/598605684477943808
    return L.marker(L.latLng(coord[1], coord[0]), { icon })
  }

  /** splice in a point, in the middle of segment. flags indicate whether it's a control point and/or a stop. call with segment == -1 to insert at beginning, or segment == segments.length to insert at end */
  splice (coord, segment, controlPoint, stop) {
    if (this.segments.length === 0) {
      if (this.previousPoint) {
        let seg = lineString([this.previousPoint.coord, coord])
        this.segments = [seg]
        this.controlPoints = [this.previousPoint.controlPoint, controlPoint]
        this.stops = [this.previousPoint.stop, stop]
        this.previousPoint = undefined
      } else {
        this.previousPoint = { coord, stop, controlPoint }
      }
    } else if (segment === -1) {
      // insert at beginning
      let seg = lineString([coord, this.segments[0].geometry.coordinates[0]])
      this.segments.unshift(seg)
      this.controlPoints.unshift(controlPoint)
      this.stops.unshift(stop)
    } else if (segment === this.segments.length) {
      // insert at end
      let seg = lineString([this.segments[this.segments.length - 1].geometry.coordinates[1], coord])
      this.segments.push(seg)
      this.controlPoints.push(controlPoint)
      this.stops.push(stop)
    } else {
      let oldSegment = this.segments[segment]

      let newSegment0 = lineString([oldSegment.coordinates[0], coord])
      let newSegment1 = lineString([coord, oldSegment.coordinates[1]])

      this.segments.splice(segment, 1, newSegment0, newSegment1)

      this.controlPoints.splice(segment + 1, 0, controlPoint)
      this.stops.splice(segment + 1, 0, stop)
    }

    // don't call draw as bulk ops may call this many times and we don't want to slow them down with map redraws
    // (consider following streets)
  }

  /** remove a point, cleaning up segment arrays as needed */
  unsplice (point) {
    if (point === 0) {
      this.segments.shift()
      this.stops.shift()
      this.controlPoints.shift()
    } else if (point === this.segments.length) {
      this.segments.pop()
      this.stops.pop()
      this.controlPoints.pop()
    } else {
      // middle
      this.stops.splice(point, 1)
      this.controlPoints.splice(point, 1)
      let newSeg = lineString([this.segments[point].geometry.coordinates[0], this.segments[point + 1].geometry.coordinates[1]])
      this.segments.splice(point, 2, newSeg)
    }

    // don't call draw here as this may be called in bulk operations
  }

  /** convert to serialized form */
  getModification () {
    // smoosh the segments into a single line string
    let coords = this.segments.map(s => s.geometry.coordinates[0])
    if (this.segments.length > 0) coords.push(this.segments[this.segments.length - 1].geometry.coordinates[1])

    return {
      geometry: lineString(coords).geometry,
      controlPoints: this.controlPoints,
      stops: this.stops
    }
  }
}
