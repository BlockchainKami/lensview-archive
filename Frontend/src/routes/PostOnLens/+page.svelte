
<script>
    import { v4 as uuid } from 'uuid';
    import PROFILE from "../profile-store.js"
    import {LENS_HUB_CONTRACT_ADDRESS, signCreatePostTypedData} from "../../api";
    import {getSigner, refreshAuthToken, splitSignature} from "../../utils.js";
    import {ethers} from "ethers";
    import LENSHUB from '../../abi/lenshub.json';
    import {create} from "ipfs-http-client";

    const projectId = "2I5sZxGApJqHQphE6pnwFbCi1I2"
    const projectSecret = "bbd89bc087b3a697713067f7f7cccdb8"
    // Create Base64 Object
    var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

    // const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
    const auth = 'Basic ' + Base64.encode(projectId + ':' + projectSecret);

    const client = create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
            authorization: auth,
        },
    })


    let savePost;
    let userEnteredContent = "";

    let profile = {};

    PROFILE.subscribe((resp) => {
        profile = resp;
    })

    const uploadToIPFS = async () => {
        const metaData = {
            version: '2.0.0',
            content: userEnteredContent,
            description: userEnteredContent,
            name: `Post by @${profile.handle}`,
            external_url: `https://lenster.xyz/u/${profile.handle}`,
            metadata_id: uuid(),
            mainContentFocus: 'TEXT_ONLY',
            attributes: [],
            locale: 'en-US'
        }
        const added = await client.add(JSON.stringify(metaData))
        const uri = `https://ipfs.infura.io/ipfs/${added.path}`
        return uri
    }

    savePost = async () => {
        console.log("Post called :" );
        const contentURI = await uploadToIPFS()
        const { accessToken } = await refreshAuthToken()
        const createPostRequest = {
            profileId: profile.id,
            contentURI,
            collectModule: {
                freeCollectModule: { followerOnly: true }
            },
            referenceModule: {
                followerOnlyReferenceModule: false
            },
        }

        try {
            const signedResult = await signCreatePostTypedData(createPostRequest, accessToken)
            const typedData = signedResult.result.typedData;
            const { v, r, s } = splitSignature(signedResult.signature)

            const contract = new ethers.Contract(
                LENS_HUB_CONTRACT_ADDRESS,
                LENSHUB,
                getSigner()
            )

            const tx = await contract.postWithSig({
                profileId: typedData.value.profileId,
                contentURI: typedData.value.contentURI,
                collectModule: typedData.value.collectModule,
                collectModuleInitData: typedData.value.collectModuleInitData,
                referenceModule: typedData.value.referenceModule,
                referenceModuleInitData: typedData.value.referenceModuleInitData,
                sig: {
                    v,
                    r,
                    s,
                    deadline: typedData.value.deadline,
                },
            })

            await tx.wait()
            console.log('successfully created post: tx hash', tx.hash)


        } catch (err) {
            console.log('error: ', err)
        }
    }



    function checking(){
        console.log("Checking ")
    }
</script>


<div>
    <button on:click={savePost}>
        Create Post
    </button>

    <input type="text" bind:value={userEnteredContent}>
</div>
