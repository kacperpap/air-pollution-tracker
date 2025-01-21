variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "air-pollution-tracker"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "apt"
}

variable "nginx_load_balancer_type" {
  description = "Type of AWS Load Balancer for NGINX ingress (e.g., NLB or ALB)"
  type        = string
  default     = "alb"
}

variable "ssl_certificate_arn" {
  description = "ARN of the ACM SSL certificate for ALB (optional)"
  type        = string
  default     = "" # Leave blank if no certificate
}

