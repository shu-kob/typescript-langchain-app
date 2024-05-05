import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { v1beta, type protos } from '@google-cloud/discoveryengine'

const model = new ChatGoogleGenerativeAI({
  model: "gemini-pro",
  maxOutputTokens: 2048,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
    }
  ],
  apiKey: process.env.GOOGLE_VERTEX_AI_API_KEY
})

export const chat = async (input: string): Promise<any> => {
  const context: string = await getDocumentsFromRAG(input)

  const res = await model.invoke([
    [
      'system',
      `${context}を元にして質問に答えます。`
    ],
    [
      'human',
      input
    ]
  ])
  return res.content
}

export const getDocumentsFromRAG = async (input: string): Promise<string> =>  {
  let responseContent: string = ''
  const dataSourceId: string = process.env.VERTEXAI_DATASOURCE_ID ?? ''
  const apiEndpointFromEnv: string = 'discoveryengine.googleapis.com'
  const servingConfigId: string = 'default_config'

  const client = new v1beta.SearchServiceClient({ apiEndpoint: apiEndpointFromEnv })
  const request = {
    servingConfig: dataSourceId + '/servingConfigs/' + servingConfigId,
    query: input,
    pageSize: 10,
    queryExpansionSpec: { condition: 'AUTO' },
    spellCorrectionSpec: { mode: 'AUTO' },
    contentSearchSpec: {
      summarySpec: {
        summaryResultCount: 5
      }
    }
  } as protos.google.cloud.discoveryengine.v1beta.SearchRequest

  const IResponseParams = {
    ISearchResult: 0,
    ISearchRequest: 1,
    ISearchResponse: 2
  }

  const response = await client.search(request, {
    autoPaginate: false
  })
  const { summary, results } = response[IResponseParams.ISearchResponse] as protos.google.cloud.discoveryengine.v1beta.ISearchResponse

  responseContent = summary?.summaryText ?? ''
  console.log('RAG Context:')
  console.log(responseContent)
  return responseContent
}
