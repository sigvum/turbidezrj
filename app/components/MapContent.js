import { useEffect, useState, useRef } from "react";
import {
  Circle,
  MapContainer,
  Popup,
  Marker,
  useMap,
  ScaleControl,
  GeoJSON,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
import { PacmanLoader } from "react-spinners";
import { selectPoints, getRioGeometry, selectBacias } from "../actions";
import L from "leaflet";
import { bbox, center } from "@turf/turf";

const BaciasLayer = ({ bacias }) => {
  const map = useMap();

  useEffect(() => {
    if (!bacias || bacias.length === 0 || !map) return;

    const style = (feature) => {
      return {
        fillColor: getRandomColor(),
        weight: 1,
        opacity: 1,
        color: "white",
        fillOpacity: 0.5,
      };
    };

    const onEachFeature = (feature, layer) => {
      if (feature.properties) {
        const popupContent = `
          <div>
            <strong>Bacia:</strong> ${feature.properties.nome}<br/>
          </div>
        `;
        layer.bindPopup(popupContent);
      }
    };

    const layers = bacias.map((bacia) => {
      return L.geoJSON(bacia.geojson, {
        style: style(bacia),
        onEachFeature: onEachFeature,
      });
    });

    const group = L.layerGroup(layers).addTo(map);

    return () => {
      map.removeLayer(group);
    };
  }, [bacias, map]);

  return null;
};

function getRandomColor() {
  const colors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

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

const calcularIntervalos = (pontos, colorScheme, numIntervalos = 7) => {
  const valores = pontos
    .map((ponto) => {
      let valor;
      if (colorScheme === "med_all") {
        valor = parseFloat(ponto.med);
      } else {
        const year = colorScheme.split("_")[1];
        valor = parseFloat(ponto[`med_${year}`]);
      }
      return isNaN(valor) ? null : valor;
    })
    .filter((valor) => valor !== null)
    .sort((a, b) => a - b);

  if (valores.length === 0) return [];

  const intervalos = [];
  const passo = 1 / numIntervalos;

  for (let i = 0; i < numIntervalos; i++) {
    const minQuantile = i * passo;
    const maxQuantile = (i + 1) * passo;

    const minIndex = Math.floor(minQuantile * (valores.length - 1));
    const maxIndex = Math.floor(maxQuantile * (valores.length - 1));

    const min = valores[minIndex];
    const max =
      i === numIntervalos - 1 ? valores[valores.length - 1] : valores[maxIndex];

    const lightness = 90 - (i * 60) / (numIntervalos - 1);

    intervalos.push({
      min,
      max,
      lightness,
    });
  }

  return intervalos;
};

const SidePanel = ({
  colorScheme,
  onColorSchemeChange,
  pontos,
  fontSize,
  panelWidth,
  onIncreaseFontSize,
  onDecreaseFontSize,
}) => {
  const map = useMap();
  const [intervalos, setIntervalos] = useState([]);

  useEffect(() => {
    if (pontos && pontos.length > 0) {
      const novosIntervalos = calcularIntervalos(pontos, colorScheme);
      setIntervalos(novosIntervalos);
    }
  }, [pontos, colorScheme]);

  useEffect(() => {
    if (!map) return;

    const panel = L.control({ position: "topleft" });

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
        left: 0;
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
          color: #1E90FF;
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
        ">Mapa interativo com <a href="https://dadosabertos.ana.gov.br/datasets/97e46167e18c4fb0bda9dd5f8ed7783b_8/about" target="_blank" style="color: #FFFFFF; text-decoration: none;"><u>dados oficiais</u></a> da Agência Nacional de Águas relativos às médias de turbidez da água no Rio de Janeiro no período entre 2013 a 2019</div>
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
    `;

      const footerHtml = `
    <hr>
    <h4 style="margin:0 0 11px; border-bottom:1px solid #eee; padding-bottom:5px; padding-top:5px;">
<div xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/" style="text-align: justify; line-height: 1.5;"><a property="dct:title" rel="cc:attributionURL" href="https://github.com/sigvum/turbidezrj" target="_blank" style="color: #FFFFFF; text-decoration: none; display: inline-flex; align-items: center;"><u>TurbidezRJ</u></a> by André Luiz Schilling, Ana Luiza Artine e Tatiana Ferreira de Lima is licensed under <a href="https://creativecommons.org/licenses/by/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-flex; align-items: center; text-decoration: none; color: #FFFFFF;"> CC BY 4.0 <img style="height:22px!important;margin-left:3px;vertical-align:middle; display: inline-block;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" alt=""><img style="height:22px!important;margin-left:3px;vertical-align:middle; display: inline-block;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" alt=""></a><div>
    </h4>
  `;
      const panelContent = categoryHtml + footerHtml;

      div.innerHTML = panelContent;

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
      decreaseBtn.onclick = onDecreaseFontSize;

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
      increaseBtn.onclick = onIncreaseFontSize;

      fontSizeControls.appendChild(decreaseBtn);
      fontSizeControls.appendChild(increaseBtn);

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
    onColorSchemeChange,
    fontSize,
    panelWidth,
    intervalos,
    onIncreaseFontSize,
    onDecreaseFontSize,
  ]);

  return null;
};

const LegendPanel = ({ intervalos, fontSize, panelWidth }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const panel = L.control({ position: "topright" });

    panel.onAdd = () => {
      const div = L.DomUtil.create("div", "legend-panel");
      div.style.cssText = `
        background-color: rgba(32,32,32,0.8);
        border-radius: 5px;
        padding: 10px;
        width: calc(${panelWidth}rem - 6rem);
        box-shadow: 0 0 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-size: ${fontSize}rem;
        color: white;
        margin: 0;
      `;

      let legendHtml = `
        <h4 style="margin:0 0 10px; border-bottom:1px solid #eee; padding-bottom:5px;">
          Legenda:
        </h4>
        <div style="display:grid; grid-template-columns:auto 1fr; gap:5px; align-items:center;">
      `;

      intervalos.forEach((intervalo, index) => {
        const isLast = index === intervalos.length - 1;
        const labelText = isLast
          ? `≥ ${intervalo.min.toFixed(1)}`
          : `${intervalo.min.toFixed(1)} - ${intervalo.max.toFixed(1)}`;

        legendHtml += `
          <div style="width:18px; height:18px; background-color:hsl(240, 100%, ${intervalo.lightness}%); border:1px solid #999;"></div>
          <div>${labelText}</div>
        `;
      });

      legendHtml += `</div>`;

      div.innerHTML = legendHtml;
      L.DomEvent.disableClickPropagation(div);

      return div;
    };

    panel.addTo(map);

    return () => {
      map.removeControl(panel);
    };
  }, [map, intervalos, fontSize, panelWidth]);

  return null;
};

const createCustomIcon = (ponto, colorScheme, intervalos) => {
  let turbidez;

  if (colorScheme === "med_all") {
    turbidez = parseFloat(ponto.med);
  } else {
    const year = colorScheme.split("_")[1];
    turbidez = parseFloat(ponto[`med_${year}`]);
  }

  if (isNaN(turbidez)) return L.divIcon({ html: "", className: "empty-icon" });

  let lightness = 60;
  if (intervalos && intervalos.length > 0) {
    const intervalo =
      intervalos.find((int) => turbidez >= int.min && turbidez <= int.max) ||
      intervalos[intervalos.length - 1];
    lightness = intervalo.lightness;
  }

  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
           fill="hsl(240, 100%, ${lightness}%)" 
           stroke="hsl(240, 100%, ${lightness - 10}%)"
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

const LayersTreeControl = ({ bacias }) => {
  const map = useMap();
  const [controlAdded, setControlAdded] = useState(false);

  useEffect(() => {
    if (controlAdded || bacias.length === 0) return;

    const setupLayersTree = async () => {
      const L = await import("leaflet");
      await import("leaflet.control.layers.tree");

      if (typeof L.control.layers.tree === "function") {
        const baciaLayers = bacias.map((bacia) => {
          return {
            label: ` ${bacia.properties.nome}`,
            layer: L.geoJSON(bacia.geojson, {
              style: {
                fillColor: getRandomColor(),
                weight: 1,
                opacity: 1,
                color: "white",
                fillOpacity: 0.5,
              },
            }),
          };
        });

        const groupedByMacro = bacias.reduce((acc, bacia) => {
          const macroName = bacia.properties.nome_macro;
          if (!acc[macroName]) {
            acc[macroName] = [];
          }
          acc[macroName].push({
            label: ` ${bacia.properties.nome}`,
            layer: L.geoJSON(bacia.geojson, {
              style: {
                fillColor: getRandomColor(),
                weight: 1,
                opacity: 1,
                color: "white",
                fillOpacity: 0.5,
              },
            }),
          });
          return acc;
        }, {});

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
          label: " <b>Bacias Hidrográficas</b>",
          selectAllCheckbox: true,
          children: Object.entries(groupedByMacro).map(
            ([macroName, bacias]) => ({
              label: ` ${macroName}`,
              selectAllCheckbox: true,
              children: bacias,
            })
          ),
        };

        const layersControl = L.control.layers
          .tree(baseTree, overlayTree, {
            collapsed: true,
            position: "bottomleft",
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
  }, [map, controlAdded, bacias]);

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
  const [bacias, setBacias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorScheme, setColorScheme] = useState("med_all");
  const [intervalos, setIntervalos] = useState([]);
  const mapRef = useRef();
  const markerRefs = useRef([]);
  const [rioGeometry, setRioGeometry] = useState(null);
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

  const RioDeJaneiroPolygon = ({ geoJSON }) => {
    const map = useMap();

    useEffect(() => {
      if (!geoJSON || !map) return;

      const style = {
        weight: 3,
        opacity: 1,
        color: "#fc0505",
        fillOpacity: 0,
      };

      const layer = L.geoJSON(geoJSON, { style }).addTo(map);

      return () => {
        if (map && layer) {
          map.removeLayer(layer);
        }
      };
    }, [geoJSON, map]);

    return null;
  };

  useEffect(() => {
    if (pontos.length > 0) {
      const novosIntervalos = calcularIntervalos(pontos, colorScheme);
      setIntervalos(novosIntervalos);
    }
  }, [pontos, colorScheme]);

  const calcularCentroTurf = (pontos) => {
    if (pontos.length === 0) return [-15.799698, -47.894194];

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

    const centroid = center(featureCollection);
    return centroid.geometry.coordinates.reverse();
  };

  useEffect(() => {
    if (pontos.length > 0 && mapRef.current) {
      ajustarVisualizacao(pontos, mapRef.current);
    }
  }, [pontos]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pontosData, rioData, baciasData] = await Promise.all([
          selectPoints(),
          getRioGeometry(),
          selectBacias(),
        ]);

        setPontos(pontosData);
        setRioGeometry(rioData);
        setBacias(baciasData);
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
        zoom={8}
        whenCreated={setMap}
        ref={mapRef}
        zoomControl={false}
        center={calcularCentroTurf(pontos)}
        style={{ height: "100%", width: "100%" }}
      >
        <ScaleControl imperial={false} />
        <Location />
        <ZoomControl position={"bottomright"} />
        <LayersTreeControl bacias={bacias} />
        <MapSearch pontos={pontos} markerRefs={markerRefs} />

        {rioGeometry && (
          <RioDeJaneiroPolygon
            geoJSON={rioGeometry}
            fillColor="#1E90FF"
            fillOpacity={0.1}
            borderColor="#1E90FF"
            borderWidth={2}
          />
        )}

        {pontos.map((ponto, index) => (
          <Marker
            ref={(el) => (markerRefs.current[index] = el)}
            key={ponto.id}
            position={{
              lat: parseFloat(ponto.latitude),
              lng: parseFloat(ponto.longitude),
            }}
            icon={createCustomIcon(ponto, colorScheme, intervalos)}
          >
            <Popup maxWidth={300} minWidth={250}>
              <div className="bg-blue-50 rounded-lg shadow overflow-hidden border border-blue-100">
                <div className="px-4 py-3">
                  <h3 className="font-bold text-lg text-blue-800">
                    {ponto.corpodagua}
                  </h3>

                  <div className="mt-2 grid grid-cols-2 gap-2">
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
          pontos={pontos}
          fontSize={fontSize}
          panelWidth={panelWidth}
          onIncreaseFontSize={increaseFontSize}
          onDecreaseFontSize={decreaseFontSize}
        />
        <LegendPanel
          intervalos={intervalos}
          fontSize={fontSize}
          panelWidth={panelWidth}
        />
      </MapContainer>
    </div>
  );
};

export default MapContent;
