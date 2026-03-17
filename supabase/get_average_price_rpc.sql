-- Função RPC para calcular a média de preços de anúncios semelhantes
-- Critérios: Categoria, Marca, Modelo e Ano.
-- Retorna a média e a quantidade de anúncios para validação no frontend.

CREATE OR REPLACE FUNCTION public.get_app_average_price(
    p_category text,
    p_brand text,
    p_model text,
    p_year int
)
RETURNS TABLE (
    average_price numeric,
    ad_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH matching_ads AS (
        SELECT preco
        FROM public.anuncios
        WHERE 
            categoria = p_category
            AND status IN ('active', 'ativo')
            AND detalhes->>'brandName' = p_brand
            AND detalhes->>'modelName' = p_model
            -- Extrai apenas o número do ano (ex: "2024 Gasolina" -> "2024")
            AND split_part(detalhes->>'year', ' ', 1)::int = p_year
    )
    SELECT 
        CASE 
            WHEN COUNT(*) >= 3 THEN AVG(preco)::numeric 
            ELSE NULL 
        END as average_price,
        COUNT(*) as ad_count
    FROM matching_ads;
END;
$$;

-- Índice para performance em consultas JSONB
-- Nota: Isso acelera drasticamente a busca por marca e modelo dentro do campo detalhes.
CREATE INDEX IF NOT EXISTS idx_anuncios_details_vehicle_comp 
ON public.anuncios USING gin (detalhes);
