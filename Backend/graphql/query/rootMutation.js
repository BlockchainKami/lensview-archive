const {
    GraphQLString,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLList
} = require('graphql')

const {postType} = require('../typeDef/postType')

const {Comment} = require('../../models/comment')




const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Mutation Query',
    fields: () => ({
        addPublication: {
            type: postType,
            description: 'Add a publication to the URL',
            args: {
                url: {type: GraphQLNonNull(GraphQLString)},
                publicationID: {type: GraphQLNonNull(GraphQLString)}
            },
            resolve: (parent, args) => {
                Comment.findOneAndUpdate(
                    {url: args.url} ,
                    { $push: { publicationIDs: args.publicationID} } , 
                    { new: true },
                    function(error, success) {
                        if (error) {
                            console.log(error)
                        } else {
                            console.log(success)
                        }
                    }
                   
                    
                )
            }

        } ,
        newUrl: {
            type: postType,
            description: 'Add a new URL',
            args: {
                url: {type: GraphQLNonNull(GraphQLString)},
                publicationID: {type: GraphQLNonNull(GraphQLString)}
            } ,
            resolve: (parent, args) => {
                const newPublication = new Comment({
                    url: args.url,
                    publicationIDs: [args.publicationID]
                })

                newPublication.save(function (err) {
                    if(err) return handleError(err);
                })
                return newPublication
            }
        }
    })
})

module.exports = {RootMutationType}