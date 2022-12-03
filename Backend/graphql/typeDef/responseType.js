
const {
    GraphQLInt,
    GraphQLString,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLList
} = require('graphql')

const responseType = new GraphQLObjectType({
    name: 'Response',
    description: 'Comments on the url',
    fields: () => ({
        lensHandle: {type: GraphQLNonNull(GraphQLString)},
        content: {type: GraphQLNonNull(GraphQLString)}
    })
})

module.exports = {responseType}
