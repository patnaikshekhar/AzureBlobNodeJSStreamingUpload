const {
  Aborter,
  BlockBlobURL,
  ContainerURL,
  ServiceURL,
  StorageURL,
  SharedKeyCredential,
  uploadStreamToBlockBlob,
  generateBlobSASQueryParameters,
  SASProtocol
} = require('@azure/storage-blob')

let progress = {}

const CONTAINER_NAME = process.env.AZ_CONTAINER_NAME
const ACCOUNT_NAME = process.env.AZ_ACCOUNT_NAME
const ACCOUNT_KEY = process.env.AZ_ACCOUNT_KEY

const getContainerURL = () => {
    const sharedKeyCredential = new SharedKeyCredential(ACCOUNT_NAME, ACCOUNT_KEY)
    const pipeline = StorageURL.newPipeline(sharedKeyCredential)
    const serviceURL = new ServiceURL(
        `https://${ACCOUNT_NAME}.blob.core.windows.net`,
        pipeline
      )
    
    const containerURL = ContainerURL.fromServiceURL(serviceURL, CONTAINER_NAME)

    return containerURL
}

const getAllBlobs = async () => {
    const containerURL = getContainerURL()
    const listBlobsResponse = await containerURL.listBlobFlatSegment(Aborter.none, null)
    return listBlobsResponse.segment.blobItems
}

const upload = async (fileName, fileStream, totalLength, highWaterMark) => {
    const containerURL = getContainerURL()
    const blockBlobURL = BlockBlobURL.fromContainerURL(containerURL, fileName)
    await uploadStreamToBlockBlob(
        Aborter.none,
        fileStream,
        blockBlobURL,
        highWaterMark,
        5,
        {
            progress: (transferProgress) => {
                const loadedbytes = transferProgress.loadedBytes
                progress[fileName] = Math.floor((loadedbytes / totalLength) * 100)
            }
        }
    )
}

const getProgress = (fileName) => {
    if (fileName in progress) {
        return progress[fileName].toString()
    } else {
        return ""
    }
}

const getSAS = (fileName) => {
    const sharedKeyCredential = new SharedKeyCredential(ACCOUNT_NAME, ACCOUNT_KEY)

    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 5)
    
    const params = generateBlobSASQueryParameters({
        protocol: SASProtocol.HTTPS,
        containerName: CONTAINER_NAME,
        blobName: fileName,
        expiryTime: expiryTime,
        permissions: 'r'
    }, sharedKeyCredential)

    return `https://${ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}/${fileName}?${params}`
}

module.exports = {
    getAllBlobs,
    upload,
    getProgress,
    getSAS
}