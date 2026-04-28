# LULC-Mapping-Sentinel2-GEE
Land Use Land Cover (LULC) Mapping using Sentinel-2 in Google Earth Engine with Random Forest Classification

# LULC Mapping using Sentinel-2 (Google Earth Engine)

## Overview
This project demonstrates Land Use Land Cover (LULC) classification using Sentinel-2 imagery in Google Earth Engine (GEE) with a Random Forest classifier.

---

## Data Used
- Sentinel-2 Surface Reflectance (COPERNICUS/S2_SR)
- Bands: B2, B3, B4, B8, B11, B12
- Year: 2023

---

## Methodology
1. Data filtering (cloud < 5%)
2. Median composite generation
3. NDVI calculation
4. Training data collection
5. Random Forest classification
6. Accuracy assessment
7. Area calculation

---

## Classes
| Class | Description |
|------|------------|
| 1 | Water |
| 2 | Vegetation |
| 3 | Built-up |
| 4 | Agriculture |
| 5 | Barren Land |

---

## Outputs
- LULC Map
- Confusion Matrix
- Accuracy Metrics (Overall, Kappa)
- Area statistics (Ha, Km²)

---

## How to Use
1. Open Google Earth Engine Code Editor
2. Import your ROI and training polygons
3. Run the script
4. Export results

---

## Author
Aditya Pal
