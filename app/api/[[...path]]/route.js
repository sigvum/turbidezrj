import { NextResponse } from "next/server";
import { Pool } from "pg";
import wkt from "wellknown";

// =====================================
// CONFIGURAÇÕES DO BANCO DE DADOS
// =====================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// =====================================
// CONFIGURAÇÕES DE AUTENTICAÇÃO
// =====================================
const AUTH_CONFIG = {
  enabled: true,
  username: process.env.API_USR,
  password: process.env.API_PWD,
};

// Função para verificar autenticação HTTP Basic
const checkAuth = (request) => {
  if (!AUTH_CONFIG.enabled) {
    return { isValid: true };
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return {
      isValid: false,
      response: NextResponse.json(
        {
          code: "Unauthorized",
          description: "Autenticação necessária. Use HTTP Basic Auth.",
        },
        {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="OGC API Features"',
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      ),
    };
  }

  try {
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    const [username, password] = credentials.split(":");

    if (
      username === AUTH_CONFIG.username &&
      password === AUTH_CONFIG.password
    ) {
      return { isValid: true };
    } else {
      return {
        isValid: false,
        response: NextResponse.json(
          {
            code: "Forbidden",
            description: "Credenciais inválidas.",
          },
          {
            status: 403,
            headers: {
              "WWW-Authenticate": 'Basic realm="OGC API Features"',
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          }
        ),
      };
    }
  } catch (error) {
    return {
      isValid: false,
      response: NextResponse.json(
        {
          code: "BadRequest",
          description: "Formato de autenticação inválido.",
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      ),
    };
  }
};

// Definição das coleções disponíveis
const collections = [
  {
    id: "turbidez_rj",
    title: "Turbidez de Corpos d'Água no Rio de Janeiro",
    description: "Medições de turbidez em corpos d'água do RJ",
    extent: {
      spatial: {
        bbox: [
          [-44.648053, -22.91994399899994, -41.678333, -21.133055998999964],
        ],
        crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
      },
      temporal: {
        interval: [["2013-01-01T00:00:00Z", "2019-12-31T23:59:59Z"]],
        trs: "http://www.opengis.net/def/uom/ISO-8601/0/Gregorian",
      },
    },
    itemType: "feature",
    crs: ["http://www.opengis.net/def/crs/OGC/1.3/CRS84"],
    links: [
      {
        href: "/api/collections/turbidez_rj",
        rel: "self",
        type: "application/json",
        title: "Metadados da coleção turbidez_rj",
      },
      {
        href: "/api/collections/turbidez_rj/items",
        rel: "items",
        type: "application/geo+json",
        title: "Itens da coleção turbidez_rj",
      },
      {
        href: "/api/collections/turbidez_rj/queryables",
        rel: "queryables",
        type: "application/schema+json",
        title: "Atributos consultáveis",
      },
    ],
  },
];

// Função para gerar links da landing page
const getLandingPageLinks = (baseUrl) => [
  {
    href: `${baseUrl}/api`,
    rel: "self",
    type: "application/json",
    title: "Esta API (Landing Page)",
  },
  {
    href: `${baseUrl}/api/conformance`,
    rel: "conformance",
    type: "application/json",
    title: "Declaração de conformidade OGC API",
  },
  {
    href: `${baseUrl}/api/collections`,
    rel: "data",
    type: "application/json",
    title: "Coleções de dados disponíveis",
  },
  {
    href: `${baseUrl}/api/openapi`,
    rel: "service-desc",
    type: "application/vnd.oai.openapi+json;version=3.0",
    title: "Documentação OpenAPI 3.0",
  },
];

// Função para processar parâmetros de consulta
const parseQueryParams = (url) => {
  const params = new URLSearchParams(url.search);
  return {
    limit: Math.min(parseInt(params.get("limit")) || 10, 1000),
    offset: parseInt(params.get("offset")) || 0,
    bbox: params.get("bbox"),
    datetime: params.get("datetime"),
    properties: params.get("properties"),
  };
};

// Função para consultar features do banco
const getFeatures = async (queryParams) => {
  const client = await pool.connect();
  try {
    let query = `
      SELECT id, corpodagua, med_13, med_14, med_15, med_16, med_17, med_18, med_19, med,
             ST_AsText(geom) AS geom
      FROM turbidez_rj
    `;
    const queryParamsSql = [];
    let whereClauses = [];

    // Filtro por bbox
    if (queryParams.bbox) {
      const bbox = queryParams.bbox.split(",").map(Number);
      if (bbox.length === 4) {
        const [minX, minY, maxX, maxY] = bbox;
        whereClauses.push(`
          ST_Within(geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
        `);
        queryParamsSql.push(minX, minY, maxX, maxY);
      }
    }

    // Adicionar cláusulas WHERE
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    // Contar total de features (numberMatched)
    const countQuery = `SELECT COUNT(*) FROM turbidez_rj${
      whereClauses.length ? ` WHERE ${whereClauses.join(" AND ")}` : ""
    }`;
    const countResult = await client.query(countQuery, queryParamsSql);
    const numberMatched = parseInt(countResult.rows[0].count);

    // Paginação
    query += ` ORDER BY id LIMIT $${queryParamsSql.length + 1} OFFSET $${
      queryParamsSql.length + 2
    }`;
    queryParamsSql.push(queryParams.limit, queryParams.offset);

    const result = await client.query(query, queryParamsSql);

    // Converter resultados para GeoJSON
    const features = result.rows.map((row) => ({
      type: "Feature",
      id: row.id,
      geometry: wkt.parse(row.geom),
      properties: {
        corpodagua: row.corpodagua,
        med_13: row.med_13,
        med_14: row.med_14,
        med_15: row.med_15,
        med_16: row.med_16,
        med_17: row.med_17,
        med_18: row.med_18,
        med_19: row.med_19,
        med: row.med,
      },
    }));

    return { features, numberMatched };
  } finally {
    client.release();
  }
};

// Handler principal para todas as rotas
export async function GET(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // =====================================
  // VERIFICAÇÃO DE AUTENTICAÇÃO
  // =====================================
  const authCheck = checkAuth(request);
  if (!authCheck.isValid) {
    return authCheck.response;
  }

  // Configurar cabeçalhos CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    // API root: /api/api (quando QGIS duplica o path)
    if (
      pathParts.length === 2 &&
      pathParts[0] === "api" &&
      pathParts[1] === "api"
    ) {
      return NextResponse.json(
        {
          title: "OGC API - Features Turbidez RJ",
          description: "API para dados de turbidez no Rio de Janeiro",
          links: getLandingPageLinks(url.origin),
          authentication: AUTH_CONFIG.enabled
            ? {
                type: "http",
                scheme: "basic",
                description: "HTTP Basic Authentication necessária",
              }
            : undefined,
        },
        { headers }
      );
    }

    // Landing page: /api
    if (pathParts.length === 1 && pathParts[0] === "api") {
      return NextResponse.json(
        {
          title: "OGC API - Features Turbidez RJ",
          description: "API para dados de turbidez no Rio de Janeiro",
          links: getLandingPageLinks(url.origin),
        },
        { headers }
      );
    }

    // Conformance: /api/conformance
    if (pathParts.length === 2 && pathParts[1] === "conformance") {
      return NextResponse.json(
        {
          conformsTo: [
            "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core",
            "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30",
            "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson",
            "http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/core",
            "http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/landing-page",
            "http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/json",
          ],
        },
        { headers }
      );
    }

    // Collections: /api/collections
    if (pathParts.length === 2 && pathParts[1] === "collections") {
      return NextResponse.json(
        {
          collections: collections.map((collection) => ({
            ...collection,
            links: collection.links.map((link) => ({
              ...link,
              href: `${url.origin}${link.href}`,
            })),
          })),
          links: getLandingPageLinks(url.origin),
        },
        { headers }
      );
    }

    // Collection específica: /api/collections/{collectionId}
    if (pathParts.length === 3 && pathParts[1] === "collections") {
      const collectionId = pathParts[2];
      const collection = collections.find((c) => c.id === collectionId);

      if (!collection) {
        return NextResponse.json(
          {
            code: "NotFound",
            description: `Collection '${collectionId}' não encontrada`,
          },
          { status: 404, headers }
        );
      }

      return NextResponse.json(
        {
          ...collection,
          links: [
            ...getLandingPageLinks(url.origin),
            ...collection.links.map((link) => ({
              ...link,
              href: `${url.origin}${link.href}`,
            })),
          ],
        },
        { headers }
      );
    }

    // Features: /api/collections/{collectionId}/items
    if (
      pathParts.length === 4 &&
      pathParts[1] === "collections" &&
      pathParts[3] === "items"
    ) {
      const collectionId = pathParts[2];
      const collection = collections.find((c) => c.id === collectionId);

      if (!collection) {
        return NextResponse.json(
          {
            code: "NotFound",
            description: `Collection '${collectionId}' não encontrada`,
          },
          { status: 404, headers }
        );
      }

      // Processar parâmetros de consulta
      const queryParams = parseQueryParams(url);
      const { features, numberMatched } = await getFeatures(queryParams);

      return NextResponse.json(
        {
          type: "FeatureCollection",
          features,
          links: [
            {
              href: `${url.origin}/api/collections/${collectionId}/items`,
              rel: "self",
              type: "application/geo+json",
              title: `Itens da coleção ${collectionId}`,
            },
            {
              href: `${url.origin}/api/collections/${collectionId}`,
              rel: "collection",
              type: "application/json",
              title: `Coleção ${collectionId}`,
            },
          ],
          numberMatched,
          numberReturned: features.length,
          timeStamp: new Date().toISOString(),
        },
        { headers: { ...headers, "Content-Type": "application/geo+json" } }
      );
    }

    // Feature específica: /api/collections/{collectionId}/items/{featureId}
    if (
      pathParts.length === 5 &&
      pathParts[1] === "collections" &&
      pathParts[3] === "items"
    ) {
      const collectionId = pathParts[2];
      const featureId = pathParts[4];

      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) {
        return NextResponse.json(
          {
            code: "NotFound",
            description: `Collection '${collectionId}' não encontrada`,
          },
          { status: 404, headers }
        );
      }

      const client = await pool.connect();
      try {
        const query = `
          SELECT id, corpodagua, med_13, med_14, med_15, med_16, med_17, med_18, med_19, med,
                 ST_AsText(geom) AS geom
          FROM turbidez_rj
          WHERE id = $1
        `;
        const result = await client.query(query, [featureId]);

        if (result.rows.length === 0) {
          return NextResponse.json(
            {
              code: "NotFound",
              description: `Feature '${featureId}' não encontrada`,
            },
            { status: 404, headers }
          );
        }

        const row = result.rows[0];
        const feature = {
          type: "Feature",
          id: row.id,
          geometry: wkt.parse(row.geom),
          properties: {
            corpodagua: row.corpodagua,
            med_13: row.med_13,
            med_14: row.med_14,
            med_15: row.med_15,
            med_16: row.med_16,
            med_17: row.med_17,
            med_18: row.med_18,
            med_19: row.med_19,
            med: row.med,
          },
        };

        return NextResponse.json(feature, {
          headers: { ...headers, "Content-Type": "application/geo+json" },
        });
      } finally {
        client.release();
      }
    }

    // Queryables: /api/collections/{collectionId}/queryables
    if (
      pathParts.length === 4 &&
      pathParts[1] === "collections" &&
      pathParts[3] === "queryables"
    ) {
      const collectionId = pathParts[2];
      const collection = collections.find((c) => c.id === collectionId);

      if (!collection) {
        return NextResponse.json(
          {
            code: "NotFound",
            description: `Collection '${collectionId}' não encontrada`,
          },
          { status: 404, headers }
        );
      }

      return NextResponse.json(
        {
          $schema: "https://json-schema.org/draft/2019-09/schema",
          $id: `${url.origin}/api/collections/${collectionId}/queryables`,
          type: "object",
          title: "Atributos consultáveis",
          properties: {
            corpodagua: {
              type: "string",
              title: "Corpo d'Água",
            },
            med_13: {
              type: "number",
              title: "Turbidez 2013",
            },
            med_14: {
              type: "number",
              title: "Turbidez 2014",
            },
            med_15: {
              type: "number",
              title: "Turbidez 2015",
            },
            med_16: {
              type: "number",
              title: "Turbidez 2016",
            },
            med_17: {
              type: "number",
              title: "Turbidez 2017",
            },
            med_18: {
              type: "number",
              title: "Turbidez 2018",
            },
            med_19: {
              type: "number",
              title: "Turbidez 2019",
            },
            med: {
              type: "number",
              title: "Mediana Turbidez",
            },
          },
          additionalProperties: true,
        },
        { headers }
      );
    }

    // OpenAPI: /api/openapi
    if (pathParts.length === 2 && pathParts[1] === "openapi") {
      return NextResponse.json(
        {
          openapi: "3.0.3",
          info: {
            title: "OGC API - Features Turbidez RJ",
            description: "API para dados de turbidez no Rio de Janeiro",
            version: "1.0.0",
            contact: {
              name: "API Support",
              url: url.origin,
            },
            license: {
              name: "MIT",
              url: "https://opensource.org/licenses/MIT",
            },
          },
          servers: [
            {
              url: url.origin + "/api",
              description: "Servidor de desenvolvimento",
            },
          ],
          components: {
            securitySchemes: AUTH_CONFIG.enabled
              ? {
                  basicAuth: {
                    type: "http",
                    scheme: "basic",
                    description: "HTTP Basic Authentication",
                  },
                }
              : {},
            schemas: {
              Feature: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["Feature"] },
                  id: { type: "string" },
                  geometry: { type: "object" },
                  properties: { type: "object" },
                },
              },
            },
          },
          security: AUTH_CONFIG.enabled ? [{ basicAuth: [] }] : [],
          paths: {
            "/": {
              get: {
                summary: "Landing page",
                description:
                  "Página inicial da API com links para outros recursos",
                responses: {
                  200: {
                    description: "Sucesso",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            links: { type: "array" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "/conformance": {
              get: {
                summary: "Declaração de conformidade",
                description:
                  "Lista de especificações OGC que esta API implementa",
                responses: {
                  200: {
                    description: "Sucesso",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            conformsTo: {
                              type: "array",
                              items: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "/collections": {
              get: {
                summary: "Lista de coleções",
                description: "Retorna todas as coleções de dados disponíveis",
                responses: {
                  200: {
                    description: "Sucesso",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            collections: { type: "array" },
                            links: { type: "array" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "/collections/{collectionId}/items": {
              get: {
                summary: "Features da coleção",
                description: "Retorna as features de uma coleção específica",
                parameters: [
                  {
                    name: "collectionId",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                  },
                  {
                    name: "limit",
                    in: "query",
                    schema: {
                      type: "integer",
                      minimum: 1,
                      maximum: 1000,
                      default: 10,
                    },
                  },
                  {
                    name: "offset",
                    in: "query",
                    schema: { type: "integer", minimum: 0, default: 0 },
                  },
                  {
                    name: "bbox",
                    in: "query",
                    schema: { type: "string" },
                    description:
                      "Filtro por caixa delimitadora (minx,miny,maxx,maxy)",
                  },
                ],
                responses: {
                  200: {
                    description: "Sucesso",
                    content: {
                      "application/geo+json": {
                        schema: {
                          type: "object",
                          properties: {
                            type: {
                              type: "string",
                              enum: ["FeatureCollection"],
                            },
                            features: { type: "array" },
                            numberMatched: { type: "integer" },
                            numberReturned: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        { headers }
      );
    }

    // Rota não encontrada
    return NextResponse.json(
      {
        code: "NotFound",
        description: "Endpoint não encontrado",
      },
      { status: 404, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        code: "InternalServerError",
        description: "Erro interno do servidor",
        detail: error.message,
      },
      { status: 500, headers }
    );
  }
}

// Suporte para requisições OPTIONS (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
