/**
 * Especificación OpenAPI 3.0 de EscalaFin Public API (/api/v1/docs)
 * EscalaFin v3.0.0 - Producción
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'EscalaFin Public API',
      version: '1.0.0',
      description: 'API Pública de EscalaFin para la consulta de préstamos, clientes, amortizaciones e integración con sistemas contables y ERPs.',
      contact: {
        name: 'Soporte EscalaFin',
        url: 'https://escalafin.com/soporte',
        email: 'soporte@escalafin.com',
      },
    },
    servers: [
      {
        url: 'https://api.escalafin.com',
        description: 'Servidor de Producción',
      },
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desarrollo Local',
      },
    ],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    paths: {
      '/api/v1/loans': {
        get: {
          summary: 'Consultar cartera de préstamos',
          description: 'Obtiene el listado de préstamos asociados al tenant autenticado con su tabla de amortización y cliente.',
          parameters: [
            {
              name: 'status',
              in: 'query',
              description: 'Estado del préstamo (ACTIVE, PAID_OFF, DEFAULTED)',
              required: false,
              schema: { type: 'string', default: 'ACTIVE' },
            },
            {
              name: 'page',
              in: 'query',
              description: 'Número de página para paginación',
              required: false,
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Cantidad de registros por página (máx. 100)',
              required: false,
              schema: { type: 'integer', default: 20 },
            },
          ],
          responses: {
            '200': {
              description: 'Operación exitosa',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            amount: { type: 'number' },
                            interestRate: { type: 'number' },
                            status: { type: 'string' },
                            client: { type: 'object' },
                            amortization: { type: 'array' },
                          },
                        },
                      },
                      pagination: { type: 'object' },
                    },
                  },
                },
              },
            },
            '401': { description: 'No autorizado (Falta X-API-Key)' },
            '403': { description: 'API Key inválida o revocada' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Cabecera de autenticación mediante API Key asignada al tenant.',
        },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
