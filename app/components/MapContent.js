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
import { PacmanLoader } from "react-spinners";
import { selectPoints } from "../actions";
import L from "leaflet";
import { bbox, center } from "@turf/turf";

// Função para ajustar o mapa a todos os pontos
const ajustarVisualizacao = (pontos, map) => {
  if (pontos.length === 0) return;

  const featureCollection = {
    type: "FeatureCollection",
    features: pontos.map((ponto) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [ponto.longitude, ponto.latitude],
      },
    })),
  };

  const box = bbox(featureCollection);
  map.fitBounds([
    [box[1], box[0]],
    [box[3], box[2]],
  ]);
};

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
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="#1E90FF" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-droplets">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
    </svg>
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
    ">Mapa interativo com dados da Agência Nacional de Águas relativos às médias de turbidez da água no Rio de Janeiro no período entre 2013 a 2019</div>
  <hr>
  <h4 style="margin:0 0 11px; border-bottom:1px solid #eee; padding-bottom:5px; padding-top:5px;">
    Categorizar por:
  </h4>
  <div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:15px;">
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "med_13" ? "checked" : ""}
        data-scheme="med_13"
      />
      Média de turbidez em 2013
    </label>
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "med_14" ? "checked" : ""}
        data-scheme="med_14"
      />
      Média de turbidez em 2014
    </label>
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "med_15" ? "checked" : ""}
        data-scheme="med_15"
      />
      Média de turbidez em 2015
    </label>
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "med_16" ? "checked" : ""}
        data-scheme="med_16"
      />
      Média de turbidez em 2016
    </label>
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "med_17" ? "checked" : ""}
        data-scheme="med_17"
      />
      Média de turbidez em 2017
    </label>
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "med_18" ? "checked" : ""}
        data-scheme="med_18"
      />
      Média de turbidez em 2018
    </label>
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "med_19" ? "checked" : ""}
        data-scheme="med_19"
      />
      Média de turbidez em 2019
    </label>
    <label style="display:flex; align-items:center; gap:5px;">
      <input 
        type="radio" 
        name="category" 
        ${colorScheme === "med_all" ? "checked" : ""}
        data-scheme="med_all"
      />
      Média de turbidez 2013-2019
    </label>
  </div>
  <hr>
  <h4 style="margin:0 0 11px; border-bottom:1px solid #eee; padding-bottom:5px; padding-top:5px;">
    © 2025 <a href="https://github.com/sigvum/turbidezrj" target=_blank>TurbidezRJ</a></span>
  </h4>
`;

      div.innerHTML = categoryHtml;

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

      div.insertBefore(fontSizeControls, div.firstChild);

      return div;
    };

    panel.addTo(map);

    return () => {
      map.removeControl(panel);
    };
  }, [map, colorScheme, onColorSchemeChange, fontSize, panelWidth]);

  return null;
};

const createCustomIcon = (ponto, colorScheme) => {
  // Determina o valor de turbidez baseado no ano selecionado
  let turbidez;

  if (colorScheme === "med_all") {
    turbidez = parseFloat(ponto.med); // Média geral
  } else {
    // Acessa diretamente as propriedades med_13, med_14, etc.
    const year = colorScheme.split("_")[1]; // Extrai o ano (13, 14, etc.)
    turbidez = parseFloat(ponto[`med_${year}`]);
  }

  // Normaliza a turbidez (ajuste 100 conforme o valor máximo esperado)
  const normalizedTurbidity = Math.min(turbidez / 100, 1);

  // Cores em tons de azul - mais escuro = mais turbidez
  const hue = 240; // Azul
  const saturation = 100;
  const lightness = 100 - normalizedTurbidity * 60; // 40% a 100%

  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
           fill="hsl(${hue}, ${saturation}%, ${lightness}%)" 
           stroke="hsl(${hue}, ${saturation}%, ${lightness - 10}%)"
           stroke-width="1.5">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
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

const LayersTreeControl = () => {
  const map = useMap();
  const [controlAdded, setControlAdded] = useState(false);

  useEffect(() => {
    if (controlAdded) return;

    const setupLayersTree = async () => {
      const L = await import("leaflet");
      await import("leaflet.control.layers.tree");

      if (typeof L.control.layers.tree === "function") {
        const baseTree = {
          label: "<b>Mapas</b>",
          children: [
            {
              label: " Stadia.AlidadeSmoothDark",
              layer: L.tileLayer(
                "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}",
                {
                  minZoom: 0,
                  maxZoom: 20,
                  attribution:
                    '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                  ext: "png",
                }
              ),
            },
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

        const layersControl = L.control.layers
          .tree(baseTree, null, {
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

const MapSearch = ({ pontos, markerRefs }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const map = useMap();

  useEffect(() => {
    if (searchTerm) {
      const filteredSuggestions = pontos
        .filter((ponto) => {
          const searchLower = searchTerm.toLowerCase();
          return (
            ponto.corpodagua &&
            ponto.corpodagua.toLowerCase().includes(searchLower)
          );
        })
        .slice(0, 10);

      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, pontos]);

  const handleSelect = (selectedPonto) => {
    const markerIndex = pontos.findIndex(
      (ponto) => ponto.id === selectedPonto.id
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
            {suggestions.map((ponto, index) => (
              <li
                key={index}
                onClick={() => handleSelect(ponto)}
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
                {ponto.corpodagua} (ID: {ponto.id})
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
  const [pontos, setPontos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorScheme, setColorScheme] = useState("med_all"); // Padrão: média geral
  const mapRef = useRef();
  const markerRefs = useRef([]);

  // Função para calcular o centro usando Turf
  const calcularCentroTurf = (pontos) => {
    if (pontos.length === 0) return [-22.9068, -43.1729]; // Fallback

    // Cria uma FeatureCollection com todos os pontos
    const featureCollection = {
      type: "FeatureCollection",
      features: pontos.map((ponto) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [ponto.longitude, ponto.latitude],
        },
      })),
    };

    // Calcula o centro geográfico
    const centroid = center(featureCollection);
    return centroid.geometry.coordinates.reverse(); // Retorna [lat, lng]
  };

  // Ajusta o viewport quando os pontos mudam
  useEffect(() => {
    if (pontos.length > 0 && mapRef.current) {
      ajustarVisualizacao(pontos, mapRef.current);
    }
  }, [pontos]);

  // Nova paleta de cores em tons de vermelho
  const generateColorMapping = (items) => {
    const redColors = [
      "#FFB3B3", // Rosa claro
      "#FF8080", // Vermelho claro
      "#FF4D4D", // Vermelho médio
      "#FF1A1A", // Vermelho vibrante
      "#E60000", // Vermelho forte
      "#CC0000", // Vermelho escuro
      "#990000", // Vermelho muito escuro
      "#660000", // Bordô
      "#330000", // Quase preto avermelhado
    ];

    // Categoriza os pontos por nível de turbidez
    const categories = ["baixa", "media", "alta", "muito_alta"];
    const mapping = {};

    // Inicializa as categorias
    categories.forEach((category) => {
      mapping[category] = {
        colors: {},
        counts: {},
      };
    });

    // Agrupa os pontos por corpo d'água para cada categoria
    items.forEach((item) => {
      const turbidez = parseFloat(item.med);
      const corpoDagua = item.corpodagua;

      // Determina a categoria baseada no valor de turbidez
      let category;
      if (turbidez < 20) {
        category = "baixa";
      } else if (turbidez >= 20 && turbidez < 40) {
        category = "media";
      } else if (turbidez >= 40 && turbidez < 60) {
        category = "alta";
      } else {
        category = "muito_alta";
      }

      // Incrementa a contagem para este corpo d'água na categoria apropriada
      if (!mapping[category].counts[corpoDagua]) {
        mapping[category].counts[corpoDagua] = 0;
      }
      mapping[category].counts[corpoDagua]++;

      // Atribui uma cor se ainda não tiver
      if (!mapping[category].colors[corpoDagua]) {
        const colorIndex =
          Object.keys(mapping[category].colors).length % redColors.length;
        mapping[category].colors[corpoDagua] = redColors[colorIndex];
      }
    });

    return mapping;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await selectPoints();
        setPontos(result);
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
    <div style={{ height: "100vh", width: "100wh" }}>
      <MapContainer
        whenCreated={setMap}
        zoomControl={true}
        ref={mapRef}
        center={calcularCentroTurf(pontos)}
        style={{ height: "100%", width: "100%" }}
      >
        <ScaleControl imperial={false} />
        <Location />
        <LayersTreeControl />
        <MapSearch pontos={pontos} markerRefs={markerRefs} />

        {pontos.map((ponto, index) => (
          <Marker
            ref={(el) => (markerRefs.current[index] = el)}
            key={ponto.id}
            position={{
              lat: parseFloat(ponto.latitude),
              lng: parseFloat(ponto.longitude),
            }}
            icon={createCustomIcon(ponto, colorScheme)}
          >
            <Popup maxWidth={300} minWidth={250}>
              <div className="bg-blue-50 rounded-lg shadow overflow-hidden border border-blue-100">
                <div className="px-4 py-3">
                  <h3 className="font-bold text-lg text-blue-800">
                    {ponto.corpodagua}
                  </h3>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {/* Média geral */}
                    <div
                      className={`p-2 rounded ${
                        colorScheme === "med_all" ? "bg-blue-100" : ""
                      }`}
                    >
                      <div className="text-xs text-blue-600">
                        Média 2013-2019
                      </div>
                      <div className="font-bold">
                        {ponto.med
                          ? parseFloat(ponto.med).toFixed(2) + " NTU"
                          : "-"}
                      </div>
                    </div>

                    {/* Anos individuais */}
                    {[13, 14, 15, 16, 17, 18, 19].map((year) => (
                      <div
                        key={year}
                        className={`p-2 rounded ${
                          colorScheme === `med_${year}` ? "bg-blue-100" : ""
                        }`}
                      >
                        <div className="text-xs text-blue-600">20{year}</div>
                        <div className="font-bold">
                          {ponto[`med_${year}`]
                            ? parseFloat(ponto[`med_${year}`]).toFixed(2) +
                              " NTU"
                            : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <SidePanel
          colorScheme={colorScheme}
          onColorSchemeChange={setColorScheme}
        />
      </MapContainer>
    </div>
  );
};

export default MapContent;
