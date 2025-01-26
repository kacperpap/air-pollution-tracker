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

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.15.3"

  cluster_name    = var.cluster_name
  cluster_version = "1.27"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    apt = {
      name           = "apt-node"
      instance_types = ["t3.small"]
      min_size       = 2
      max_size       = 3
      desired_size   = 2
      labels = {
        deployment = "apt"
      }
    }

  }
}

resource "kubernetes_namespace" "production" {
  metadata {
    name = "production"
  }
}

resource "kubernetes_namespace" "staging" {
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
}

data "terraform_remote_state" "ecr" {
  backend = "local" 
  config = {
    path = "../registry/terraform.tfstate" 
  }
}


