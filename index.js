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

/** circle-in-circle marker for stops */
const stopIcon = L.icon({
  iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AEWEDkssvjS+AAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAACQElEQVRIx72VPWgTcRjGf+/fXh1irtBP6VAxFGOHBAq6dRNxcKqLbsYG6mAEN0GCgwShm2AFKbSNmy52chBx62ax0AylUiN2KPQTek0He+Veh0v1Lh82CdgHDo7L+zxP3v/78RfqIJZTillBVSWWY3R7naF9Bytq43b3s1zMMiciehxXD1JP2M7oPe+Ix6U94qFo/Rt7roMV08aEMymz9YxM1QdDwkrpprPDTMkhjpSFJWBSfkoOcWeHGSulm8aQODGDzkd6d3eDPPUzrg+Fzj5Suy/kTU2DE8Vd4Kj83gZYjZlILKcYQ2K1wFJNcYWnt+B6AkbK1ZhfgU8FePa+RhUVBhMkPY9CMSv+z1ZKN91DekKBR3B7BN4+/PfJ3HkJ7+bLWZVhtbPl5qUXQOyMjjk7TIf+iQcPbsBkqrHjz+Th1cdAyyjYXYx1n2dWIvf168E+w0HClYvwJddcja9mYeFHoIVtVkqv5bI5cMLiHML0ePNNND3uc49R2iOuqmIqi2R3QHKgeYPkgM8NDy2jVYN2c5iWUcndXmeoymCwr3WDEFdg38GqMljdaN0gxFWI2rhVBh8WWzeo5Hb3s2yC2xHA2YOltebFl9Z8bhDFLHMmYhP2bYf0VPMG6SmfG1zlIqLmjMVkZRYL3/3pbBSZvM8Jnr9pYyKW01PYRaeyTf/rfXBqN9qfaXyuiZ/f+Oz+oqchIwXrLFsXLnFt9YkUTrz0PY+Cm5deu4t0JMpiZYcFhSNRFu0u0m5eej2PQq2w35GC9O8BIx5RAAAAAElFTkSuQmCC',
  iconRetinaUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AEWEDkfDSiz7gAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAD0klEQVRo3t2aQUtbWRSAv/fSxFelNEhVpAWnTTJ5GJztdJFaKLgtXVUQ7Q+oxYXDZKjjUi1ksIuAsy6dQRhX0q20oHVRt4aEhNhOByxSlcFStE9Dcrt4kxKjybsvJs9kzi7Jyz3nu+fcc+8950GTi3LWAfSo8ORy3Mwectcw6Df28X/Z5/LRESqAx0P+YhuftDY2NI0VdwsvXC7epCLK0bkB6FGhZrMMfd5jcvsDwWrG6LxK+pKXKbeb+VREyTsCoEeFxzhg5p8NfhL5GoWACj1+ZrVWJqrxijTAjSnx8O8Uc7Uy/DSQ6zqj7yaV32sKoEfFlX93WK02VKoJrfYOwqmIsntmgMAT0b+RYLles17JG/4QtzOPlRWrZ9VyP/imxXAm7rzxACIPmTjLvmkxXJUHfNNi+G2CPxohz/tCjLz9VflTGiDwRPRn4iw30mYV6CsfTkrpgk2vs1Nt2HR74VYQBvogHITvrpjfv9+F1TQsxeF1Grb27K+J4A90nLawjwF0/ixSdrONAtwJQewB9F6T+09yE8aew6sECBvZafs3RS8LcGNKPHyXZM6Wa7tgcVze8NNA7j2FzEfJvaj35D6hFHbY9DqHdkLn/o/w11htYnwwBgtr0qHUUrxjqwDGATN2jB8dqJ3xYI41OiCXXo0DZo5B6VGhptfJyQLUcuar8cR/XnAVDoBqNsuQrPGBrvoZX/BEoMvaC9ksQ99C6PMek7LZZnG8/jl/cdz6gFZssyqbNu+Eqs82dqT3mqmrkmx/IKhHhafiWahUYg+c23lldOVy3JQG6PY6M/vFXuj2Vn4me8hdaYBbQRwXK52GQb80wECf8wBWOo19/NIA4XPwgJXOL/tclgYonCqdFCudhbKNSpOLFMD7XecNs9Lp8ZCXBlhNOw9gpfNiG5+kAZbizgNY6dTa2JAGeH0OHrDSqWmsSANs7Zm3J6ckuWl9b3a38MJWFhp77hyAjC6XizcAaudVpALkVcIZLyQ3TV1WF/zCtVK95GVKZmCBeQGvt9x7al2pKLZZdbuZVyQDKfPRvPbVSwZj1hUKRQW3m/lvAKmIku/xMyurZGENHj2rvfGPnslVJnr8zBY3RFQArZUJxcahYm6ptp4YjJljypRVtFYmThwlUhHl6LrOqB2lC2vw/fjZFnZy0xxDZubBbICUdnGavrR4ofhDewfhnS17xV0BvExA6Jf6FnfbOwhvl5nA47WfJiuvn1i6mcfKii/ESKMY7wsxUqnVVLaG1AhdGqvuTEWAQjg1epPv/91mLZambXSXeKN5XzUoAWmYlz2+AuTyoRli++xMAAAAAElFTkSuQmCC',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

export default class TransitEditorLayer extends L.LayerGroup {
  /**
   * construct with a GeoJSON geometry and a list of which coordinates are stops.
   * Optionally, also specify which coordinates are control points.
   */
  constructor ({ geometry, stops, controlPoints = null }) {
    super()
    if (controlPoints == null) controlPoints = stops

    if (geometry.coordinates.length !== stops.length || stops.length !== controlPoints.length) {
      console.log('allegedly parallel stop, control point and coordinate arrays are not the same length!')
      throw new Error('allegedly parallel stop, control point and coordinate arrays are not the same length!')
    }

    this.segments = []
    this.segmentLayers = []
    // is the beginning of this segment a stop?
    this.stops = []
    this.markers = []

    if (geometry.coordinates.length > 0) {
      // convert to renderable form, making the polyline into segments
      let coordIdx = 1
      let startCoordIdx = 0

      // add the first marker
      this.stops.push(stops[0])
      this.markers.push(this.getMarker(geometry.coordinates[0], stops[0]))

      // split up the geometry into constituent pieces
      while (coordIdx < this.controlPoints.length) {
        while (!controlPoints[coordIdx]) coordIdx++

        // include the last coordinate in the string so it goes all the way to the control point
        let segment = linestring(geometry.coordinates.slice(startCoordIdx, coordIdx + 1))
        this.segments.push(segment)
        this.segmentLayers.push(L.geoJson(segment))

        // add the stop marker at the end of this segment
        this.stops.push(stops[coordIdx])
        this.markers.push(this.getMarker(geometry.getMarker(geometry.coordinates[coordIdx], stops[coordIdx])))
      }

      this.segmentLayers.forEach(this.addLayer)
      this.markers.forEach(this.addLayer)
    }

    this.handleMapClick = this.handleMapClick.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
  }

  addTo (map) {
    super.addTo(map)
    this.map = map

    // add an event listener for appending to the path
    this.map.on('click', this.handleMapClick)
  }

  /** handle a click on the map */
  handleMapClick (e) {
    // first or second stop
    let coord = [e.latlng.lng, e.latlng.lat]
    this.stops.push(true)
    let marker = this.getMarker(coord, true)
    this.markers.push(marker)
    this.addLayer(marker)

    if (this.markers.length > 1) {
      let prevLatLng = this.markers[this.markers.length - 2].getLatLng()
      let prevCoord = [prevLatLng.lng, prevLatLng.lat]
      let segment = this.getSegment(prevCoord, coord)
      let segmentLayer = L.geoJson(segment)

      this.addLayer(segmentLayer)

      this.segments.push(segment)
      this.segmentLayers.push(segmentLayer)
    }
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
      this.segmentLayers[idx - 1] = L.geoJson(segment)
    }

    if (idx < this.markers.length - 1) {
      let nextLatLng = this.markers[idx + 1].getLatLng()
      let segment = this.getSegment([latLng.lng, latLng.lat], [nextLatLng.lng, nextLatLng.lat])
      this.segments[idx] = segment
      this.removeLayer(this.segmentLayers[idx])
      this.segmentLayers[idx] = L.geoJson(segment)
    }
  }

  /** get a marker for a stop or a control point */
  getMarker ([lng, lat], isStop) {
    console.log(`created marker at ${lat}, ${lng}`)
    let marker = L.marker(L.latLng(lat, lng), { draggable: true, icon: isStop ? stopIcon : controlPointIcon })
    marker.on('dragend', this.handleDragEnd)
    return marker
  }

  /** get a segment. TODO this is where we'll eventually use a routing service. */
  getSegment (prevCoord, coord) {
    // for now just returning straight-line, eventually we will have the option to also use street geometries
    return linestring([prevCoord, coord])
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
