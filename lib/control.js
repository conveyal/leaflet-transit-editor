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

    let autoCreateStopsLabel = document.createElement('label')
    let autoCreateStopsCheckbox = document.createElement('input')
    autoCreateStopsCheckbox.setAttribute('type', 'checkbox')
    autoCreateStopsCheckbox.setAttribute('checked')
    autoCreateStopsCheckbox.addEventListener('change', e => this.layer.autoCreateStops = e.target.checked)
    autoCreateStopsLabel.appendChild(autoCreateStopsCheckbox)
    // TODO i18n
    autoCreateStopsLabel.appendChild(document.createTextNode('Auto-create stops'))

    div.appendChild(autoCreateStopsLabel)

    let followStreetsLabel = document.createElement('label')
    let followStreetsCheckbox = document.createElement('input')
    followStreetsCheckbox.setAttribute('type', 'checkbox')
    followStreetsCheckbox.setAttribute('checked')
    followStreetsCheckbox.addEventListener('change', e => this.layer.followStreets = e.target)
    followStreetsLabel.appendChild(followStreetsCheckbox)
    // TODO i18n
    followStreetsLabel.appendChild(document.createTextNode('Auto-create stops'))

    div.appendChild(followStreetsLabel)

    return div
  }
}
