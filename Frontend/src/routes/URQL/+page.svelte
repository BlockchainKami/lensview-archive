<!--<script>-->
<!--    import { queryStore, getContextClient } from '@urql/svelte';-->

<!--    const todos = queryStore({-->
<!--        client: getContextClient(),-->
<!--        query: `-->
<!--      query  {-->
<!--  defaultProfile(request: { ethereumAddress: "0x3A5bd1E37b099aE3386D13947b6a90d97675e5e3"}) {-->
<!--    id-->
<!--    name-->
<!--    bio-->
<!--    isDefault-->
<!--    attributes {-->
<!--      displayType-->
<!--      traitType-->
<!--      key-->
<!--      value-->
<!--    }-->
<!--    followNftAddress-->
<!--    metadata-->
<!--    handle-->
<!--    picture {-->
<!--      ... on NftImage {-->
<!--        contractAddress-->
<!--        tokenId-->
<!--        uri-->
<!--        chainId-->
<!--        verified-->
<!--      }-->
<!--      ... on MediaSet {-->
<!--        original {-->
<!--          url-->
<!--          mimeType-->
<!--        }-->
<!--      }-->
<!--    }-->
<!--    coverPicture {-->
<!--      ... on NftImage {-->
<!--        contractAddress-->
<!--        tokenId-->
<!--        uri-->
<!--        chainId-->
<!--        verified-->
<!--      }-->
<!--      ... on MediaSet {-->
<!--        original {-->
<!--          url-->
<!--          mimeType-->
<!--        }-->
<!--      }-->
<!--    }-->
<!--    ownedBy-->
<!--    dispatcher {-->
<!--      address-->
<!--      canUseRelay-->
<!--    }-->
<!--    stats {-->
<!--      totalFollowers-->
<!--      totalFollowing-->
<!--      totalPosts-->
<!--      totalComments-->
<!--      totalMirrors-->
<!--      totalPublications-->
<!--      totalCollects-->
<!--    }-->
<!--    followModule {-->
<!--      ... on FeeFollowModuleSettings {-->
<!--        type-->
<!--        contractAddress-->
<!--        amount {-->
<!--          asset {-->
<!--            name-->
<!--            symbol-->
<!--            decimals-->
<!--            address-->
<!--          }-->
<!--          value-->
<!--        }-->
<!--        recipient-->
<!--      }-->
<!--      ... on ProfileFollowModuleSettings {-->
<!--       type-->
<!--      }-->
<!--      ... on RevertFollowModuleSettings {-->
<!--       type-->
<!--      }-->
<!--    }-->
<!--  }-->
<!--}-->
<!--    `,-->
<!--    });-->
<!--</script>-->
<!--<pre>{JSON.stringify($todos, null, 2)}</pre>-->
