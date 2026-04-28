
//LANDUSE LANDCOVER MAP USING SENTINEL2 IN GOOGLE EARTH ENGINE

Map.centerObject(roi,9);
Map.addLayer(roi,{color:'black'},'AOI');

// ===============================
// 2. Sentinel-2 Collection
// ===============================
var s2 = ee.ImageCollection("COPERNICUS/S2_SR")
  .filterBounds(roi)
  .filterDate('2023-01-01','2023-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',5))
  .select(['B2','B3','B4','B8','B11','B12']);  // Important step

// Create composite
var image = s2.median().clip(roi);

// ===============================
// 3. True Color Composite
// ===============================
Map.addLayer(image,{
  bands:['B4','B3','B2'],
  min:0,
  max:3000
},'True Color');

// ===============================
// 4. False Color Composite
// ===============================
Map.addLayer(image,{
  bands:['B8','B4','B3'],
  min:0,
  max:3000
},'False Color');

// ================================
// 4. Add NDVI (Optional but recommended)
// ================================
var ndvi = image.normalizedDifference(['B8','B4']).rename('NDVI');
image = image.addBands(ndvi);

//var ndvi = image.normalizedDifference(['B8','B4']).rename('NDVI');
//var ndbi = image.normalizedDifference(['B11','B8']).rename('NDBI');
//var ndwi = image.normalizedDifference(['B3','B8']).rename('NDWI');

//image = image.addBands([ndvi, ndbi, ndwi]);

water = water.map(function(f){
  return f.set('Class',1);
});

vegetation = vegetation.map(function(f){
  return f.set('Class',2);
});

builtup = builtup.map(function(f){
  return f.set('Class',3);
});

agriculture = agriculture.map(function(f){
  return f.set('Class',4);
});

barren = barren.map(function(f){
  return f.set('Class',5);
});

// ================================
// 5. Training Data (Create polygons for each class)
// Example Classes:
// 1 = Water
// 2 = Vegetation
// 3 = Built-up
// 4 = Agriculture
// 5 = Barren land

var training = water.merge(vegetation)
                    .merge(builtup)
                    .merge(agriculture)
                    .merge(barren);

// ================================
// 6. Sample Training Data
// ================================
var trainingData = image.sampleRegions({
  collection: training,
  properties: ['Class'],
  scale: 10
});

// ================================
// 7. Split Data (70% training, 30% testing)
// ================================
var withRandom = trainingData.randomColumn('random');
var trainSet = withRandom.filter(ee.Filter.lt('random', 0.7));
var testSet = withRandom.filter(ee.Filter.gte('random', 0.7));

// ================================
// 8. Train Random Forest Classifier
// ================================
var classifier = ee.Classifier.smileRandomForest(100)
  .train({
    features: trainSet,
    classProperty: 'Class',
    inputProperties: image.bandNames()
  });

// ================================
// 9. Classification
// ================================
var classified = image.classify(classifier);

Map.addLayer(classified, {
  min: 1,
  max: 5,
  palette: ['blue','green','red','yellow','white']
}, 'LULC Map');

// ================================
// 10. Accuracy Assessment
// ================================
var testClassification = testSet.classify(classifier);
var confusionMatrix = testClassification.errorMatrix('Class', 'classification');

print('Confusion Matrix:', confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());
print('Kappa Coefficient:', confusionMatrix.kappa());
print('Producer Accuracy:', confusionMatrix.producersAccuracy());
print('User Accuracy:', confusionMatrix.consumersAccuracy());

// ================================
// 11. Area Calculation
// ================================
var pixelArea = ee.Image.pixelArea();

var areaImage = pixelArea.addBands(classified);

var areaStats = areaImage.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: 'Class'
  }),
  geometry: roi,
  scale: 10,
  maxPixels: 1e13
});

print('Area (sq.m):', areaStats);

// Convert to hectare
var areaHa = ee.List(areaStats.get('groups')).map(function(item){
  item = ee.Dictionary(item);
  var area = ee.Number(item.get('sum')).divide(10000);
  return ee.Dictionary({
    'Class': item.get('Class'),
    'Area (Ha)': area
  });
});
print('Area (Hectare):', areaHa);

// Convert to km²
var areaKm = ee.List(areaStats.get('groups')).map(function(item){
  item = ee.Dictionary(item);
  var area = ee.Number(item.get('sum')).divide(1e6);
  return ee.Dictionary({
    'Class': item.get('Class'),
    'Area (Km2)': area
  });
});
print('Area (Km2):', areaKm);

// ================================
// 12. Legend
// ================================
var legend = ui.Panel({style: {position: 'bottom-left'}});
legend.add(ui.Label('LULC Legend'));

var makeRow = function(color, name) {
  var colorBox = ui.Label('', {
    backgroundColor: color,
    padding: '8px',
    margin: '0 0 4px 0'
  });
  var description = ui.Label(name);
  return ui.Panel([colorBox, description],
    ui.Panel.Layout.Flow('horizontal'));
};

legend.add(makeRow('blue', 'Water'));
legend.add(makeRow('green', 'Vegetation'));
legend.add(makeRow('red', 'Built-up'));
legend.add(makeRow('yellow', 'Agricultural Land'));
legend.add(makeRow('white', 'Barren Land'));

Map.add(legend);

Export.image.toDrive({
  image: classified,
  description: 'LULC_Map_2023',
  folder: 'GEE_EXPORT',
  fileNamePrefix: 'LULC_2023',
  region: roi,
  scale: 10,
  maxPixels: 1e13
});