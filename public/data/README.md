# Road atlas

`road-atlas.json` contains actual street and pedestrian path geometry from six
small OpenStreetMap areas: Tokyo, Paris, New York, Venice, Melbourne, and Marrakesh.
The artwork chooses one of these areas at random on page load, without a runtime
map service. When session storage is available, it remembers the last area in
the current tab so reloading selects a different one. No location labels or
playback controls are displayed.
It is an artistic walk on the road graph, not a traffic or routing simulation;
one-way restrictions are not modeled.

© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
This derived database is made available under the
[Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
The downloadable JSON is the complete derived database used by the artwork.

Regenerate with `python3 scripts/build-road-atlas.py`. The script reads small
bounding boxes from the official OSM API, retains connected road node IDs, clips
segments to the area boundary, and projects coordinates into local meters.
`center` is `[latitude, longitude]`; `size` is `[width, height]` in meters;
`nodes` are `[east, south]` offsets from the center; `edges` are node index pairs.
The generation date and source are included in the JSON. Raw OSM downloads stay
in the system temporary directory and are not shipped with the website.
