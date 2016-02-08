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

/** simple circle marker for control points */
const controlPointIcon = L.icon({
  iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AEWEDoh52T9hgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAABA0lEQVRIx72VsW7CMBBA3/kjkGBtd1aWjhaiEqr/oRNfxNR/OIREhTxmYWWHlUj8hDvU6ZA6FW19vCmSL/ec3OlOGCDEhHrpnqfADBgBV+CgXo79uBIylDjE9AKsgDnD7IG1etkMiUqCMdAAD9zOGXhSL23/wPWSL4DLL5OT4y/5/fIX5MMd/+dZvbx/CUJMAON881pMgFa94HJhGurSdAWX3C1KfQKwccArNqzUCw5YGgnm39q0+j+KaWoqAGbWgpG14GotOJgK1MvRAVuj/PuuTd+MBOsQ0+c0DTGd/jCif9wP6uXxLtPUfh8UNtquVvL77+RMmwsUbmjhLRByfFsK+ABYUWNiAQ1ofgAAAABJRU5ErkJggg==',
  iconRetinaUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AEWEDoTL7OsBgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAACCklEQVRo3u2arW8CQRDFf0sb0uAInqRVaCCpaRU5D6IKW4Hjb8Ehzlb3PKlqDUlBV9EET+pIcwm5Cmab4wrHZ7idpGPOLHvv3bz52B1AuZljN2gOogugDNSAW3lWgJIsmQEfwAgYynMaeGaRGYHmIDJAFegAjwe+2wf6wDjwTHQWAvK1W8ATkD+RCkKgDTwf4hWzB/g74OWEwNcRaQSeeTspgeYgKgC9I6RyiLS6gWfmRxNoDqJrCcD8mZNLCFQCz3xuW5hLAV8DJhmAR945EQz7e0B++O5Iqq8HnhntTEBkM3GsXt1skpNZE7BfGclmW0wU1wV2MgZ6DoK3MdFL9YDk+VfHW5/7ZJ0wsQo7d/TrJ6VUiFdsK6GWAvBWSq0VD0hj9q2EgPXClW0Ac9JVagFvvVCNS6ij8BzTiUsoQqddBp5Z5BSfJsupzZwCq2kncPvvgYytop1ASTsBtBOYaSfwoZ3ASDuB4b8HMrapJeArBO/bY2WO5RW3NuvH68BYjmlaLBTMSwJytmwrItCOD0RsED8r8UIoWFdbCQmIhgICjeQU5zeNyo2XyxnJXze9SdaBrqNSCgVbejcqt78VFw8vm0ZOfyqx3MPXHQJfTxs1bZyROTKlSZ3OpBIQEnqHfDE5Fc+cnXyW05jPXRarH3Tv3E7LxgXg4cSpNpQ9C/uC38sDCW8482ePH5cYptdlRb02AAAAAElFTkSuQmCC',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

export default class TransitEditorLayer extends L.LayerGroup {
  /**
   * construct with a GeoJSON geometry and a list of which coordinates are stops.
   * Optionally, also specify which coordinates are control points.
   */
  constructor ({ geometry, controlPoints, stopPoints }) {
    super()
    if (geometry.coordinates.length !== controlPoints.length) {
      console.log('allegedly parallel control point and coordinate arrays are not the same length!')
      throw new Error('allegedly parallel control point and coordinate arrays are not the same length!')
    }

    // state: what segment is currently being dragged
    this.draggingSegment = -1
    // whether new points are added at the end or the beginning of the geometry
    this.extendFromEnd = true

    this.controlPoints = controlPoints

    this.segments = []
    this.segmentLayers = []
    this.markers = []

    if (geometry.coordinates.length > 0) {
      // convert to renderable form, making the polyline into segments
      let coordIdx = 1
      let startCoordIdx = 0

      // add the first marker
      let marker = this.getMarker(geometry.coordinates[0])
      this.markers.push(marker)

      // split up the geometry into constituent pieces
      while (coordIdx < this.controlPoints.length) {
        while (!controlPoints[coordIdx]) coordIdx++

        // include the last coordinate in the string so it goes all the way to the control point
        let segment = linestring(geometry.coordinates.slice(startCoordIdx, coordIdx + 1))
        this.segments.push(segment)
        let segmentLayer = this.getSegmentLayer(segment)
        this.segmentLayers.push(segmentLayer)
        this.addLayer(segmentLayer)

        // add the stop marker at the end of this segment
        this.markers.push(this.getMarker(geometry.getMarker(geometry.coordinates[coordIdx])))
      }
    }

    this.handleMapClick = this.handleMapClick.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleMarkerClick = this.handleMarkerClick.bind(this)
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
      this.segments.push(segment)
      this.segmentLayers.push(segmentLayer)
    } else {
      let nextLatLng = this.markers[0].getLatLng()
      let nextCoord = [nextLatLng.lng, nextLatLng.lat]
      let segment = this.getSegment(coord, nextCoord)
      let segmentLayer = this.getSegmentLayer(segment)

      this.addLayer(segmentLayer)

      this.markers.unshift(marker)
      this.segments.unshift(segment)
      this.segmentLayers.unshift(segmentLayer)
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
    }

    if (idx < this.markers.length - 1) {
      let nextLatLng = this.markers[idx + 1].getLatLng()
      let segment = this.getSegment([latLng.lng, latLng.lat], [nextLatLng.lng, nextLatLng.lat])
      this.segments[idx] = segment
      this.removeLayer(this.segmentLayers[idx])
      let segmentLayer = this.getSegmentLayer(segment)
      this.segmentLayers[idx] = segmentLayer
      this.addLayer(segmentLayer)
    }
  }

  /** if you click on the first or last marker, it selects which end to extend from */
  handleMarkerClick (e) {
    let index = this.markers.indexOf(e.target)

    if (index === 0) this.extendFromEnd = false
    else if (index === this.markers.length - 1) this.extendFromEnd = true
  }

  /** get a marker for a stop or a control point */
  getMarker ([lng, lat]) {
    console.log(`created marker at ${lat}, ${lng}`)
    let marker = L.marker(L.latLng(lat, lng), { draggable: true, icon: controlPointIcon })
    marker.on('dragend', this.handleDragEnd)
    marker.on('click', this.handleMarkerClick)
    return marker
  }

  /** get a segment. TODO this is where we'll eventually use a routing service. */
  getSegment (prevCoord, coord) {
    // for now just returning straight-line, eventually we will have the option to also use street geometries
    return linestring([prevCoord, coord])
  }

  /** convert a segment to a segment layer */
  getSegmentLayer (segment) {
    let layer = L.geoJson(segment)
    layer.getLayers()[0].on('mousedown', this.handleMouseDown.bind(this, segment))
    return layer
  }

  /** return the geometry of the modification, as well as the stop and control point indices */
  getModification () {
    // merge all of the segments together
    let coords = []
    let stops = []
    let controlPoints = []

    this.segments.forEach((s, sidx, segments) => {
      // drop the last coordinate to avoid duplicates
      s.geometry.coordinates.slice(0, -1)
        .forEach((c, cidx, coords) => {
          coords.push(c)
          // first coordinate of segment is always control point, may be stop as well
          controlPoints.push(cidx === 0)
          stops.push(cidx === 0 ? stops[sidx] : false)
        })
    })

    // add the very last coordinate
    let lastCoord = this.segments.slice(-1)[0].geometry.coordinates.slice(-1)[0]
    coords.push(lastCoord)
    controlPoints.push(true)
    stops.push(stops.slice(-1)[0])

    return {
      geometry: linestring(coords).geometry,
      controlPoints,
      stops
    }
  }
}
