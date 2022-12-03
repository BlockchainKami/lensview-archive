query = `
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




const getData = async (id) => {

   const data = await hitGraph('https://api.thegraph.com/subgraphs/name/anudit/lens-protocol')


    let contentURI = data["data"]["posts"][0]["contentURI"]
    let JsonURI = await hitIPFS(contentURI)

    let content = JsonURI["description"]
    let handle = data["data"]["posts"][0]["profileId"]["handle"]
    console.log(content, handle)
}

const hitGraph = async (url, arg) => {
    const resp = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          variables: {pid: 10021410}
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

getData()
