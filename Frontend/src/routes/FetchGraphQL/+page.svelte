<script>

    import {onMount} from "svelte";

    // $: Data = {};

    onMount(() => {
        // fetch('https://todos-graphql.herokuapp.com/graphql', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(graphqlQuery)
        // })
        //     .then(res => {
        //         console.log("Res : " + JSON.stringify(res));
        //         console.log("")
        //         return res.json();
        //     }).then(resData => {
        //     console.log("Res Data : " + JSON.stringify(resData))
        // })

        fetch('https://api.lens.dev', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(defaultProfile)
        })
            .then(res => {
                console.log("Res : " + JSON.stringify(res));
                console.log("")
                return res.json();
            }).then(resData => {
                // Data = resData;
            console.log("Res Data : " + JSON.stringify(resData))
        })

    })

    const graphqlQuery = {
        query: `
    {
      getTodos {
        id
        text
        done
      }
    }
  `
    };

    const defaultProfile = {
        query: `
    {
  defaultProfile(request: { ethereumAddress: "0x3A5bd1E37b099aE3386D13947b6a90d97675e5e3"}) {
    id
    name
    bio
    isDefault
    attributes {
      displayType
      traitType
      key
      value
    }
    followNftAddress
    metadata
    handle
    picture {
      ... on NftImage {
        contractAddress
        tokenId
        uri
        chainId
        verified
      }
      ... on MediaSet {
        original {
          url
          mimeType
        }
      }
    }
    coverPicture {
      ... on NftImage {
        contractAddress
        tokenId
        uri
        chainId
        verified
      }
      ... on MediaSet {
        original {
          url
          mimeType
        }
      }
    }
    ownedBy
    dispatcher {
      address
      canUseRelay
    }
    stats {
      totalFollowers
      totalFollowing
      totalPosts
      totalComments
      totalMirrors
      totalPublications
      totalCollects
    }
    followModule {
      ... on FeeFollowModuleSettings {
        type
        contractAddress
        amount {
          asset {
            name
            symbol
            decimals
            address
          }
          value
        }
        recipient
      }
      ... on ProfileFollowModuleSettings {
       type
      }
      ... on RevertFollowModuleSettings {
       type
      }
    }
  }
}
    `
    } ;

</script>


<!--<pre>{JSON.stringify($Data, null, 2)}</pre>-->
