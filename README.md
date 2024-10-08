## Terminoid.com website
This website hosts and plays recordings that adhere to this format: [asciicast v2](https://docs.asciinema.org/manual/asciicast/v2/)

It's an extremely simple version of: [asciinema-server](https://github.com/asciinema/asciinema-server)

### Features
- Small and barebones
- Backend is entirely Openresty and Redis

Frontend is:
- [xterm.js](https://xtermjs.org)
- [pako](https://github.com/nodeca/pako)
- [a fork of html2canvas](https://github.com/yorickshan/html2canvas-pro)
- [terminal.css](https://github.com/Gioni06/terminal.css)
- [FiraCode font](https://github.com/tonsky/FiraCode)

### Todo
- Scrubber and seeking
- Chapters
- Better mobile experience
- Pipeline Redis queries
- When missing asciicast header, calculate a likely maximum terminal width

### Linux Installation
- Install Openresty from apt or whatever
- Requires Redis >= 6.2.0.  Right now apt/snap may be installing 6.0.x, so build it from source
- It took me around 5 minutes to build it from source and configure it on ARM64, it's really easy
- [install from source instructions](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/install-redis-from-source/)
- [config instructions](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/#install-redis-properly)
- Put the nginx.conf from this repo root where it goes, something like `/usr/local/openresty/nginx/conf`
- Copy the directory structure from repo root wherever your html goes, something like `/usr/local/openresty/nginx/html`
- mkdir `/var/log/openresty` and make sure openresty has permission to use it (or put your logs somewhere else)
- Do your firewall and HTTPS stuff as needed
