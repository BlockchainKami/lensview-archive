const {getLensContent} = require('./getLensPublication')

const getPublicationDetails = async (data) => {

    const publicationIDs = data["publicationIDs"]


    const response = await getLensContent(publicationIDs)
    return response

}

const sendToFrontEnd = (data) => {
    console.log(data)
}

module.exports = {sendToFrontEnd, getPublicationDetails}
