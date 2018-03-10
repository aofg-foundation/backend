FROM node:latest


WORKDIR /usr/app

# COPY package.json .
# RUN npm install --quiet

# RUN npm install --global nodemon

# COPY . .
# Create app directory
# RUN mkdir -p /usr/src/note-loopback
# WORKDIR /usr/src/note-loopback

# Install app dependencies
# COPY package.json /usr/src/note-loopback
# RUN npm install

# Bundle app source
# COPY . /usr/src/note-loopback

EXPOSE 3000
CMD [ "node", "." ]