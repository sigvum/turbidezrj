import { useEffect, useState, useRef } from "react";
import {
  Circle,
  MapContainer,
  Popup,
  Marker,
  useMap,
  ScaleControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
import TI_Wawi from "../../public/geojson/TI_Wawi.geojson.json";
import TI_Batovi from "../../public/geojson/TI_Batovi.geojson.json";
import TI_Parque_do_Xingu from "../../public/geojson/TI_Parque_do_Xingu.geojson.json";
import TI_Pequizal_do_Naruvotu from "../../public/geojson/TI_Pequizal_do_Naruvotu.geojson.json";
import { PacmanLoader } from "react-spinners";
import { selectAldeias } from "../actions";
import L from "leaflet";

const defaultCenter = [-12.125264, -53.426514];

const SidePanel = ({ colorScheme, onColorSchemeChange, colorMapping }) => {
  const map = useMap();
  const [fontSize, setFontSize] = useState(0.65);
  const [panelWidth, setPanelWidth] = useState(13);

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 0.1, 1.2));
    setPanelWidth((prev) => Math.min(prev + 1, 16));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 0.1, 0.5));
    setPanelWidth((prev) => Math.max(prev - 1, 10));
  };

  useEffect(() => {
    if (!map) return;

    const panel = L.control({ position: "topright" });

    panel.onAdd = () => {
      const div = L.DomUtil.create("div", "side-panel");
      div.style.cssText = `
        background-color: rgba(32,32,32,0.8);
        border-radius: 0 0 0 5px;
        padding: 15px;
        width: ${panelWidth}rem;
        box-shadow: 0 0 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-size: ${fontSize}rem;
        margin: 0;
        position: absolute;
        top: 0;
        right: 0;
      `;

      const categoryHtml = `
  <div style="display:flex; flex-direction:column; align-items:center; margin:10px 0;">
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-fan-icon lucide-fan"><path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z"/><path d="M12 12v.01"/></svg>
    <div style="
      margin-top: 8px;
      font-weight: bold;
      color: black;
      font-size: 1.7rem;
      text-shadow: 
        -1px -1px 0 white,
        1px -1px 0 white,
        -1px 1px 0 white,
        1px 1px 0 white;
    ">TurbidezRJ</div>
  </div>
   <div style="
      margin-top: 4px;
      font-size: 0.8rem;
      color: white;
      text-align: justify;
    ">Mapa interativo com dados da Agência Nacional de Águas relativo à média de turbidez da água no Rio de Janeiro no período entre 2013 a 2019</div>
  <hr>
  <h4 style="margin:0 0 11px; border-bottom:1px solid #eee; padding-bottom:5px; padding-top:5px;">
    Categorizar por:
  </h4>
  <div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:15px;">
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "municipio" ? "checked" : ""}
        data-scheme="municipio"
      />
      Município
    </label>
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "etnia" ? "checked" : ""}
        data-scheme="etnia"
      />
      Etnia
    </label>
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "tronco_linguistico" ? "checked" : ""}
        data-scheme="tronco_linguistico"
      />
      Tronco Linguístico
    </label>
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "terra_indigena" ? "checked" : ""}
        data-scheme="terra_indigena"
      />
      Terra Indígena
    </label>
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "ctl" ? "checked" : ""}
        data-scheme="ctl"
      />
      CTL
    </label>
  </div>
  <hr>
`;

      const currentMapping = colorMapping[colorScheme] || {};
      const categoryNames = {
        municipio: "Município",
        etnia: "Etnia",
        tronco_linguistico: "Tronco Linguístico",
        terra_indigena: "Terra Indígena",
        ctl: "CTL",
      };
      const categoryName = categoryNames[colorScheme] || colorScheme;

      const totalAldeias = Object.values(
        colorMapping[colorScheme]?.counts || {}
      ).reduce((a, b) => a + b, 0);
      const totalPopulacao = Object.values(
        colorMapping[colorScheme]?.populations || {}
      ).reduce((a, b) => a + b, 0);

      const legendHtml = `
  <h4 style="margin:0 0 11px; border-bottom:1px solid #eee; padding-bottom:5px; padding-top:5px;">
    nº aldeias e pop. por <b>${categoryNames[colorScheme] || colorScheme}</b>:
  </h4>
  <div style="margin-bottom:5px;">
    <div>Nº de aldeias: <b>${totalAldeias}</b></div>
    <div>População: <b>${totalPopulacao} hab</b></div>
  </div>
  <div style="overflow-y:visible;">
    <div style="display:grid; grid-template-columns:auto 1fr auto auto; gap:4px; align-items:center; padding-bottom:50px;">
      
      <div></div>
      <div></div>
      <div style="text-align:right;"><b>nº aldeias</b></div>
      <div style="text-align:right;"><b>pop.</b></div>
      
      ${Object.entries(colorMapping[colorScheme]?.colors || {})
        .map(([value, color]) => {
          const count = colorMapping[colorScheme]?.counts?.[value] || 0;
          const population =
            colorMapping[colorScheme]?.populations?.[value] || 0;

          return {
            value,
            color,
            count,
            population,
          };
        })
        .sort((a, b) => b.population - a.population)
        .map(
          ({ value, color, count, population }) => `
            <div style="width:11px; height:11px; background-color:${color}; border-radius:50%; border:1px solid #ccc;"></div>
            <span>${value || "Sem valor"}</span>
            <span style="text-align:right;">${count}</span>
            <span style="text-align:right;">${population}</span>
          `
        )
        .join("")}
</div>
        <hr>
  <h4 style="margin:0 0 11px; border-bottom:1px solid #eee; padding-bottom:5px; padding-top:5px;">
    © 2025 TurbidezRJ — Idealizado por <span style="color:#b0b0b0"><b>André Luiz Schilling</b></span>
  </h4>
    
  </div>
`;

      div.innerHTML = categoryHtml + legendHtml;

      const radioInputs = div.querySelectorAll('input[type="radio"]');
      radioInputs.forEach((input) => {
        input.addEventListener("change", (e) => {
          const scheme = e.target.dataset.scheme;
          onColorSchemeChange(scheme);
        });
      });

      L.DomEvent.disableClickPropagation(div);

      const fontSizeControls = L.DomUtil.create("div", "font-size-controls");
      fontSizeControls.style.cssText = `
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      `;

      const decreaseBtn = L.DomUtil.create("button", "font-size-btn");
      decreaseBtn.innerHTML = "A-";
      decreaseBtn.style.cssText = `
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        cursor: pointer;
      `;
      decreaseBtn.onclick = decreaseFontSize;

      const increaseBtn = L.DomUtil.create("button", "font-size-btn");
      increaseBtn.innerHTML = "A+";
      increaseBtn.style.cssText = `
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        cursor: pointer;
      `;
      increaseBtn.onclick = increaseFontSize;

      fontSizeControls.appendChild(decreaseBtn);
      fontSizeControls.appendChild(increaseBtn);

      // Inserir os controles no início do painel
      div.insertBefore(fontSizeControls, div.firstChild);

      return div;
    };

    panel.addTo(map);

    return () => {
      map.removeControl(panel);
    };
  }, [
    map,
    colorScheme,
    colorMapping,
    onColorSchemeChange,
    fontSize,
    panelWidth,
  ]);

  return null;
};

const createCustomIcon = (item, colorScheme, colorMapping) => {
  const categoryValue = item[colorScheme] || "Sem valor";
  const currentColors = colorMapping[colorScheme]?.colors || {};
  const strokeColor = currentColors[categoryValue];

  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house">
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      </svg>
    `,
    className: "custom-marker-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const Location = () => {
  const map = useMap();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    map.locate({
      setView: false,
      maxZoom: 8,
    });

    map.on("locationfound", (event) => {
      setPosition(event.latlng);
    });

    map.on("locationerror", (e) => {
      console.error("Error obtaining location:", e.message);
    });

    return () => {
      map.off("locationfound");
      map.off("locationerror");
    };
  }, [map]);

  return position ? (
    <>
      <Circle
        center={position}
        weight={2}
        color={"red"}
        fillColor={"red"}
        fillOpacity={0.1}
        radius={50}
      />
      <Marker position={position}>
        <Popup>
          <b>Você</b> está aqui
        </Popup>
      </Marker>
    </>
  ) : null;
};

if (L.Icon.Default.imagePath === undefined) {
  L.Icon.Default.imagePath = "/";
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "leaflet/marker-icon-2x.png",
    iconUrl: "leaflet/marker-icon.png",
    shadowUrl: "leaflet/marker-shadow.png",
  });
}

function createGeoJSONLayer(geojsonData) {
  return L.geoJSON(geojsonData, {
    onEachFeature: (feature, layer) => {
      if (feature.properties && feature.properties.terrai_nom) {
        layer.bindPopup(feature.properties.terrai_nom);
      }

      layer.on("mouseover", function (e) {
        this.openPopup();
        this.setStyle({
          fillColor: "#eb4034",
          weight: 2,
          color: "#eb4034",
          fillOpacity: 0.7,
        });
      });

      layer.on("mouseout", function () {
        this.closePopup();
        this.setStyle({
          fillColor: "#fcba03",
          weight: 2,
          color: "#fcba03",
          fillOpacity: 0.2,
        });
      });
    },
    style: {
      fillColor: "#fcba03",
      weight: 2,
      color: "#fcba03",
      fillOpacity: 0.2,
    },
  });
}

const LayersTreeControl = () => {
  const map = useMap();
  const [controlAdded, setControlAdded] = useState(false);

  useEffect(() => {
    if (controlAdded) return;

    const setupLayersTree = async () => {
      const L = await import("leaflet");
      await import("leaflet.control.layers.tree");

      if (typeof L.control.layers.tree === "function") {
        const wawiLayer = createGeoJSONLayer(TI_Wawi);
        const batoviLayer = createGeoJSONLayer(TI_Batovi);
        const xinguLayer = createGeoJSONLayer(TI_Parque_do_Xingu);
        const pequizalLayer = createGeoJSONLayer(TI_Pequizal_do_Naruvotu);

        const baseTree = {
          label: "<b>Mapas</b>",
          children: [
            {
              label: " Google Earth",
              layer: L.tileLayer(
                "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                {
                  attribution: "Google Earth",
                  subdomains: ["mt0", "mt1", "mt2", "mt3"],
                }
              ),
            },
            {
              label: " OpenStreetMap",
              layer: L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                  attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                }
              ),
            },
          ],
        };

        const overlayTree = {
          label: " <b>Terras Indígenas</b>",
          selectAllCheckbox: true,
          children: [
            {
              label: " Wawi",
              layer: wawiLayer,
            },
            {
              label: " Batovi",
              layer: batoviLayer,
            },
            {
              label: " Parque do Xingu",
              layer: xinguLayer,
            },
            {
              label: " Pequizal do Naruvotu",
              layer: pequizalLayer,
            },
          ],
        };

        const layersControl = L.control.layers
          .tree(baseTree, overlayTree, {
            collapsed: true,
            position: "topleft",
          })
          .addTo(map);

        baseTree.children[0].layer.addTo(map);

        setControlAdded(true);
      } else {
        console.error(
          "O plugin L.control.layers.tree não foi carregado corretamente"
        );
      }
    };

    setupLayersTree();
  }, [map, controlAdded]);

  return null;
};

const MapSearch = ({ aldeias, markerRefs }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const map = useMap();

  useEffect(() => {
    if (searchTerm) {
      const filteredSuggestions = aldeias
        .filter((aldeia) => {
          const searchLower = searchTerm.toLowerCase();
          const matchAldeia =
            aldeia.aldeia && aldeia.aldeia.toLowerCase().includes(searchLower);

          const matchOutroNome =
            aldeia.outro_nome &&
            aldeia.outro_nome.toLowerCase().includes(searchLower);

          return matchAldeia || matchOutroNome;
        })
        .slice(0, 10);

      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, aldeias]);

  const handleSelect = (selectedAldeia) => {
    const markerIndex = aldeias.findIndex(
      (aldeia) =>
        aldeia.aldeia === selectedAldeia.aldeia ||
        aldeia.outro_nome === selectedAldeia.aldeia
    );

    if (markerIndex !== -1 && markerRefs.current[markerIndex]) {
      const marker = markerRefs.current[markerIndex];
      marker.openPopup();
      const markerLatLng = marker.getLatLng();
      map.setView(markerLatLng, 15);
    }
    setSearchTerm("");
    setSuggestions([]);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "9rem",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "30%",
      }}
    >
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Buscar corpo d'água..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: "1.2em",
            width: "100%",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0 0 15px rgba(0,0,0,0.2)",
            backgroundColor: "rgba(32,32,32,0.8)",
          }}
        />

        {suggestions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "rgba(32,32,32,0.6)",
              border: "1px solid #ccc",
              borderTop: "none",
              listStyle: "none",
              margin: 0,
              padding: 0,
              maxHeight: "200px",
              overflowY: "auto",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            {suggestions.map((aldeia, index) => (
              <li
                key={index}
                onClick={() =>
                  handleSelect({
                    aldeia: aldeia.aldeia || aldeia.outro_nome,
                  })
                }
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "rgba(32,32,32,0.8)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "rgba(32,32,32,0.6)")
                }
              >
                {aldeia.aldeia || aldeia.outro_nome}
                {aldeia.aldeia && aldeia.outro_nome && (
                  <span
                    style={{
                      fontSize: "1.2em",
                      color: "#fff",
                      marginLeft: "10px",
                    }}
                  >
                    ({aldeia.outro_nome})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const MapContent = () => {
  const [map, setMap] = useState(null);
  const [aldeias, setAldeias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorScheme, setColorScheme] = useState("municipio");
  const [colorMapping, setColorMapping] = useState({});
  const markerRefs = useRef([]);

  const generateColorMapping = (items, key) => {
    const colors = [
      "#FF00FF", // Magenta neon
      "#00FFFF", // Ciano neon
      "#FFFFFF", // Vermelho vivo
      "#00FF00", // Verde limão neon
      "#0000FF", // Azul elétrico
      "#FFFF00", // Amarelo neon
      "#FF5100", // Laranja neon
      "#9D00FF", // Roxo neon
      "#FF008C", // Rosa neon
      "#01FF70", // Verde neon
      "#00B4FF", // Azul celeste neon
      "#FFB700", // Amarelo âmbar neon
      "#FF0054", // Vermelho-rosa neon
      "#00FFC8", // Turquesa neon
      "#6A00FF", // Índigo neon
      "#FF7700", // Laranja coral
      "#00FF8F", // Verde aqua neon
      "#D100FF", // Violeta neon
    ];

    const categories = [
      "municipio",
      "etnia",
      "tronco_linguistico",
      "terra_indigena",
      "ctl",
    ];

    const mapping = {};

    categories.forEach((category) => {
      const counts = {};
      const populations = {};

      items.forEach((item) => {
        const value = item[category] || "Sem valor";
        counts[value] = (counts[value] || 0) + 1;

        let pop = 0;
        if (item.populacao) {
          if (typeof item.populacao === "string") {
            pop =
              parseFloat(item.populacao.replace(/\./g, "").replace(",", ".")) ||
              0;
          } else {
            pop = Number(item.populacao) || 0;
          }
        }
        populations[value] = (populations[value] || 0) + pop;
      });

      const uniqueValues = Object.keys(counts);
      mapping[category] = {
        colors: {},
        counts: counts,
        populations: populations,
      };

      uniqueValues.forEach((value, index) => {
        mapping[category].colors[value] = colors[index % colors.length];
      });
    });

    return mapping;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await selectAldeias();
        setAldeias(result);
        setColorMapping(generateColorMapping(result));
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <PacmanLoader color="#fff0f0" />
      </div>
    );
  return (
    <>
      <div style={{ height: "100vh", width: "100wh" }}>
        <MapContainer
          whenCreated={setMap}
          zoomControl={true}
          center={defaultCenter}
          zoom={8}
          style={{ height: "100%", width: "100%" }}
        >
          <ScaleControl imperial={false} />
          <Location />
          <LayersTreeControl />

          <MapSearch aldeias={aldeias} markerRefs={markerRefs} />

          {aldeias.map((item, index) => (
            <Marker
              ref={(el) => (markerRefs.current[index] = el)}
              key={index}
              position={{
                lat: parseFloat(item.latitude),
                lng: parseFloat(item.longitude),
              }}
              icon={createCustomIcon(item, colorScheme, colorMapping)}
            >
              <Popup maxWidth={250} minWidth={250}>
                <div className="bg-green-600/40 rounded-lg shadow overflow-hidden border border-gray-200">
                  <div className="px-0 py-0 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Aldeia
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {item.aldeia || "-"}
                        </dd>
                      </div>

                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Outro Nome
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {item.outro_nome || "-"}
                        </dd>
                      </div>

                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Etnia
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {item.etnia || "-"}
                        </dd>
                      </div>

                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Tronco Linguístico
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {item.tronco_linguistico || "-"}
                        </dd>
                      </div>

                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          População
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {item.populacao || "-"}
                        </dd>
                      </div>

                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Liderança
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {item.lideranca || "-"}
                        </dd>
                      </div>

                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Município
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {item.municipio || "-"}
                        </dd>
                      </div>

                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          CTL
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {item.ctl || "-"}
                        </dd>
                      </div>

                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Terra Indígena
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {item.terra_indigena || "-"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          <SidePanel
            colorScheme={colorScheme}
            onColorSchemeChange={setColorScheme}
            colorMapping={colorMapping}
          />
        </MapContainer>
      </div>
    </>
  );
};

export default MapContent;
