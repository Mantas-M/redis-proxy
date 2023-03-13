.env configurables:

REDIS_HOSTNAME=YOUR_REDIS_HOST
REDIS_PORT=YOUR_REDIS_HOST
PROXY_PORT=6381
MIN_REDIS_CONNECTIONS=2
MAX_REDIS_CONNECTIONS=10
NODE_ENV=dev specifying dev enables logging for the application which slows it down

Proxy port, min and max connections have default values if they are not set on runtime

Building docker image

sudo docker build -t redis-proxy .

Running docker image

sudo docker run --rm -it -p 6381:6381 -e REDIS_HOSTNAME= -e REDIS_PORT= redis-proxy
