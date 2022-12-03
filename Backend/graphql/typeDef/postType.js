const {
    GraphQLInt,
    GraphQLString,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLList
} = require('graphql')

const postType = new GraphQLObjectType({
    name: 'Post',
    description: 'Comments on the url',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLInt)},
        url: {type: GraphQLNonNull(GraphQLString)},
        publications: {type: GraphQLNonNull(GraphQLList(GraphQLString))}
    })
})

module.exports = {postType}
