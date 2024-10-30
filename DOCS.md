# Configuration

Basic configuration of runtime that uses Node v22.5.1 LTS version on Linux or WSL 2 on Windows:

Get the newest version of nvm (node version manager) from github source:
```bash
sudo apt-get install curl

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

nvm install 22.5.1
```

***(Note: instead of using v0.39.7 you may use the latest version)***

More specific docs: [https://dev.to/cryptus_neoxys/setting-up-nodejs-with-nvm-on-wsl-2-3828](https://dev.to/cryptus_neoxys/setting-up-nodejs-with-nvm-on-wsl-2-3828)



## frontend application 
*Frontend application is written with support of TypeScript and React framework and utilizes tailwindcss and taiwindui for fast and utility-oriented styling*

Generating projct template
```node
npx create-react-app <app_name> --template typescript 
```

Installing Tailwind via npm:
[https://tailwindcss.com/docs/installation](https://tailwindcss.com/docs/installation)