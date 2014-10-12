var pageHeight = $(window).height();
$("#loader").css("height", pageHeight * 0.75 );

// comma seperator for thousands
var formatCommas = d3.format(",");

// setup Leaflet map
var mapHeight = $(window).height() - 50;

$("#map").height(mapHeight);

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

var healthFacilitiesData = [];
var chaptersData = {};
var supplyChainData = {};
var healthFacilities = new L.FeatureGroup();
var chapters = new L.FeatureGroup();
var supplyChain = new L.FeatureGroup();
var extentGroup = new L.FeatureGroup();

function returnPrice(item){
  switch (item){
    case 'Utrasound machine': return 2443000;
    case 'Anesthesia machine': return 1915000;
    case 'Ventilator (portable)': return 1100000;
    case 'Respirator (portable)': return 650000;
    case 'ECG machine': return 310000;
    case 'Generator 6KVA': return 127500;
    case 'Std Eqpt for RHU': return 2070300;
    case 'OB/Del kits': return 16323;
    case 'First Aid kits': return 6130;
  }
}

var map = new L.Map("map", {
  center: [11.04197, 124.96296], 
  zoom: 8, 
  minZoom: 6,
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
    "Red Cross Chapters": chapters,
    "Supply Chain": supplyChain
};

var hospitalMarkerOptions = {
    radius: 7,
    fillColor: "#662506",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};
var rhuMarkerOptions = {
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
var portMarkerOptions = {
    radius: 5,
    fillColor: "#253494",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9
};
var airportMarkerOptions = {
    radius: 5,
    fillColor: "#ffff99",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9
};
var warehouseMarkerOptions = {
    radius: 5,
    fillColor: "#7fc97f",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9
};

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend');
  div.innerHTML = '<i class="HealthFacilities" style="display:none; background:' + hospitalMarkerOptions["fillColor"] + '"></i>' + '<span class="HealthFacilities" style="display:none;">DOH Hospital<br></span>' + '' +
    '<i class="HealthFacilities" style="display:none; background:' + rhuMarkerOptions["fillColor"] + '"></i><span class="HealthFacilities" style="display:none;">Health Facility<br></span>' +
    '<i class="RedCrossChapters" style="display:none; background:' + chapterMarkerOptions["fillColor"] + '"></i><span class="RedCrossChapters" style="display:none;">Red Cross Chapter<br></span>'+
    '<i class="SupplyChain" style="display:none; background:' + warehouseMarkerOptions["fillColor"] + '"></i><span class="SupplyChain" style="display:none;">Red Cross Warehouse<br></span>'+
    '<i class="SupplyChain" style="display:none; background:' + portMarkerOptions["fillColor"] + '"></i><span class="SupplyChain" style="display:none;">Port<br></span>'+
    '<i class="SupplyChain" style="display:none; background:' + airportMarkerOptions["fillColor"] + '"></i><span class="SupplyChain" style="display:none;">Airport<br></span>';
    return div;
};

legend.addTo(map);

map.on('overlayadd', function(e){
  var overlay = e.name.replace(/\s+/g, '');
  var legendClass = "." + overlay;
  $(legendClass).toggle();
});
map.on('overlayremove', function(e){
  var overlay = e.name.replace(/\s+/g, '');
  var legendClass = "." + overlay;
  $(legendClass).toggle();
});



L.control.layers(baseMaps, overlayMaps).addTo(map);


function getFacilityData() {
  d3.csv("data/facilities_new.csv", function(data){ 
    formatData(data); 
  });
}

// format CSV data as geoJson
function formatData(data){
    $.each(data, function(index, item) {
        var latlng = [item.lon, item.lat];
        var thisGeoJsonObject = {
            "type": "Feature",
            "properties": {
                "name": item.name,
                "RHU / Hospital": item["RHU / Hospital"],
                "items": {    
                  "Utrasound machine": {
                    "count": item["Utrasound machine"],
                    "note": item["Utrasound machine NOTE"]
                  },
                  "Anesthesia machine": {
                    "count": item["Anesthesia machine"],
                    "note": item["Anesthesia machine NOTE"]
                  }, 
                  "Ventilator (portable)": {
                    "count": item["Ventilator (portable)"], 
                    "note": item["Ventilator (portable) NOTE"]
                  }, 
                  "Respirator (portable)": {
                    "count": item["Respirator (portable)"], 
                    "note": item["Respirator (portable) NOTE"]
                  },
                  "ECG machine": { 
                    "count": item["ECG machine"], 
                    "note": item["ECG machine NOTE"]
                  },  
                  "Generator 6KVA": { 
                    "count": item["Generator 6KVA"],  
                    "note": item["Generator 6KVA NOTE"]
                  }, 
                  "Std Eqpt for RHU": { 
                    "count": item["Std Eqpt for RHU"],  
                    "note": item["Std Eqpt for RHU NOTE"]
                  }, 
                  "OB/Del kits": { 
                    "count": item["OB/Del kits"], 
                    "note": item["OB/Del kits NOTE"]
                  },  
                  "First Aid kits": { 
                    "count": item["First Aid kits"], 
                    "note": item["First Aid kits NOTE"]
                  }
                }                              
            },
            "geometry": {
                "type": "Point",
                "coordinates": latlng
            }
        };
        healthFacilitiesData.push(thisGeoJsonObject);
    });
    getChaptersData();
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
      getSupplyChainData();

    },
    error: function(e) {
      console.log(e);
    }
  });
}

function getSupplyChainData() {
  $.ajax({
    type: 'GET',
    url: 'data/supplyChain.geojson',
    contentType: 'application/json',
    dataType: 'json',
    timeout: 10000,
    success: function(data) {
      console.log("Success!");
      supplyChainData = data;
      mapData();

    },
    error: function(e) {
      console.log(e);
    }
  });
}

function mapData() {
  // Health facilities
  L.geoJson(healthFacilitiesData, {
    pointToLayer: function (feature, latlng){
      return L.circleMarker(latlng)
    },
    style: function(feature){
        switch (feature.properties["RHU / Hospital"]){
          case 'H': return hospitalMarkerOptions;
          case 'R': return rhuMarkerOptions;
        }
    },
    onEachFeature: onEachHealthFacility
  }).addTo(healthFacilities).addTo(extentGroup);
  // Chapters
  L.geoJson(chaptersData.features, {
    pointToLayer: function (feature, latlng){
      return L.circleMarker(latlng, chapterMarkerOptions)
    },
    onEachFeature: onEachChapter
  }).addTo(chapters).addTo(extentGroup);
  map.addLayer(healthFacilities);
  map.addLayer(chapters);
  zoomOut();
  // Supply chain
  L.geoJson(supplyChainData.features, {
    pointToLayer: function (feature, latlng){
      return L.circleMarker(latlng)
    },
    style: function(feature){
        switch (feature.properties.type){
          case 'airport': return airportMarkerOptions;
          case 'port': return portMarkerOptions;
          case 'warehouse': return warehouseMarkerOptions;
        }
    },
    onEachFeature: onEachSupply
  }).addTo(supplyChain).addTo(extentGroup);
  $("#loader").remove();
}

function onEachHealthFacility(feature, layer) {
  var popupHtml = "<h5>" + feature.properties.name + "</h5>";
  var sumCosts = 0;
  $.each(feature.properties.items, function(index, item){
    if(parseInt(item.count)>=0){
      var totalCost = parseInt(item.count) * returnPrice(index);
      sumCosts += totalCost;
      popupHtml += "<b>" + index + "</b> <small>(" + item.note + ")</small><br>" + 
          item.count + 
          // " x " + formatCommas(returnPrice(index)) + " = " + formatCommas(totalCost) + 
          ((item.count == "1") ? " @ " + formatCommas(returnPrice(index)) : " x " + formatCommas(returnPrice(index)) + " = " + formatCommas(totalCost)) +
          "<br>";
    }
  });
  popupHtml += "<br>Total: " + formatCommas(sumCosts) + "<br><small>* all costs in PHP";
  layer.bindPopup(popupHtml);
}


function onEachChapter(feature, layer) {
  layer.bindPopup(feature.properties.name);
}
function onEachSupply(feature, layer) {
  layer.bindPopup(feature.properties.name);
}

// VARIOUS HELPER FUNCTIONS

function zoomOut(){  
  map.fitBounds(extentGroup.getBounds().pad(0.1,0.1));

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