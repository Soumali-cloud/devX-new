# Iceberg melt and environmental-data sources

## Model attribution

The iceberg melt engine adapts the physical-process architecture of
OceanParcels' **MeltingIcebergs** software: basal melting, buoyant convection,
and wave erosion. It is not a copy of the Eocene experiment or its forcing.
The reference code is MIT licensed:

- Elbertsen, M. V., van Sebille, E., & Bijl, P. K. (2024). *MeltingIcebergs*
  (v1.2). Zenodo. https://doi.org/10.5281/zenodo.14096393
- https://github.com/Parcels-code/MeltingIcebergs

The adapted equations are implemented in `ml_engine/models/iceberg_melt.py`.
This application must retain this attribution when redistributing substantial
adaptations of the reference model.

## Modern forcing contract

The simulation accepts colocated, time-appropriate forcing exported from
authoritative sources. Suggested sources are Copernicus Marine (ocean
temperature/currents/salinity), ERA5/ECMWF (wind), NSIDC (sea ice), and the US
National Ice Center (iceberg observations). Eocene inputs are not used.

`observed` means supplied observation, `modelled` means a reanalysis/model
field, `estimated` marks inferred iceberg dimensions, and `scenario-based`
marks synthetic sensitivity forcing. A built-in baseline is only available for
explicit scenario demonstrations, never as a live observation.

If salinity is supplied with a forcing request, the model uses the first-order
freezing-point approximation `-0.054 × salinity (PSU)`; otherwise it retains
the documented default of -1.92 °C. This is a configurable approximation, not
a replacement for a full seawater thermodynamic calculation.

## Sea-level interpretation

For floating freshwater ice, the API reports the net volume difference between
meltwater and the seawater already displaced by the melted ice mass. This
individual-iceberg value is generally tiny and must not be interpreted as a
projection of land-ice-driven global sea-level rise.
