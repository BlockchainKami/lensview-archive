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





// let query = `
//     query Publication ($pid: InternalPublicationId!) {
//         publication(request: {
//         publicationId: $pid
//         }) {
//         __typename
//         ... on Post {
//             ...PostFields
//         }
//         ... on Comment {
//             ...CommentFields
//         }
//         ... on Mirror {
//             ...MirrorFields
//         }
//         }
//     }
//
//     fragment MediaFields on Media {
//         url
//         mimeType
//     }
//
//     fragment ProfileFields on Profile {
//         id
//         name
//         bio
//         attributes {
//         displayType
//         traitType
//         key
//         value
//         }
//         isFollowedByMe
//         isFollowing(who: null)
//         followNftAddress
//         metadata
//         isDefault
//         handle
//         picture {
//         ... on NftImage {
//             contractAddress
//             tokenId
//             uri
//             verified
//         }
//         ... on MediaSet {
//             original {
//             ...MediaFields
//             }
//         }
//         }
//         coverPicture {
//         ... on NftImage {
//             contractAddress
//             tokenId
//             uri
//             verified
//         }
//         ... on MediaSet {
//             original {
//             ...MediaFields
//             }
//         }
//         }
//         ownedBy
//         dispatcher {
//         address
//         }
//         stats {
//         totalFollowers
//         totalFollowing
//         totalPosts
//         totalComments
//         totalMirrors
//         totalPublications
//         totalCollects
//         }
//         followModule {
//         ...FollowModuleFields
//         }
//     }
//
//     fragment PublicationStatsFields on PublicationStats {
//         totalAmountOfMirrors
//         totalAmountOfCollects
//         totalAmountOfComments
//     }
//
//     fragment MetadataOutputFields on MetadataOutput {
//         name
//         description
//         content
//         media {
//         original {
//             ...MediaFields
//         }
//         }
//         attributes {
//         displayType
//         traitType
//         value
//         }
//     }
//
//     fragment Erc20Fields on Erc20 {
//         name
//         symbol
//         decimals
//         address
//     }
//
//     fragment PostFields on Post {
//         id
//         profile {
//         ...ProfileFields
//         }
//         stats {
//         ...PublicationStatsFields
//         }
//         metadata {
//         ...MetadataOutputFields
//         }
//         createdAt
//         collectModule {
//         ...CollectModuleFields
//         }
//         referenceModule {
//         ...ReferenceModuleFields
//         }
//         appId
//         hidden
//         reaction(request: null)
//         mirrors(by: null)
//         hasCollectedByMe
//     }
//
//     fragment MirrorBaseFields on Mirror {
//         id
//         profile {
//         ...ProfileFields
//         }
//         stats {
//         ...PublicationStatsFields
//         }
//         metadata {
//         ...MetadataOutputFields
//         }
//         createdAt
//         collectModule {
//         ...CollectModuleFields
//         }
//         referenceModule {
//         ...ReferenceModuleFields
//         }
//         appId
//         hidden
//         reaction(request: null)
//         hasCollectedByMe
//     }
//
//     fragment MirrorFields on Mirror {
//         ...MirrorBaseFields
//         mirrorOf {
//         ... on Post {
//             ...PostFields
//         }
//         ... on Comment {
//             ...CommentFields
//         }
//         }
//     }
//
//     fragment CommentBaseFields on Comment {
//         id
//         profile {
//         ...ProfileFields
//         }
//         stats {
//         ...PublicationStatsFields
//         }
//         metadata {
//         ...MetadataOutputFields
//         }
//         createdAt
//         collectModule {
//         ...CollectModuleFields
//         }
//         referenceModule {
//         ...ReferenceModuleFields
//         }
//         appId
//         hidden
//         reaction(request: null)
//         mirrors(by: null)
//         hasCollectedByMe
//     }
//
//     fragment CommentFields on Comment {
//         ...CommentBaseFields
//         mainPost {
//         ... on Post {
//             ...PostFields
//         }
//         ... on Mirror {
//             ...MirrorBaseFields
//             mirrorOf {
//             ... on Post {
//                 ...PostFields
//             }
//             ... on Comment {
//                 ...CommentMirrorOfFields
//             }
//             }
//         }
//         }
//     }
//
//     fragment CommentMirrorOfFields on Comment {
//         ...CommentBaseFields
//         mainPost {
//         ... on Post {
//             ...PostFields
//         }
//         ... on Mirror {
//             ...MirrorBaseFields
//         }
//         }
//     }
//
//     fragment FollowModuleFields on FollowModule {
//         ... on FeeFollowModuleSettings {
//         type
//         amount {
//             asset {
//             name
//             symbol
//             decimals
//             address
//             }
//             value
//         }
//         recipient
//         }
//         ... on ProfileFollowModuleSettings {
//         type
//         contractAddress
//         }
//         ... on RevertFollowModuleSettings {
//         type
//         contractAddress
//         }
//         ... on UnknownFollowModuleSettings {
//         type
//         contractAddress
//         followModuleReturnData
//         }
//     }
//
//     fragment CollectModuleFields on CollectModule {
//         __typename
//         ... on FreeCollectModuleSettings {
//         type
//         followerOnly
//         contractAddress
//         }
//         ... on FeeCollectModuleSettings {
//         type
//         amount {
//             asset {
//             ...Erc20Fields
//             }
//             value
//         }
//         recipient
//         referralFee
//         }
//         ... on LimitedFeeCollectModuleSettings {
//         type
//         collectLimit
//         amount {
//             asset {
//             ...Erc20Fields
//             }
//             value
//         }
//         recipient
//         referralFee
//         }
//         ... on LimitedTimedFeeCollectModuleSettings {
//         type
//         collectLimit
//         amount {
//             asset {
//             ...Erc20Fields
//             }
//             value
//         }
//         recipient
//         referralFee
//         endTimestamp
//         }
//         ... on RevertCollectModuleSettings {
//         type
//         }
//         ... on TimedFeeCollectModuleSettings {
//         type
//         amount {
//             asset {
//             ...Erc20Fields
//             }
//             value
//         }
//         recipient
//         referralFee
//         endTimestamp
//         }
//         ... on UnknownCollectModuleSettings {
//         type
//         contractAddress
//         collectModuleReturnData
//         }
//     }
//
//     fragment ReferenceModuleFields on ReferenceModule {
//         ... on FollowOnlyReferenceModuleSettings {
//         type
//         contractAddress
//         }
//         ... on UnknownReferenceModuleSettings {
//         type
//         contractAddress
//         referenceModuleReturnData
//         }
//         ... on DegreesOfSeparationReferenceModuleSettings {
//         type
//         contractAddress
//         commentsRestricted
//         mirrorsRestricted
//         degreesOfSeparation
//         }
//     }
//
//     `
//
//
//
// const response = []
//
//
// const getLensContent = async (pids) => {
//
//
//     try {
//
//         for (const pid of pids) {
//             const resp = await fetch('https://api.lens.dev', {
//                 method: 'POST',
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     query: query,
//                     variables: {pid: pid}
//                 })
//             })
//
//             const data = await resp.json()
//             let content = data.data.publication.metadata.content
//             let handle = data.data.publication.profile.handle
//
//             await response.push({
//                 handle: handle,
//                 content: content
//             })
//
//
//
//         }
//
//     } catch(error) {
//         console.log(error)
//     }
//     return response
//
//
// }
//
//
// export default getLensContent

