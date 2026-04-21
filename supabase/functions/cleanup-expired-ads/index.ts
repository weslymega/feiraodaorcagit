
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[Cleanup] Starting ad expiration cleanup sequence (35 days rule)...')

    // 1. Buscar anúncios com mais de 35 dias (UTC)
    const thirtyFiveDaysAgo = new Date()
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35)
    
    // Usar tabela 'anuncios' (padrão do projeto)
    const { data: adsToDelete, error: fetchError } = await supabase
      .from('anuncios')
      .select('id, user_id, title')
      .lt('created_at', thirtyFiveDaysAgo.toISOString())
      .limit(50) 

    if (fetchError) throw fetchError

    if (!adsToDelete || adsToDelete.length === 0) {
      console.log('[Cleanup] No ads found for permanent deletion.')
      return new Response(JSON.stringify({ message: 'No ads to cleanup' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`[Cleanup] Found ${adsToDelete.length} ads to delete permanently.`)

    const results = []

    for (const ad of adsToDelete) {
      const adId = ad.id
      const userId = ad.user_id
      
      // Pasta: ads-images/USER_ID/AD_ID/
      const folderPath = `${userId}/${adId}`
      
      try {
        console.log(`[Cleanup] [${adId}] Cleaning Storage folder: ${folderPath}`)
        
        // Listar arquivos para deletar
        const { data: files, error: listError } = await supabase.storage
          .from('ads-images')
          .list(folderPath)

        if (!listError && files && files.length > 0) {
           const filePaths = files.map(f => `${folderPath}/${f.name}`)
           
           // A. DELETAR IMAGENS NO STORAGE (Mandatório antes do DB)
           const { error: storageError } = await supabase.storage
             .from('ads-images')
             .remove(filePaths)

           if (storageError) {
             console.error(`[Cleanup] [${adId}] Storage Error:`, storageError)
             await supabase.from('ad_cleanup_logs').insert({
               ad_id: adId,
               owner_id: userId,
               status: 'error',
               error_message: `Storage deletion failed: ${storageError.message}`
             })
             results.push({ adId, status: 'failed_storage' })
             continue; 
           }
        }

        // B. DELETAR REGISTRO NO BANCO (anuncios)
        const { error: dbError } = await supabase
          .from('anuncios')
          .delete()
          .eq('id', adId)

        if (dbError) {
           console.error(`[Cleanup] [${adId}] DB Delete Error:`, dbError)
           await supabase.from('ad_cleanup_logs').insert({
             ad_id: adId,
             owner_id: userId,
             status: 'error',
             error_message: `DB deletion failed: ${dbError.message}`
           })
           results.push({ adId, status: 'failed_db' })
           continue;
        }

        // C. LOG DE SUCESSO DEFINITIVO
        await supabase.from('ad_cleanup_logs').insert({
          ad_id: adId,
          owner_id: userId,
          title: ad.title,
          status: 'success'
        })

        console.log(`[Cleanup] [${adId}] Permanent cleanup completed.`)
        results.push({ adId, status: 'success' })

      } catch (innerError) {
        console.error(`[Cleanup] [${adId}] Unexpected error:`, innerError)
        results.push({ adId, status: 'error', message: innerError.message })
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('[Cleanup] Fatal error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
