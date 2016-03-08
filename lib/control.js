/**
 * A control that manages editing functionality
 */

import L from 'leaflet'

export default class TransitEditorControl extends L.Control {
  /** Construct a new control controlling the given editor layer */
  constructor (layer) {
    super()
    this.layer = layer
  }

  /** Add to the map */
  onAdd (map) {
    this.map = map

    let div = document.createElement('div')
    // make the background non-transparent, and set some padding so stray clicks don't wind up on the map
    div.setAttribute('style', 'background: #fff; padding: 5px')

    let autoCreateStopsLabel = document.createElement('label')
    let autoCreateStopsCheckbox = document.createElement('input')
    autoCreateStopsCheckbox.setAttribute('type', 'checkbox')
    autoCreateStopsCheckbox.checked = this.layer.autoCreateStops
    autoCreateStopsCheckbox.addEventListener('change', e => this.layer.autoCreateStops = e.target.checked)
    autoCreateStopsLabel.appendChild(autoCreateStopsCheckbox)
    // TODO i18n
    autoCreateStopsLabel.appendChild(document.createTextNode('Auto-create stops'))

    div.appendChild(autoCreateStopsLabel)
    div.appendChild(document.createElement('br'))

    // don't allow events to propagate to map, https://github.com/Leaflet/Leaflet/issues/2481
    L.DomEvent.disableClickPropagation(div)

    return div
  }
}
