## 1. Registry and github workflow ci.yml:

Amazon Elastic Container Registry (ECR) is used to sotre published images. It is needed hence, public repositories such as dockerhub, allows you to store limited number of images and their versions with free plan. To publish images to your private ECR, you need to create it and then run github workflow [ci.yml](https://github.com/kacperpap/air-pollution-tracker/blob/main/.github/workflows/ci.yml).

Before running registry terraform scirpts make sure that:
- [ ] you are authorized to aws local console as a user that have same policies as `terraform user` descirbed in [aws.commands](../aws.commands)
    ```
    aws iam list-users 
    aws iam list-attached-user-policies --user-name terraform
    aws iam get-policy --policy-arn arn:aws:iam::********:policy/FullEcrEc2EksIamKmsLogsAlbAccess
    aws iam get-policy-version --policy-arn arn:aws:iam::*********:policy/FullEcrEc2EksIamKmsLogsAlbAccess --version-id v4
    ```
- [ ] if you are not using aws cli, you can just specify access key to the aws user as env variables:
    - create `.env.aws` file based on `.env.aws.template`
    - Run (on widnows)
        ```

        ./load-aws-env.ps1
        ```
        
    -  Now you can run:
        ```terraform

        cd ./terraform/registry
        terraform init
        terraform plan -out=tfplan
        terraform apply tfplan
        ```
- [ ] check the created repository
    ```
    aws ecr describe-repositories --query "repositories[*].{Name:repositoryName,URI:repositoryUri}" --output table
    ```
- [ ] Before running github ci.yml workflow make sure that user github have same policies as `github user` descirbed in [aws.commands](../aws.commands) and that you have set all neede variables descirbed in env section in ci.yml script. After running it successfully, it will build and publish images to your ECR, which you can check using command:
    ```
    aws ecr describe-images --repository-name air-pollution-tracker
    ```

## 2. Infrastructure and APT deployment:

Terraform [terraform/infrastructure/main.tf](/terraform/infrastructure/main.tf) script will both create your infrastructure on AWS and deploy air-pollution-tracker apt. That is why you need to configure first your domain name, publish images to ECR, provide variables.tf file based on [variables.tf.template](https://github.com/kacperpap/air-pollution-tracker/blob/main/terraform/infrastructure/variables.tf.template)  and secrets file based on [terraform.tfvars.template](https://github.com/kacperpap/air-pollution-tracker/blob/main/terraform/infrastructure/terraform.tfvars.template).

Before runninng infrastructure terraform scripts you need:

- [ ] Make sure that you are running [registry](../terraform/registry/) terraform script due to dependency in remote output:
  ```
  data "terraform_remote_state" "ecr" {
    backend = "local" 
    config = {
      path = "../repository/terraform.tfstate" 
    }
  }
  ```

- [ ] log in aws console (local) by running:
  ```
  aws configure
  ```
*You will be prompted to pass same credentials as in .aws.env (access-key-id, access-key and region). It is needed because running  [terraform/infrastructure/main.tf](/terraform/infrastructure/main.tf) requires to execute get-token, to securly connect to eks module*

- [ ] Check if you published images to ECR correctly:
    ```
    aws ecr describe-images --repository-name air-pollution-tracker
    ```
  ***NOTE, that deploying images must have proper prod/dev in name, taht will differenciate which images the script will deploy, and have latest tag, below section from variables.tf file which allows you to set environment, besed on which the proper images will be taken from ECR***

    ```
      variable "environment" {
      description = "Environment (prod/dev)"
      type        = string
      default     = "prod"
    }
    ```

- [ ] Created variables.tf file based on [variables.tf.template](https://github.com/kacperpap/air-pollution-tracker/blob/main/terraform/infrastructure/variables.tf.template), make sure to pass valid vars in duckdns section, for example, for air.pollution-tracker.duckdns.org and generated SSL/TLS certificate (next steps show how to get cert):
    ```
    variable "secure" {
      description = "Enable SSL/TLS"
      type        = bool
      default     = true
    }

    variable "subdomain" {
      description = "Subdomain for duck dns"
      type = string
      default = "air-pollution-tracker"
    }
    ```

- [ ] Created secrets file based on [terraform.tfvars.template](https://github.com/kacperpap/air-pollution-tracker/blob/main/terraform/infrastructure/terraform.tfvars.template)

- [ ] To enable quick generating and renewal of certificates for domain from **Let's Encrypt** refer to instruction: [DNS.md](https://github.com/kacperpap/air-pollution-tracker/blob/main/dns/DNS.md)

- [ ] Now you can run scripts as follows:
  ```
  cd ./terraform/infrastructure
  terraform init
  terraform apply
  ```
**WARNING: you cannot run terraform plan here, due to that [output.tf](./infrastructure/output.tf) file requires to know ingress hostname on a runtime:**
  ```
  output "ingress_hostname" {
    description = "Public hostname or IP for the NGINX ingress"
    value       = try(
      data.kubernetes_service.nginx_ingress.status[0].load_balancer[0].ingress[0].hostname,
      "Load balancer hostname not available yet"
    )
  }
  ```

- [ ] after creating eks cluster, pin it to your local terminal by executing:
  ```
  aws eks update-kubeconfig --name apt --region eu-central-1
  ```


- [ ] check if your k8s cluster is available and if nginx is running correctly:

    - Check created nodes (there should be as much as defined in [main.tf](/terraform/infrastructure/main.tf) in **eks_managed_node_groups in eks module**, which means if you specified to create minimum 2 instances of type t3.small, there should be 2 nodes in different subnets, ip-10-0-1-[0-255].eu-central-1.compute.internal in 10.0.1.0/24 and ip-10-0-2-[0-255].eu-central-1.compute.internal in 10.0.2.0/24)
      ```
      kubectl get nodes
      ```
      ```
      NAME                                          STATUS   ROLES    AGE    VERSION
      ip-10-0-1-140.eu-central-1.compute.internal   Ready    <none>   3m23s   v1.27.16-eks-aeac579
      ip-10-0-2-184.eu-central-1.compute.internal   Ready    <none>   3m21s   v1.27.16-eks-aeac579
      ```
    - Check deployment of inress-nginx controller

      ```
      kubectl get pods -n ingress-nginx
      ```
      ```
      NAME                                        READY   STATUS    RESTARTS   AGE
      ingress-nginx-controller-5979bb57db-gvxs7   1/1     Running   0          175m
      ```
      ```
      kubectl get svc -n ingress-nginx
      ```
      ```
      NAME                                 TYPE           CLUSTER-IP      EXTERNAL-IP                          PORT(S)                      AGE
      ingress-nginx-controller             LoadBalancer   172.20.79.167   xxx.eu-central-1.elb.amazonaws.com   80:31060/TCP,443:32360/TCP   176m
      ingress-nginx-controller-admission   ClusterIP      172.20.24.169   <none>                               443/TCP                      176m
      ```

- [ ] After successfull install of ingress you can check the status of your pods and services
    - Logs from pods:
      ```
      kubectl logs pod/pod-name -n ingress-nginx
      ```

    - Displaying all event from namespace by creation timestamp:
      ```
      kubectl get events -n ingress-nginx --sort-by='.metadata.creationTimestamp'
      ```

- [ ] After veryfing this you can verify installation of application
**Remeber that deploying app via helm chart, requires generating values.yaml file, which is done based on variables provided in variables.tf and is done automatically by script. You can check the [values.yaml.tpl](https://github.com/kacperpap/air-pollution-tracker/blob/main/charts/apt-k8s-aws/values.yaml.tpl) to modify the default resources provided to your app. Terraform script based on that file generates generated-values.yaml in same directory.**
- Logs from pods:
  ```
  kubectl logs pod/pod-name -n $NAMESPACE
  ```

- Displaying all event from namespace by creation timestamp:
  ```
  kubectl get events -n $NAMESPACE --sort-by='.metadata.creationTimestamp'
  ```


## 3. E2E tests (staging)
**On staging branch, maain infrastructure script automates E2E test**. It does the following:
 - creates Elastic Container Service task and policy
 - based on image published to ECR registry via [e2e.yml](https://github.com/kacperpap/air-pollution-tracker/blob/main/.github/workflows/e2e.yml), runs container in FARGATE
 - saves video from the cypress test to S3 bucket and then downloads it locally
 - cleanups S3 bucket
This functionality is not properly working yet, that's why it is only on staging branch, but to **run it manually** you need to:
    - [ ] install dependencies from in e2e module
      ```
      cd ./e2e/ && npm install
      ```
    - [ ] build docker image by running:
      ```
      docker build -t cypress-test -f .\e2e\cypress.Dockerfile .\e2e\
      ```
    - [ ] run continer:
      ```
      docker run -e CYPRESS_FRONTEND_URL=https://air-pollution-tracker.duckdns.org -e API_BASE_URL=https://air-pollution-tracker.duckdns.org  cypress-test
      ```
    - [ ] as defined in **cypress.config.js** it should save a video from the test in e2e directory

## 4. Roles (staging)
On staging branch, there is being developed the functionality, that will enable k8s administrator to generate certificates for roles in cluster.


## 5. Rolling update
To perform rolling update of your application, first build and publish new images to your private AWS CER. After that consider running script [rolling-update-apt-k8s-aws.ps1](https://github.com/kacperpap/air-pollution-tracker/blob/main/rolling-update-apt-k8s-aws.ps1). The script scans your ECR to find any newer images that the ones being deployed, and if it finds any, deploys them as defined in strategy set in helm templates, which you can check in [templates catalogue for aws deployment](https://github.com/kacperpap/air-pollution-tracker/blob/main/charts/apt-k8s-aws/templates) (example for backend.yml below)
```
strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
```

## Troubleshooting:
During running terraform infrastructure script, if it cannot create secrets managers due to "scheduled deletion", remove manually with below command:
  ```
  aws secretsmanager delete-secret --secret-id "air-pollution-tracker-prod-secrets" --force-delete-without-recovery
  ```