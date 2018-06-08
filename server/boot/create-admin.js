const config = require('../config')

const { email, password } = config.admin
const { addresses } = config
const adminData = { email, password, address: addresses[0] }

/**
 * Create the first admin user if there are not users in the system
 */
module.exports = function createAdmin (server) {
  const Person = server.models.Person
  const Role = server.models.Role
  const RoleMapping = server.models.RoleMapping
  return Person
    .destroyAll()
    .then(accounts => {
      console.log('create admin', adminData)
      return Person.create(adminData)
    })
    .then(account => {
      if (account) {
        return Role
          .find({name: 'ADMIN'})
          .then(roles => {
            if (roles.length < 1) {
              return Role.create({
                name: 'ADMIN'
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
          principalId: payload.account.id
        }).then(principal => {
          payload.principal = principal
          return payload
        })
      }
    })
}
