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

resource "null_resource" "helm_repo_update" {
  provisioner "local-exec" {
    command = "helm repo update"
    interpreter = ["PowerShell", "-Command"]
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
      min_size       = local.namespace == "production" ? 4 : 2
      max_size       = local.namespace == "production" ? 6 : 3
      desired_size   = local.namespace == "production" ? 4 : 2
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
  depends_on = [null_resource.helm_repo_update]
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
  name                        = "${var.project_name}-${var.environment}-secrets"
  tags                        = local.common_tags
  force_overwrite_replica_secret = true
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    DATABASE_URL            = var.database_url
    STAGING_DATABASE_URL    = var.staging_database_url
    RABBITMQ_URL            = var.rabbitmq_url
    JWT_KEY                 = var.jwt_key
    DUCKDNS_TOKEN           = var.duckdns_token
    SSL_CERTIFICATE         = var.ssl_certificate
    SSL_CERTIFICATE_KEY     = var.ssl_certificate_key
  })
}


resource "local_file" "helm_values" {
  
  filename = "${path.module}/../../charts/apt-k8s-aws/generated-values.yaml"
  content = templatefile("${path.module}/../../charts/apt-k8s-aws/${local.namespace}-values.yaml.tpl", {
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

resource "time_sleep" "wait_for_apt_deployment" {
  depends_on = [helm_release.app]
  create_duration = "60s"
}


data "terraform_remote_state" "ecr" {
  backend = "local" 
  config = {
    path = "../registry/terraform.tfstate" 
  }
}

resource "aws_s3_bucket" "test_results_bucket" {
  bucket = "${var.project_name}-e2e-results"
  force_destroy = true
}

resource "aws_ecs_cluster" "e2e_tests_cluster" {
  name = "${var.project_name}-e2e-tests-cluster"
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

data "aws_iam_policy_document" "ecs_task_execution_policy" {
  statement {
    effect = "Allow"
    actions = [
      "ecs:RunTask",
      "ecs:StartTask",
      "ecs:StopTask"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "ecr:BatchGetImage",
      "ecr:GetAuthorizationToken"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "ecs_task_execution_policy" {
  name        = "ecs-task-execution-policy"
  description = "Policy for ECS tasks"
  policy      = data.aws_iam_policy_document.ecs_task_execution_policy.json
}


resource "aws_ecs_task_definition" "e2e_tests" {
  family                   = "e2e-tests"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "e2e-tests-container"
      image     = "${data.terraform_remote_state.ecr.outputs.repository_url}/e2e-${var.environment}-latest"
      essential = true
      environment = [
        { name = "CYPRESS_FRONTEND_URL", value = var.secure == true ? "https://${var.subdomain}.duckdns.org" : "http://${var.subdomain}.duckdns.org" },
        { name = "API_BASE_URL", value = var.secure == true ? "https://${var.subdomain}.duckdns.org" : "http://${var.subdomain}.duckdns.org" }
      ]
      mountPoints = [
        {
          sourceVolume = "test-results"
          containerPath = "/app/cypress/videos"
          readOnly = false
        }
      ]
      command = [
        "sh", "-c", "npm run test:e2e -- --headed && aws s3 sync /app/cypress/videos s3://${aws_s3_bucket.test_results_bucket.bucket}/ && echo 'Copied successfully'"
      ]
    }
  ])

  volume {
    name = "test-results"
  }
}

# resource "aws_ecs_service" "e2e_tests_service" {
#   name           = "e2e-tests-service"
#   cluster        = aws_ecs_cluster.e2e_tests_cluster.id
#   desired_count  = 1
#   launch_type    = "FARGATE"
#   task_definition = aws_ecs_task_definition.e2e_tests.arn

#   network_configuration {
#     subnets         = module.vpc.public_subnets
#     security_groups = [aws_security_group.e2e_tests_sg.id]
#     assign_public_ip = true
#   }
# }


resource "aws_security_group" "e2e_tests_sg" {
  name_prefix = "${var.project_name}-e2e-tests"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "null_resource" "run_e2e_tests" {
  provisioner "local-exec" {
    command = <<EOT
    Write-Host "Uruchamiam zadanie ECS dla testów e2e..."
    $TASK_ARN = aws ecs run-task `
      --cluster "${aws_ecs_cluster.e2e_tests_cluster.id}" `
      --launch-type FARGATE `
      --task-definition "${aws_ecs_task_definition.e2e_tests.family}" `
      --network-configuration "awsvpcConfiguration={subnets=[${join(",", module.vpc.public_subnets)}],securityGroups=[${aws_security_group.e2e_tests_sg.id}],assignPublicIp=\"ENABLED\"}" `
      --query "tasks[0].taskArn" --output text

    Write-Host "Otrzymany ARN zadania: $TASK_ARN"
    Write-Host "Czekam na zakończenie zadania..."
    aws ecs wait tasks-stopped --cluster "${aws_ecs_cluster.e2e_tests_cluster.id}" --tasks $TASK_ARN
    Write-Host "Zadanie zakończone."
    EOT

    interpreter = ["PowerShell", "-Command"]
  }

  depends_on = [
    aws_ecs_task_definition.e2e_tests,
    aws_ecs_cluster.e2e_tests_cluster,
    aws_security_group.e2e_tests_sg
  ]
}




resource "null_resource" "download_results_from_s3" {
  provisioner "local-exec" {
    command = "aws s3 sync s3://${aws_s3_bucket.test_results_bucket.bucket}/ ../../e2e/videos --delete"
  }

  depends_on = [null_resource.run_e2e_tests]
}

resource "null_resource" "cleanup_s3" {
  provisioner "local-exec" {
    command = "aws s3 rm s3://${aws_s3_bucket.test_results_bucket.bucket}/ --recursive"
  }

  depends_on = [null_resource.download_results_from_s3]
}







