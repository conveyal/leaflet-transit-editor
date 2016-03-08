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
    autoCreateStopsCheckbox.addEventListener('change', (e) => { this.layer.autoCreateStops = e.target.checked })
    autoCreateStopsLabel.appendChild(autoCreateStopsCheckbox)
    // TODO i18n
    autoCreateStopsLabel.appendChild(document.createTextNode('Auto-create stops'))

    let stopSpacingLabel = document.createElement('label')
    let stopSpacingInput = document.createElement('input')
    stopSpacingInput.setAttribute('type', 'number')
    stopSpacingInput.setAttribute('value', this.layer.stopSpacingMeters)
    stopSpacingInput.addEventListener('change', (e) => { this.layer.stopSpacingMeters = Number(e.target.value) })
    stopSpacingLabel.appendChild(stopSpacingInput)
    stopSpacingLabel.appendChild(document.createTextNode('Stop spacing (meters)'))

    let createStopOnClickLabel = document.createElement('label')
    let createStopOnClickCheckbox = document.createElement('input')
    createStopOnClickCheckbox.setAttribute('type', 'checkbox')
    createStopOnClickCheckbox.checked = this.layer.createStopOnClick
    createStopOnClickCheckbox.addEventListener('change', (e) => { this.layer.createStopOnClick = e.target.checked })
    createStopOnClickLabel.appendChild(createStopOnClickCheckbox)
    // TODO i18n
    createStopOnClickLabel.appendChild(document.createTextNode('Create stop on click'))

    div.appendChild(autoCreateStopsLabel)
    div.appendChild(document.createElement('br'))
    div.appendChild(stopSpacingLabel)
    div.appendChild(document.createElement('br'))
    div.appendChild(createStopOnClickLabel)

    // don't allow events to propagate to map, https://github.com/Leaflet/Leaflet/issues/2481
    L.DomEvent.disableClickPropagation(div)

    return div
  }
}
