const { admin } = require('../config.json')

const { promisify } = require('util')
const slug = require('slug')
const faker = require('faker')


function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4();
}

function fakerLocale(locale) {
  faker.locale = locale
  return faker
}

module.exports = async function (app) {
  try {
    await app.dataSources.mongodb.automigrate('Person')
    await app.dataSources.mongodb.automigrate('Post')
    await app.dataSources.mongodb.automigrate('Comment')

    const createPerson = promisify(app.models.Person.create.bind(app.models.Person))
    const createPost = promisify(app.models.Post.create.bind(app.models.Post))
    const createComment = promisify(app.models.Comment.create.bind(app.models.Comment))

    const persons = await createPerson(
      Array(5).fill({}).map(_ => ({
        email: faker.internet.email(),
        password: '12345'
      }))
    )

    const posts = await createPost(
      Array(5).fill({}).map((_, index) => ({
        category: ['post', 'wiki'][Math.random() * 2 >> 0],
        title: {
          en: fakerLocale('en').hacker.phrase(),
          ru: fakerLocale('ru').hacker.phrase(),
          zh: fakerLocale('zh_CN').hacker.phrase()
        },
        slug: slug(fakerLocale('en').hacker.phrase()) + '-' + guid(),
        body: {
          en: Array(10).fill(0).map((_, index) => ({
            component: index != 0 ? 'p' : 'blockquote', 
            props: { text: Array(5 + Math.random() * 10 >> 0).fill(0).map(_ => fakerLocale('en').hacker.phrase()).join(' ') },
          })),
          ru: Array(10).fill(0).map((_, index) => ({
            component: index != 0 ? 'p' : 'blockquote', 
            props: { text: Array(5 + Math.random() * 10 >> 0).fill(0).map(_ => fakerLocale('ru').hacker.phrase()).join(' ') },
            children: index != 0 ? null : [
              {
                component: 'code',
                props: {
                  text: `  div.body-part
    p(v-if='type === "p"')
      span.nk-dropcap-3(v-if='!props.hideCap && !child') {{ props.text[0] }}
      span {{ props.text }}
    blockquote.nk-blockquote(v-if='type === "blockquote"')
      .nk-blockquote-icon &ldquo;
      em {{ props.text}}
      .nk-blockquote-author(v-if='props.author') 
        router-link(:to="{ name: 'lang-peoples-id', params: { id: props.author.id}}" v-if="props.author.id")
          span {{ props.author.displayName }}
        span(v-else) {{ props.author.displayName }}
    pre.nk-code(v-if='type === "code"') {{ props.text }}

    body-part(
      v-if='children && children.length' 
      v-for='(child, index) in children' 
      :config='child' 
      :child='true' 
      :last='index == children.length - 1' 
      :key='key + index')

    div(v-if='!last')
      .nk-gap-4(v-if='!child')
      .nk-gap-3(v-else)`
                }
              }
            ]
          })),
          zh: Array(10).fill().map(_ => ({
            component: index ? 'p' : 'blockquote', 
            props: { text: Array(5 + Math.random() * 10 >> 0).fill(0).map(_ => fakerLocale('zh_CN').hacker.phrase()).join(' ') }
          })),
        },
        authorId: persons[Math.random() * persons.length >> 0].id
      }))
    )

    const comments = await createComment(
      Array(Math.random() * 50 >> 0).fill(0).map(_ => ({
        postId: posts[Math.random() * posts.length >> 0].id,
        authorId: persons[Math.random() * persons.length >> 0].id,
        text: fakerLocale('en').hacker.phrase()
      }))
    )

    const adminPerson = await createPerson({
      email: admin.email,
      password: admin.password
    })

    const adminRole = await app.models.Role
      .findOne({name: 'ADMIN'})
      .then(role => {
        if (!role) {
          return app.models.Role.create({ name: 'ADMIN' })
        }

        return role
      })

    await adminRole.principals.create({
      principalType: app.models.RoleMapping.USER,
      principalId: adminPerson.id,
    })
  } catch (e) {
    console.log(e)
    throw e
  }
}