# How to run

In one terminal window run the signaling server.

```
cd signalingServer
node server.js
```

Server the static site somehow, for example with servedir:

```
npm i servedir -g
servedir static/
```

In one tab go to: http://localhost:8000/index.html#user1

** note the hashtag in the URL ** that's your username

In another tab go to: http://localhost:8000/index.html#user2

Once you see local video in both tabs in the console run:

```js
// whatever the other user is
call('user1');
```

## License

MIT
