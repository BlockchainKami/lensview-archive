const {getPublicationDetails} = require( './send.js');
const {responseType} = require ('../typeDef/responseType.js');

const {
    GraphQLString,
    GraphQLObjectType,
    GraphQLList
} = require('graphql')

const {postType} = require('../typeDef/postType')
const {Comment} = require('../../models/comment')



const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        getURL: {
            type: postType,
            description: 'Get a post by URL',
            args: {
                url: {type: GraphQLString}
            },
            resolve: async (parent, args) =>
                {
                   try {
                        let data = await Comment.findOne({ url: args.url})
                        if(data) {
                            return {
                                id: 0,
                                url: data["url"],
                                publications: data["publicationIDs"]
                        }
                        } else {
                            return {
                                id: -1,
                                url: "",
                                publications: []
                            }
                        }
                   } catch(err) {
                        return {
                            id: -1,
                            url: "",
                            publications: []
                        }
                   }
                            
                }

  
        },
        getResponse: {
            type: GraphQLList(responseType),
            description: 'Get a post by URL',
            args: {
                url: {type: GraphQLString}
            },
            resolve: async (parent, args) =>
            {
                try {
                    let data = await Comment.findOne({ url: args.url})
                    if(data) {
                        let res = await getPublicationDetails(data)
                        console.log("inside query:",res)

                        return res
                    } else {
                        return {
                            id: -1,
                            url: "",
                            publications: []
                        }
                    }
                } catch(err) {
                    return {
                        id: -1,
                        url: "",
                        publications: []
                    }
                }

            }
        }




    })
})

module.exports = {RootQueryType}

// (err, post) => {
//     if(err){
//         return console.log(err);
//     } 
//     if(post) {
//         console.log("Post")
//         return post
        
//     } else {
//         console.log("Null")
//         return null
//     }
    
// }
