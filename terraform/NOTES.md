## 1. registry and github workflow ci.yml:
Before running registry terraform scirpts make sure that:
- [ ] you are authorized to aws local console as a user that have same policies as `terraform user` descirbed in [aws.commands](../aws.commands)
    ```
    aws iam list-users 
    aws iam list-attached-user-policies --user-name terraform
    aws iam get-policy --policy-arn arn:aws:iam::619071343147:policy/FullEcrEc2EksIamKmsLogsAlbAccess
    aws iam get-policy-version --policy-arn arn:aws:iam::619071343147:policy/FullEcrEc2EksIamKmsLogsAlbAccess --version-id v4
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
- [ ] check the created repository and if there is no images
    ```
    aws ecr describe-repositories --query "repositories[*].{Name:repositoryName,URI:repositoryUri}" --output table
    aws ecr describe-images --repository-name air-pollution-tracker
    ```
- [ ] Before running github ci.yml workflow make sure that user github have same policies as `github user` descirbed in [aws.commands](../aws.commands)

## 2. infrastructure:
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

- [ ] After veryfing this you can install application helm chart on created infrastructure

**For this step you will need to pass output data from terraform, secrets from .env file (DATABASE_URL and JWT_KEY) and other variables to values.yaml files and deploy ingress and apt charts, to correctly deploy application. Be sure to run at first [deploy-apt-ingress-k8s-aws.ps1](../deploy-apt-ingress-k8s-aws.ps1) and then after deploying ingress, you can run [deploy-apt-k8s-aws.ps1](../deploy-apt-k8s-aws.ps1)**

##### (PowerShell) Script [deploy-apt-ingress-k8s-aws.ps1](../deploy-apt-ingress-k8s-aws.ps1):

> Generates new `generate-values.yaml` file with specified variables by outputs in terraform and .env secrets, then runs the helm with: 
```
helm install apt-ingress "$PROJECT_ROOT/charts/apt-ingress-k8s-aws" -f generated-values.yaml -n ingress-nginx
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


##### (PowerShell) Script [deploy-apt-k8s-aws.ps1](../deploy-apt-k8s-aws.ps1):

> Generates new `generate-values.yaml` file with specified variables by outputs in terraform and .env secrets, then runs the helm with (be sure to specify in .env environment variable as prod if you want to deploy production images in production namespace or dev for staging version): 
```
helm install apt "$PROJECT_ROOT/charts/apt-k8s-aws" -f generated-values.yaml -n $NAMESPACE
```

- [ ] After successfull install of application you can check the status of your pods and services
    - Logs from pods:
      ```
      kubectl logs pod/pod-name -n $NAMESPACE
      ```

    - Displaying all event from namespace by creation timestamp:
      ```
      kubectl get events -n $NAMESPACE --sort-by='.metadata.creationTimestamp'
      ```


## 3. E2E tests



## 4. Rolling update


## 5. Domena od Duck DNS oraz certyfiakt z AWS Certificate Manager 
### Domena
 - [ ] Logujemy się do DuckDNS za pomocą GitHub'a, wpisujemy wybraną domenę, aby ją poprawnie zaktualizować wywołujemy zapytanie curl lub GET w przeglądarce:
  ```
  https://www.duckdns.org/update?domains=air-pollution-tracker&token={YOURVALUE}&verbose=true&clear=false
  ```

### Certyfikat AWS CM
  - [ ] Aby wygenerować certyfikat w AWS CM podajemy wartość CNAME value wygenerowaną przez CM (ponieważ rekort TXT jest jedynym możliwym do dodania w DuckDNS do potwierdzenia kontroli nad domeną)
  ```
  https://www.duckdns.org/update?domains=air-pollution-tracker&token={YOURVALUE}&txt=_72ada2a896f8d48dfcdbd236b1112cd4.zfyfvmchrl.acm-validations.aws.&verbose=true
  ```
  Powinniśmy otrzymać potwierdzenie dodania
  ```
  OK
  _72ada2a896f8d48dfcdbd236b1112cd4.zfyfvmchrl.acm-validations.aws.
  UPDATED
  ```
  Można to również sprawdzić poprzez dig lub nslookup
  ```
  dig air-pollution-tracker.duckdns.org TXT
  ```
  Opcjonalnie można następnie usunąć ten rekor, po zweryfikowaniu i wystawieniu certyfikatu przez aws:
  ```
  https://www.duckdns.org/update?domains=air-pollution-tracker&token={YOURVALUE}&clear=true
  ```
### Certyfikat Let's Encrypt
  - [ ] Uruchamiamy certbota w docker
    ```
    docker run -it --rm -v certs:/etc/letsencrypt certbot/certbot certonly --manual --preferred-challenges dns -d air-pollution-tracker.duckdns.org
    ```

  - [ ] Wygenerowaną wartość musimy ustawić w rekordzie DNS TXT _acme-challenge.air-pollution-tracker.duckdns.org.
    ```
    curl "https://www.duckdns.org/update?domains=_acme-challenge.air-pollution-tracker.duckdns.org.&token={YOURVALUE}&txt=_72ada2a896f8d48dfcdbd236b1112cd4.zfyfvmchrl.acm-validations.aws.&verbose=true&clear=false"
    ```
 


### Roles
# Generowanie klucza prywatnego dla administratora
openssl genrsa -out apt-admin.key 2048

# Generowanie Certificate Signing Request (CSR) dla administratora
openssl req -new -key apt-admin.key -out apt-admin.csr -subj "/CN=apt-admin"

# Analogicznie dla dewelopera
openssl genrsa -out apt-developer.key 2048
openssl req -new -key apt-developer.key -out apt-developer.csr -subj "/CN=apt-developer"

# Dla administratora
kubectl get csr apt-admin -o yaml | kubectl apply -f -
kubectl certificate approve apt-admin

# Dla dewelopera
kubectl get csr apt-developer -o yaml | kubectl apply -f -
kubectl certificate approve apt-developer




## Problemy:
Jeśli nie można utworzyć secrets manager z powodu "scheduled deletion", usuń ręcznie podczas wystąpienia błędu
aws secretsmanager delete-secret --secret-id "air-pollution-tracker-prod-secrets" --force-delete-without-recovery