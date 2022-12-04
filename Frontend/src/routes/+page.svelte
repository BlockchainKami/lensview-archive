<script>
    import {page} from '$app/stores';
    import logo from '$lib/images/Lensview.png';
    import anjay from '$lib/images/Anjay.png';
    import parikshit from '$lib/images/Parikshit.png';
    import lens from '$lib/images/lens.png';
    import polygon from '$lib/images/polygon.png';
    import graph from '$lib/images/graph.png';
    import ipfs from '$lib/images/ipfs.png';
    import {ethers, providers} from 'ethers'
    import {
        createClient,
        STORAGE_KEY,
        authenticate as authenticateMutation,
        getChallenge,
        getDefaultProfile
    } from '../api'
    import {parseJwt} from "../utils.js";
    import PROFILE from "./profile-store.js"
    import {onMount} from "svelte";


    /**
     * Description : Sign In
     * @type {boolean}
     */
    let connected = false;
    let userAddress;
    let userProfile;
    let profileId;
    let totalPostedPost;
    let url = ($page.url.searchParams.has('url')) ? $page.url.searchParams.get('url') : "";

    const getUserProfile = async (address) => {
        try {
            const urqlClient = await createClient()
            const response = await urqlClient.query(getDefaultProfile, {
                address
            }).toPromise()
            userProfile = response.data.defaultProfile;
            await PROFILE.set(userProfile);

            await console.log("User profile : " + JSON.stringify(userProfile))

            profileId = userProfile["id"];
            totalPostedPost = userProfile["stats"]["totalPosts"] + 3;

            console.log("Profile Id : " + profileId + " totalPostedPost : " + totalPostedPost);
        } catch (err) {
            console.log('error fetching user profile...: ', err)
        }
    }

    const signIn = async () => {
        try {
            const accounts = await window.ethereum.send(
                "eth_requestAccounts"
            )
            connected = true;
            const account = accounts.result[0];
            userAddress = account;
            const urqlClient = await createClient()
            const response = await urqlClient.query(getChallenge, {
                address: account
            }).toPromise()
            const provider = new providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner()
            const signature = await signer.signMessage(response.data.challenge.text)
            const authData = await urqlClient.mutation(authenticateMutation, {
                address: account, signature
            }).toPromise()
            const {accessToken, refreshToken} = authData.data.authenticate
            const accessTokenData = parseJwt(accessToken)
            getUserProfile(account)
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                accessToken, refreshToken, exp: accessTokenData.exp
            }))
        } catch (err) {
            console.log("Error while connecting : " + err)
        }
    }

    /*****************************************************/

    let isFetching = false;
    /**
     * Description : Post Fetch
     */
    let comments = [];
    const query = `
query getUrlData($url: String) {
        getResponse(url: $url) {
            lensHandle
            content
        }
    }
`


    const fetchUrlDB = () => {
        if (url) {
            console.log("Fetching for URL: " + url);
            fetch('https://lensview-backend.onrender.com:5000', {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    query: query,
                    variables: {url: url}
                })
            }).then(res => res.json()).then(async data => {

                console.log("Data from Fetch: " + data)
                const response = data['data']['getResponse'];

                comments = [...response];
                if(comments.length === 0){
                    console.log("No Post ")
                }

                console.log("comment : " + comments)
            })
        } else {
            console.log("Empty Url");
        }
    }

    onMount(() => {
        fetchUrlDB();
    });

    /*****************************************************/

    /**
     * Description : Save PID in DB
     */

    /*********** Save New URL In DB *********/
    const newURLQuery = `
mutation addUrlData($url: String!, $pid: String!) {
    newUrl(url: $url, publicationID: $pid) {
        url
    }
}
`

    const newUrl = (urlString, pid) => {
        isFetching = true
        console.log("newUrl called");
        fetch('https://lensview-backend.onrender.com:5000', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: newURLQuery,
                variables: {url: urlString, pid: pid}
            })
        }).then(res => res.json()).then(async data => {
            await setTimeout(() => {}, 2000)
            fetchUrlDB();
            isFetching = false
            console.log("New Url Add : " + JSON.stringify(data))
        })
    }

    /*****************************/


    /************** Add PID to existing URL ********/
    const addPIDQuery = `
mutation addUrlData($url: String!, $pid: String!) {
    addPublication(url: $url, publicationID: $pid) {
        url
        publications
    }
}
`

    const addPublication = (urlString, pid) => {
        isFetching = true
        console.log("addPublication");
        fetch('https://lensview-backend.onrender.com:5000', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: addPIDQuery,
                variables: {url: urlString, pid: pid}
            })
        }).then(res => res.json()).then(async data => {
            await setTimeout(() => {}, 2000)
            fetchUrlDB();
            isFetching = false;
            console.log("PID added : " + JSON.stringify(data))
        })
    }

    /**********************************************/

    /********************************/


    /**
     * Description : Post On Lens
     */
    import {v4 as uuid} from 'uuid';
    import {LENS_HUB_CONTRACT_ADDRESS, signCreatePostTypedData} from "../api";
    import {getSigner, refreshAuthToken, splitSignature} from "../utils.js";
    import LENSHUB from '../abi/lenshub.json';
    import {create} from "ipfs-http-client";

    const projectId = "2I5sZxGApJqHQphE6pnwFbCi1I2";
    const projectSecret = "bbd89bc087b3a697713067f7f7cccdb8";
    // Create Base64 Object
    var Base64 = {
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (e) {
            var t = "";
            var n, r, i, s, o, u, a;
            var f = 0;
            e = Base64._utf8_encode(e);
            while (f < e.length) {
                n = e.charCodeAt(f++);
                r = e.charCodeAt(f++);
                i = e.charCodeAt(f++);
                s = n >> 2;
                o = (n & 3) << 4 | r >> 4;
                u = (r & 15) << 2 | i >> 6;
                a = i & 63;
                if (isNaN(r)) {
                    u = a = 64
                } else if (isNaN(i)) {
                    a = 64
                }
                t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
            }
            return t
        }, decode: function (e) {
            var t = "";
            var n, r, i;
            var s, o, u, a;
            var f = 0;
            e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (f < e.length) {
                s = this._keyStr.indexOf(e.charAt(f++));
                o = this._keyStr.indexOf(e.charAt(f++));
                u = this._keyStr.indexOf(e.charAt(f++));
                a = this._keyStr.indexOf(e.charAt(f++));
                n = s << 2 | o >> 4;
                r = (o & 15) << 4 | u >> 2;
                i = (u & 3) << 6 | a;
                t = t + String.fromCharCode(n);
                if (u != 64) {
                    t = t + String.fromCharCode(r)
                }
                if (a != 64) {
                    t = t + String.fromCharCode(i)
                }
            }
            t = Base64._utf8_decode(t);
            return t
        }, _utf8_encode: function (e) {
            e = e.replace(/\r\n/g, "\n");
            var t = "";
            for (var n = 0; n < e.length; n++) {
                var r = e.charCodeAt(n);
                if (r < 128) {
                    t += String.fromCharCode(r)
                } else if (r > 127 && r < 2048) {
                    t += String.fromCharCode(r >> 6 | 192);
                    t += String.fromCharCode(r & 63 | 128)
                } else {
                    t += String.fromCharCode(r >> 12 | 224);
                    t += String.fromCharCode(r >> 6 & 63 | 128);
                    t += String.fromCharCode(r & 63 | 128)
                }
            }
            return t
        }, _utf8_decode: function (e) {
            var t = "";
            var n = 0;
            var r = c1 = c2 = 0;
            while (n < e.length) {
                r = e.charCodeAt(n);
                if (r < 128) {
                    t += String.fromCharCode(r);
                    n++
                } else if (r > 191 && r < 224) {
                    c2 = e.charCodeAt(n + 1);
                    t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                    n += 2
                } else {
                    c2 = e.charCodeAt(n + 1);
                    c3 = e.charCodeAt(n + 2);
                    t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                    n += 3
                }
            }
            return t
        }
    }

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
    let isPosting = false
    let profile = {};

    PROFILE.subscribe((resp) => {
        profile = resp;
    })

    const uploadToIPFS = async () => {

        /*** Web3.storage ***/
        const client = makeStorageClient()
        const cid = await client.put(makeFileObjects())
        console.log('stored files with cid:', cid)
        const uri = `https://${cid}.ipfs.w3s.link/metaData.json`

        /****** Infura ****/
        // const metaData = {
        //     version: '2.0.0',
        //     content: userEnteredContent,
        //     description: userEnteredContent,
        //     name: `Post by @${profile.handle}`,
        //     external_url: `https://lenster.xyz/u/${profile.handle}`,
        //     metadata_id: uuid(),
        //     mainContentFocus: 'TEXT_ONLY',
        //     attributes: [],
        //     locale: 'en-US'
        // }
        // const added = await client.add(JSON.stringify(metaData))
        // const uri = `https://ipfs.infura.io/ipfs/${added.path}`

        console.log("URI : " + uri);
        return uri
    }

    savePost = async () => {
        isPosting = true
        console.log("Post called :");
        const contentURI = await uploadToIPFS()
        const {accessToken} = await refreshAuthToken()
        const createPostRequest = {
            profileId: profile.id,
            contentURI,
            collectModule: {
                freeCollectModule: {followerOnly: true}
            },
            referenceModule: {
                followerOnlyReferenceModule: false
            },
        }

        try {
            const signedResult = await signCreatePostTypedData(createPostRequest, accessToken)
            const typedData = signedResult.result.typedData;
            const {v, r, s} = splitSignature(signedResult.signature)

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

            console.log('successfully created post: tx hash', tx.hash);
            console.log('successfully created post: tx hash', JSON.stringify(tx));

            isPosting = false;
            userEnteredContent = "";

            console.log("After successfull tx totalPostedPost : " + totalPostedPost)
            const postID = profileId + '-' + '0x' + totalPostedPost.toString(16);

            console.log("postID : " + postID);

            if(comments.length === 0){
                newUrl(url, postID);
            }
            else{
                addPublication(url, postID);
            }


        } catch (err) {
            isPosting = false
            console.log('error: ', err)
        }
    }

    /************************************************************************************/



    /**
     * Description : Web3 Storage Code
     */
    import {Web3Storage} from 'web3.storage'

    function getAccessToken() {
        // If you're just testing, you can paste in a token
        // and uncomment the following line:
        // return 'paste-your-token-here'

        // In a real app, it's better to read an access token from an
        // environement variable or other configuration that's kept outside of
        // your code base. For this to work, you need to set the
        // WEB3STORAGE_TOKEN environment variable before you run your code.
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGZmZjhDM2RGOTk4OTg0Qjc0OEE5RTU2MGU0ODdBOGNlNTZGNDE3NTYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NzAwMDk5NTI4MTgsIm5hbWUiOiJMZW5zVmlldy10ZXN0In0.UqH4RR3fHmiO-3iajToeHAIVmrjIyaDrEY92zF6SRHM"
    }

    function makeStorageClient() {
        return new Web3Storage({token: getAccessToken()})
    }

    function makeFileObjects() {
        // You can create File objects from a Blob of binary data
        // see: https://developer.mozilla.org/en-US/docs/Web/API/Blob
        // Here we're just storing a JSON object, but you can store images,
        // audio, or whatever you want!
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
        const blob = new Blob([JSON.stringify(metaData)], {type: 'application/json'})

        const files = [
            new File(['contents-of-file-1'], 'plain-utf8.txt'),
            new File([blob], 'metaData.json')
        ]
        return files
    }
    /*********************************/

</script>



<!---------------------------------- HTML --------------------------->
<header>
    <div class="flex p-5 justify-between items-center">
        <div>
            <a class="flex flex-row items-center" href="http://localhost:5173/">
                <div>
                    <img class="logo" src={logo} alt="lensView"/>
                </div>
            </a>
        </div>

        <div class="fixed left-1/4 w-1/2" style="top: 4vh">
            <div class="relative w-full sm:max-w-2xl sm:mx-auto">
                <div class="overflow-hidden z-0 rounded-full relative p-3">
                    <div role="form" class="relative flex z-50 bg-white rounded-full">
                        <input type="text" bind:value={url} placeholder="enter your search URL here"
                               class="rounded-full flex-1 px-6 py-4 text-gray-700 focus:outline-none">
                        <button on:click={fetchUrlDB}
                                class="bg-gradient-to-r from-amber-500 to-pink-500 text-white rounded-full font-semibold px-8 py-4 hover:bg-indigo-400 focus:bg-indigo-600 focus:outline-none">
                            Search
                        </button>
                    </div>
                    <div class="glow glow-1 z-10 bg-pink-400 absolute"></div>
                    <div class="glow glow-2 z-20 bg-purple-400 absolute"></div>
                    <div class="glow glow-3 z-30 bg-yellow-400 absolute"></div>
                    <div class="glow glow-4 z-40 bg-gradient-to-r from-red-500 to-orange-500 absolute"></div>
                </div>
            </div>
        </div>

        <div class="wallet-btn">
            {#if !connected}
                <button on:Click={signIn()}
                        class="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800">
            <span class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
               <div class="flex">
                <svg aria-hidden="true" class="mr-2 -ml-1 w-6 h-5" viewBox="0 0 2405 2501" fill="none"
                     xmlns="http://www.w3.org/2000/svg"> <g clip-path="url(#clip0_1512_1323)"> <path
                        d="M2278.79 1730.86L2133.62 2221.69L1848.64 2143.76L2278.79 1730.86Z" fill="#E4761B"
                        stroke="#E4761B" stroke-width="5.94955"/> <path
                        d="M1848.64 2143.76L2123.51 1767.15L2278.79 1730.86L1848.64 2143.76Z" fill="#E4761B"
                        stroke="#E4761B" stroke-width="5.94955"/> <path
                        d="M2065.2 1360.79L2278.79 1730.86L2123.51 1767.15L2065.2 1360.79ZM2065.2 1360.79L2202.64 1265.6L2278.79 1730.86L2065.2 1360.79Z"
                        fill="#F6851B" stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M1890.29 1081.17L2285.34 919.338L2265.7 1007.99L1890.29 1081.17ZM2253.21 1114.48L1890.29 1081.17L2265.7 1007.99L2253.21 1114.48Z"
                        fill="#763D16" stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M2253.21 1114.48L2202.64 1265.6L1890.29 1081.17L2253.21 1114.48ZM2332.34 956.82L2265.7 1007.99L2285.34 919.338L2332.34 956.82ZM2253.21 1114.48L2265.7 1007.99L2318.65 1052.01L2253.21 1114.48Z"
                        fill="#763D16" stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M1542.24 2024.17L1641 2055.7L1848.64 2143.75L1542.24 2024.17Z" fill="#E2761B"
                        stroke="#E2761B" stroke-width="5.94955"/> <path
                        d="M2202.64 1265.6L2253.21 1114.48L2296.64 1147.8L2202.64 1265.6ZM2202.64 1265.6L1792.71 1130.55L1890.29 1081.17L2202.64 1265.6Z"
                        fill="#763D16" stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M1987.86 617.696L1890.29 1081.17L1792.71 1130.55L1987.86 617.696Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M2285.34 919.338L1890.29 1081.17L1987.86 617.696L2285.34 919.338Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M1987.86 617.696L2400.16 570.1L2285.34 919.338L1987.86 617.696Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M2202.64 1265.6L2065.2 1360.79L1792.71 1130.55L2202.64 1265.6Z" fill="#F6851B"
                        stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M2382.31 236.33L2400.16 570.1L1987.86 617.696L2382.31 236.33Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M2382.31 236.33L1558.3 835.45L1547.59 429.095L2382.31 236.33Z" fill="#E2761B"
                        stroke="#E2761B" stroke-width="5.94955"/> <path
                        d="M934.789 380.309L1547.59 429.095L1558.3 835.449L934.789 380.309Z" fill="#F6851B"
                        stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M1792.71 1130.55L1558.3 835.449L1987.86 617.696L1792.71 1130.55Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M1792.71 1130.55L2065.2 1360.79L1682.65 1403.04L1792.71 1130.55Z" fill="#E4761B"
                        stroke="#E4761B" stroke-width="5.94955"/> <path
                        d="M1682.65 1403.04L1558.3 835.449L1792.71 1130.55L1682.65 1403.04Z" fill="#E4761B"
                        stroke="#E4761B" stroke-width="5.94955"/> <path
                        d="M1987.86 617.696L1558.3 835.45L2382.31 236.33L1987.86 617.696Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M940.144 2134.24L1134.69 2337.11L869.939 2096.16L940.144 2134.24Z" fill="#C0AD9E"
                        stroke="#C0AD9E" stroke-width="5.94955"/> <path
                        d="M1848.64 2143.75L1940.86 1793.33L2123.51 1767.15L1848.64 2143.75Z" fill="#CD6116"
                        stroke="#CD6116" stroke-width="5.94955"/> <path
                        d="M151.234 1157.92L487.978 803.917L194.666 1115.67L151.234 1157.92Z" fill="#E2761B"
                        stroke="#E2761B" stroke-width="5.94955"/> <path
                        d="M2123.51 1767.15L1940.86 1793.33L2065.2 1360.79L2123.51 1767.15ZM1558.3 835.449L1230.48 824.74L934.789 380.309L1558.3 835.449Z"
                        fill="#F6851B" stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M2065.2 1360.79L1940.86 1793.33L1930.74 1582.12L2065.2 1360.79Z" fill="#E4751F"
                        stroke="#E4751F" stroke-width="5.94955"/> <path
                        d="M1682.65 1403.04L2065.2 1360.79L1930.74 1582.12L1682.65 1403.04Z" fill="#CD6116"
                        stroke="#CD6116" stroke-width="5.94955"/> <path
                        d="M1230.48 824.74L1558.3 835.449L1682.65 1403.04L1230.48 824.74Z" fill="#F6851B"
                        stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M1230.48 824.74L345.784 6.08252L934.79 380.309L1230.48 824.74ZM934.195 2258.58L165.513 2496.56L12.0146 1910.53L934.195 2258.58Z"
                        fill="#E4761B" stroke="#E4761B" stroke-width="5.94955"/> <path
                        d="M265.465 1304.27L555.803 1076.41L799.14 1132.93L265.465 1304.27Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M799.139 1132.93L555.803 1076.41L686.098 538.567L799.139 1132.93Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M194.666 1115.67L555.803 1076.41L265.465 1304.27L194.666 1115.67Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M1930.74 1582.12L1780.81 1506.56L1682.65 1403.04L1930.74 1582.12Z" fill="#CD6116"
                        stroke="#CD6116" stroke-width="5.94955"/> <path
                        d="M194.666 1115.67L169.083 980.618L555.803 1076.41L194.666 1115.67Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M1749.88 1676.72L1780.81 1506.56L1930.74 1582.12L1749.88 1676.72Z" fill="#233447"
                        stroke="#233447" stroke-width="5.94955"/> <path
                        d="M1940.86 1793.33L1749.88 1676.72L1930.74 1582.12L1940.86 1793.33Z" fill="#F6851B"
                        stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M555.803 1076.41L169.082 980.618L137.55 866.982L555.803 1076.41ZM686.098 538.567L555.803 1076.41L137.55 866.982L686.098 538.567ZM686.098 538.567L1230.48 824.74L799.139 1132.93L686.098 538.567Z"
                        fill="#763D16" stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M799.14 1132.93L1230.48 824.74L1422.65 1411.96L799.14 1132.93ZM1422.65 1411.96L826.508 1399.47L799.14 1132.93L1422.65 1411.96Z"
                        fill="#E4761B" stroke="#E4761B" stroke-width="5.94955"/> <path
                        d="M265.465 1304.27L799.14 1132.93L826.508 1399.47L265.465 1304.27ZM1682.65 1403.04L1422.65 1411.96L1230.48 824.74L1682.65 1403.04Z"
                        fill="#F6851B" stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M1780.81 1506.56L1749.88 1676.72L1682.65 1403.04L1780.81 1506.56Z" fill="#CD6116"
                        stroke="#CD6116" stroke-width="5.94955"/> <path
                        d="M345.784 6.08252L1230.48 824.74L686.098 538.567L345.784 6.08252Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M12.0146 1910.53L758.088 1879.59L934.195 2258.58L12.0146 1910.53Z" fill="#E4761B"
                        stroke="#E4761B" stroke-width="5.94955"/> <path
                        d="M934.194 2258.58L758.088 1879.59L1124.58 1861.75L934.194 2258.58Z" fill="#CD6116"
                        stroke="#CD6116" stroke-width="5.94955"/> <path
                        d="M1749.88 1676.72L1940.86 1793.33L2046.16 2041.42L1749.88 1676.72ZM826.508 1399.47L12.0146 1910.53L265.465 1304.27L826.508 1399.47ZM758.088 1879.59L12.0146 1910.53L826.508 1399.47L758.088 1879.59ZM1682.65 1403.04L1731.43 1580.33L1495.83 1594.02L1682.65 1403.04ZM1495.83 1594.02L1422.65 1411.96L1682.65 1403.04L1495.83 1594.02Z"
                        fill="#F6851B" stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M1134.69 2337.11L934.194 2258.58L1631.48 2375.79L1134.69 2337.11Z" fill="#C0AD9E"
                        stroke="#C0AD9E" stroke-width="5.94955"/> <path
                        d="M265.465 1304.27L151.234 1157.91L194.666 1115.67L265.465 1304.27Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M1710.61 2288.92L1631.48 2375.79L934.194 2258.58L1710.61 2288.92Z" fill="#D7C1B3"
                        stroke="#D7C1B3" stroke-width="5.94955"/> <path
                        d="M1748.09 2075.93L934.194 2258.58L1124.58 1861.75L1748.09 2075.93Z" fill="#E4761B"
                        stroke="#E4761B" stroke-width="5.94955"/> <path
                        d="M934.194 2258.58L1748.09 2075.93L1710.61 2288.92L934.194 2258.58Z" fill="#D7C1B3"
                        stroke="#D7C1B3" stroke-width="5.94955"/> <path
                        d="M137.55 866.982L110.777 409.462L686.098 538.567L137.55 866.982ZM194.665 1115.67L115.536 1035.35L169.082 980.618L194.665 1115.67Z"
                        fill="#763D16" stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M1289.38 1529.76L1422.65 1411.96L1403.61 1699.92L1289.38 1529.76Z" fill="#CD6116"
                        stroke="#CD6116" stroke-width="5.94955"/> <path
                        d="M1422.65 1411.96L1289.38 1529.76L1095.43 1630.31L1422.65 1411.96Z" fill="#CD6116"
                        stroke="#CD6116" stroke-width="5.94955"/> <path
                        d="M2046.16 2041.42L2009.87 2014.65L1749.88 1676.72L2046.16 2041.42Z" fill="#F6851B"
                        stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M1095.43 1630.31L826.508 1399.47L1422.65 1411.96L1095.43 1630.31Z" fill="#CD6116"
                        stroke="#CD6116" stroke-width="5.94955"/> <path
                        d="M1403.61 1699.92L1422.65 1411.96L1495.83 1594.02L1403.61 1699.92Z" fill="#E4751F"
                        stroke="#E4751F" stroke-width="5.94955"/> <path
                        d="M89.3589 912.199L137.55 866.982L169.083 980.618L89.3589 912.199Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M1403.61 1699.92L1095.43 1630.31L1289.38 1529.76L1403.61 1699.92Z" fill="#233447"
                        stroke="#233447" stroke-width="5.94955"/> <path
                        d="M686.098 538.567L110.777 409.462L345.784 6.08252L686.098 538.567Z" fill="#763D16"
                        stroke="#763D16" stroke-width="5.94955"/> <path
                        d="M1631.48 2375.79L1664.2 2465.03L1134.69 2337.12L1631.48 2375.79Z" fill="#C0AD9E"
                        stroke="#C0AD9E" stroke-width="5.94955"/> <path
                        d="M1124.58 1861.75L1095.43 1630.31L1403.61 1699.92L1124.58 1861.75Z" fill="#F6851B"
                        stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M826.508 1399.47L1095.43 1630.31L1124.58 1861.75L826.508 1399.47Z" fill="#E4751F"
                        stroke="#E4751F" stroke-width="5.94955"/> <path
                        d="M1495.83 1594.02L1731.43 1580.33L2009.87 2014.65L1495.83 1594.02ZM826.508 1399.47L1124.58 1861.75L758.088 1879.59L826.508 1399.47Z"
                        fill="#F6851B" stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M1495.83 1594.02L1788.55 2039.64L1403.61 1699.92L1495.83 1594.02Z" fill="#E4751F"
                        stroke="#E4751F" stroke-width="5.94955"/> <path
                        d="M1403.61 1699.92L1788.55 2039.64L1748.09 2075.93L1403.61 1699.92Z" fill="#F6851B"
                        stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M1748.09 2075.93L1124.58 1861.75L1403.61 1699.92L1748.09 2075.93ZM2009.87 2014.65L1788.55 2039.64L1495.83 1594.02L2009.87 2014.65Z"
                        fill="#F6851B" stroke="#F6851B" stroke-width="5.94955"/> <path
                        d="M2068.18 2224.07L1972.99 2415.05L1664.2 2465.03L2068.18 2224.07ZM1664.2 2465.03L1631.48 2375.79L1710.61 2288.92L1664.2 2465.03Z"
                        fill="#C0AD9E" stroke="#C0AD9E" stroke-width="5.94955"/> <path
                        d="M1710.61 2288.92L1768.92 2265.72L1664.2 2465.03L1710.61 2288.92ZM1664.2 2465.03L1768.92 2265.72L2068.18 2224.07L1664.2 2465.03Z"
                        fill="#C0AD9E" stroke="#C0AD9E" stroke-width="5.94955"/> <path
                        d="M2009.87 2014.65L2083.05 2059.27L1860.54 2086.04L2009.87 2014.65Z" fill="#161616"
                        stroke="#161616" stroke-width="5.94955"/> <path
                        d="M1860.54 2086.04L1788.55 2039.64L2009.87 2014.65L1860.54 2086.04ZM1834.96 2121.15L2105.66 2088.42L2068.18 2224.07L1834.96 2121.15Z"
                        fill="#161616" stroke="#161616" stroke-width="5.94955"/> <path
                        d="M2068.18 2224.07L1768.92 2265.72L1834.96 2121.15L2068.18 2224.07ZM1768.92 2265.72L1710.61 2288.92L1748.09 2075.93L1768.92 2265.72ZM1748.09 2075.93L1788.55 2039.64L1860.54 2086.04L1748.09 2075.93ZM2083.05 2059.27L2105.66 2088.42L1834.96 2121.15L2083.05 2059.27Z"
                        fill="#161616" stroke="#161616" stroke-width="5.94955"/> <path
                        d="M1834.96 2121.15L1860.54 2086.04L2083.05 2059.27L1834.96 2121.15ZM1748.09 2075.93L1834.96 2121.15L1768.92 2265.72L1748.09 2075.93Z"
                        fill="#161616" stroke="#161616" stroke-width="5.94955"/> <path
                        d="M1860.54 2086.04L1834.96 2121.15L1748.09 2075.93L1860.54 2086.04Z" fill="#161616"
                        stroke="#161616" stroke-width="5.94955"/> </g> <defs> <clipPath id="clip0_1512_1323"> <rect
                        width="2404" height="2500" fill="white" transform="translate(0.519043 0.132812)"/> </clipPath> </defs> </svg>
                    Connect with MetaMask
               </div>
            </span>
                </button>
            {:else}
                <div class="overflow-hidden relative w-10 h-10 bg-gray-100 rounded-full dark:bg-gray-600">
                    <svg class="absolute -left-1 w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20"
                         xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clip-rule="evenodd"></path>
                    </svg>
                </div>

            {/if}
        </div>
    </div>
</header>

<div class="tagline">
    An Omnipresent Social App For Yours View
</div>

<section class="py-8 lg:py-16">
    <div class="max-w-6xl mx-auto px-4">
        {#if !isFetching}
            {#each comments as comment}
                <article class="p-6 mb-6 text-base bg-white rounded-lg dark:bg-gray-900">
                    <div class="comment-div">
                        <div class="upDownVote">
                            <div>+</div>
                            <div>14</div>
                            <div>-</div>
                        </div>

                        <div class="comment-box">
                            <footer class="flex justify-between items-center mb-2">
                                <div class="flex items-center">
                                    <p class="inline-flex items-center mr-3 text-sm text-gray-900 dark:text-white"><img
                                            class="mr-2 w-6 h-6 rounded-full"
                                            src="https://flowbite.com/docs/images/people/profile-picture-2.jpg"
                                            alt="Michael Gough">{comment["lensHandle"]}</p>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">
                                        <time pubdate datetime="2022-02-08"
                                              title="February 8th, 2022">Nov. 3, 2022
                                        </time>
                                    </p>
                                </div>
<!--                                <button id="dropdownComment1Button" data-dropdown-toggle="dropdownComment1"-->
<!--                                        class="inline-flex items-center p-2 text-sm font-medium text-center text-gray-400 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700 dark:focus:ring-gray-600"-->
<!--                                        type="button">-->
<!--                                    <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"-->
<!--                                         xmlns="http://www.w3.org/2000/svg">-->
<!--                                        <path-->
<!--                                                d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z">-->
<!--                                        </path>-->
<!--                                    </svg>-->
<!--                                    <span class="sr-only">Comment settings</span>-->
<!--                                </button>-->
                                <!-- Dropdown menu -->
<!--                                <div id="dropdownComment1"-->
<!--                                     class="hidden z-10 w-36 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600">-->
<!--                                    <ul class="py-1 text-sm text-gray-700 dark:text-gray-200"-->
<!--                                        aria-labelledby="dropdownMenuIconHorizontalButton">-->
<!--                                        <li>-->
<!--                                            <a href="#"-->
<!--                                               class="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Edit</a>-->
<!--                                        </li>-->
<!--                                        <li>-->
<!--                                            <a href="#"-->
<!--                                               class="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Remove</a>-->
<!--                                        </li>-->
<!--                                        <li>-->
<!--                                            <a href="#"-->
<!--                                               class="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Report</a>-->
<!--                                        </li>-->
<!--                                    </ul>-->
<!--                                </div>-->
                            </footer>
                            <p class="text-gray-500 dark:text-gray-400">{comment["content"]}</p>
                            <div class="flex items-center mt-4 space-x-4">
                                <button type="button"
                                        class="flex items-center text-sm text-gray-500 hover:underline dark:text-gray-400">
                                    <svg aria-hidden="true" class="mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                    </svg>
                                    Reply
                                </button>
                            </div>
                        </div>


                    </div>
                </article>
            {:else}

                <div style="display: flex; justify-content: center; font-size: x-large">
                    <h1>
                        No post on this URL
                    </h1>
                </div>
            {/each}
        {:else}
            <div role="status" class="max-w-sm animate-pulse">
                <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
                <span class="sr-only">Fetching...</span>
            </div>

        {/if}

    </div>
</section>

<div class="comment">

    <div class="comment-content">
        <input type="text" bind:value={userEnteredContent} class="comment-input">
        {#if !isPosting}
            <button type="button" on:click={savePost}
                class="text-white bg-gradient-to-br from-pink-500 to-orange-400 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center w-24">
            Post
        </button>
        {:else}
            <button disabled type="button" class="py-2.5 px-5 mr-2 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 inline-flex items-center">
                <svg aria-hidden="true" role="status" class="inline mr-2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2"/>
                </svg>
                Posting...
            </button>
        {/if}
    </div>

</div>

<div class="tech bg-white dark:bg-gray-900">
    <div class="tech-heading">
        Technologies Used
    </div>
    <div class="tech-logo-div">
        <div>
            <img class="tech-logo" src={lens} alt="lens"/>
        </div>
        <div>
            <img class="tech-logo" src={polygon} alt="polygon"/>
        </div>
        <div>
            <img class="tech-logo" src={graph} alt="graph"/>
        </div>
        <div>
            <img class="tech-logo" src={ipfs} alt="ipfs"/>
        </div>
    </div>
</div>

<section class="bg-white dark:bg-gray-900">
    <div class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 ">
        <div class="mx-auto max-w-screen-sm text-center mb-8 lg:mb-16">
            <h2 class="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">Our Team</h2>
            <!--            <p class="font-light text-gray-500 lg:mb-16 sm:text-xl dark:text-gray-400">Explore the whole collection of-->
            <!--                open-source web components and elements built with the utility classes from Tailwind</p>-->
        </div>
        <div class="grid gap-8 mb-6 lg:mb-16 md:grid-cols-2">
            <div class="items-center bg-gray-50 rounded-lg shadow sm:flex dark:bg-gray-800 dark:border-gray-700">
                <a href="#">
                    <img class="w-full rounded-lg sm:rounded-none sm:rounded-l-lg"
                         src="{anjay}"
                         alt="Anjay Sahoo">
                </a>
                <div class="p-5">
                    <h3 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        <a href="#">Anjay Sahoo</a>
                    </h3>
                    <span class="text-gray-500 dark:text-gray-400">Web Developer</span>
                    <p class="mt-3 mb-4 font-light text-gray-500 dark:text-gray-400">
                        Love working on frontend <br> side, used Svelte to build LensView webpage
                        </p>
                    <ul class="flex space-x-4 sm:mt-0">
                        <li>
                            <a href="#" class="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fill-rule="evenodd"
                                          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                          clip-rule="evenodd"/>
                                </svg>
                            </a>
                        </li>
                        <li>
                            <a href="#" class="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                                </svg>
                            </a>
                        </li>
                        <li>
                            <a href="#" class="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fill-rule="evenodd"
                                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                          clip-rule="evenodd"/>
                                </svg>
                            </a>
                        </li>
                        <li>
                            <a href="#" class="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fill-rule="evenodd"
                                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"
                                          clip-rule="evenodd"/>
                                </svg>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="items-center bg-gray-50 rounded-lg shadow sm:flex dark:bg-gray-800 dark:border-gray-700">
                <a href="#">
                    <img class="w-full rounded-lg sm:rounded-none sm:rounded-l-lg"
                         src={parikshit}
                         alt="Parikshit Barua">
                </a>
                <div class="p-5">
                    <h3 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        <a href="#">Parikshit Barua</a>
                    </h3>
                    <span class="text-gray-500 dark:text-gray-400">Backend Developer</span>
                    <p class="mt-3 mb-4 font-light text-gray-500 dark:text-gray-400">Building on Lens Protocol, currently working on @LensView</p>
                    <ul class="flex space-x-4 sm:mt-0">
                        <li>
                            <a href="#" class="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fill-rule="evenodd"
                                          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                          clip-rule="evenodd"/>
                                </svg>
                            </a>
                        </li>
                        <li>
                            <a href="#" class="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                                </svg>
                            </a>
                        </li>
                        <li>
                            <a href="#" class="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fill-rule="evenodd"
                                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                          clip-rule="evenodd"/>
                                </svg>
                            </a>
                        </li>
                        <li>
                            <a href="#" class="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fill-rule="evenodd"
                                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"
                                          clip-rule="evenodd"/>
                                </svg>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</section>
<!-------------------------------------------------------------------------->


<!-------------------------Style ----------------->
<style>
    .productName {
        font-family: bely-display;
    }

    .comment-div{
        display: flex;
        gap: 2rem;
    }

    .upDownVote{
        display: flex;
        padding: 0.6rem;
        background-color: #374151;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        border-radius: 5px;
    }

    .plusMinus{

    }

    .tech{
        padding: 3rem;
    }

    .tech-heading{
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
        font-weight: 800;
        color: white;
        display: flex;
        justify-content: center;
        font-size: xx-large;
        margin-bottom: 3rem;
    }

    .tech-logo-div{
        display: flex;
        justify-content: space-evenly;
    }

    .tech-logo{
        height: 14rem;
        width: 14rem;
    }

    .logo {
        width: 9rem;
        height: 9rem;
    }

    .tagline {
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
        font-weight: 800;
        color: white;
        display: flex;
        justify-content: center;
        font-size: xx-large;
    }

    .wallet-btn {
        margin-bottom: 3rem;
    }

    /*
 * View a PURE 100% Tailwind CSS version here:
 * https://play.tailwindcss.com/Vg6H4j8Fux
 */

    .glow {
        top: -10%;
        left: -10%;
        width: 120%;
        height: 120%;
        border-radius: 100%;
    }

    .glow-1 {
        animation: glow1 4s linear infinite;
    }

    .glow-2 {
        animation: glow2 4s linear infinite;
        animation-delay: 100ms;
    }

    .glow-3 {
        animation: glow3 4s linear infinite;
        animation-delay: 200ms;
    }

    .glow-4 {
        animation: glow4 4s linear infinite;
        animation-delay: 300ms;
    }

    @keyframes glow1 {
        0% {
            transform: translate(10%, 10%) scale(1);
        }
        25% {
            transform: translate(-10%, 10%) scale(1);
        }
        50% {
            transform: translate(-10%, -10%) scale(1);
        }
        75% {
            transform: translate(10%, -10%) scale(1);
        }
        100% {
            transform: translate(10%, 10%) scale(1);
        }
    }

    @keyframes glow2 {
        0% {
            transform: translate(-10%, -10%) scale(1);
        }
        25% {
            transform: translate(10%, -10%) scale(1);
        }
        50% {
            transform: translate(10%, 10%) scale(1);
        }
        75% {
            transform: translate(-10%, 10%) scale(1);
        }
        100% {
            transform: translate(-10%, -10%) scale(1);
        }
    }

    @keyframes glow3 {
        0% {
            transform: translate(-10%, 10%) scale(1);
        }
        25% {
            transform: translate(-10%, -10%) scale(1);
        }
        50% {
            transform: translate(10%, -10%) scale(1);
        }
        75% {
            transform: translate(10%, 10%) scale(1);
        }
        100% {
            transform: translate(-10%, 10%) scale(1);
        }
    }

    @keyframes glow4 {
        0% {
            transform: translate(10%, -10%) scale(1);
        }
        25% {
            transform: translate(10%, 10%) scale(1);
        }
        50% {
            transform: translate(-10%, 10%) scale(1);
        }
        75% {
            transform: translate(-10%, -10%) scale(1);
        }
        100% {
            transform: translate(10%, -10%) scale(1);
        }
    }

    .comment {
        display: flex;
        justify-content: center;
    }

    .comment-content {
        display: flex;
        gap: 1rem;
        align-items: center;
        padding: 1rem;
        background-color: white;
        border-radius: 5px;
        margin-bottom: 3rem;
    }

    .comment-input {
        width: 45rem;
        border: 4px solid;
        border-radius: 10px;
    }

</style>
<!------------------------------------------------>

