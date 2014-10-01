var pageHeight = $(window).height();
$("#loader").css("height", pageHeight * 0.75 );

// setup Leaflet map
var mapHeight = $(window).height() - 50;
var mapBounds = [];

$("#map").height(mapHeight);
$("#infoWrapper").height(mapHeight);

var mapboxAttribution = '<a href="https://www.mapbox.com/" target="_blank">Mapbox</a> | Base data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a> | &copy; <a href="https://ifrc.org/" title="IFRC" target="_blank">IFRC</a> 2014 | <a title="Disclaimer" onClick="showDisclaimer();">Disclaimer</a>';
var hotAttribution = 'Base data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a> | Map style by <a href="http://hot.openstreetmap.org" target="_blank">H.O.T.</a> | &copy; <a href="https://ifrc.org/" title="IFRC" target="_blank">IFRC</a> 2014 | <a title="Disclaimer" onClick="showDisclaimer();">Disclaimer</a>';

var mapboxStreetsUrl = 'http://{s}.tiles.mapbox.com/v3/americanredcross.hmki3gmj/{z}/{x}/{y}.png',
  mapboxTerrainUrl = 'http://{s}.tiles.mapbox.com/v3/americanredcross.hc5olfpa/{z}/{x}/{y}.png',
  greyscaleUrl = 'http://{s}.tiles.mapbox.com/v3/americanredcross.i4d2d077/{z}/{x}/{y}.png',
  hotUrl = 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
var mapboxStreets = new L.TileLayer(mapboxStreetsUrl, {attribution: mapboxAttribution}),
  mapboxTerrain = new L.TileLayer(mapboxTerrainUrl, {attribution: mapboxAttribution}),
  greyscale = new L.TileLayer(greyscaleUrl, {attribution: mapboxAttribution}),
  hot = new L.TileLayer(hotUrl, {attribution: hotAttribution});

var healthFacilities = new L.LayerGroup();
var healthFacilitiesData = {};
var chapters = new L.LayerGroup();
var chaptersData = {};
// var portsAirports = new L.LayerGroup();

var map = new L.Map("map", {
  center: [11.04197, 124.96296], 
  zoom: 16, 
  minZoom: 8,
  layers: [hot]
});

var baseMaps = {
  "Grey": greyscale,
  "Streets": mapboxStreets,
  "Terrain": mapboxTerrain,
  "HOT": hot
};
var overlayMaps = {
    "Health Facilities": healthFacilities,
    "Red Cross Chapters": chapters
    // "Ports & Airports": portsAirports
};

var dohMarkerOptions = {
    radius: 7,
    fillColor: "#662506",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};
var healthMarkerOptions = {
    radius: 4,
    fillColor: "#cc4c02",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};
var chapterMarkerOptions = {
    radius: 6,
    fillColor: "#ff0000",
    color: "#670000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9
};

L.control.layers(baseMaps, overlayMaps).addTo(map);

function getFacilityData() {
  $.ajax({
    type: 'GET',
    url: 'data/facilities.geojson',
    contentType: 'application/json',
    dataType: 'json',
    timeout: 10000,
    success: function(data) {
      console.log("Success!");
      healthFacilitiesData = data;
      getChaptersData();

    },
    error: function(e) {
      console.log(e);
    }
  });
}

function getChaptersData() {
  $.ajax({
    type: 'GET',
    url: 'data/chapters.geojson',
    contentType: 'application/json',
    dataType: 'json',
    timeout: 10000,
    success: function(data) {
      console.log("Success!");
      chaptersData = data;
      mapData();

    },
    error: function(e) {
      console.log(e);
    }
  });
}

function mapData() {
  // Health facilities
  var facilitiesGeojson = L.geoJson(healthFacilitiesData.features, {
    pointToLayer: function (feature, latlng){
      return L.circleMarker(latlng)
    },
    style: function(feature){
        switch (feature.properties.type){
          case 'hospital_doh': return dohMarkerOptions;
          case 'health_facility': return healthMarkerOptions;
        }
    },
    onEachFeature: onEachHealthFacility
  }).addTo(healthFacilities);
  mapBounds = facilitiesGeojson.getBounds();    
  map.fitBounds(mapBounds);
  // Chapters
  L.geoJson(chaptersData.features, {
    pointToLayer: function (feature, latlng){
      return L.circleMarker(latlng, chapterMarkerOptions)
    },
    onEachFeature: onEachChapter
  }).addTo(chapters);
  map.addLayer(healthFacilities);
}

function onEachHealthFacility(feature, layer) {
  layer.bindPopup(feature.properties.name);
}

function onEachChapter(feature, layer) {
  layer.bindPopup(feature.properties.name);
}

// VARIOUS HELPER FUNCTIONS

function zoomOut(){   
  map.fitBounds(mapBounds);
} 

// adjust map div height on screen resize
$(window).resize(function(){
  mapHeight = $(window).height() - 50;
  $("#map").height(mapHeight);
  $("#infoWrapper").height(mapHeight);
});

// show disclaimer text on click of dislcaimer link
function showDisclaimer() {
    window.alert("The maps used do not imply the expression of any opinion on the part of the International Federation of Red Cross and Red Crescent Societies or National Societies concerning the legal status of a territory or of its authorities.");
}

getFacilityData();