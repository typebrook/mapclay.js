import defaultExport, { MapOption, loadCSS } from './BaseRenderer';
import { renderWith, renderByYamlWith, renderByScriptTargetWith } from './mapclay';
import { TerraDrawOpenLayersAdapter } from 'terra-draw'
loadCSS('https://cdn.jsdelivr.net/npm/ol@10.1.0/ol.css')

import * as ol from 'ol'
import * as control from 'ol/control';
import * as format from 'ol/format';
import * as geom from 'ol/geom';
import * as layer from 'ol/layer';
import * as source from 'ol/source';
import * as style from 'ol/style';
import * as proj from 'ol/proj';
import proj4 from 'proj4'
import * as olProj4 from 'ol/proj/proj4';


const Renderer = class extends defaultExport {
  id = 'openlayers'

  static validOptions = super.validOptions.concat([
    new MapOption({
      name: "proj",
      desc: "Projection of map view",
      example: "EPSG:3826",
      example_desc: "Taiwan TM2",
      isValid: () => true
    }),
  ])

  static defaultConfig = Object.freeze({
    ...super.defaultConfig,
    proj: "EPSG:4326",
    control: {
      fullscreen: false,
      scale: false
    }
  })

  static includedProjections = ['EPSG:4326', "EPSG:3857"]

  async createView(target) {
    super.createView(target)

    // TODO Consider apply cursor style same to maplibre or leaflet
    // That is: grab for normal grabbing for updating camera

    const projection = this.config.proj
    if (projection && !this.constructor.includedProjections.includes(projection)) {
      olProj4.register(proj4);
      await olProj4.fromEPSGCode(projection)
    }
    proj.setUserProjection(projection);

    // Set basemap and camera
    const map = new ol.Map({
      target: target,
      view: new ol.View({
        constrainResolution: true,
        center: this.config.center,
        zoom: this.config.zoom,
      }),
    });

    this.setCursor(map)

    this.setControl(map, this.config)
    this.setData(map, this.config)

    return new Promise((resolve,) => {
      map.on('rendercomplete', () => {
        resolve(map)
      })
    }).then(() => {
      if (this.config.draw) {
        const adapter = new TerraDrawOpenLayersAdapter({
          lib: {
            Circle: geom.Circle,
            Feature: ol.Feature,
            GeoJSON: format.GeoJSON,
            Style: style.Style,
            VectorLayer: layer.Vector,
            VectorSource: source.Vector,
            Stroke: style.Stroke,
            getUserProjection: proj.getUserProjection,
            CircleStyle: style.Circle,
          },
          map
        })
        this.draw = this.setDrawComponent(adapter)
      }
      this.setExtra(map, this.config)
    })
  };

  setCursor(map) {
    map.getViewport().style.cursor = "grab";
    map.on('pointerdrag', (_) => {
      map.getViewport().style.cursor = "grabbing";
    });
    map.on('pointerup', () => {
      map.getViewport().style.cursor = "grab";
    });
  }

  handleAliases(options) {
    super.handleAliases(options)
    if (options.STYLE) {
      options.data.push({
        type: "style",
        url: options.STYLE
      })
      delete options.STYLE
    }
  }

  // Configure controls
  setControl(map, config) {
    if (config.control.fullscreen === true) {
      map.addControl(new control.FullScreen());
    }
    // TODO Add more options by config
    if (config.control.scale === true) {
      map.addControl(new control.ScaleLine({
        units: 'metric'
      }))
    }
  };

  // Configure extra stuff
  setExtra(map, config) {
    if (config.debug === true) {
      map.addLayer(
        new layer.Tile({
          source: new source.TileDebug(),
        })
      );
    }
    if (config.eval) {
      this.evalScript(config.eval, [
        ["foo", "bar"],
        ["map", map],
        ["ol", {
          ...ol,
          format: format,
          geom: geom,
          layer: layer,
          source: source,
          style: source,
          proj: proj,
          proj4: proj4,
          olProj4: olProj4
        }]
      ])
    }
  };

  // Apply vector layer for markers onto map
  addMarkers = (map, markers) => markers.forEach(marker => {
    const element = document.createElement('div')
    element.innerHTML = this.svgForMarker
    element.title = marker.title
    element.classList.add('marker')

    const overlay = new ol.Overlay({
      element: element,
      position: marker.xy,
      positioning: 'bottom-center',
      anchor: [0.5, 1],
      stopEvent: false,
    })
    map.addOverlay(overlay)
  })

  addTileData(map, data) {
    const styleDatum = data.filter(datum => datum.type === 'style')[0]
    const tileData = data.filter(datum => datum.type === 'tile')
    if (!styleDatum && tileData.length === 0) {
      const baseLayer = new layer.Tile({
        source: new source.OSM(),
        title: 'OSM Carto'
      })
      map.addLayer(baseLayer)
    } else {
      tileData.forEach(datum => {
        const tileLayer = new layer.Tile({
          source: new source.XYZ({ url: datum.url }),
          title: datum.title ? datum.title : "Anonymous"
        })
        map.addLayer(tileLayer)
      })
    }

    // TODO Layers for WMTS
    const wmtsData = data.filter(datum => datum.type === 'wmts')[0]
    if (map, wmtsData) {
      // this.addLayersInWMTS(map, wmtsData)
    }
  }

  addGPXFile(map, gpxUrl) {
    const style = {
      'MultiLineString': new style.Style({
        stroke: new style.Stroke({
          color: 'red',
          width: 3,
        })
      })
    };

    map.addLayer(
      new layer.Vector({
        source: new source.Vector({
          url: gpxUrl,
          format: new format.GPX(),
        }),
        style: () => style['MultiLineString'],

      })
    );

    if (Object.prototype.hasOwnProperty.call(this.config, 'center')) {
      this.flyTo(map, { center: [10, 10], zoom: 10 })
    }
  }

  updateCamera(map, options, useAnimation) {
    const view = map.getView();
    if (useAnimation) {
      flyTo(map, { center: options.center, zoom: options.zoom })
    } else {
      view.animate({
        center: options.center,
        zoom: options.zoom,
        duration: 300
      })
    }
  }
}

// Pan map to a specific location
function flyTo(map, status, done) {
  const duration = 2500;
  const view = map.getView();
  const nextZoom = status.zoom ? status.zoom : view.getZoom();
  const nextCenter = status.center ? status.center : view.center;

  let parts = 2;
  let called = false;
  function callback(complete) {
    --parts;
    if (called) return
    if (parts === 0 || !complete) {
      called = true;
      done(complete);
    }
  }

  // Move view to the given location
  view.animate(
    {
      center: nextCenter,
      duration: duration,
    },
    callback
  );
  // At the same time, zoom out and zoom in
  view.animate(
    {
      zoom: (view.getZoom() + nextZoom) / 2 - 1,
      duration: duration / 2,
    },
    {
      zoom: nextZoom,
      duration: duration / 2,
    },
    callback
  );
}


const render = renderWith({ use: Renderer })
const renderByYaml = renderByYamlWith({ use: Renderer })
const renderByScriptTarget = renderByScriptTargetWith({ use: Renderer })

globalThis.mapclay = { render, renderByYaml }

export { render, renderByYaml, renderByScriptTarget }
export default Renderer
