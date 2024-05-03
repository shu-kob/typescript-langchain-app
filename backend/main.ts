import express, { Express, Request, Response } from 'express'
import { chat } from './src/chat'

console.log('active')

const app: Express = express()
const port = 3000
app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})

app.post('/chat', (req: Request, res: Response) => {
  console.log('req.body: ')
  console.log(req.body)
  const { query } = req.body
  if (query == null) {
    res.status(400).send('query is required')
  }
  chat(query).then(result => {
    res.status(200).json(result)
  }).catch(e => {
    console.error(e)
    res.status(500).send('server error')
  })
})

app.listen(port, () => {
  console.log(`listening on port ${port}`);
})
