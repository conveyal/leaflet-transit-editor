/**
 * The Leaflet transit editor
 * It is stop/"control point" based. As you draw a line it follows streets (or not), and the control points optionally become stops.
 * You can also tell it to create stops automatically.
 *
 * It's built using a bunch of Leaflet draggable markers; the geometry between them is filled in automatically (eventually using the street network)

 * @author mattwigway
 */

import L from 'leaflet'
import linestring from 'turf-linestring'
import distance from 'turf-distance'
import lineDistance from 'turf-line-distance'
import lineSlice from 'turf-line-slice'
import point from 'turf-point'
import LeafletTransitControl from './control'

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
   * construct with a GeoJSON geometry and a list of which coordinates are stops.
   * Optionally, also specify which coordinates are control points.
   */
  constructor ({ segments }) {
    super()

    this.handleMapClick = this.handleMapClick.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleMarkerClick = this.handleMarkerClick.bind(this)
    this.handleMarkerDoubleClick = this.handleMarkerDoubleClick.bind(this)

    // track state
    this.draggingSegment = -1
    this.followStreets = true
    this.autoCreateStops = true

    // reinstate GeoJSON properties lost in persistence layer
    this.segments = segments.map(s => Object.assign({}, s, { properties: {}, type: 'Feature' }))
    this.segmentLayers = this.segments.map(seg => this.getSegmentLayer(seg))
    this.segmentLayers.forEach(l => this.addLayer(l))

    // add control point markers
    this.markers = this.segments.map(seg => this.getMarker(seg.geometry.coordinates[0]))
    // add last segment
    if (this.segments.length > 0) {
      let lastSegment = this.segments[this.segments.length - 1]
      this.markers.push(this.getMarker(lastSegment.geometry.coordinates[lastSegment.geometry.coordinates.length - 1]))
    }
    this.markers.forEach(m => this.addLayer(m))

    // add stop markers
    // creates a 2d array of [segment][stopIndexInSegment]
    this.stopMarkers = this.segments.map(seg => {
      return seg.stops.map(stop => this.getMarker(stop))
    })
  }

  addTo (map) {
    super.addTo(map)
    this.map = map

    // add an event listener for appending to the path
    this.map.on('click', this.handleMapClick)
    this.map.on('mouseup', this.handleMouseUp)
  }

  /** handle a click on the map */
  handleMapClick (e) {
    // don't handle map clicks when dragging
    if (this.draggingSegment >= 0) return

    // first or second stop
    let coord = [e.latlng.lng, e.latlng.lat]
    let marker = this.getMarker(coord, true)
    this.addLayer(marker)

    if (this.markers.length === 0) {
      this.markers.push(marker)
      return // first stop, not making a segment
    }

    if (this.extendFromEnd) {
      let prevLatLng = this.markers[this.markers.length - 1].getLatLng()
      let prevCoord = [prevLatLng.lng, prevLatLng.lat]
      let segment = this.getSegment(prevCoord, coord)
      let segmentLayer = this.getSegmentLayer(segment)

      this.addLayer(segmentLayer)

      this.markers.push(marker)
      let segmentIndex = this.segments.push(segment)
      this.segmentLayers.push(segmentLayer)
      this.updateStopLocations(segmentIndex)
    } else {
      let nextLatLng = this.markers[0].getLatLng()
      let nextCoord = [nextLatLng.lng, nextLatLng.lat]
      let segment = this.getSegment(coord, nextCoord)
      let segmentLayer = this.getSegmentLayer(segment)

      this.addLayer(segmentLayer)

      this.markers.unshift(marker)
      this.segments.unshift(segment)
      this.segmentLayers.unshift(segmentLayer)

      this.updateStopLocations(0)
    }
  }

  /** handle a mousedown (drag start) on a segment */
  handleMouseDown (segment, e) {
    // we search now instead of just passing in an index, in case segments have been added/deleted since the event handler was registered
    this.draggingSegment = this.segments.indexOf(segment)

    if (this.draggingSegment < 0) console.warn('dragging segment not on map (perhaps events were not cleared?)')
  }

  /** handle a mouseup event */
  handleMouseUp (e) {
    // if we're not dragging a line segment, ignore
    if (this.draggingSegment < 0) return

    let coord = [e.latlng.lng, e.latlng.lat]
    let prevLatLng = this.markers[this.draggingSegment].getLatLng()
    let prevCoord = [prevLatLng.lng, prevLatLng.lat]

    // markers are always one item longer than segments, no need to be concerned about overflow here
    let nextLatLng = this.markers[this.draggingSegment + 1].getLatLng()
    let nextCoord = [nextLatLng.lng, nextLatLng.lat]

    // create the new marker and segments
    let marker = this.getMarker(coord)

    let s0 = this.getSegment(prevCoord, coord)
    let s1 = this.getSegment(coord, nextCoord)
    let l0 = this.getSegmentLayer(s0)
    let l1 = this.getSegmentLayer(s1)

    // add them to the map and splice them in
    this.addLayer(marker)

    // splice marker *after* begin marker (i.e. at position of current end marker for dragged segment)
    this.markers.splice(this.draggingSegment + 1, 0, marker)
    this.addLayer(l0)
    this.addLayer(l1)

    // remove old segment and add two new
    // insert two new segments *in place of* existing segment
    this.segments.splice(this.draggingSegment, 1, s0, s1)
    let oldSegLayer = this.segmentLayers.splice(this.draggingSegment, 1, l0, l1)
    this.removeLayer(oldSegLayer[0])

    this.updateStopLocations(this.draggingSegment)
    // need to call again in case we dragged a stop; the previous call will propagate down the transit line
    // only until it hits a non-auto-generated stop
    this.updateStopLocations(this.draggingSegment + 1)

    this.draggingSegment = -1
  }

  /** handle dragging a marker */
  handleDragEnd (e) {
    let marker = e.target
    // figure out the index of this marker
    let idx = this.markers.indexOf(marker)

    console.log(`dragged marker ${idx} to ${marker.getLatLng()}`)

    if (idx === -1) {
      console.log('dragged marker not in array')
      return
    }

    let latLng = marker.getLatLng()

    if (idx > 0) {
      let prevLatLng = this.markers[idx - 1].getLatLng()
      let segment = this.getSegment([prevLatLng.lng, prevLatLng.lat], [latLng.lng, latLng.lat])
      this.segments[idx - 1] = segment
      this.removeLayer(this.segmentLayers[idx - 1])
      let segmentLayer = this.getSegmentLayer(segment)
      this.segmentLayers[idx - 1] = segmentLayer
      this.addLayer(segmentLayer)

      this.updateStopLocations(idx - 1)
    }

    if (idx < this.markers.length - 1) {
      let nextLatLng = this.markers[idx + 1].getLatLng()
      let segment = this.getSegment([latLng.lng, latLng.lat], [nextLatLng.lng, nextLatLng.lat])
      this.segments[idx] = segment
      this.removeLayer(this.segmentLayers[idx])
      let segmentLayer = this.getSegmentLayer(segment)
      this.segmentLayers[idx] = segmentLayer
      this.addLayer(segmentLayer)

      this.updateStopLocations(idx)
    }
  }

  /** if you click on the first or last marker, it selects which end to extend from */
  handleMarkerClick (e) {
    let index = this.markers.indexOf(e.target)

    if (index === 0) this.extendFromEnd = false
    else if (index === this.markers.length - 1) this.extendFromEnd = true
  }

  /** handle double clicking on a marker (remove it) */
  handleMarkerDoubleClick (e) {
    let idx = this.markers.indexOf(e.target)

    if (idx < 0) {
      console.warn('double clicked on marker not in array')
      return
    }

    if (idx === 0) {
      // special case: marker at start
      this.removeLayer(this.markers.splice(0, 1)[0])
      this.segments.splice(0, 1)
      this.removeLayer(this.segmentLayers.splice(0, 1)[0])
    } else if (idx === this.markers.length - 1) {
      this.removeLayer(this.markers.splice(idx, 1)[0])
      this.segments.splice(idx - 1, 1)
      this.removeLayer(this.segmentLayers.splice(idx - 1, 1)[0])
    } else {
      // in the middle
      let prevLatLng = this.markers[idx - 1].getLatLng()
      let prevCoord = [prevLatLng.lng, prevLatLng.lat]

      // markers are always one item longer than segments, no need to be concerned about overflow here
      let nextLatLng = this.markers[idx + 1].getLatLng()
      let nextCoord = [nextLatLng.lng, nextLatLng.lat]

      let segment = this.getSegment(prevCoord, nextCoord)
      // replace the segment before and the segment after
      this.segments.splice(idx - 1, 2, segment)
      let segmentLayer = this.getSegmentLayer(segment)
      this.addLayer(segmentLayer)
      this.segmentLayers.splice(idx - 1, 2, segmentLayer)
        .forEach(l => this.removeLayer(l))

      this.removeLayer(this.markers.splice(idx, 1)[0])
    }
  }

  /** get a marker for a stop or a control point */
  getMarker ([lng, lat]) {
    console.log(`created marker at ${lat}, ${lng}`)
    let marker = L.marker(L.latLng(lat, lng), { draggable: true, icon: controlPointIcon })
    marker.on('dragend', this.handleDragEnd)
    marker.on('click', this.handleMarkerClick)
    marker.on('dblclick', this.handleMarkerDoubleClick)
    return marker
  }

  /** get a segment. TODO this is where we'll eventually use a routing service. */
  getSegment (prevCoord, coord) {
    // for now just returning straight-line, eventually we will have the option to also use street geometries
    let seg = linestring([prevCoord, coord])
    seg.stops = []
    return seg
  }

  /** convert a segment to a segment layer */
  getSegmentLayer (segment) {
    let layer = L.geoJson(segment)
    layer.getLayers()[0].on('mousedown', this.handleMouseDown.bind(this, segment))
    return layer
  }

  /** get an edit control associated with this editor instance */
  getControl () {
    return new LeafletTransitControl(this)
  }

  /** update the locations of stops along a particular segment */
  updateStopLocations (segmentIndex) {
    // figure out if we're offsetting from the start of the segment or if there's a stop on the previous segment that we're offsetting from
    let distFromPreviousStop
    let segment = this.segments[segmentIndex]
    if (segmentIndex === 0 || segment.stops.length > 0 && !segment.stops[0].autoGenerated) {
      distFromPreviousStop = 0
    } else {
      let prevSegmentIndex = segmentIndex
      while (prevSegmentIndex-- > 0) {
        let prevSeg = this.segments[prevSegmentIndex]
        if (prevSeg.stops.length === 0) {
          distFromPreviousStop += lineDistance(prevSeg, 'kilometers')
        } else {
          // get the distance to the last stop on this segment
          let lastStop = prevSeg.stops[prevSeg.stops.length - 1]
          let lastCoord = prevSeg.geometry.coordinates[prevSeg.geometry.coordinates.length - 1]
          let subSegment = lineSlice(prevSeg, point([lastStop.lng, lastStop.lat]), point(lastCoord))
          distFromPreviousStop += lineDistance(subSegment, 'kilometers')
        }
      }
    }

    // create the stops
    let stops = []

    // only the first stop can be non-autogenerated
    if (segment.stops.length > 0 && !segment.stops[0].autoGenerated) stops.push(segment.stops[0])

    // if it's the first segment, create a stop at the start
    let next = segmentIndex === 0 ? 0 : Math.max(distFromPreviousStop, 0.4)

    let total = distFromPreviousStop

    for (let line = 0; line < segment.geometry.coordinates.length - 1; line++) {
      let lengthThisLine = distance(point(segment.geometry.coordinates[line]), point(segment.geometry.coordinates[line + 1]), 'kilometers')
      while (next < total + lengthThisLine) {
        // make a stop at the appropriate place along the line
        // NB using loop so that multiple stops are created on long straight segments
        // e.g. someone might want to model the https://en.wikipedia.org/wiki/Indian_Pacific
        let seg = next - total
        let frac = seg / lengthThisLine
        let lng = segment.geometry.coordinates[line][0] + frac * (segment.geometry.coordinates[line + 1][0] - segment.geometry.coordinates[line][0])
        let lat = segment.geometry.coordinates[line][1] + frac * (segment.geometry.coordinates[line + 1][1] - segment.geometry.coordinates[line][1])
        let stop = point([lng, lat])
        stop.autoGenerated = true
        stops.push(stop)
        next += 0.4 // 400m spacing FIXME don't hardwire this here
      }

      segment.stops = stops

      this.stopMarkers[segmentIndex].forEach(m => this.removeLayer(m))
      this.stopMarkers[segmentIndex] = stops.map(s => L.marker(L.latLng(s.geometry.coordinates[1], s.geometry.coordinates[0]), { icon: s.autoGenerated ? ghostedStopIcon : stopIcon }))
      this.stopMarkers[segmentIndex].forEach(m => this.addLayer(m))

      total += lengthThisLine
    }

    // reflow stops until we hit the next hand-placed stop
    if (this.segments.length > segmentIndex + 1 && (this.segments[segmentIndex + 1].stops.length === 0 || this.segments[segmentIndex + 1].stops[0].autoGenerated)) {
      this.updateStopLocations(segmentIndex + 1)
    }
  }

  /** return the geometry of the modification, as well as the stop and control point indices */
  getModification () {
    return {
      segments: this.segments
    }
  }
}
