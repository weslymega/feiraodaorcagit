
// Interface para os itens básicos (Marca, Modelo, Ano)
export interface FipeItem {
  codigo: string;
  nome: string;
}

// Interface para o detalhe completo do veículo
export interface FipeDetail {
  TipoVeiculo: number;
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  SiglaCombustivel: string;
}

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1/carros';

export const fipeApi = {
  // Buscar Marcas
  getBrands: async (): Promise<FipeItem[]> => {
    try {
      const response = await fetch(`${BASE_URL}/marcas`);
      if (!response.ok) throw new Error('Falha ao buscar marcas');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Buscar Modelos pela Marca
  getModels: async (brandId: string): Promise<FipeItem[]> => {
    try {
      const response = await fetch(`${BASE_URL}/marcas/${brandId}/modelos`);
      if (!response.ok) throw new Error('Falha ao buscar modelos');
      const data = await response.json();
      return data.modelos || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Buscar Anos pelo Modelo
  getYears: async (brandId: string, modelId: string): Promise<FipeItem[]> => {
    try {
      const response = await fetch(`${BASE_URL}/marcas/${brandId}/modelos/${modelId}/anos`);
      if (!response.ok) throw new Error('Falha ao buscar anos');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Buscar Detalhes (Preço) pelo Ano
  getDetail: async (brandId: string, modelId: string, yearId: string): Promise<FipeDetail | null> => {
    try {
      const response = await fetch(`${BASE_URL}/marcas/${brandId}/modelos/${modelId}/anos/${yearId}`);
      if (!response.ok) throw new Error('Falha ao buscar detalhes');
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  }
};
