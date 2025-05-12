# Air Pollution Tracker
Air pollution tracker is a system developed as part of my engineering thesis at AGH UST in 2024/2025. 

## License
For details, see [LICENSE.md](https://github.com/kacperpap/air-pollution-tracker/blob/main/LICENSE.md)

## Engineering thesis
Full desciption of the project, its goals and motivatian, and more comprehensive description of architectural decisions can be seen in my [thesis](https://github.com/kacperpap/air-pollution-tracker/blob/main/Zastosowanie_podejścia_Cloud_Native_i_metodyk_DevOps_w_implementacji_aplikacji_do_symulacji_rozprzestrzeniania_się_zanieczyszczenia_powietrza.pdf).

### APT architecture
<p align="center">
  <img src="https://github.com/user-attachments/assets/76a62ab8-19a2-426d-aabe-3ba70af151be" width="400" />
</p>


### Local deployment

*Local deployment is prepared to run in development mode via docker compose, which quickly runs all modules and to run in mode representing real deployment on k8s inftastructure. Scripts for local deployment are written in powershell as the locally project was developed on WSL. Remeber that even local deployment requires to register a free account in NeonDB and pass the credentials via .env file.*

---
#### 0. Clone proejct and install dependecies
---
    Requirements: git, pip, npm
- [ ] Clone project via command:

        git clone https://github.com/kacperpap/air-pollution-tracker.git

- [ ] Install dependencies in each repository:

        cd ./backend && npm install
        cd ./frontend && npm install
        cd ./calc_module &&  pip install -r .\requirements.txt
---
#### 1. Run locally with docker compose
---
    Requirements: docker desktop for windows
After cloning the project:
- [ ] prepare the .env file besed on template [.env.template](https://github.com/kacperpap/air-pollution-tracker/blob/main/.env.template) to make sure the build and run via docker compose will be defined, because they use variables to differ between test and dev/prod build versions (test version runs images in development mode while dev and prod generally builds static files if possible). For run in docker compose your .env may look similar to:    

        # ENVIRONMENT=test
        ENVIRONMENT=test

        ## Frontend
        FAST_REFRESH=false
        REACT_APP_API_BASE_URL=http://localhost:9000/api
        # REACT_APP_API_BASE_URL=http://backend:9000/api

        ## Backend
        ORIGIN=http://localhost:3000
        # ORIGIN=http://frontend:3000
        SECURE=false

        ## staging database
        DATABASE_URL=postgresql://apt-neondb_owner:********@*******-pooler.eu-central-1.aws.neon.tech/apt-neondb?sslmode=require&connection_limit=112&pool_timeout=30

        ## secret key for generating JWT tokens
        JWT_KEY=***************

        ## RabbitMQ
        RABBITMQ_REQUEST_QUEUE=simulation_request_queue
        RABBITMQ_URL=amqp://rabbitmq

    ***Warninng*** Secure flag must be set to false if you run in test mode, due to the fact that it changes the policy of sending cookies (i.e. access-tokens) to secure and requires to use only https calls (which requires SSL certificate)

- [ ] build docker images, using defined [docker-compose](https://github.com/kacperpap/air-pollution-tracker/blob/main/docker-compose.yml) 

        docker compose -f docker-compose.yml build --no-cache

     ***Warninng*** Context in docker-compose is set as . , which stands for main project directory, it enables to read env's from .env file in main directory instead from each module catalogue (you can define separate .env in each module to run module alone)

- [ ] run docker images, using defined [docker-compose](https://github.com/kacperpap/air-pollution-tracker/blob/main/docker-compose.yml) 

        docker compose -f .\docker-compose.yml up

---
#### 2. Run locally on k8s
---   
   Requirements: k8s (i.e. plugin in docker desktop), helm, nginx, kubectl configured, mkcert for generating slef-signed certificate (if running in local https mode with SECURE set as true)

After cloning the project:
- [ ] prepare the .env file besed on template [.env.template](https://github.com/kacperpap/air-pollution-tracker/blob/main/.env.template). For run locally in k8s your .env may look similar to:    

        ENVIRONMENT=prod
        DOMAIN=air-pollution-tracker.com

        ## Frontend
        # REACT_APP_API_BASE_URL=https://${DOMAIN}/api is set in configMap based on domain

        ## Backend
        # ORIGIN=https://${DOMAIN} is set in configMap based on domain
        SECURE=true

        ## production database
        DATABASE_URL=postgresql://apt-neondb_owner:********@*******-pooler.eu-central-1.aws.neon.tech/apt-neondb?sslmode=require&connection_limit=112&pool_timeout=30

        JWT_KEY=***************

        ## RabbitMQ
        RABBITMQ_REQUEST_QUEUE=simulation_request_queue
        RABBITMQ_URL=amqp://rabbitmq

    ***Info*** Secure flag set to true, will need to generate self-signed cert and adding it to local trust store, it is done via deployment script. Domain variable is the name of your "local" domain taht will need to be added to /etc/hosts as prompted in deployment script

- [ ] run local deployment scrpit [deploy-apt-k8s-local.ps1](https://github.com/kacperpap/air-pollution-tracker/blob/main/deploy-apt-k8s-local.ps1) (as can be seen, it is prepared only for wsl on windows), the script consist of functions listed below and does the following:
        
        function Check-Prerequisites
            > check proper installation of git, mkcert, k8s and helm
        function Check-NginxIngress
            > checks for existance of ingress-nginx in helm list repo, ingress-nginx namespace and ingress-nginx being run via:
              kubectl get pods -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
        function Install-NginxIngress
            > if above is not completed, script downloads and deploys ingress-nginx
        function Wait-ForIngressReady
            > waits for proper ingress-nginx installation and running
        function Get-EnvVariables
            > parses the envs provided in .env file from main project repository
        function Install-Certificate
            > if SECURE is set to true, generates local certificate for provided DOMAIN name
        function Generate-ValuesFile
            > for k8s resoures to be defined via helm, script generates values file, that will enable helm template parser to set all needed configuration:
              $valuesContent | Out-File -FilePath generated-values.yaml -Encoding UTF8
        function Install-Application

    ***Warning*** Script during execution will ask for saving local certificate in system trust store and to add a line in the /etc/hosts file

 - [ ] For proper uninstallation of all app modules you can use [undeploy-apt-k8s-local.ps1](https://github.com/kacperpap/air-pollution-tracker/blob/main/undeploy-apt-k8s-local.ps1), but be aware that it will also uninstall ingress-nginx, which is not necessery if you run multiple times local deployment

### AWS APT infrastructure
<p align="center">
  <img src="https://github.com/user-attachments/assets/cea15c1e-231c-4a3a-9d1b-b676b875d0e4" />
</p>


### AWS deployment

*AWS deplyment is more complicated and requires having AWS account with pined credit card to run any resources.* ***Please be aware that running APT app in AWS will require using non-free resources and hence won't be free out of charge.***

For information how to deploy APT on AWS similarily to deploying apt locally on k8s, check the instruction [NOTES](https://github.com/kacperpap/air-pollution-tracker/blob/main/terraform/NOTES.md)
