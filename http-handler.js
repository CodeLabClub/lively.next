import UserDB from "./user-db.js";
import { verify } from "./jwt.js";

let routes = [

  {
    path: "/list-users",
    handle: async (server, req, res, next, success, fail) => {
      let userDB = UserDB.ensureDB(server.options.userdb, {}),
          users = await userDB.getAllUsers();
      success(users.map(ea => ea.dataForClient()));
    }
  },

  {
    path: "/login",
    methods: ["POST"],
    handle: async (server, req, res, next, success, fail) => {
      let data;
      try { data = await body(req, true); } catch (err) { return fail("json error"); }

      if (typeof data.name !== "string" && typeof data.password !== "string")
        return fail("invalid request");

      let userDB = UserDB.ensureDB(server.options.userdb, {}),
          users = await userDB.getAllUsers(),
          user = await userDB.getUserNamed(data.name)
      if (!user) return fail(`no user ${data.name}`);
      if (!user.checkPassword(data.password))
        return fail(`password for ${data.name} does not match`);

      success({status: "login successful", token: user.sign()});
    }
  },

  {
    path: "/verify",
    methods: ["POST"],
    handle: async (server, req, res, next, success, fail) => {
      let data;
      try { data = await body(req, true); } catch (err) { return fail("json error"); }
      if (typeof data.token !== "string")
        return fail("invalid request");

      try {
        let decoded = await verify(data.token),
            answer = {status: "OK"};
        if (data.decode) answer.decoded = decoded;
        return success(answer);
      } catch (err) {
        switch (err.name) {
          case 'TokenExpiredError': return fail('token expired', true);
          case 'JsonWebTokenError': return fail('token malformed', true);
          default: return fail(String(err), true);
        }
      }
    }
  }

]

function matches(req, route) {
  let {path, methods, handle} = route, match;

  if (typeof path === "string") {
    if (req.url !== path) return false;

  } else if (path instanceof RegExp) {
    match = path.match(req.url);
    if (!match) return false;

  } else if (typeof path === "function") {
    match = path(req.url);
    if (!match) return false;
  }

  if (methods && methods !== "*") {
    if (!methods.includes(req.method.toUpperCase())) return false;
  }

  return match || true;
}

function body(req, isJSON) {
  return new Promise((resolve, reject) => {
    if (req.body) return resolve(req.body);
    let body = "";
    req.on("data", d => body += String(d));
    req.on("end", () => {
      if (isJSON) {
        try { body = JSON.parse(body); } catch (err) { reject(err); }
        resolve(body);
      }
    });
    req.on("error", reject);
  });
}

function fail(req, res, path, reason, sendReason = false) {
  console.log(`${path} failed: ${reason}`);
  res.writeHead(400, {"content-type": "application/json"});
  res.end(JSON.stringify({error: `${path} failed${sendReason ? ", " + reason : ""}`}));
}

function success(req, res, path, data) {
  res.writeHead(200, {"content-type": "application/json"});
  res.end(JSON.stringify(data));
}

export async function handleRequest(server, req, res, next) {
  let route = routes.find(r => matches(req, r));
  
  if (!route) return next();
  let s = (data) => success(req, res, req.url, data);
  let f = (reason, sendReason) => fail(req, res, req.url, reason, sendReason);
  await route.handle(server, req, res, next, s, f);
}
