const config = require('../config.json')

const email = config.admin.email
const password = config.admin.password

console.log({
  email,
  password
})

/**
 * Create the first admin user if there are not users in the system
 */
module.exports = function createAdmin(server) {
  const Person = server.models.Person
  const Role = server.models.Role
  const RoleMapping = server.models.RoleMapping

  return Person
    .find()
    .then(accounts => {
      if (accounts.length < 1) {
        return Person.create({email, password})
      }
    })
    .then(account => {
      if (account) {
        return Role
          .find({name: 'ADMIN'})
          .then(roles => {
            if (roles.length < 1) {
              return Role.create({
                name: 'ADMIN',
              })
            }

            return roles[0]
          })
          .then(role => {
            // resolve with a payload
            return {account, role}
          })
      }
    })
    .then(payload => { // get account and role from payload
      if (payload && payload.account && payload.role) {
        return payload.role.principals.create({
          principalType: RoleMapping.USER,
          principalId: payload.account.id,
        }).then(principal => {
          payload.principal = principal
          return payload
        })
      }
    })
}