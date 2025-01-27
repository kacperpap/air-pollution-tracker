provider "aws" {
  region = var.aws_region
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    args        = ["eks", "get-token", "--cluster-name", var.cluster_name]
    command     = "aws"
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      args        = ["eks", "get-token", "--cluster-name", var.cluster_name]
      command     = "aws"
    }
  }
}

locals {
  namespace = var.environment == "prod" ? "production" : "staging"
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

data "aws_availability_zones" "available" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "${var.project_name}-vpc"
  cidr = "10.0.0.0/16"
  azs             = slice(data.aws_availability_zones.available.names, 0, 2)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.3.0/24", "10.0.4.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                    = "1"
    "kubernetes.io/role/alb-ingress"            = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
    "kubernetes.io/role/alb-ingress"            = "1"
  }
}

resource "aws_security_group" "eks_cluster" {
  name_prefix = "${var.project_name}-eks-cluster"
  description = "Security group for EKS cluster"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port = 443
    to_port   = 443
    protocol  = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}


module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.15.3"

  cluster_name    = var.cluster_name
  cluster_version = "1.27"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  cluster_security_group_id = aws_security_group.eks_cluster.id

  eks_managed_node_groups = {
    apt = {
      name           = "apt-node"
      instance_types = ["t3.small"]
      min_size       = 2
      max_size       = 3
      desired_size   = 2
      labels = {
        deployment = "${var.node_group}"
      }
    }

  }
}

resource "time_sleep" "wait_for_eks" {
  depends_on = [module.eks]
  create_duration = "60s"
}

resource "kubernetes_namespace" "production" {
  depends_on = [module.eks]
  metadata {
    name = "production"
  }
}

resource "kubernetes_namespace" "staging" {
  depends_on = [module.eks]
  metadata {
    name = "staging"
  }
}

resource "helm_release" "nginx_ingress" {
  name       = "ingress-nginx"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  namespace  = "ingress-nginx"
  create_namespace = true

  set {
    name  = "controller.service.type"
    value = "LoadBalancer"
  }

  set {
    name  = "controller.service.annotations.service.beta.kubernetes.io/aws-load-balancer-type"
    value = "alb" 
  }

  set {
    name  = "controller.service.annotations.service.beta.kubernetes.io/aws-load-balancer-backend-protocol"
    value = "HTTP"
  }

  set {
    name  = "controller.service.externalTrafficPolicy"
    value = "Cluster"
  }

  set {
    name  = "controller.replicaCount"
    value = 1
  }
}

resource "time_sleep" "wait_for_ingress" {
  depends_on = [helm_release.nginx_ingress]
  create_duration = "60s"
}

data "kubernetes_service" "nginx_ingress" {
  metadata {
    name      = "ingress-nginx-controller"
    namespace = "ingress-nginx"
  }

  depends_on = [time_sleep.wait_for_ingress]
}

resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.project_name}-${var.environment}-secrets"
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    DATABASE_URL            = var.database_url
    RABBITMQ_URL            = var.rabbitmq_url
    JWT_KEY                 = var.jwt_key
    SSL_CERTIFICATE         = var.ssl_certificate
    SSL_CERTIFICATE_KEY     = var.ssl_certificate_key
  })
}

resource "local_file" "helm_values" {
  
  filename = "${path.module}/../../charts/apt-k8s-aws/generated-values.yaml"
  content = templatefile("${path.module}/../../charts/apt-k8s-aws/values.yaml.tpl", {
    namespace               = local.namespace
    repository_url          = data.terraform_remote_state.ecr.outputs.repository_url
    environment             = var.environment
    cluster_name            = var.cluster_name
    node_group              = var.node_group
    fqdn                    = "${var.subdomain}.duckdns.org"
    secure                  = var.secure
    database_url            = local.namespace == "production" ? var.database_url : var.staging_database_url
    jwt_key                 = var.jwt_key
    rabbitmq_request_queue  = var.rabbitmq_request_queue
    rabbitmq_url            = var.rabbitmq_url
    ssl_certificate         = var.secure ? base64encode(join("\n", split("\n", var.ssl_certificate))) : ""
    ssl_certificate_key     = var.secure ? base64encode(join("\n", split("\n", var.ssl_certificate_key))) : ""
  })

  depends_on = [
    module.eks,
    helm_release.nginx_ingress,
    kubernetes_namespace.production,
    kubernetes_namespace.staging,
    data.kubernetes_service.nginx_ingress
  ]
}

resource "helm_release" "app" {
  depends_on = [
    local_file.helm_values,
    helm_release.nginx_ingress,
    aws_secretsmanager_secret_version.app_secrets,
  ]

  name      = var.project_name
  chart     = "${path.module}/../../charts/apt-k8s-aws"
  namespace = local.namespace
  values    = [local_file.helm_values.content]
}

# resource "null_resource" "update_duckdns" {
#   provisioner "local-exec" {
#     command = <<EOT
#       python ./resolve_duckdns.py "${data.kubernetes_service.nginx_ingress.status[0].load_balancer[0].ingress[0].hostname}" "${var.subdomain}" "${var.duckdns_token}"
#     EOT
#   }

#   triggers = {
#     ingress_hostname = data.kubernetes_service.nginx_ingress.status[0].load_balancer[0].ingress[0].hostname
#   }

#   depends_on = [data.kubernetes_service.nginx_ingress]
# }



resource "null_resource" "update_duckdns" {
  provisioner "local-exec" {
    command = <<EOT
      $resolved_ip = (Resolve-DnsName -Name "${data.kubernetes_service.nginx_ingress.status[0].load_balancer[0].ingress[0].hostname}" -Type A).IPAddress
      Invoke-RestMethod -Uri "https://www.duckdns.org/update?domains=${var.subdomain}&token=${var.duckdns_token}&ip=$resolved_ip&clear=false"
    EOT
    interpreter = ["PowerShell", "-Command"]
  }

  triggers = {
    ingress_hostname = data.kubernetes_service.nginx_ingress.status[0].load_balancer[0].ingress[0].hostname
  }

  depends_on = [data.kubernetes_service.nginx_ingress]
}

data "terraform_remote_state" "ecr" {
  backend = "local" 
  config = {
    path = "../registry/terraform.tfstate" 
  }
}


