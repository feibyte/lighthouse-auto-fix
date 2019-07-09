# Setup

At this moment, we have to setup environment manually. Basically, we have to do is: copy website content to `/server/www`, start a nginx server and run lighthouse.

Be mind: If your website is under a directory, for instance, `https://localhost/blog/`， then it should be put in `/server/www/blog`.
If you don't have one, you could check out my blog: https://github.com/fedeoo/blog/tree/gh-pages 

We're going to setup a https server, If you don't have a certificate before. This might be helpful.
```
# create self-signed key and certificate pair
openssl req \
    -newkey rsa:2048 \
    -x509 \
    -nodes \
    -keyout ~/.ssl/nginx-selfsigned.key \
    -new \
    -out ~/.ssl/nginx-selfsigned.crt \
    -subj /CN=localhost \
    -reqexts SAN \
    -extensions SAN \
    -config <(cat /System/Library/OpenSSL/openssl.cnf \
        <(printf '[SAN]\nsubjectAltName=DNS:localhost')) \
    -sha256 \
    -days 3650

# trust the certificate
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/.ssl/nginx-selfsigned.crt
```
**Ensure your certificate path `~/.ssl/nginx-selfsigned.crt` and  `~/.ssl/nginx-selfsigned.key`** We're using it in `/server/docker-compose.yml`

Then go to server directory start the server:
```sh
cd /server && docker-compose up
```

That's all!

Now you could work on optimization. When you finish it, running `HOME=https://localhost/blog/ node scr/booster.js` will generate new website under `server/dist`.

Now, if you switch nginx server to optimized one(
change `- ./www:/usr/share/nginx/html` in docker-compose.yml and restart the server
) and run lighthouse to see the improvement.
