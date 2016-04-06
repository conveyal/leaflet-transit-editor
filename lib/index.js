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
import distance from 'turf-distance'
import point from 'turf-point'

import TransitEditorControl from './control'

const CIRCUMFERENCE_OF_EARTH_METERS = 40000000

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

/** blue version of above, used for snapped stops */
const snappedStopIcon = L.icon({
  iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAABuvAAAbrwFeGpEcAAAAB3RJTUUH4AMIDzc5nNqMHAAAAWlJREFUOMutVLFOwlAUPbd9TQUaIcIECczdcMAYGdz0H0z8Bz/FjZ3Bf9BNEhhwUKbOLk4QqQEkae1xgJq2PBsG7vbuOT3vvPtOH3CgkuQiiAjLEAQRK0pwDiDSfGOGxMgyxI/5AKCSIiFwTPIUgNV9929Hq/Amq3JRVA/DVjkgGayJ1yDil2VI2hHJS+cjvF/687bGcMwCAJTKlbdFXd2JyHPK0bbsjYiAbvUMgKNRWog3Gy/9eRv1mh03Vc7YnJAoZVEl2vHCONStqRxsoUTf319IQPFm45zQEEyfTf1Llf3zlzujZsEemEr5qSQq5TcL9kDH1wuR6LecXsMyJ8l2wzIn/ZbTA5lvkeSVeLNHyEYMItpNIAIQoFu9FpEn3Yy4Sa5wS95VEtnaofzFPCu0jrCiW+uIN30BALq1DoCTBOVTvOk4xtYR7J2jxX/y9w+7RwaKsXDBlGHM0WHJFyD1jGQr7uVhB61faBCaB/rjKqIAAAAASUVORK5CYII=',
  iconRetinaUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAABuvAAAbrwFeGpEcAAAAB3RJTUUH4AMIDzcvaA45TQAAAXZJREFUWMPtmL9KA0EQh7+VVTlClHghVhYGPAn4AmJpJ6bIE1j5AGlsBAvBxiYP4ENcRFsbG18gEIxgYyckgYQQxCNrk8Bx5M/eZQMn7HR3zHDfzP5md+eEUoo02RopMxnHOVDsACUgF/M7PaAhBR3TFTpKAAOwNU5koYl5GgoUEigCe4Azeb/+3n6KQ/N76JZDj0PgC/iUgkB7ycYwx8C2YZk4gAfsBoq3KNTMCgUKD/BuBxzcDbgcddslI12Uc5vXGR5uMnwALSlo6QKdAs7mN/emYMJQPwWugKEUvOh2mQMQhYnoQdvCuht12yUKLmFdpnYfskAWyAKl6rRPco7ZJbNAqQcq5t364757Ucy7dZO+iYFqWfyzDTq1LL5J38RtX+1TIYtf7VMx6atzQTtf5b4zuVdJwbPtsn8NNE9DJ+GhMKol3bv1grieFLzqVqg5HoFXZV2gEWtynVap6MwezXDZOB0NzarU1AyXjRP2/5AFWtL+AB1Vj7oU2OKfAAAAAElFTkSuQmCC',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
})

function rad (deg) {
  return deg * Math.PI / 180
}

export default class TransitEditorLayer extends L.LayerGroup {
  /**
   * construct with a GeoJSON geometry and a list of which coordinates are stops and which coordinates are control points.
   * stopIds contains the IDs of stops we're snapping to.
   * snapStops is an array of { stop_id, stop_lat, stop_lon } to use in snapping.
   */
  constructor ({ geometry, stops, controlPoints, stopIds, snapStops = [], allowExtendFromStart = true, allowExtendFromEnd = true }) {
    super()

    // state
    this.extendFromEnd = allowExtendFromEnd
    this.followStreets = false
    this.draggingSegment = -1
    this.stopSpacingMeters = 400
    this.autoCreateStops = true
    this.allowExtendFromStart = allowExtendFromStart
    this.allowExtendFromEnd = allowExtendFromEnd

    // if false, create control points rather than stops on click
    this.createStopOnClick = true

    // protective copies
    this.controlPoints = [...controlPoints]
    this.stops = [...stops]
    this.stopIds = [...stopIds]

    // snapstops is immutable, no need to clone
    this.snapStops = snapStops

    this.segments = []

    // handle features or raw geojson geometries
    if (geometry.geometry) geometry = geometry.geometry

    // create the segments
    for (let i = 0; i < geometry.coordinates.length - 1; i++) {
      this.segments.push(lineString([geometry.coordinates[i], geometry.coordinates[i + 1]]))
    }

    // add existing stops (snap targets) to map
    snapStops.forEach((stop) => {
      this.addLayer(L.circleMarker(L.latLng(stop.stop_lat, stop.stop_lon), { radius: 2, color: '#777' }))
    })

    this.draw()
  }

  onAdd (map) {
    super.onAdd(map)
    this.map = map
    this.map.on('click', this.handleClick)
    this.map.on('mouseup', this.handleSegmentDrag)
  }

  handleClick = (e) => {
    // if we're not allowed to make this extension, don't
    if (this.extendFromEnd && !this.allowExtendFromEnd || !this.extendFromEnd && !this.allowExtendFromStart) return

    // don't create extra end stops at dragged locations
    if (this.draggingSegment >= 0) return

    let coord = [e.latlng.lng, e.latlng.lat]
    // this is a control point and may additionally be a stop
    let snapStop = this.getStopNear(e.latlng)
    if (snapStop != null) {
      coord = [snapStop.stop_lon, snapStop.stop_lat]
    }

    this.splice(coord, this.extendFromEnd ? this.segments.length : -1, true, snapStop != null || this.createStopOnClick, snapStop != null ? snapStop.stop_id : null)

    // NB last call increased length of this.segments by 1 so use - 1
    if (this.segments.length > 0) {
      this.reflowFrom(this.extendFromEnd ? this.segments.length - 1 : 0)
    }

    this.draw()
  }

  /** return true if this modification is valid, i.e. all the parallel arrays are the same length */
  isValid () {
    let len = this.stops.length
    return this.segments.length === len - 1 && this.stopIds.length === len && this.controlPoints.length === len ||
      // special case: length is 0, no segments
      this.segments.length === 0 && this.stopIds.length === 0 && this.controlPoints.length === 0 && this.stops.length === 0
  }

  /** throw an exception if any constraints have been violated */
  check () {
    if (!this.isValid()) {
      // fail hard so we don't frustrate users by letting them continue to edit
      window.alert('Error modifying transit route; please discard your changes and try again (and report this error).')
      throw new Error('Modification is not valid!')
    }
  }

  handleMarkerDrag = (e) => {
    let marker = e.target
    let pointIdx = this.markers.indexOf(marker)
    let latlng = marker.getLatLng() // e doesn't have latlng but marker location has already been updated
    let coord = [latlng.lng, latlng.lat]

    let snapStop = this.getStopNear(latlng)
    if (snapStop != null) {
      this.stopIds[pointIdx] = snapStop.stop_id
      // even if we drag a control point onto a stop snap to the stop
      this.stops[pointIdx] = true
      coord = [snapStop.stop_lon, snapStop.stop_lat]
    }

    if (pointIdx < this.segments.length) this.segments[pointIdx].geometry.coordinates[0] = coord
    if (pointIdx > 0) this.segments[pointIdx - 1].geometry.coordinates[1] = coord
    this.controlPoints[pointIdx] = true // we've dragged it, it's a control point now

    this.reflow(pointIdx)

    this.draw()
  }

  /** called on map mouseup, used when dragging segments */
  handleSegmentDrag = (e) => {
    if (this.draggingSegment < 0) return // not dragging a segment

    console.log(`detected drag end of segment ${this.draggingSegment}`)

    // don't pan the map or trigger a click
    e.originalEvent.preventDefault()

    let coord = [e.latlng.lng, e.latlng.lat]

    let snapStop = this.getStopNear(e.latlng)
    if (snapStop != null) {
      coord = [snapStop.stop_lon, snapStop.stop_lat]
    }

    // it's a control point but not a stop, unless it snaps to a stop
    this.splice(coord, this.draggingSegment, true, snapStop != null, snapStop != null ? snapStop.stop_id : null)

    this.reflow(this.draggingSegment + 1)

    // clear state
    this.draggingSegment = -1

    this.check()

    this.draw()
  }

  /** delete stop referenced by marker */
  handleStopDelete = (marker) => {
    let index = this.markers.indexOf(marker)

    if (index === -1) {
      console.log('Attempt to delete nonexistent marker')
      return
    }

    if (!this.controlPoints[index]) {
      // not a control point, reflow nothing etc.
      this.unsplice(index)
    } else if (index === 0) {
      // first and last stops handled specially
      index++
      while (!this.controlPoints[index] && index < this.controlPoints.length) index++

      index--

      while (index >= 0) this.unsplice(index--)

      // no need to reflow, we've removed the relevant segments
    } else if (index === this.controlPoints.length - 1) {
      do {
        this.unsplice(index--)
      } while (!this.controlPoints[index] && index > 0)
      // no need to reflow, we've removed the relevant segments
    } else {
      // reflowing will take care of getting rid of unecessary segments
      this.unsplice(index)

      // if previous point is a control point and a stop, only reflow after
      // however, if previous point is not a control point, reflow the entire segment
      if (this.controlPoints[index - 1] && this.stops[index - 1]) this.reflowFrom(index - 1)
      else this.reflow(index - 1)
    }

    this.check()

    this.draw()
  }

  /** convert a stop to a control point or vice-versa */
  handleControlPointToggle = (marker, stop) => {
    let index = this.markers.indexOf(marker)
    if (index === -1) {
      console.log('Can\'t toggle stop, marker not found')
      return
    }

    this.stops[index] = stop

    this.check()

    this.draw()
  }

  /** (re)draw the layer */
  draw () {
    // clear the map
    if (this.markers) {
      // null markers are non-stop non-control points
      this.markers.filter((m) => m != null).forEach((m) => this.removeLayer(m))
      this.segmentLayers.forEach((l) => this.removeLayer(l))
    }

    this.markers = []
    this.segmentLayers = this.segments.map((s) => this.getSegmentLayer(s))

    // draw segments
    this.segmentLayers.forEach((l) => this.addLayer(l))

    // draw the markers
    for (let i = 0; i < this.segments.length; i++) {
      let controlPoint = this.controlPoints[i]
      let stop = this.stops[i]
      let stopId = this.stopIds[i]

      let marker = this.getMarker(this.segments[i].geometry.coordinates[0], controlPoint, stop, stopId)
      // will be null if no marker is needed
      if (marker !== null) this.addLayer(marker)
      // add anyhow to preserve positioning
      this.markers.push(marker)
    }

    // add the last marker
    if (this.segments.length > 0) {
      let marker = this.getMarker(this.segments[this.segments.length - 1].geometry.coordinates[1],
        this.controlPoints[this.segments.length],
        this.stops[this.segments.length],
        this.stopIds[this.segments.length])
      if (marker !== null) this.addLayer(marker)
      // add even if null to preserve positioning
      this.markers.push(marker)
    }
  }

  /** get a layer to show a segment of the line */
  getSegmentLayer (geometry) {
    let lay = L.geoJson(geometry)
    lay.getLayers()[0].on('mousedown', (e) => {
      // write down which layer we're dragging, we then deal with it on mouseup
      this.draggingSegment = this.segmentLayers.indexOf(lay)
      console.log(`dragging segment ${this.draggingSegment}!`)
      e.originalEvent.preventDefault()
    })
    return lay
  }

  /** get a stop ID at the specified location, or null if this is not near a stop */
  getStopNear ({ lng, lat, radiusMeters, radiusPixels = 10 }) {
    // base snap distance on map zoom, make it five pixels
    if (radiusMeters === undefined) {
      let metersPerPixel = CIRCUMFERENCE_OF_EARTH_METERS / (256 * Math.pow(2, this.map.getZoom()))
      radiusMeters = radiusPixels * metersPerPixel
    }

    let dLat = 360 * radiusMeters / CIRCUMFERENCE_OF_EARTH_METERS
    let dLng = Math.abs(dLat / Math.cos(rad(lat)))

    let maxLat = lat + dLat
    let minLat = lat - dLat
    let maxLng = lng + dLng
    let minLng = lng - dLng

    let query = this.snapStops.filter((s) => s.stop_lat > minLat && s.stop_lat < maxLat && s.stop_lon > minLng && s.stop_lon < maxLng)
    let clickPoint = point([lng, lat])

    // filter using true distance
    let stopAtDistance = query
      .map((stop) => {
        return {
          distance: distance(clickPoint, point([stop.stop_lon, stop.stop_lat]), 'kilometers'),
          stop
        }
      })
      .filter((s) => s.distance < radiusMeters / 1000)

    // return closest
    let outStop = null
    let outDist = Infinity

    for (let { stop, distance } of stopAtDistance) {
      if (distance < outDist) {
        outStop = stop
        outDist = distance
      }
    }

    return outStop
  }

  /** get a marker */
  getMarker (coord, controlPoint, stop, stopId) {
    let icon

    // snapped stop
    if (stopId != null) icon = snappedStopIcon
    // manually placed stop
    else if (controlPoint && stop) icon = stopIcon
    // autogenerated stop
    else if (stop && !controlPoint) icon = ghostedStopIcon
    // just a control point
    else if (controlPoint && !stop) icon = controlPointIcon
    // no marker needed, not a stop or control point
    else return null

    // https://twitter.com/tmcw/status/598605684477943808
    // snapped stops are not draggable
    let marker = L.marker(L.latLng(coord[1], coord[0]), { icon, draggable: stopId == null })
    // it really would be better to do the whole thing on drag but then the marker gets replaced every time the event handler (which calls draw) is called.
    // we could change draw to do smart diffing.
    marker.on('dragend', this.handleMarkerDrag)
    marker.on('dblclick', this.handleMarkerDoubleClick)

    let popupContent = document.createElement('div')

    if (controlPoint && stopId == null) {
      // doesn't make sense to turn an autogenerated stop into not a stop, as then it will be neither a stop or a control point
      // also doesn't make sense to turn a snapped stop into not a stop
      let toggleStop = document.createElement('a')
      toggleStop.href = '#'
      toggleStop.innerText = stop ? 'make control point' : 'make stop'
      toggleStop.addEventListener('click', (e) => this.handleControlPointToggle(marker, !stop))
      popupContent.appendChild(toggleStop)
    }

    popupContent.appendChild(document.createTextNode(' '))

    let deleteStop = document.createElement('a')
    deleteStop.innerText = 'delete'
    deleteStop.href = '#'
    deleteStop.addEventListener('click', (e) => this.handleStopDelete(marker))
    popupContent.appendChild(deleteStop)

    marker.bindPopup(popupContent)

    return marker
  }

  /** splice in a point, in the middle of segment. flags indicate whether it's a control point and/or a stop. call with segment == -1 to insert at beginning, or segment == segments.length to insert at end */
  splice (coord, segment, controlPoint, stop, stopId = null) {
    if (this.segments.length === 0) {
      if (this.previousPoint) {
        let seg = lineString([this.previousPoint.coord, coord])
        this.segments = [seg]
        this.controlPoints = [this.previousPoint.controlPoint, controlPoint]
        this.stops = [this.previousPoint.stop, stop]
        this.stopIds = [this.previousPoint.stopId, stopId]
        this.previousPoint = undefined
      } else {
        this.previousPoint = { coord, stop, controlPoint, stopId }
      }
    } else if (segment === -1) {
      // insert at beginning
      let seg = lineString([coord, this.segments[0].geometry.coordinates[0]])
      this.segments.unshift(seg)
      this.controlPoints.unshift(controlPoint)
      this.stops.unshift(stop)
      this.stopIds.unshift(stopId)
    } else if (segment === this.segments.length) {
      // insert at end
      let seg = lineString([this.segments[this.segments.length - 1].geometry.coordinates[1], coord])
      this.segments.push(seg)
      this.controlPoints.push(controlPoint)
      this.stops.push(stop)
      this.stopIds.push(stopId)
    } else {
      let oldSegment = this.segments[segment]

      let newSegment0 = lineString([oldSegment.geometry.coordinates[0], coord])
      let newSegment1 = lineString([coord, oldSegment.geometry.coordinates[1]])

      this.segments.splice(segment, 1, newSegment0, newSegment1)

      this.controlPoints.splice(segment + 1, 0, controlPoint)
      this.stops.splice(segment + 1, 0, stop)
      this.stopIds.splice(segment + 1, 0, stopId)
    }

    // don't call draw as bulk ops may call this many times and we don't want to slow them down with map redraws
    // (consider following streets)
    this.check()
  }

  /** remove a point, cleaning up segment arrays as needed */
  unsplice (point) {
    if (point === 0) {
      this.segments.shift()
      this.stops.shift()
      this.controlPoints.shift()
      this.stopIds.shift()
    } else if (point === this.segments.length) {
      this.segments.pop()
      this.stops.pop()
      this.controlPoints.pop()
      this.stopIds.pop()
    } else {
      // middle
      this.stops.splice(point, 1)
      this.stopIds.splice(point, 1)
      this.controlPoints.splice(point, 1)
      let newSeg = lineString([this.segments[point - 1].geometry.coordinates[0], this.segments[point].geometry.coordinates[1]])
      this.segments.splice(point - 1, 2, newSeg)
    }

    // don't call draw here as this may be called in bulk operations

    this.check()
  }

  /** Reflow the stops around the given point */
  reflow (point) {
    // don't try to reflow stop -1
    if (point === 0) {
      this.reflowFrom(point)
      return
    }

    // do we need to anchor stops around this point
    let anchored = this.stops[point] && this.controlPoints[point]

    point--

    // find start of reflow segment
    while ((!this.controlPoints[point] || !this.stops[point]) && point > 0) point--

    // the new index of this point is the end of the reflow section, if we are anchoring around this point
    let newPointIndex = this.reflowFrom(point)

    // if it's a stop and a control point, restart the reflowing here, as long as it's not the last stop
    if (anchored && newPointIndex < this.segments.length) this.reflowFrom(newPointIndex)
  }

  /** reflow stops starting from the given point, returning the index of the end of the reflowed section */
  reflowFrom (pointIdx) {
    // construct a sub-geometry to reflow along
    let segmentCount = 0
    // start with first coord because the loop below would exit because it's likely to be a stop+controlPoint
    let coords = [this.segments[pointIdx].geometry.coordinates[0]]
    let stops = [this.stops[pointIdx]]
    let stopIds = [this.stopIds[pointIdx]]
    let controlPoints = [this.controlPoints[pointIdx]]

    for (let segIdx = pointIdx + 1; ; segIdx++) {
      // we started with one coordinate, so every additional coordinate is a segment
      // while not at the top of my list of inconvenient mathematical facts, the fencepost problem is still pretty annoying
      segmentCount++

      if (segIdx === this.segments.length) {
        // at the end
        coords.push(this.segments[segIdx - 1].geometry.coordinates[1])
        stops.push(this.stops[segIdx])
        stopIds.push(this.stopIds[segIdx])
        controlPoints.push(this.controlPoints[segIdx])
        break
      }

      // retain all control points and non-stop non-control-point locations (non-stop non-control-point locations are used for the output from the routing algorithm)
      // but no need to retain old autogenerated stops
      if (this.controlPoints[segIdx] || !this.stops[segIdx]) {
        coords.push(this.segments[segIdx].geometry.coordinates[0])
        // add the stop and control point markers at the _end_ of the segment because we initialized the array with the start of the first segment
        stops.push(this.stops[segIdx])
        stopIds.push(this.stopIds[segIdx])
        controlPoints.push(this.controlPoints[segIdx])
      }

      // we've hit the end of the reflow section
      if (this.controlPoints[segIdx] && this.stops[segIdx]) break
    }

    let distances = []

    for (let i = 1; i < coords.length; i++) {
      let f = point(coords[i - 1])
      let t = point(coords[i])
      distances.push(distance(f, t, 'kilometers') * 1000)
    }

    let outCoords
    let outStops
    let outStopIds
    let outControlPoints

    if (this.autoCreateStops) {
      outCoords = [coords[0]]
      outStops = [stops[0]]
      outStopIds = [stopIds[0]]
      outControlPoints = [controlPoints[0]]

      let next = this.stopSpacingMeters
      let total = 0
      let segment = 0

      while (segment < distances.length) {
        // don't put stops super close together
        if (segment + 1 === distances.length && next + 0.25 * this.stopSpacingMeters > total + distances[segment]) break

        if (next < total + distances[segment]) {
          // create a stop
          let frac = (next - total) / distances[segment]
          let lng = (coords[segment + 1][0] - coords[segment][0]) * frac + coords[segment][0]
          let lat = (coords[segment + 1][1] - coords[segment][1]) * frac + coords[segment][1]

          outCoords.push([lng, lat])
          outStops.push(true)
          outStopIds.push(null)
          outControlPoints.push(false)

          next += this.stopSpacingMeters
        } else {
          // advance to next segment
          total += distances[segment]
          segment++

          outCoords.push(coords[segment])
          outStops.push(stops[segment])
          outStopIds.push(stopIds[segment])
          outControlPoints.push(controlPoints[segment])
        }
      }
    } else {
      // not automatically creating any stops, just keep the non-auto-generated stops
      // don't duplicate the last stop
      outCoords = coords.slice(0, -1)
      outStops = stops.slice(0, -1)
      outStopIds = stopIds.slice(0, -1)
      outControlPoints = controlPoints.slice(0, -1)
    }

    // create the new segments
    let segments = []

    for (let i = 0; i < outCoords.length - 1; i++) {
      segments.push(lineString([outCoords[i], outCoords[i + 1]]))
    }

    segments.push(lineString([outCoords[outCoords.length - 1], coords[coords.length - 1]]))
    outStops.push(stops[stops.length - 1])
    outStopIds.push(stopIds[stopIds.length - 1])
    outControlPoints.push(controlPoints[controlPoints.length - 1])

    // sanity check
    let len = outStops.length
    if (segments.length !== len - 1 || outControlPoints.length !== len || outStopIds.length !== len || outStops.length !== len) {
      throw new Error('Internal error when attempting to reflow, parallel arrays are not parallel')
    }

    this.segments.splice(pointIdx, segmentCount, ...segments)
    this.controlPoints.splice(pointIdx, segmentCount + 1, ...outControlPoints)
    this.stops.splice(pointIdx, segmentCount + 1, ...outStops)
    this.stopIds.splice(pointIdx, segmentCount + 1, ...outStopIds)

    this.check()

    return pointIdx + segments.length
  }

  /** convert to serialized form */
  getModification () {
    // smoosh the segments into a single line string
    let coords = this.segments.map((s) => s.geometry.coordinates[0])
    if (this.segments.length > 0) coords.push(this.segments[this.segments.length - 1].geometry.coordinates[1])

    return {
      geometry: lineString(coords).geometry,
      controlPoints: this.controlPoints,
      stops: this.stops,
      stopIds: this.stopIds
    }
  }

  /** get a control for this layer, specifying callbacks */
  getControl ({ save, close }) {
    return new TransitEditorControl(this, { save, close })
  }
}
