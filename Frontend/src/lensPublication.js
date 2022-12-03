const query = `
query Publication ($pid: ID!) {
        posts(where: {id:$pid}) {
          id
          pubId
          profileId {
            id
            handle
          }
          contentURI
          timestamp
        }
}
`



let response = []


const getLensContent = async (pids) => {


    try {
        response = [];
        for (const pid of pids) {

            const pidDecimal = convertToDecimal(pid)

            const graphResp = await hitGraph(pidDecimal)

            let contentURI = await graphResp["data"]["posts"][0]["contentURI"]
            let JsonURI = await hitIPFS(contentURI)

            let content = JsonURI["content"]
            let handle = graphResp["data"]["posts"][0]["profileId"]["handle"]
            console.log('Return:',content, handle)

            await response.push({
                handle: handle,
                content: content
            })
        }

    } catch(error) {
        console.log(error)
    }
    return response


}

const hitGraph = async (pid) => {
    const resp = await fetch('https://api.thegraph.com/subgraphs/name/anudit/lens-protocol', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query: query,
            variables: {pid: pid}
        })
    })

    const data = await resp.json()
    return data

}

const hitIPFS = async (url, arg) => {
    const resp = await fetch(url, {
        method: 'GET',
        headers: { "Content-Type": "application/json" }
    })

    const data = await resp.json()
    return data

}

const convertToDecimal = (pid) => {
    let arr = pid.split('-')

    let profile = parseInt(arr[0])
    let postId = parseInt(arr[1])

    let publicationID = profile.toString() + postId.toString()

    return parseInt(publicationID)
}


export default getLensContent

