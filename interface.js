import L2LClient from "lively.2lively/client.js";
import * as bcrypt from "bcryptjs/index.js";


var defaultClient = L2LClient.default()

export async function emailAvailable(email) {
   return (await getUser({email})).email == null;
}

export async function getUser({name='anonymous', email=null, password=null, avatar=false}){
  var opts = {
    name,
    email,
    password,
    avatar: avatar ? JSON.stringify(avatar) : avatar
  }
  return (await defaultClient.sendToAndWait(defaultClient.trackerId,'userInfo',opts)).data
}

export async function authenticateUser(opts){
  return (await defaultClient.sendToAndWait(defaultClient.trackerId,'authenticateUser',opts)).data
}

export function getHash(aString){
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(aString, salt);
    return hash
}

export async function createUser(options,ackFn){
  var {name,email,password} = options
  if(!name || !email || !password) {
    var errMsg = 'Insufficient options specified: Requires name, email, password'
    throw new Error(errMsg)
  }
  
  await defaultClient.sendToAndWait(defaultClient.trackerId,'createUser',options,ackFn)
  
}