const convertToDecimal = (pid) => {
    let arr = pid.split('-')

    let profile = parseInt(arr[0])
    let postId = parseInt(arr[1])

    let publicationID = profile.toString() + postId.toString()

    return parseInt(publicationID)
}

convertToDecimal('0x018776-0x0a')