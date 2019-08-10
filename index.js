const express = require('express')
const mustacheExpress = require('mustache-express')
const azblob = require('./azblob')
const busboy = require('connect-busboy')

const HIGH_WATER_MARK = 12 * 1024 * 1024

const app = express()
app.use(express.json())
app.engine('mustache', mustacheExpress())
app.set('view engine', 'mustache')
app.set('views', __dirname + '/templates')
app.use(busboy({
    highWaterMark: HIGH_WATER_MARK,
}))

app.get('/', async (req, res) => {

    try {
        const blobs = await azblob.getAllBlobs()

        res.render('home', {
            blobs
        })
    } catch(e) {
        res.send(e.toString())
    }
})

app.post('/sas', (req, res) => {
    const fileName = req.body.filename
    console.log('Body is', req.body)
    res.end(azblob.getSAS(fileName))
})

app.post('/upload', async (req, res) => {
    const totalLength = req.header('Content-Length')
    req.pipe(req.busboy); // Pipe it trough busboy

    req.busboy.on('file', async (fieldname, file, filename) => {
        console.log(`Upload of '${filename}' started`)
        
        await azblob.upload(filename, file, totalLength, HIGH_WATER_MARK)
        console.log(`Upload of '${filename}' completed`)
        res.end('Completed')
    })
})

app.get('/progress', (req, res) => {
    const fileName = req.query.file
    const progress = azblob.getProgress(fileName)
    if (progress) {
        res.end(progress)
    } else {
        res.sendStatus(404)
    }
    
})

app.use(express.static('./static'))

app.listen(8080, () => {
    console.log('Server Started')
})