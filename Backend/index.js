const express = require('express')
const {graphqlHTTP} = require('express-graphql')
const {GraphQLSchema} = require('graphql')
const {connectDB} = require('./db')
let cors = require('cors')


const {RootQueryType} =  require('./graphql/query/rootQuery')
const {RootMutationType} = require('./graphql/query/rootMutation')

const app = express();

connectDB();


const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
})


app.use(cors())


app.use('', graphqlHTTP({
    graphiql: true,
    schema: schema
}))

app.listen(5000, () => {
    console.log("Listening on 5000")
})