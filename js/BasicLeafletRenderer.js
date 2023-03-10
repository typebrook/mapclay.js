import defaultExport from './BaseRenderer.js';

export default class extends defaultExport {
  version = '1.9.3';

  resources = [
    `https://unpkg.com/leaflet@${this.version}/dist/leaflet.js`,
    `https://unpkg.com/leaflet@${this.version}/dist/leaflet.css`
  ]

  createMap(element, config) {
    // If Map Container is initialized, remove it
    if (element.map && element.map.remove) {
      element.map.off()
      element.map.remove()
    }

    let latLon = Array.from(config.center).reverse()
    let map = L.map(element).setView(latLon, config.zoom);
    let xyz = config.XYZ
      ? config.XYZ
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

    L.tileLayer(xyz).addTo(map);
    return map;
  };

  // Configure interactions
  setInteraction(map, config) {
    config.link == true && this.addPermalink(map);
  };

  // Configure controls
  setControl(map, config){
    if (config.control.fullscreen) {
      let css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css';
      document.body.append(css);

      let script = document.createElement('script');
      script.src = "https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js";
      document.body.append(script);
      script.onload = () => {
        map.addControl(new L.Control.Fullscreen());
      }
    }
    if (config.control.scale) {
      L.control.scale().addTo(map);
    }
  };

  // Configure extra stuff
  setExtra(map, config) {
    if (config.debug == true) {
      L.GridLayer.GridDebug = L.GridLayer.extend({
        createTile: function (coords) {
          const tile = document.createElement('div');
          tile.style.outline = '1px solid';
          tile.style.padding = '3px';
          tile.style.fontWeight = 'bold';
          tile.style.fontSize = '14pt';
          tile.innerHTML = [coords.z, coords.x, coords.y].join('/');
          return tile;
        }
      });

      L.gridLayer.gridDebug = function (opts) {
        return new L.GridLayer.GridDebug(opts);
      };

      map.addLayer(L.gridLayer.gridDebug());
    }
    if (config.eval) {
      eval(config.eval)
    }
  };

  addMarkers(map, markers) {
    markers.forEach(marker => {
      let xy = Array.from(marker.xy).reverse()
      L.marker(xy).addTo(map)
        .bindPopup(marker.message)
    });
  }

  addGPXFiles(map, gpxUrl) {
    let script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.7.0/gpx.min.js";
    document.body.append(script);

    let options = {
      gpx_options: {
        joinTrackSegments: false
      },
      polyline_options: {
        color: 'red',
        weight: 3,
        lineCap: 'round'
      },
      marker_options: {
        startIconUrl: null,
        endIconUrl: null,
        shadowUrl: '',
        wptIconUrls: {
          '': null
        }
      },
      async: true
    }
    script.onload = () => {
      new L.GPX(gpxUrl, options).addTo(map);
    }
  }

  addPermalink(map) {
    let script = document.createElement('script');
    script.src = "https://rawgit.com/MarcChasse/leaflet.Permalink/master/leaflet.permalink.min.js";
    document.body.append(script);
    script.onload = () => {
      L.Permalink.setup(map);
    }
  }
}
